"""Controllable-quota accounting (audit C6) and the send_commands alias fallback (C10), against the real MultiManager.

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


# --- C10: alias fallback in MultiManager.send_commands -----------------------


class AliasAccount:
    """Refuses the primary code; accepts the alias only on the given filter pass(es)."""

    def __init__(self, alias_ok_on: set[bool]):
        self.alias_ok_on = alias_ok_on
        self.calls: list[tuple[str, bool]] = []

    def send_command(self, device_id, command, reverse_filters):
        self.calls.append((command["code"], reverse_filters))
        return command["code"] == "switch_alias" and reverse_filters in self.alias_ok_on


def _send(account):
    device = SimpleNamespace(category="sfkzq", get_status_code_aliases=lambda code: ["switch_alias"])
    counted: list[str] = []
    hub = SimpleNamespace(
        device_map={"v1": device},
        virtual_function_handler=SimpleNamespace(get_category_virtual_functions=lambda category: []),
        accounts={"iot": account},
        _note_controllable_command=lambda acc, device_id: counted.append(device_id),
    )
    return MultiManager.send_commands(hub, "v1", [{"code": "switch", "value": True}]), counted


def test_alias_success_is_not_resent_nor_overwritten():
    """C10: an alias the first filter pass accepts must not be sent a second
    time with reverse filters, and its success must survive."""
    account = AliasAccount(alias_ok_on={False})
    ok, counted = _send(account)
    assert ok is True
    assert account.calls == [("switch", False), ("switch", True), ("switch_alias", False)]
    assert counted == ["v1"]


def test_alias_falls_back_to_reverse_filters():
    account = AliasAccount(alias_ok_on={True})
    ok, counted = _send(account)
    assert ok is True
    assert account.calls[-2:] == [("switch_alias", False), ("switch_alias", True)]
    assert counted == ["v1"]


def test_alias_refused_everywhere_is_a_failure():
    ok, counted = _send(AliasAccount(alias_ok_on=set()))
    assert ok is False and counted == []
