"""Keep the device object on a cloud re-query (audit C20), against the real
XTMergingManager.put_device_keeping_object and its two call sites,
XTSharingDeviceManager._update_device_list_info_cache and
XTIOTDeviceManager._update_device_list_info_cache.

A BIZCODE_BIND_USER frame re-queries the device and the SDK dropped the
fresh, bare 2-DP CustomerDevice straight into the sharing map. The master map
(and every entity) kept the rich merged object, so MQ reports wrote into an
object nothing reads: the device silently stopped updating while still
looking healthy.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from custom_components.xtend_tuya.multi_manager.managers.tuya_iot.xt_tuya_iot_manager import XTIOTDeviceManager
from custom_components.xtend_tuya.multi_manager.managers.tuya_sharing.xt_tuya_sharing_manager import (
    XTSharingDeviceManager,
)
from custom_components.xtend_tuya.multi_manager.shared.merging_manager import XTMergingManager
from custom_components.xtend_tuya.multi_manager.shared.shared_classes import XTDevice, XTDeviceMap


@pytest.fixture(autouse=True)
def registry(monkeypatch):
    monkeypatch.setattr(XTDeviceMap, "master_device_map", [])


def xt(dev_id, n_dps, name=""):
    d = XTDevice()
    d.id = dev_id
    d.name = name
    d.local_strategy = {n: {"status_code": f"dp_{n}", "config_item": {}} for n in range(n_dps)}
    return d


@pytest.fixture
def maps():
    rich = xt("bf01", 32, name="Herbs bed 801")
    return rich, XTDeviceMap({"bf01": rich}), {"bf01": rich}  # sharing map, master map (entities read it)


def test_requery_keeps_the_object_the_entities_hold(maps):
    rich, sharing_map, master_map = maps
    kept = XTMergingManager.put_device_keeping_object(sharing_map, "bf01", xt("bf01", 2))

    assert kept is rich, "the object the entities hold must stay in the map"
    assert sharing_map["bf01"] is master_map["bf01"], "maps must not diverge"
    assert len(rich.local_strategy) == 32, "rich DP model must survive"
    assert rich.name == "Herbs bed 801"


def test_new_device_is_inserted_and_reput_is_a_noop():
    m = XTDeviceMap({})
    new = xt("bf02", 1)
    assert XTMergingManager.put_device_keeping_object(m, "bf02", new) is new
    assert m["bf02"] is new
    # Re-putting the same object is a no-op, not a self-merge.
    assert XTMergingManager.put_device_keeping_object(m, "bf02", new) is new


def test_sharing_call_site_keeps_the_object(maps):
    rich, sharing_map, master_map = maps
    bare = SimpleNamespace(id="bf01", name="", local_strategy={1: {}, 11: {}}, status={}, function={}, status_range={})
    stub = SimpleNamespace(
        device_repository=SimpleNamespace(query_devices_by_ids=lambda ids: [bare]),
        device_map=sharing_map,
        multi_manager=None,
    )
    XTSharingDeviceManager._update_device_list_info_cache(stub, ["bf01"])
    assert sharing_map["bf01"] is master_map["bf01"] is rich
    assert len(rich.local_strategy) == 32


def test_iot_call_site_keeps_the_object(maps):
    rich, sharing_map, master_map = maps
    stub = SimpleNamespace(
        get_device_list_info=lambda ids: {"result": {"list": [{"id": "bf01", "status": [{"code": "c", "value": 1}]}]}},
        device_map=sharing_map,
        multi_manager=None,
        _status_list_to_dict=XTIOTDeviceManager._status_list_to_dict,
    )
    XTIOTDeviceManager._update_device_list_info_cache(stub, ["bf01"])
    assert sharing_map["bf01"] is master_map["bf01"] is rich
    assert len(rich.local_strategy) == 32
