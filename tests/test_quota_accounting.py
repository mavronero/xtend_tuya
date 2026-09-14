"""Self-check for controllable-quota accounting (audit C6/C10/C11).

Standalone (no Home Assistant import) — mirrors MultiManager.note_cloud_write
and the alias fallback in MultiManager.send_commands.

A Tuya Trial project can control 10 distinct devices per calendar month. The
tracker only counted devices that went through send_commands, so every cloud
timer POST/DELETE (`/v1.0/devices/{id}/timers` via account.call_api) was free
in HA's books and the pool ran out unannounced — and a command counted as
"success" whenever the transport did not raise.

Run: `python tests/test_quota_accounting.py`
"""

import re

DEVICE_WRITE_URL = re.compile(r"^/v[0-9.]+/devices/([^/?]+)/")

OK = {"success": True}
REFUSED = {"success": False, "code": 60001001, "msg": "exceed control limit"}


class Quota:
    def __init__(self):
        self.devices = set()

    def record(self, device_id):
        self.devices.add(device_id)


def note_cloud_write(quota, method, url, response):
    """Mirror of MultiManager.note_cloud_write."""
    if method == "GET" or quota is None:
        return
    if not isinstance(response, dict) or response.get("success") is not True:
        return
    if match := DEVICE_WRITE_URL.match(url):
        quota.record(match.group(1))


def alias_fallback(send, accounts, commands):
    """Mirror of the alias loop in send_commands (C10)."""
    calls = []
    result = False
    for command in commands:
        alias_result = False
        for acc in accounts:
            if alias_result := send(acc, command, False, calls):
                break
        if not alias_result:
            for acc in accounts:
                if alias_result := send(acc, command, True, calls):
                    break
        if alias_result:
            result = True
            break
    return result, calls


def demo():
    q = Quota()
    # A cloud timer write counts the valve, once, whichever verb it used.
    note_cloud_write(q, "POST", "/v1.0/devices/bf01/timers", OK)
    note_cloud_write(q, "DELETE", "/v1.0/devices/bf01/timers?group_id=7", OK)
    assert q.devices == {"bf01"}
    note_cloud_write(q, "POST", "/v1.0/devices/bf02/commands", OK)
    assert q.devices == {"bf01", "bf02"}

    # Reads are free, and a refused write must not burn a unit.
    note_cloud_write(q, "GET", "/v1.0/devices/bf03/timers", OK)
    note_cloud_write(q, "POST", "/v1.0/devices/bf03/timers", REFUSED)
    note_cloud_write(q, "POST", "/v1.0/devices/bf03/timers", None)
    # Neither does a write that is not addressed to a device.
    note_cloud_write(q, "POST", "/v1.0/homes/42/rooms", OK)
    assert "bf03" not in q.devices and len(q.devices) == 2

    # C10: the first alias attempt succeeding must not trigger a second send
    # to the same valve, nor have its success overwritten.
    def send(acc, cmd, reverse, calls):
        calls.append((acc, cmd, reverse))
        return not reverse  # the plain filter set works

    ok, calls = alias_fallback(send, ["iot"], ["switch"])
    assert ok is True
    assert calls == [("iot", "switch", False)], "no duplicate command"

    # And when the first set genuinely fails, the reverse set still runs.
    def send_reverse_only(acc, cmd, reverse, calls):
        calls.append((acc, cmd, reverse))
        return reverse

    ok, calls = alias_fallback(send_reverse_only, ["iot"], ["switch"])
    assert ok is True and len(calls) == 2
    print("ok")


if __name__ == "__main__":
    demo()
