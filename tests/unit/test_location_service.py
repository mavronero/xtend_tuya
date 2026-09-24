"""Valve home/room map (location_service) on a fake port.

Replaces the C16 source-text checks in tests/test_entry_hygiene.py with the
behaviour they stood for: one refresh timer per config entry (not per
id(multi_manager)), bound to the entry, re-armed after an unload.
"""

from __future__ import annotations

import pytest

from custom_components.xtend_tuya.entity_parser.valves import location_service as ls
from custom_components.xtend_tuya.transport.port import CloudResult


class FakePort:
    has_cloud_account = True
    openapi_uid = "uid1"

    def __init__(self, rooms_shape="dict"):
        self.rooms_shape = rooms_shape
        self.calls: list[str] = []

    async def cloud(self, method, path, body=None):
        self.calls.append(path)
        if path == "/v1.0/users/uid1/homes":
            return CloudResult("ok", None, {"success": True, "result": [{"home_id": 7, "name": "Farm"}]})
        if path == "/v1.0/homes/7/rooms":
            rooms = [{"room_id": 1, "name": "FF East"}]
            return CloudResult("ok", None, {"success": True, "result": rooms if self.rooms_shape == "list" else {"rooms": rooms}})
        if path == "/v1.0/homes/7/rooms/1/devices":
            return CloudResult("ok", None, {"success": True, "result": [{"device_id": "bf01"}, {"id": "bf02"}]})
        return CloudResult("failed", "1108", None)


class FakeEntry:
    def __init__(self, entry_id="e1"):
        self.entry_id = entry_id
        self.on_unload: list = []

    def async_on_unload(self, cb):
        self.on_unload.append(cb)

    def unload(self):
        for cb in self.on_unload:
            cb()
        self.on_unload.clear()


class FakeHass:
    def __init__(self):
        self.data: dict = {}
        self.views: list = []
        self.http = type("Http", (), {"register_view": lambda _, view: self.views.append(view)})()


@pytest.fixture(autouse=True)
def _quiet(monkeypatch):
    monkeypatch.setattr(ls, "async_dispatcher_send", lambda hass, signal: None)
    monkeypatch.setattr(ls, "async_track_time_interval", lambda hass, cb, interval: lambda: None)


@pytest.mark.parametrize("shape", ["dict", "list"])
async def test_refresh_builds_the_map_from_both_room_shapes(shape):
    hass = FakeHass()
    await ls.async_refresh(hass, FakePort(shape))
    assert ls.get_location(hass, "bf01") == {"home": "Farm", "room": "FF East"}
    assert ls.get_location(hass, "bf02") == {"home": "Farm", "room": "FF East"}
    assert ls.get_location(FakeHass(), "bf01") is None  # state is per HA instance


async def test_no_uid_means_no_calls():
    port = FakePort()
    port.openapi_uid = None
    hass = FakeHass()
    await ls.async_refresh(hass, port)
    assert port.calls == [] and ls.get_location(hass, "bf01") is None


async def test_scheduled_once_per_entry_and_rearmed_after_unload():
    hass, entry, port = FakeHass(), FakeEntry(), FakePort()
    await ls.async_ensure_scheduled(hass, entry, port)
    await ls.async_ensure_scheduled(hass, entry, port)  # second valve / second call: no-op
    assert port.calls.count("/v1.0/users/uid1/homes") == 1
    assert len(hass.views) == 1
    # the discard hook and the 12 h timer are both bound to the entry
    assert len(entry.on_unload) == 2
    entry.unload()
    await ls.async_ensure_scheduled(hass, entry, port)  # reload re-arms
    assert port.calls.count("/v1.0/users/uid1/homes") == 2
    assert len(hass.views) == 1  # the view is registered once per process
