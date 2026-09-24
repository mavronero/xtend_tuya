"""DP-collapse trace predicate (audit D7/C22), against the real
shared_classes.is_dp_collapse and the XTDevice.__setattr__ gate.

The 4.4.247 instrumentation hooked XTDeviceMap.__setitem__ and clear(), i.e.
map-slot replacement. The real collapses are attribute writes
(`device.local_strategy = {}`), which touch neither, and clear() fired on
every routine reload, so the 20-stacks-per-hour budget went on noise. The
trace now watches the four DP dicts on the device itself.
"""

from __future__ import annotations

import pytest

from custom_components.xtend_tuya.multi_manager.shared import shared_classes
from custom_components.xtend_tuya.multi_manager.shared.shared_classes import XTDevice, XTDeviceMap, is_dp_collapse


def dps(n):
    return {i: {} for i in range(n)}


@pytest.fixture
def traces(monkeypatch):
    monkeypatch.setattr(XTDeviceMap, "master_device_map", [])
    calls: list[str] = []
    monkeypatch.setattr(shared_classes, "trace_dp_collapse_write", lambda _logger, msg: calls.append(msg))
    return calls


def test_is_dp_collapse():
    # The incident: a 32-DP valve wiped to nothing, or to the 2-DP subset.
    assert is_dp_collapse(dps(32), {})
    assert is_dp_collapse(dps(32), dps(2))
    assert is_dp_collapse(dps(13), dps(3))
    assert is_dp_collapse(dps(8), dps(4))
    assert is_dp_collapse(dps(20), dps(9))
    # Normal life: growth, no change, small losses, below the floor.
    assert not is_dp_collapse({}, dps(32))
    assert not is_dp_collapse(dps(32), dps(32))
    assert not is_dp_collapse(dps(32), dps(20))
    assert not is_dp_collapse(dps(3), {})
    assert not is_dp_collapse(None, {})


def test_setattr_traces_each_dp_attr_collapse(traces):
    d = XTDevice()
    assert traces == [], "first assignments in __init__ are not collapses"
    for attr in XTDevice.DP_ATTRS:
        setattr(d, attr, dps(32))
        setattr(d, attr, {})
    assert len(traces) == 4
    assert "local_strategy replaced: 32 -> 0" in traces[-1]


def test_setattr_ignores_other_attrs_and_modest_shrink(traces):
    d = XTDevice()
    d.device_preference = dps(32)
    d.device_preference = {}
    d.local_strategy = dps(32)
    d.local_strategy = dps(20)
    assert traces == []


def test_muted_scratch_copy_is_not_traced(traces):
    """get_open_api_device's build phase empties a copy with sync_changes=False;
    tracing it fired once per device per reload."""
    d = XTDevice()
    d.local_strategy = dps(32)
    d.sync_changes = False
    d.local_strategy = {}
    assert traces == []
