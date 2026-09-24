"""Device report-recency stamping (audit C23) against the real code.

Replaces tests/test_last_report_ts.py (a mirror of the stamping gate plus
source-text greps). The load-time seed (mm_update_device_cache stamps every
device) is covered in tests/ha/test_entry_lifecycle.py.

Entity availability is otherwise a pure function of the cloud `online` flag,
so a valve that stops reporting keeps serving frozen values and still reads
healthy: the mechanism behind "HA disagrees with the SmartLife app".
"""

from __future__ import annotations

import copy
import time
from types import SimpleNamespace

import pytest

from custom_components.xtend_tuya.multi_manager.managers.tuya_iot.xt_tuya_iot_manager import XTIOTDeviceManager
from custom_components.xtend_tuya.multi_manager.managers.tuya_sharing.xt_tuya_sharing_manager import (
    XTSharingDeviceManager,
)
from custom_components.xtend_tuya.multi_manager.shared.shared_classes import XTDevice, XTDeviceMap


@pytest.fixture(autouse=True)
def _isolated_master_map(monkeypatch):
    monkeypatch.setattr(XTDeviceMap, "master_device_map", [])


def test_new_device_has_never_been_seen():
    assert XTDevice(id="d1").last_report_ts == 0.0


UPDATE_PATHS = [
    pytest.param(XTIOTDeviceManager._update_device, id="iot"),
    pytest.param(XTSharingDeviceManager._XTSharingDeviceManager__update_device, id="sharing"),  # type: ignore[attr-defined]
]


@pytest.mark.parametrize("update_device", UPDATE_PATHS)
def test_report_that_changed_something_stamps_device(update_device):
    heard: list = []
    me = SimpleNamespace(device_listeners=[SimpleNamespace(update_device=lambda *a: heard.append(a))])
    device = XTDevice(id="d1")

    before = time.time()
    update_device(me, device, ["cur_cap"], None)

    assert before <= device.last_report_ts <= time.time()
    assert heard, "listeners still get the update"


@pytest.mark.parametrize("update_device", UPDATE_PATHS)
@pytest.mark.parametrize("props", [None, []])
def test_empty_report_or_online_notice_does_not_stamp(update_device, props):
    device = XTDevice(id="d1")
    device.last_report_ts = 1000.0
    update_device(SimpleNamespace(device_listeners=[]), device, props, None)
    assert device.last_report_ts == 1000.0


def test_stamp_mirrors_across_source_maps():
    """The master object must carry the stamp set on a source copy."""
    iot, sharing = XTDevice(id="d1"), XTDevice(id="d1")
    for device in (iot, sharing):
        XTDeviceMap.register_device_map(XTDeviceMap({"d1": device}))

    sharing.last_report_ts = 1234.0

    assert iot.last_report_ts == 1234.0


def test_deepcopy_carries_stamp():
    device = XTDevice(id="d1")
    device.last_report_ts = 1234.0
    assert copy.deepcopy(device).last_report_ts == 1234.0
