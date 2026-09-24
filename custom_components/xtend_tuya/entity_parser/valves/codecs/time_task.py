"""Timer DPs: `time_task` (QT-08W, 11 bytes) and `time_task_0` (QT-08W-T3, 12 bytes).

Both DPs are a sliding window: the device keeps up to 7 timers internally and
the DP only shows the last-written one.

QT-08W, corrected 2026-06-05 against live SmartLife toggles on S 809:
    [slot, enabled, mode, value(4B BE), hour, minute, days_mask, 1]
  byte[1] is the enable flag (SmartLife flips only this byte); byte[10] is a
  constant 1. A delete is byte[1]==0 with an all-zero payload; a disabled
  timer keeps its payload with byte[1]==0.

QT-08W-T3, decoded live 2026-07-15 on 706:
    [00, index, b2, mode, value(4B BE), hour, minute, days_mask, enabled]
  byte[1] is the per-timer index; byte[2] is an order marker (SmartLife writes
  the index there too); an all-zero payload is an empty slot. Only
  `time_task_0` accepts writes (`time_task_1` is ignored by the device).

Common: mode 0 = duration (value in seconds), 1 = volume (value in liters);
days bit 0 = Monday.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

_LOGGER = logging.getLogger(__name__)

QT08W_CODE = "time_task"
T3_CODE = "time_task_0"
SLOTS = 7
DAYS = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
MODE_DURATION = 0
MODE_VOLUME = 1


@dataclass(frozen=True)
class Timer:
    slot: int
    hour: int
    minute: int
    mode: int
    value: int
    days_mask: int
    enabled: bool

    def as_attribute(self) -> dict[str, Any]:
        """The slot dict HA publishes in the registry sensor's `slots` attribute."""
        duration = self.mode == MODE_DURATION
        return {
            "slot": self.slot,
            "hour": self.hour,
            "minute": self.minute,
            "mode": "duration" if duration else "volume",
            "value": self.value,
            "value_unit": "s" if duration else "L",
            "days": days_of(self.days_mask),
            "days_mask": self.days_mask,
            "enabled": self.enabled,
        }


@dataclass(frozen=True)
class TimeTaskFrame:
    index: int
    timer: Timer | None  # None = the slot at `index` is empty / deleted


def decode_qt08w(frame: bytes) -> TimeTaskFrame | None:
    if len(frame) < 11:
        return None
    index, enabled, payload = frame[0], frame[1], frame[2:11]
    if enabled == 0 and not any(payload):
        return TimeTaskFrame(index, None)
    return TimeTaskFrame(
        index,
        Timer(
            slot=index,
            hour=payload[5],
            minute=payload[6],
            mode=payload[0],
            value=int.from_bytes(payload[1:5], "big"),
            days_mask=payload[7],
            enabled=bool(enabled),
        ),
    )


def decode_t3(frame: bytes) -> TimeTaskFrame | None:
    if len(frame) < 12:
        return None
    index = frame[1]
    value = int.from_bytes(frame[4:8], "big")
    hour, minute, days_mask, enabled = frame[8], frame[9], frame[10], frame[11]
    if not value and not hour and not minute and not days_mask and not enabled:
        return TimeTaskFrame(index, None)
    return TimeTaskFrame(
        index,
        Timer(
            slot=index,
            hour=hour,
            minute=minute,
            mode=frame[3],
            value=value,
            days_mask=days_mask,
            enabled=bool(enabled),
        ),
    )


def encode_qt08w(timer: Timer) -> bytes:
    _check(timer)
    return bytes(
        [timer.slot, 1 if timer.enabled else 0, timer.mode & 0xFF]
        + list(timer.value.to_bytes(4, "big"))
        + [timer.hour & 0xFF, timer.minute & 0xFF, timer.days_mask & 0x7F, 1]
    )


def encode_t3(timer: Timer) -> bytes:
    _check(timer)
    return bytes(
        [0, timer.slot, timer.slot, timer.mode & 0xFF]
        + list(timer.value.to_bytes(4, "big"))
        + [timer.hour & 0xFF, timer.minute & 0xFF, timer.days_mask & 0x7F, 1 if timer.enabled else 0]
    )


def clear_qt08w(slot: int) -> bytes:
    _check_slot(slot)
    return bytes([slot] + [0] * 10)


def clear_t3(index: int) -> bytes:
    """All-zero payload at `index`; index 0 = the all-zeros frame confirmed on 706."""
    _check_slot(index)
    return bytes([0, index] + [0] * 10)


def days_of(mask: int) -> list[str]:
    return [DAYS[i] for i in range(7) if mask & (1 << i)]


def days_to_mask(days: list[str] | int | None) -> int:
    if days is None:
        return 0
    if isinstance(days, int):
        return days & 0x7F
    mask = 0
    for day in days:
        try:
            mask |= 1 << DAYS.index(day.capitalize())
        except ValueError:
            _LOGGER.warning("Unknown day %r (expected one of %s)", day, list(DAYS))
    return mask


def mask_to_loops(mask: int) -> str:
    """Tuya cloud timer `loops`: one char per day, Monday first."""
    return "".join("1" if mask & (1 << i) else "0" for i in range(7))


def mode_from_name(mode: str) -> int:
    if mode == "duration":
        return MODE_DURATION
    if mode == "volume":
        return MODE_VOLUME
    raise ValueError(f"mode must be 'duration' or 'volume', got {mode!r}")


def _check(timer: Timer) -> None:
    _check_slot(timer.slot)
    if not 0 <= timer.value <= 0xFFFFFFFF:
        raise ValueError(f"value out of range: {timer.value}")


def _check_slot(slot: int) -> None:
    if not 0 <= slot < SLOTS:
        raise ValueError(f"slot must be 0–6, got {slot}")
