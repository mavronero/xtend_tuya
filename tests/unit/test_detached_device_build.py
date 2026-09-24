"""Build the OpenAPI device view off the live device (audit D6), against the
real XTIOTDeviceManager.get_open_api_device / _status_list_to_dict and the
XTDevice.__setattr__ sync_changes gate.

get_open_api_device called XTDevice.from_compatible_device, which returns the
SAME object when handed an XTDevice, and then assigned empty
function/status_range/status/local_strategy to it. __setattr__ broadcast
those empties into every registered device map, so a bindUser MQTT frame or
an add_device_by_id wiped the merged DP model fleet-wide until the two
OpenAPI calls refilled it, and not at all if they failed.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from custom_components.xtend_tuya.multi_manager.managers.tuya_iot.xt_tuya_iot_manager import XTIOTDeviceManager
from custom_components.xtend_tuya.multi_manager.shared.shared_classes import XTDevice, XTDeviceMap


@pytest.fixture(autouse=True)
def registry(monkeypatch):
    monkeypatch.setattr(XTDeviceMap, "master_device_map", [])


def xt(n_dps):
    d = XTDevice()
    d.id = "bf01"
    d.local_strategy = {n: {} for n in range(n_dps)}
    return d


# Shadow call succeeds with one property, model call fails: the build refills
# the scratch copy with a 1-DP view.
SHADOW = {"success": True, "result": {"properties": [{"dp_id": 1, "code": "switch_1", "type": "bool", "value": True}]}}
FAILED = {"success": False}


def test_open_api_build_never_touches_the_live_device_or_its_mirrors():
    live, mirror = xt(32), xt(32)
    XTDeviceMap.register_device_map(XTDeviceMap({"bf01": live}))
    XTDeviceMap.register_device_map(XTDeviceMap({"bf01": mirror}))

    # A normal attribute write still reaches the mirror (this is the feature).
    live.status = {"switch_1": False}
    assert mirror.status == {"switch_1": False}

    api = SimpleNamespace(get=lambda path: SHADOW if path.endswith("/shadow/properties") else FAILED)
    scratch = XTIOTDeviceManager.get_open_api_device(SimpleNamespace(api=api), live)

    assert scratch is not live
    assert list(scratch.local_strategy) == [1], "the build's own refill stays on the copy"
    for d in (live, mirror):
        assert len(d.local_strategy) == 32, "live DP model emptied by the build"
        assert d.status == {"switch_1": False}, "build's empties broadcast into the maps"
        assert d.function == {} and d.status_range == {}


def test_status_list_to_dict():
    """/v1.0/iot-03/devices keeps `status` as a list; every reader indexes it by code."""
    to_dict = XTIOTDeviceManager._status_list_to_dict
    assert to_dict([{"code": "cur_cap", "value": 91}, {"code": "va_battery", "value": 62}]) == {
        "cur_cap": 91,
        "va_battery": 62,
    }
    assert to_dict([{"no_code": 1}]) == {}
    assert to_dict({"cur_cap": 91}) == {"cur_cap": 91}
    assert to_dict(None) == {}
