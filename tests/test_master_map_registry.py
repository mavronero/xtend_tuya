"""Self-check for the per-entry scoping of the cross-source device mirror.

Standalone (no Home Assistant import) — mirrors
XTDeviceMap.register_device_map / unregister_device_map and
MultiManager._disable_multi_map_device_alignment (audit C9).

XTDeviceMap.master_device_map is a process-wide class attribute. It used to
be wiped wholesale at the start of every entry's cache update, so reloading
hub A de-registered hub B's maps: B's IOT and sharing copies of a device
stopped mirroring each other until B was reloaded too, with no log line.

Run: `python tests/test_master_map_registry.py`
"""


class Map(dict):
    """Stand-in for XTDeviceMap (a UserDict — equality compares contents)."""

    def __init__(self, label, data=None):
        super().__init__(data or {})
        self.label = label


REGISTRY: list = []


def register(m):
    if not any(x is m for x in REGISTRY):
        REGISTRY.append(m)


def unregister(m):
    REGISTRY[:] = [x for x in REGISTRY if x is not m]


class Hub:
    def __init__(self, label, maps):
        self.label = label
        self.maps = maps

    def enable(self):
        for m in self.maps:
            register(m)

    def disable(self):
        for m in self.maps:
            unregister(m)


def demo():
    a = Hub("solar", [Map("a-iot"), Map("a-sharing")])
    b = Hub("simon", [Map("b-iot"), Map("b-sharing")])
    a.enable()
    b.enable()
    assert len(REGISTRY) == 4

    # Reloading hub A must only take A's maps out of the mirror.
    a.disable()
    assert [m.label for m in REGISTRY] == ["b-iot", "b-sharing"]
    a.enable()
    assert len(REGISTRY) == 4

    # Re-registering is idempotent by IDENTITY: two empty maps compare equal
    # as dicts, so an equality-based check would refuse the second one.
    empty1, empty2 = Map("e1"), Map("e2")
    assert empty1 == empty2
    register(empty1)
    register(empty2)
    register(empty1)
    assert [m.label for m in REGISTRY[-2:]] == ["e1", "e2"]

    # And unregister removes only the one map, not its equal twin.
    unregister(empty1)
    assert [m.label for m in REGISTRY[-1:]] == ["e2"]
    print("ok")


if __name__ == "__main__":
    demo()
