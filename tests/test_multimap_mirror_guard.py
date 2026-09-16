"""Self-check: the cross-map device mirror never degrades a DP dict.

Standalone (no Home Assistant import) — mirrors XTDeviceMap.set_device_key_value
and XTDevice.__setattr__ in multi_manager/shared/shared_classes.py.

2026-09-16 prod outage: the solar hub (OpenAPI, ~32 DPs per valve) loaded
first, then Simon's hub (SmartLife sharing, 2 DPs for the same valve ids).
4.4.251 stopped wiping the process-wide mirror registry at load start
(audit C9), so Simon's 2-DP copies were mirrored onto the solar hub's full
objects: `status replaced: 32 -> 2` on 96 valves, manual watering and
timers dead. The guard: a mirrored write that would collapse a DP dict is
dropped; a richer copy still upgrades a poorer one.

Run: `python tests/test_multimap_mirror_guard.py`
"""

MIN_SIZE = 4
DP_ATTRS = ("function", "status_range", "status", "local_strategy")
REGISTRY: list = []


def is_dp_collapse(old, new):
    """Mirror of shared_classes.is_dp_collapse."""
    if not isinstance(old, dict) or not isinstance(new, dict):
        return False
    if len(old) < MIN_SIZE:
        return False
    return len(new) * 2 <= len(old)


class Device:
    def __init__(self, id, status):
        object.__setattr__(self, "id", id)
        object.__setattr__(self, "status", status)
        object.__setattr__(self, "name", id)

    def __setattr__(self, attr, value):  # mirror of XTDevice.__setattr__
        object.__setattr__(self, attr, value)
        for m in REGISTRY:
            m.set_device_key_value(self.id, attr, value)


class Map(dict):
    def set_device_key_value(self, device_id, key, value):  # mirror
        if device := self.get(device_id):
            if hasattr(device, key) and getattr(device, key) != value:
                if key in DP_ATTRS and is_dp_collapse(getattr(device, key), value):
                    return None
                setattr(device, key, value)


def dps(n, prefix="dp"):
    return {f"{prefix}{i}": i for i in range(n)}


def demo():
    REGISTRY.clear()
    solar_iot = Map(v=Device("v", dps(32)))
    solar_master = Map(v=solar_iot["v"])  # master map points at the same object
    simon_sharing = Map(v=Device("v", dps(2)))
    REGISTRY.extend([solar_iot, solar_master, simon_sharing])

    # Simon's hub converts its sharing copy: 2-DP status written on its object.
    simon_sharing["v"].status = dps(2)
    assert len(solar_iot["v"].status) == 32, "poorer copy degraded the full one"

    # The full copy still upgrades the poorer one (alignment at end of load).
    solar_master["v"].status = dps(32)
    assert len(simon_sharing["v"].status) == 32

    # A normal in-place status change (values, same keys) still mirrors.
    solar_iot["v"].status = {**dps(32), "dp0": 99}
    assert simon_sharing["v"].status["dp0"] == 99

    # Small dicts (below MIN_SIZE) are never treated as a collapse.
    a, b = Map(w=Device("w", dps(3))), Map(w=Device("w", dps(1)))
    REGISTRY[:] = [a, b]
    b["w"].status = dps(1)
    assert len(a["w"].status) == 1

    # A genuine, modest shrink (less than half) still mirrors.
    REGISTRY[:] = [solar_iot, simon_sharing]
    simon_sharing["v"].status = dps(20)
    assert len(solar_iot["v"].status) == 20
    print("ok")


if __name__ == "__main__":
    demo()
