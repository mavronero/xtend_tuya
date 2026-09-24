"""Entry-lifecycle cleanups C12-C15 against the real code.

Replaces tests/test_entry_hygiene.py (a mirror of update_listener plus
source-text greps). C16 lives in tests/unit/test_location_service.py; the
C14 registration (a real options change reloads, a no-op write does not) is
in tests/ha/test_entry_lifecycle.py.

C12 tuya_sharing was silenced at CRITICAL process-wide, hiding the reconnect
    diagnostics of the very library the DP collapse was blamed on.
C13 device.__setattr__ = wrapped sets an INSTANCE attribute; Python resolves
    dunders on the type, so the per-device hook never fired: dead code, removed.
C14 update_listener: reload only when the options really changed (HA fires it
    on any entry write; a reload costs ~5 cloud calls per device).
C15 repair issues were only ever created; they are now cleared once healthy.
"""

from __future__ import annotations

import logging
from types import SimpleNamespace

import pytest

import custom_components.xtend_tuya as xt
from custom_components.xtend_tuya.const import XTMultiManagerProperties
from custom_components.xtend_tuya.multi_manager.managers.tuya_iot import init as iot_init
from custom_components.xtend_tuya.multi_manager.managers.tuya_iot.const import (
    CONF_ACCESS_ID,
    CONF_ACCESS_SECRET,
    CONF_APP_TYPE,
    CONF_AUTH_TYPE,
    CONF_COUNTRY_CODE,
    CONF_ENDPOINT_OT,
    CONF_PASSWORD,
    CONF_USERNAME,
)
from custom_components.xtend_tuya.multi_manager.managers.tuya_sharing.ha_tuya_integration import (
    tuya_decorators,
)
from custom_components.xtend_tuya.multi_manager.managers.tuya_sharing.ha_tuya_integration.config_entry_handler import (
    XTHATuyaIntegrationConfigEntryManager,
)
from custom_components.xtend_tuya.multi_manager.shared.interface import device_manager as dm_iface
from custom_components.xtend_tuya.multi_manager.shared.threading import XTEventLoopProtector


@pytest.fixture(autouse=True)
def _no_hass_executor(monkeypatch):
    monkeypatch.setattr(XTEventLoopProtector, "hass", None)


# --------------------------------------------------------------------- C12


def test_c12_tuya_sharing_logs_warnings():
    lib_logger = logging.getLogger("tuya_sharing")
    assert lib_logger.level == logging.WARNING
    assert lib_logger.isEnabledFor(logging.WARNING)
    assert lib_logger.isEnabledFor(logging.ERROR)


# --------------------------------------------------------------------- C13


def test_c13_core_tuya_devices_are_not_decorated():
    class Device:
        id = "d1"

    device = Device()
    manager = SimpleNamespace(
        device_map={"d1": device},
        refresh_mq=lambda: None,
        on_message=lambda msg: None,
    )
    handler = XTHATuyaIntegrationConfigEntryManager(None, None)  # type: ignore[arg-type]

    decorators = tuya_decorators.decorate_tuya_manager(manager, handler)  # type: ignore[arg-type]

    assert sorted(d.method_name for d in decorators) == ["on_message", "refresh_mq"]
    assert "__setattr__" not in vars(device), "instance-level dunder wrapping never fires"
    assert not hasattr(handler, "on_tuya_device_attribute_change")


# --------------------------------------------------------------------- C14


class ReloadHass:
    def __init__(self):
        self.reloaded: list[str] = []
        self.config_entries = SimpleNamespace(async_schedule_reload=self.reloaded.append)


@pytest.mark.parametrize(
    ("entry_id", "options", "reload"),
    [
        ("solar", {"endpoint": "eu", "access_id": "abc"}, False),  # write that changed nothing
        ("solar", {"endpoint": "us", "access_id": "abc"}, True),  # real options change
        ("solar", {"endpoint": "eu"}, True),  # option removed
        ("simon", {"endpoint": "eu"}, True),  # entry not loaded yet: reload, don't ignore
    ],
)
async def test_c14_update_listener_reloads_only_on_real_change(monkeypatch, entry_id, options, reload):
    monkeypatch.setattr(xt, "_LOADED_OPTIONS", {"solar": {"endpoint": "eu", "access_id": "abc"}})
    hass = ReloadHass()
    await xt.update_listener(hass, SimpleNamespace(entry_id=entry_id, options=options))  # type: ignore[arg-type]
    assert hass.reloaded == ([entry_id] if reload else [])


# --------------------------------------------------------------------- C15


