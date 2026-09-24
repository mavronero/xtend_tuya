"""Per-entry scoping of the cross-source device mirror (audit C9), against the
real XTDeviceMap.register_device_map / unregister_device_map and
MultiManager._enable/_disable_multi_map_device_alignment.

XTDeviceMap.master_device_map is process-wide. It used to be wiped wholesale
at the start of every entry's cache update, so reloading hub A de-registered
hub B's maps: B's IOT and sharing copies of a device stopped mirroring each
other until B was reloaded too, with no log line.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from custom_components.xtend_tuya.multi_manager.multi_manager import MultiManager
from custom_components.xtend_tuya.multi_manager.shared.shared_classes import XTDeviceMap


@pytest.fixture(autouse=True)
def registry(monkeypatch):
    monkeypatch.setattr(XTDeviceMap, "master_device_map", [])


class Hub:
    """Stub self for the real enable/disable methods (name-mangled helper included)."""

    _enable_multi_map_device_alignment = MultiManager._enable_multi_map_device_alignment
    _disable_multi_map_device_alignment = MultiManager._disable_multi_map_device_alignment
    _align_multi_map_devices = MultiManager._align_multi_map_devices
    _MultiManager__get_available_device_maps = MultiManager._MultiManager__get_available_device_maps

    def __init__(self):
        self.iot, self.sharing, self.device_map = XTDeviceMap({}), XTDeviceMap({}), XTDeviceMap({})
        account = SimpleNamespace(get_available_device_maps=lambda: [self.iot, self.sharing])
        self.accounts = {"acct": account}
        self.maps = [self.iot, self.sharing, self.device_map]


def ids(maps):
    return [id(m) for m in maps]


def test_reloading_one_hub_leaves_the_other_registered():
    a, b = Hub(), Hub()
    a._enable_multi_map_device_alignment()
    b._enable_multi_map_device_alignment()
    assert ids(XTDeviceMap.master_device_map) == ids(a.maps + b.maps)

    a._disable_multi_map_device_alignment()
    assert ids(XTDeviceMap.master_device_map) == ids(b.maps)
    a._enable_multi_map_device_alignment()
    assert len(XTDeviceMap.master_device_map) == 6


def test_register_is_idempotent_by_identity_not_equality():
    """Two empty maps compare equal (UserDict); an equality check would refuse the second."""
    e1, e2 = XTDeviceMap({}), XTDeviceMap({})
    assert e1 == e2
    XTDeviceMap.register_device_map(e1)
    XTDeviceMap.register_device_map(e2)
    XTDeviceMap.register_device_map(e1)
    assert ids(XTDeviceMap.master_device_map) == ids([e1, e2])

    # unregister removes only that map, not its equal twin
    XTDeviceMap.unregister_device_map(e1)
    assert ids(XTDeviceMap.master_device_map) == ids([e2])
