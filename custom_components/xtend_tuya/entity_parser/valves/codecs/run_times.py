"""`start_time` / `close_time` (QT-08W): 6 bytes [year-2000, month, day, hour, minute, second].

Captured 2026-04-10: GgQKBTs7 = [26, 4, 10, 5, 59, 59] -> 2026-04-10 05:59:59.
0xFF / zero fields mean "unset". Note the firmware writes the *scheduled*
close at run start (end_time pre-report), so a close stamp can be in the future.
"""

from __future__ import annotations

START_CODE = "start_time"
CLOSE_CODE = "close_time"


def decode(frame: bytes) -> str | None:
    """'YYYY-MM-DD HH:MM:SS' in device-local time, or None when unset."""
    if len(frame) != 6:
        return None
    y, mo, d, h, mi, s = frame
    if y == 255 or mo == 0 or mo > 12 or d == 0 or d > 31:
        return None
    return f"20{y:02d}-{mo:02d}-{d:02d} {h:02d}:{mi:02d}:{s:02d}"
