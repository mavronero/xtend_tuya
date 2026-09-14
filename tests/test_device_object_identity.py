"""Self-check for keeping the device object on a cloud re-query (audit C20).

Standalone (no Home Assistant import) — mirrors
XTMergingManager.put_device_keeping_object (shared/merging_manager.py) and
the two call sites that re-query a single device:
XTSharingDeviceManager._update_device_list_info_cache and
XTIOTDeviceManager._update_device_list_info_cache.

A BIZCODE_BIND_USER frame re-queries the device and the SDK dropped the
fresh, bare 2-DP CustomerDevice straight into the sharing map. The master
map (and every entity) kept the rich merged object, so MQ reports wrote into
an object nothing reads: the device silently stopped updating while still
looking healthy.

Run: `python tests/test_device_object_identity.py`
"""


class Device:
    def __init__(self, dev_id, dps, name=""):
        self.id = dev_id
        self.local_strategy = dict(dps)
        self.name = name


def merge(previous, fresh):
    """Stand-in for XTMergingManager.merge_devices: dicts union, left wins."""
    merged = dict(fresh.local_strategy)
    merged.update(previous.local_strategy)
    previous.local_strategy = merged
    fresh.local_strategy = merged
    previous.name = previous.name or fresh.name


def put_device_keeping_object(device_map, device_id, fresh):
    """Mirror of XTMergingManager.put_device_keeping_object."""
    previous = device_map.get(device_id)
    if previous is None or previous is fresh:
        device_map[device_id] = fresh
        return fresh
    merge(previous, fresh)
    device_map[device_id] = previous
    return previous


def demo():
    rich = Device("bf01", {n: {} for n in range(32)}, name="Herbs bed 801")
    sharing_map = {"bf01": rich}
    master_map = {"bf01": rich}  # what the entities read

    # bindUser: the cloud hands back the bare sharing view of the device
    bare = Device("bf01", {1: {}, 11: {}})
    kept = put_device_keeping_object(sharing_map, "bf01", bare)

    assert kept is rich, "the object the entities hold must stay in the map"
    assert sharing_map["bf01"] is master_map["bf01"], "maps must not diverge"
    assert len(rich.local_strategy) == 32, "rich DP model must survive"
    assert rich.name == "Herbs bed 801"

    # An MQ report arriving right after still lands where the entities read.
    sharing_map["bf01"].local_strategy[99] = {}
    assert 99 in master_map["bf01"].local_strategy

    # A genuinely new device is just inserted.
    new = Device("bf02", {1: {}})
    assert put_device_keeping_object(sharing_map, "bf02", new) is new
    assert sharing_map["bf02"] is new

    # Re-putting the same object is a no-op, not a self-merge.
    assert put_device_keeping_object(sharing_map, "bf02", new) is new
    print("ok")


if __name__ == "__main__":
    demo()
