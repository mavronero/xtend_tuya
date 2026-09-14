"""Self-check for the OpenAPI hang guards (audit C4).

Standalone (no Home Assistant import) — mirrors the bounded wait in
TuyaOpenAPI.reconnect and asserts the two source invariants in
lib/tuya_iot/openapi.py.

requests has no default timeout, so a hung TCP connection parked an HA
executor thread forever; and connect() set token_info.reconnecting without a
try/finally, so one raise (__request re-raises on a non-JSON body — a proxy
HTML error page will do it) left the flag True and every later caller that
needed a refresh spun in reconnect()'s busy-wait for good. Threads
accumulated, the executor pool wedged, data stopped, nothing was logged.

Run: `python tests/test_openapi_timeouts.py`
"""

import pathlib
import re

SRC = (
    pathlib.Path(__file__).resolve().parents[1]
    / "custom_components" / "xtend_tuya" / "lib" / "tuya_iot" / "openapi.py"
)

WAIT_TIME = 0.2
RECONNECT_WAIT_TIMEOUT = 60


def wait_passes(is_reconnecting):
    """Mirror of reconnect()'s bounded busy-wait; returns the sleep count."""
    loop_pass = 0
    while is_reconnecting(loop_pass) and loop_pass * WAIT_TIME < RECONNECT_WAIT_TIMEOUT:
        loop_pass += 1
    return loop_pass


def demo():
    # The other thread finishes: we wake as soon as it clears the flag.
    assert wait_passes(lambda n: n < 5) == 5
    # The flag is never cleared: bounded at 60 s instead of forever.
    passes = wait_passes(lambda n: True)
    assert passes * WAIT_TIME >= RECONNECT_WAIT_TIMEOUT
    assert passes == 300
    # Already clear: no wait at all.
    assert wait_passes(lambda n: False) == 0

    src = SRC.read_text()
    # Every HTTP call is bounded.
    assert re.search(r"self\.session\.request\((?:[^)]*\n)*?[^)]*timeout=", src), \
        "session.request must carry a timeout"
    assert "REQUEST_TIMEOUT = 30" in src
    # The reconnecting flag is always cleared, including on a raise.
    connect = src.split("    def connect(", 1)[1].split("\n    def ", 1)[0]
    assert "finally:" in connect, "connect() must clear reconnecting in a finally"
    print("ok")


if __name__ == "__main__":
    demo()
