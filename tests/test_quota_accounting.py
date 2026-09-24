"""Self-check for the alias fallback in MultiManager.send_commands (audit C10).

Standalone mirror (no Home Assistant import). Converted to a real-import test
in step 8 (docs/architecture.md §7); the note_cloud_write part (C6) already
runs against the real code in tests/unit/test_quota_accounting.py.

A Tuya Trial project can control 10 distinct devices per calendar month. The
tracker only counted devices that went through send_commands, so every cloud
timer POST/DELETE (`/v1.0/devices/{id}/timers` via account.call_api) was free
in HA's books and the pool ran out unannounced — and a command counted as
"success" whenever the transport did not raise.

Run: `python tests/test_quota_accounting.py`
"""


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
