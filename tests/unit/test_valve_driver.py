"""Valve profiles and the command side (profiles.py, driver.py, the services) against a fake port."""

from __future__ import annotations

import base64
from types import MappingProxyType

import pytest

from custom_components.xtend_tuya.entity_parser.valves import control_service, driver, timer_service
from custom_components.xtend_tuya.entity_parser.valves.codecs import time_task as tt
from custom_components.xtend_tuya.entity_parser.valves.profiles import (
    BLE_WATER_TIMER,
    QT08W,
    QT08W_T3,
    SMART_WATER_TIMER,
    profile_for,
)
from custom_components.xtend_tuya.transport.port import CloudResult, DeviceSnapshot
from custom_components.xtend_tuya.transport.settings import HubSettings

DEVICE = "bf01"


class FakePort:
    def __init__(self, product_id, status=None, cloud=None, has_cloud_account=True, blocked=False):
        self.settings = HubSettings()
        self.has_cloud_account = has_cloud_account
        self.cloud_writes_blocked = blocked
        self._device = DeviceSnapshot(DEVICE, product_id, "sfkzq", True, MappingProxyType(status or {}))
        self._cloud = cloud or {}
        self.dp_writes: list = []
        self.cloud_calls: list = []

    def device(self, device_id):
        return self._device

    async def send_dp(self, device_id, commands):
        self.dp_writes.extend(commands)
        return True

    async def cloud(self, method, path, body=None):
        self.cloud_calls.append(method)
        return self._cloud.get(method, CloudResult("ok", None, {"success": True, "result": []}))

    def clear_breaker(self):
        pass


@pytest.fixture
def use_port(monkeypatch):
    def install(port):
        monkeypatch.setattr(driver, "port_for_device", lambda hass, device_id: port)
        monkeypatch.setattr(timer_service, "_get_prior_slot", lambda hass, device_id, slot: None)
        monkeypatch.setattr(timer_service, "_ha_timezone", lambda hass: ("UTC", "+00:00"))
        return port

    return install


TIMER = {"device_id": DEVICE, "slot": 2, "hour": 6, "minute": 30, "mode": "duration", "value": 600, "days": ["Mon"]}


def test_profiles_by_product_id_and_dp_signature():
    assert profile_for("o6dagifntoafakst", {}) is QT08W
    assert profile_for("rjnqkjk1pct15ku2", {}) is QT08W_T3
    assert profile_for("nxquc5lb", {}) is SMART_WATER_TIMER
    assert profile_for("t2cak5zb", {}) is BLE_WATER_TIMER
    # Unknown product: detected by its timer DP, as the services did before profiles.
    assert profile_for("unknown", {"time_task_0": "AA"}) is QT08W_T3
    assert profile_for("unknown", {"time_task": "AA"}) is QT08W
    assert profile_for("unknown", {"switch": True}) is None


def test_capabilities_that_l3_relies_on():
    assert QT08W_T3.capabilities.run_signal == "counter"  # the watchdog cannot see T3 runs
    assert BLE_WATER_TIMER.capabilities.run_signal == "none" and not BLE_WATER_TIMER.capabilities.flow_meter
    assert SMART_WATER_TIMER.timer is None and SMART_WATER_TIMER.single_run is None


@pytest.mark.parametrize(("profile", "codec"), [(QT08W, tt.decode_qt08w), (QT08W_T3, tt.decode_t3)])
async def test_set_timer_writes_the_profile_codec_and_mirrors(use_port, profile, codec):
    port = use_port(FakePort(profile.product_id))
    result = await timer_service.set_timer(None, TIMER)
    assert result.as_response() == {"success": True, "device_id": DEVICE, "dp": "ok", "cloud": "ok", "reason": None}
    (write,) = port.dp_writes
    assert write["code"] == profile.timer.code
    assert codec(base64.b64decode(write["value"])).timer == tt.Timer(2, 6, 30, 0, 600, 0x01, True)
    assert port.cloud_calls == ["POST"]


async def test_cloud_outcomes_are_reported(use_port):
    use_port(FakePort(QT08W.product_id, blocked=True))
    assert (await timer_service.set_timer(None, TIMER)).cloud == "skipped"

    use_port(FakePort(QT08W.product_id, cloud={"POST": CloudResult("failed", "quota_exceeded", {})}))
    result = await timer_service.set_timer(None, TIMER)
    assert (result.dp, result.cloud, result.reason) == ("ok", "failed", "quota_exceeded")

    use_port(FakePort(QT08W.product_id, has_cloud_account=False))
    result = await timer_service.set_timer(None, TIMER)
    assert (result.dp, result.cloud, result.reason) == ("ok", "n/a", "no_openapi_account")

    use_port(FakePort(QT08W.product_id))
    result = await timer_service.set_timer(None, {**TIMER, "enabled": False})
    assert (result.cloud, result.reason) == ("n/a", "disabled_timer_not_mirrored")


@pytest.mark.parametrize("profile", [SMART_WATER_TIMER, BLE_WATER_TIMER])
async def test_read_only_profiles_are_unsupported_and_untouched(use_port, profile):
    port = use_port(FakePort(profile.product_id))
    for call in (
        timer_service.set_timer(None, TIMER),
        timer_service.delete_timer(None, {"device_id": DEVICE, "slot": 0}),
        control_service.start_watering(None, {"device_id": DEVICE, "mode": "duration", "value": 60}),
        control_service.stop_watering(None, {"device_id": DEVICE}),
    ):
        result = await call
        assert (result.dp, result.as_response()["success"]) == ("unsupported", False)
    assert port.dp_writes == [] and port.cloud_calls == []


async def test_unknown_device(monkeypatch):
    monkeypatch.setattr(driver, "port_for_device", lambda hass, device_id: None)
    result = await control_service.stop_watering(None, {"device_id": "nope"})
    assert (result.dp, result.reason) == ("failed", "unknown_device")


async def test_single_run_payloads_per_profile(use_port):
    port = use_port(FakePort(QT08W.product_id))
    await control_service.start_watering(None, {"device_id": DEVICE, "mode": "duration", "value": 30})
    await control_service.stop_watering(None, {"device_id": DEVICE})
    assert port.dp_writes == [
        {"code": "one_control", "value": "AAAAAB4B"},  # the SmartLife capture
        {"code": "one_control", "value": "AAAAAAAA"},
        {"code": "switch", "value": False},
    ]

    port = use_port(FakePort(QT08W_T3.product_id))
    result = await control_service.start_watering(None, {"device_id": DEVICE, "mode": "volume", "value": 60})
    assert result.reason == "volume_ran_as_duration"
    await control_service.stop_watering(None, {"device_id": DEVICE})
    assert [base64.b64decode(w["value"]).hex() for w in port.dp_writes] == ["00000000003c01000001", "00000000000001000000"]
