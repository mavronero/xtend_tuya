"""The cross-map device mirror never degrades a DP dict, against the real
XTDeviceMap.set_device_key_value and XTDevice.__setattr__.

2026-09-16 prod outage: the solar hub (OpenAPI, ~32 DPs per valve) loaded
first, then Simon's hub (SmartLife sharing, 2 DPs for the same valve ids).
4.4.251 stopped wiping the process-wide mirror registry at load start (audit
C9), so Simon's 2-DP copies were mirrored onto the solar hub's full objects:
`status replaced: 32 -> 2` on 96 valves, manual watering and timers dead.
The guard: a mirrored write that would collapse a DP dict is dropped; a
richer copy still upgrades a poorer one.
"""

from __future__ import annotations

import pytest

from custom_components.xtend_tuya.multi_manager.shared.shared_classes import XTDevice, XTDeviceMap


@pytest.fixture(autouse=True)
def registry(monkeypatch):
    monkeypatch.setattr(XTDeviceMap, "master_device_map", [])


def dps(n):
    return {f"dp{i}": i for i in range(n)}


def device(dev_id, status):
    d = XTDevice()
    d.id = dev_id
    d.status = status
    return d


def registered(**devices):
    m = XTDeviceMap(devices)
    XTDeviceMap.register_device_map(m)
    return m


def test_poorer_copy_never_collapses_richer_and_richer_still_upgrades():
    solar_iot = registered(v=device("v", dps(32)))
    solar_master = registered(v=solar_iot["v"])  # master map holds the same object
    simon_sharing = registered(v=device("v", dps(2)))

    # Simon's hub converts its sharing copy: a 2-DP status written on its object.
    simon_sharing["v"].status = dps(2)
    assert len(solar_iot["v"].status) == 32, "poorer copy degraded the full one"

    # The full copy still upgrades the poorer one (alignment at end of load).
    solar_master["v"].status = dps(32)
    assert len(simon_sharing["v"].status) == 32

    # A normal in-place status change (same keys, new values) still mirrors.
    solar_iot["v"].status = {**dps(32), "dp0": 99}
    assert simon_sharing["v"].status["dp0"] == 99


def test_each_dp_attr_is_guarded():
    rich = registered(v=device("v", {}))["v"]
    poor = registered(v=device("v", {}))["v"]
    for attr in XTDevice.DP_ATTRS:
        object.__setattr__(rich, attr, dps(32))
        setattr(poor, attr, dps(2))
        assert len(getattr(rich, attr)) == 32, attr


def test_small_dicts_are_not_treated_as_collapse():
    a = registered(w=device("w", dps(3)))
    b = registered(w=device("w", dps(3)))
    b["w"].status = dps(1)
    assert len(a["w"].status) == 1


def test_modest_shrink_still_mirrors():
    solar = registered(v=device("v", dps(32)))
    simon = registered(v=device("v", dps(32)))
    simon["v"].status = dps(20)
    assert len(solar["v"].status) == 20
