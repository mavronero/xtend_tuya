"""XTDevice.__deepcopy__ must not drag the whole device map into each copy.

2026-08-10 outages: merge_devices deep-copies both devices as a backup; a
naive deepcopy followed device_map / original_device and copied the entire
inventory per device, pegging the event loop during setup (fixed 4.4.233).
"""

from __future__ import annotations

import copy
import time

import pytest

from custom_components.xtend_tuya.multi_manager.shared.shared_classes import XTDevice, XTDeviceMap


@pytest.fixture(autouse=True)
def registry(monkeypatch):
    monkeypatch.setattr(XTDeviceMap, "master_device_map", [])


def make_device(i):
    d = XTDevice()
    d.id = f"bf{i:020x}"
    d.name = f"Valve {i}"
    d.status = {f"dp_{n}": n for n in range(20)}
    d.status_range = {
        f"dp_{n}": {"code": f"dp_{n}", "type": "Integer", "values": '{"min":0,"max":100}'} for n in range(20)
    }
    d.local_strategy = {n: {"status_code": f"dp_{n}", "config_item": {"valueDesc": "{}"}} for n in range(20)}
    return d


@pytest.fixture
def devices():
    devices = {d.id: d for d in (make_device(i) for i in range(240))}
    dev_map = XTDeviceMap(devices)
    first = next(iter(devices.values()))
    first.original_device = make_device(9999)
    assert first.device_map is dev_map
    return list(devices.values())


def test_copy_is_an_isolated_data_snapshot(devices):
    first = devices[0]
    cp = copy.deepcopy(first)
    assert cp.device_map is None
    assert cp.original_device is None
    assert cp.status == first.status and cp.status is not first.status
    assert cp.status_range is not first.status_range
    cp.status["dp_0"] = 12345
    assert first.status["dp_0"] == 0, "copy mutated the original"

    # Mutating the copy must not sync back through the multimap machinery.
    cp.name = "renamed copy"
    assert first.name == "Valve 0"


def test_copy_cost_does_not_scale_with_map_size(devices):
    t0 = time.perf_counter()
    for d in devices[:50]:
        copy.deepcopy(d)
    t = time.perf_counter() - t0
    assert t < 1.0, f"50 copies took {t:.2f}s: still dragging the map along"
