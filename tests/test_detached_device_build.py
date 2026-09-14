"""Self-check for building the OpenAPI device view off the live device (D6).

Standalone (no Home Assistant import) — mirrors XTDevice.__setattr__'s
sync_changes gate (shared/shared_classes.py) and
XTIOTDeviceManager.get_open_api_device / _status_list_to_dict
(managers/tuya_iot/xt_tuya_iot_manager.py).

get_open_api_device called XTDevice.from_compatible_device, which returns the
SAME object when handed an XTDevice, and then assigned empty
function/status_range/status/local_strategy to it. __setattr__ broadcast
those empties into every registered device map, so a bindUser MQTT frame or
an add_device_by_id wiped the merged DP model fleet-wide until the two
OpenAPI calls refilled it — and not at all if they failed.

Run: `python tests/test_detached_device_build.py`
"""

import copy

EXCLUDED = ("id", "device_map", "device_source_priority", "original_device",
            "source", "sync_changes")

MAPS: list = []


class Device:
    """Stand-in for XTDevice: mirrors the __setattr__ broadcast + the gate."""

    sync_changes = True

    def __init__(self, dev_id="", **kw):
        object.__setattr__(self, "id", dev_id)
        self.status = {}
        self.local_strategy = {}
        for k, v in kw.items():
            setattr(self, k, v)

    def __setattr__(self, attr, value):
        object.__setattr__(self, attr, value)
        if not self.sync_changes:
            return
        if attr not in EXCLUDED:
            for m in MAPS:
                if (other := m.get(self.id)) is not None and other is not self:
                    object.__setattr__(other, attr, value)

    def get_copy(self):
        new = Device.__new__(Device)
        for k, v in self.__dict__.items():
            object.__setattr__(new, k, copy.deepcopy(v))
        return new


def status_list_to_dict(status):
    """Mirror of XTIOTDeviceManager._status_list_to_dict."""
    if not isinstance(status, list):
        return status or {}
    return {
        i["code"]: i["value"]
        for i in status
        if isinstance(i, dict) and "code" in i and "value" in i
    }


def demo():
    live = Device("bf01", local_strategy={n: {} for n in range(32)})
    mirror = Device("bf01", local_strategy={n: {} for n in range(32)})
    MAPS.append({"bf01": mirror})

    # A normal attribute write still reaches the mirror (this is the feature).
    live.status = {"switch_1": True}
    assert mirror.status == {"switch_1": True}

    # The scratch copy used to be the live object itself.
    scratch = live.get_copy()
    assert scratch is not live
    scratch.sync_changes = False
    scratch.local_strategy = {}
    scratch.status = {}
    assert len(live.local_strategy) == 32, "live device emptied by the build"
    assert len(mirror.local_strategy) == 32, "empties broadcast to the mirror"
    assert mirror.status == {"switch_1": True}

    # And the build's own refill stays local until the caller merges it.
    scratch.local_strategy = {1: {}, 11: {}}
    assert len(live.local_strategy) == 32

    # /v1.0/iot-03/devices keeps `status` as a list; every reader indexes it
    # by code, so the raw list raises TypeError on the next access.
    assert status_list_to_dict(
        [{"code": "cur_cap", "value": 91}, {"code": "va_battery", "value": 62}]
    ) == {"cur_cap": 91, "va_battery": 62}
    assert status_list_to_dict([{"no_code": 1}]) == {}
    assert status_list_to_dict({"cur_cap": 91}) == {"cur_cap": 91}
    assert status_list_to_dict(None) == {}
    print("ok")


if __name__ == "__main__":
    demo()