async def test_c15_clear_issue_deletes_the_issue_raise_issue_created(monkeypatch):
    created: list[str] = []
    deleted: list[str] = []
    monkeypatch.setattr(dm_iface, "async_create_issue", lambda **kw: created.append(kw["issue_id"]))
    monkeypatch.setattr(dm_iface, "async_delete_issue", lambda hass, domain, issue_id: deleted.append(issue_id))
    entry = SimpleNamespace(entry_id="e1")
    iface = dm_iface.XTDeviceManagerInterface

    await iface.raise_issue(None, None, entry, False, dm_iface.IssueSeverity.ERROR, "tuya_iot_failed_login", {})  # type: ignore[arg-type]
    await iface.clear_issue(None, None, entry, "tuya_iot_failed_login")  # type: ignore[arg-type]
    assert created == deleted == ["e1_tuya_iot_failed_login"]


class IssueRecorder:
    """Stub `self` for the IOT plugin: records raise_issue / clear_issue."""

    def __init__(self, **kw):
        self.raised: list[str] = []
        self.cleared: list[str] = []
        self.__dict__.update(kw)

    async def raise_issue(self, **kw):
        self.raised.append(kw["translation_key"])

    async def clear_issue(self, hass, config_entry, translation_key):
        self.cleared.append(translation_key)


class FakeOpenAPI:
    def __init__(self, **kw):
        pass

    def set_dev_channel(self, channel):
        pass

    def connect(self, *a):
        return {"success": True}

    def test_validity(self):
        return True


STALE_SETUP_ISSUES = ["tuya_iot_not_configured", "tuya_iot_failed_request", "tuya_iot_failed_login"]
FULL_OPTIONS = {
    CONF_AUTH_TYPE: 0,
    CONF_ENDPOINT_OT: "https://openapi.tuyaeu.com",
    CONF_ACCESS_ID: "id",
    CONF_ACCESS_SECRET: "secret",
    CONF_USERNAME: "u",
    CONF_PASSWORD: "p",
    CONF_COUNTRY_CODE: "49",
    CONF_APP_TYPE: "smartlife",
}


async def test_c15_successful_iot_setup_clears_stale_setup_issues(monkeypatch):
    monkeypatch.setattr(iot_init, "XTIOTOpenAPI", FakeOpenAPI)
    monkeypatch.setattr(iot_init, "XTIOTDeviceManager", lambda *a: SimpleNamespace(add_device_listener=lambda l: None, mq=None))
    monkeypatch.setattr(iot_init, "XTIOTHomeManager", lambda *a: object())
    me = IssueRecorder(multi_manager=SimpleNamespace(multi_device_listener=None))
    entry = SimpleNamespace(entry_id="e1", title="solar", options=FULL_OPTIONS)

    data = await iot_init.XTTuyaIOTDeviceManagerInterface._init_from_entry(me, None, entry)  # type: ignore[arg-type]

    assert data is not None
    assert me.raised == []
    assert sorted(me.cleared) == sorted(STALE_SETUP_ISSUES)


async def test_c15_unconfigured_iot_raises_and_clears_nothing():
    me = IssueRecorder()
    entry = SimpleNamespace(entry_id="e1", title="solar", options={})
    assert await iot_init.XTTuyaIOTDeviceManagerInterface._init_from_entry(me, None, entry) is None  # type: ignore[arg-type]
    assert me.raised == ["tuya_iot_not_configured"] and me.cleared == []


@pytest.mark.parametrize(
    ("prop", "value", "key"),
    [
        (XTMultiManagerProperties.LOCK_DEVICE_ID, "d1", "tuya_iot_lock_not_subscribed"),
        (XTMultiManagerProperties.CAMERA_DEVICE_ID, "d1", "tuya_iot_camera_not_subscribed"),
        (XTMultiManagerProperties.IR_DEVICE_ID, "d1", "tuya_iot_ir_not_subscribed"),
        (XTMultiManagerProperties.ENERGY_SENSOR, ["d1"], "tuya_iot_sensor_energy_stat_not_subscribed"),
    ],
)
@pytest.mark.parametrize("subscribed", [True, False])
async def test_c15_subscription_probe_raises_or_clears(prop, value, key, subscribed):
    async def probe(callback, *args):
        return subscribed

    probes = SimpleNamespace(
        test_lock_api_subscription=None,
        test_camera_api_subscription=None,
        test_ir_api_subscription=None,
        test_sensor_energy_statistic_api_subscription=None,
    )
    me = IssueRecorder(
        iot_account=SimpleNamespace(device_manager=probes),
        _register_mq_supervisor=lambda hass, entry: None,
        _safe_subscription_test=probe,
    )
    mm = SimpleNamespace(
        device_map={"d1": object()},
        get_general_property=lambda p, default: value if p == prop else default,
    )

    await iot_init.XTTuyaIOTDeviceManagerInterface.on_loading_finalized(me, None, SimpleNamespace(title="solar"), mm)  # type: ignore[arg-type]

    assert (me.raised, me.cleared) == (([], [key]) if subscribed else ([key], []))
