"""Real-HA harness for the xtend_tuya fork.

The two Tuya cloud plugins are replaced by FakeAccount objects serving the
device lists captured from prod diagnostics. MultiManager, the merge/mirror
machinery, entity parsers and every platform run for real.
"""

from __future__ import annotations

import gzip
import json
import pathlib
from typing import Any

import pytest
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

FIXTURES = pathlib.Path(__file__).resolve().parent.parent / "fixtures"
DOMAIN = "xtend_tuya"

# Per config-entry id: the fake accounts MultiManager.setup_entry registers.
ACCOUNTS: dict[str, list[Any]] = {}


@pytest.fixture(autouse=True)
def _enable_custom_integrations(recorder_mock, enable_custom_integrations):
    # recorder_mock: the manifest depends on recorder (runs store, calendar).
    yield


def load_fixture_devices(name: str) -> list[dict]:
    with gzip.open(FIXTURES / f"{name}_devices.json.gz", "rt") as f:
        return json.load(f)


def _dp_type(name: str | None):
    from custom_components.xtend_tuya.ha_tuya_integration.tuya_integration_imports import (
        TuyaDPType,
    )

    return TuyaDPType.try_parse(name) if name else None


def build_device(d: dict, keep: set[str] | None = None):
    """Diagnostics dict -> XTDevice. `keep` limits DP codes (2-DP sharing copy)."""
    from custom_components.xtend_tuya.multi_manager.shared.shared_classes import (
        XTDevice,
        XTDeviceFunction,
        XTDeviceStatusRange,
    )

    dev = XTDevice(
        id=d["id"],
        name=d.get("name") or d["id"],
        category=d.get("category") or "",
        product_id=d.get("product_id") or "",
        product_name=d.get("product_name") or "",
        online=bool(d.get("online")),
        sub=bool(d.get("sub")),
        time_zone=d.get("time_zone") or "",
    )
    ok = (lambda code: True) if keep is None else (lambda code: code in keep)
    dev.function = {
        code: XTDeviceFunction(code=code, type=_dp_type(f.get("type")), values=json.dumps(f.get("value", {})), dp_id=f.get("dpId") or 0)
        for code, f in (d.get("function") or {}).items()
        if ok(code)
    }
    dev.status_range = {
        code: XTDeviceStatusRange(code=code, type=_dp_type(s.get("type")), values=json.dumps(s.get("value", {})), dp_id=s.get("dpId") or 0, report_type=s.get("report_type"))
        for code, s in (d.get("status_range") or {}).items()
        if ok(code)
    }
    dev.status = {
        code: json.dumps(v) if isinstance(v, (dict, list)) else v
        for code, v in (d.get("status") or {}).items()
        if ok(code)
    }
    ls = d.get("local_strategy") or {}
    dev.local_strategy = {
        int(k): v for k, v in (ls.items() if isinstance(ls, dict) else []) if ok(v.get("status_code"))
    }
    return dev


class FakeAccount:
    """Stands in for the tuya_iot / tuya_sharing plugin: no cloud, fixed devices."""

    def __init__(self, type_name: str, devices: list, priority) -> None:
        from custom_components.xtend_tuya.multi_manager.shared.shared_classes import XTDeviceMap

        self.type_name = type_name
        self.multi_manager = None
        self.device_map = XTDeviceMap({d.id: d for d in devices}, priority)
        self.sent: list[tuple[str, dict]] = []

    # identity
    def get_type_name(self) -> str:
        return self.type_name

    def is_type_initialized(self) -> bool:
        return True

    async def setup_from_entry(self, hass, config_entry, multi_manager) -> None:
        self.multi_manager = multi_manager
        multi_manager.register_account(self)

    # devices
    async def update_device_cache(self) -> None:
        return None

    def get_available_device_maps(self) -> list:
        return [self.device_map]

    def convert_to_xt_device(self, device, device_source_priority=None):
        device.device_source_priority = device_source_priority
        return device

    def get_domain_identifiers_of_device(self, device_id: str) -> list:
        return [DOMAIN]

    def get_device_registry_identifiers(self) -> list:
        return [DOMAIN]

    def inform_device_has_an_entity(self, device_id: str) -> None:
        if device_id in self.device_map:
            self.device_map[device_id].set_up = True

    def on_update_device(self, device):
        return None

    def get_add_device_signal_list(self, device_id: str):
        return None

    def add_device_by_id(self, device_id: str):
        return None

    # descriptors
    def get_platform_descriptors_to_merge(self, platform):
        return None

    def get_platform_descriptors_to_exclude(self, platform):
        return None

    # cloud
    def send_command(self, device_id: str, command: dict, reverse_filters: bool = False) -> bool:
        self.sent.append((device_id, command))
        return True

    def call_api(self, method: str, url: str, payload: str | None):
        return None

    def query_scenes(self) -> list:
        return []

    def trigger_scene(self, home_id: str, scene_id: str) -> bool:
        return True

    def get_device_stream_allocate(self, *a, **k):
        return None

    # mqtt / lifecycle
    def on_message(self, msg: dict) -> None:
        return None

    def refresh_mq(self) -> None:
        return None

    def get_mqtt_client(self):
        return None

    def on_mqtt_stop(self) -> None:
        return None

    def remove_device_listeners(self) -> None:
        return None

    def on_post_setup(self) -> None:
        return None

    async def on_loading_finalized(self, hass, config_entry, multi_manager) -> None:
        return None

    def unload(self) -> None:
        return None

    async def raise_issue(self, *a, **k):
        return None

    async def clear_issue(self, *a, **k):
        return None

    def send_lock_unlock_command(self, *a, **k) -> bool:
        return False


@pytest.fixture
def fake_plugins(monkeypatch):
    """No real plugins; MultiManager.setup_entry registers ACCOUNTS[entry_id]."""
    from custom_components.xtend_tuya.const import AllowedPlugins
    from custom_components.xtend_tuya.multi_manager import multi_manager as mm_mod

    monkeypatch.setattr(AllowedPlugins, "get_plugins_to_load", staticmethod(lambda: []))
    # Debug-only daemon thread with no stop(); the HA harness rejects lingering threads.
    from custom_components.xtend_tuya.multi_manager.shared.debug import stall_sampler

    monkeypatch.setattr(stall_sampler, "start", lambda hass: None)
    original = mm_mod.MultiManager.setup_entry

    async def setup_entry(self):
        await original(self)
        for account in ACCOUNTS.get(self.config_entry.entry_id, []):
            await account.setup_from_entry(self.hass, self.config_entry, self)
        for account in self.accounts.values():
            account.on_post_setup()

    monkeypatch.setattr(mm_mod.MultiManager, "setup_entry", setup_entry)
    yield
    ACCOUNTS.clear()


async def setup_hub(hass, title: str, accounts: list[FakeAccount]) -> MockConfigEntry:
    """Add a hub entry, run its setup AND its background load to completion."""
    from custom_components.xtend_tuya import _LOAD_TASKS

    await async_setup_component(hass, "http", {})
    entry = MockConfigEntry(domain=DOMAIN, title=title, data={}, options={}, unique_id=title)
    entry.add_to_hass(hass)
    ACCOUNTS[entry.entry_id] = accounts
    assert await hass.config_entries.async_setup(entry.entry_id)
    await _LOAD_TASKS[entry.entry_id]  # raises if the load body raised
    await hass.async_block_till_done()
    return entry
