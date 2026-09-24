"""Controllable-quota accounting (audit C6), against the real MultiManager.note_cloud_write.

A Tuya Trial project can control 10 distinct devices per calendar month. Cloud
timer POST/DELETE through account.call_api burn that allowance just like
commands do; reads and refused writes must not.
"""

from __future__ import annotations

from types import SimpleNamespace

from custom_components.xtend_tuya.multi_manager.multi_manager import MultiManager

OK = {"success": True}
REFUSED = {"success": False, "code": 60001001, "msg": "exceed control limit"}


class Quota:
    def __init__(self):
        self.devices: set[str] = set()

    def record(self, device_id):
        self.devices.add(device_id)


def _hub():
    return SimpleNamespace(controllable_quota=Quota())


def test_cloud_writes_count_each_device_once():
    hub = _hub()
    MultiManager.note_cloud_write(hub, "POST", "/v1.0/devices/bf01/timers", OK)
    MultiManager.note_cloud_write(hub, "DELETE", "/v1.0/devices/bf01/timers?group_id=7", OK)
    MultiManager.note_cloud_write(hub, "POST", "/v1.0/devices/bf02/commands", OK)
    assert hub.controllable_quota.devices == {"bf01", "bf02"}


def test_reads_refusals_and_non_device_writes_are_free():
    hub = _hub()
    MultiManager.note_cloud_write(hub, "GET", "/v1.0/devices/bf03/timers", OK)
    MultiManager.note_cloud_write(hub, "POST", "/v1.0/devices/bf03/timers", REFUSED)
    MultiManager.note_cloud_write(hub, "POST", "/v1.0/devices/bf03/timers", None)
    MultiManager.note_cloud_write(hub, "POST", "/v1.0/homes/42/rooms", OK)
    assert hub.controllable_quota.devices == set()


def test_hub_without_tracker_is_a_no_op():
    MultiManager.note_cloud_write(SimpleNamespace(controllable_quota=None), "POST", "/v1.0/devices/x/timers", OK)
