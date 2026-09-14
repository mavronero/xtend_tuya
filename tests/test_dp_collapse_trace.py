"""Self-check for the DP-collapse trace predicate (audit D7/C22).

Standalone (no Home Assistant import) — mirrors is_dp_collapse and the
XTDevice.__setattr__ gate in multi_manager/shared/shared_classes.py.
Replaces tests/test_dp_collapse_watchdog.py, deleted with the watchdog.

The 4.4.247 instrumentation hooked XTDeviceMap.__setitem__ and clear(), i.e.
map-*slot* replacement. The real collapses are attribute writes
(`device.local_strategy = {}`), which touch neither, and clear() fired on
every routine reload — so the 20-stacks-per-hour budget was spent on noise
and every reproduction attempt came back clean. The trace now watches the
four DP dicts on the device itself.

Run: `python tests/test_dp_collapse_trace.py`
"""

MIN_SIZE = 4
DP_ATTRS = ("function", "status_range", "status", "local_strategy")


def is_dp_collapse(old, new):
    """Mirror of shared_classes.is_dp_collapse."""
    if not isinstance(old, dict) or not isinstance(new, dict):
        return False
    if len(old) < MIN_SIZE:
        return False
    return len(new) * 2 <= len(old)


def should_trace(attr, old, new, sync_changes=True):
    """Mirror of the XTDevice.__setattr__ gate."""
    return attr in DP_ATTRS and sync_changes and is_dp_collapse(old, new)


def dps(n):
    return {i: {} for i in range(n)}


def demo():
    # The incident: a 32-DP valve wiped to nothing, or to the 2-DP subset.
    assert should_trace("local_strategy", dps(32), {})
    assert should_trace("local_strategy", dps(32), dps(2))
    assert should_trace("status_range", dps(13), dps(3))
    assert should_trace("function", dps(8), dps(4))
    assert should_trace("status", dps(20), dps(9))

    # Normal life: growth, no change, and small losses are not collapses.
    assert not should_trace("local_strategy", {}, dps(32))
    assert not should_trace("local_strategy", dps(32), dps(32))
    assert not should_trace("local_strategy", dps(32), dps(20))
    assert not should_trace("local_strategy", dps(3), {})  # below the floor

    # Only the four DP dicts, and never on a first assignment.
    assert not should_trace("device_preference", dps(32), {})
    assert not should_trace("local_strategy", None, {})

    # A muted scratch copy (get_open_api_device's build phase) is not the
    # live model; tracing it fired once per device per reload.
    assert not should_trace("local_strategy", dps(32), {}, sync_changes=False)
    print("ok")


if __name__ == "__main__":
    demo()
