"""Hub settings (docs/architecture.md §3.1) and how the timer service honours them."""

from __future__ import annotations

from types import MappingProxyType

import pytest

from custom_components.xtend_tuya.entity_parser.valves import driver, timer_service
from custom_components.xtend_tuya.transport.port import CloudResult, DeviceSnapshot
from custom_components.xtend_tuya.transport.settings import OPTION_KEY, HubSettings


def _options(**hub):
    return {OPTION_KEY: hub}


@pytest.mark.parametrize(
    ("options", "expected"),
    [
        (None, HubSettings("trial", 10, True)),  # prod today: no option at all
        ({}, HubSettings("trial", 10, True)),
        (_options(plan="paid"), HubSettings("paid", None, True)),
        (_options(plan="paid", controllable_limit=50), HubSettings("paid", None, True)),
        (_options(plan="custom", controllable_limit=30), HubSettings("custom", 30, True)),
        (_options(plan="custom"), HubSettings("custom", 10, True)),  # no usable limit: safe Trial cap
        (_options(plan="custom", controllable_limit=0), HubSettings("custom", 10, True)),
        (_options(plan="bogus"), HubSettings("trial", 10, True)),
        (_options(plan="trial", cloud_timer_mirror=False), HubSettings("trial", 10, False)),
    ],
)
def test_from_options(options, expected):
    assert HubSettings.from_options(options) == expected


@pytest.mark.parametrize("settings", [HubSettings(), HubSettings("paid", None, False), HubSettings("custom", 25, True)])
def test_round_trip(settings):
    assert HubSettings.from_options({OPTION_KEY: settings.to_option()}) == settings


class FakePort:
    def __init__(self, settings: HubSettings):
        self.settings = settings
        self.has_cloud_account = True
        self.cloud_writes_blocked = False
        self.dp_writes: list = []
        self.cloud_calls: list = []

    def device(self, device_id):
        return DeviceSnapshot(device_id, "o6dagifntoafakst", "sfkzq", True, MappingProxyType({"time_task": "AA"}))

    async def send_dp(self, device_id, commands):
        self.dp_writes.append(commands)
        return True

    async def cloud(self, method, path, body=None):
        self.cloud_calls.append(method)
        return CloudResult("ok", None, {"success": True, "result": []})

    def clear_breaker(self):
        pass


TIMER = {"device_id": "bf01", "slot": 1, "hour": 7, "minute": 7, "mode": "duration", "value": 60, "days": ["Mon"], "enabled": True}


@pytest.fixture
def port(monkeypatch, request):
    fake = FakePort(request.param)
    monkeypatch.setattr(driver, "port_for_device", lambda hass, device_id: fake)
    monkeypatch.setattr(timer_service, "_get_prior_slot", lambda hass, device_id, slot: None)
    monkeypatch.setattr(timer_service, "_ha_timezone", lambda hass: ("UTC", "+00:00"))
    return fake


@pytest.mark.parametrize("port", [HubSettings()], indirect=True)
async def test_mirror_on_writes_device_and_cloud(port):
    result = await timer_service.set_timer(None, TIMER)
    assert (result.dp, result.cloud) == ("ok", "ok")
    assert len(port.dp_writes) == 1
    assert port.cloud_calls == ["POST"]


@pytest.mark.parametrize("port", [HubSettings(cloud_timer_mirror=False)], indirect=True)
async def test_mirror_off_writes_device_only(port):
    result = await timer_service.set_timer(None, TIMER)
    assert (result.dp, result.cloud, result.reason) == ("ok", "n/a", "mirror_disabled")
    assert len(port.dp_writes) == 1
    assert port.cloud_calls == []


@pytest.mark.parametrize("port", [HubSettings(cloud_timer_mirror=False)], indirect=True)
async def test_resync_refuses_without_mirror(port):
    # Without the mirror no HA timer is in the cloud; a resync would clear them all.
    assert await timer_service.resync_from_cloud(None, {"device_id": "bf01"}) == {
        "success": False,
        "error": "cloud_mirror_disabled",
    }
    assert port.cloud_calls == [] and port.dp_writes == []
