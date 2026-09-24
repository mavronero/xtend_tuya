"""Single ("water now") runs: `one_control` (QT-08W) and `cyc_control_0` (QT-08W-T3).

one_control, 6 bytes [lead, value(4B BE), flag], captured 2026-06-08 from the
SmartLife app's own single watering on FF East 10 (920):
    AAAAAB4B = [0x00, 0,0,0,0x1E, 0x01] -> lead 0, 30 s, start; the device
    ran 30 s and closed itself. lead=1 is ignored by the firmware (the
    4.4.183 "never stops" bug). The status mirrors the last command: lead 0 =
    duration, 1 = volume (verified 2026-06-09 on 964); value 0 = idle.

cyc_control_0, 10 bytes [00, 00, value(4B BE), 01, 00, 00, flag], captured
2026-07-15 on 706: start = 00 00 00 00 00 3c 01 00 00 01, stop = flag 0.
byte[6]=01 is duration mode; volume runs were never captured.
"""

from __future__ import annotations

ONE_CONTROL_CODE = "one_control"
CYC_CONTROL_CODE = "cyc_control_0"
LEAD_SINGLE_RUN = 0
# Volume single-run was never captured from SmartLife; unverified guess kept
# only for flow-meter valves. Prefer duration.
LEAD_VOLUME = 3
FLAG_START = 1
FLAG_IDLE = 0


def encode_one_control(lead: int, value: int, flag: int) -> bytes:
    _check_value(value)
    return bytes([lead & 0xFF]) + value.to_bytes(4, "big") + bytes([flag & 0xFF])


def decode_one_control(frame: bytes) -> tuple[int, int] | None:
    """(lead, value), or None for a short frame."""
    if len(frame) < 6:
        return None
    return frame[0], int.from_bytes(frame[1:5], "big")


def one_control_mode(lead: int, value: int) -> str:
    """Status label: a zero value means no single watering is set."""
    if not value:
        return "idle"
    if lead == 0:
        return "duration"
    if lead == 1:
        return "volume"
    return f"unknown ({lead})"


def encode_cyc_control(value: int, flag: int) -> bytes:
    _check_value(value)
    return bytes([0, 0]) + value.to_bytes(4, "big") + bytes([1, 0, 0, flag & 0xFF])


def _check_value(value: int) -> None:
    if not 0 <= value <= 0xFFFFFFFF:
        raise ValueError(f"value out of range: {value}")
