"""Timer slots of each valve: one owner, one writer (docs/architecture.md §4.5).

The device's timer DP is a sliding window that shows only the last-written
slot, so HA accumulates the 7 slots itself. `TimerState` is the only thing
that changes them: fed by decoded DP reports, by the timer service after a
confirmed DP clear, and by restore after a restart. The registry sensor and
the timer service only read it.

The device DP is the truth; the cloud registry is a mirror (a SmartLife
disable does not reach the DP, verified 2026-08-12 on three valves).
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.core import HomeAssistant

from .codecs.time_task import SLOTS, TimeTaskFrame

_LOGGER = logging.getLogger(__name__)

DATA_KEY = "xtend_tuya_valve_timer_states"


class TimerState:
    def __init__(self) -> None:
        self._slots: dict[int, dict[str, Any] | None] = {i: None for i in range(SLOTS)}
        # The DP keeps re-reporting its last write. Apply each payload once, or
        # every state read would re-apply the last delete over restored slots.
        self._last_payload: bytes | None = None

    def apply_report(self, payload: bytes, frame: TimeTaskFrame | None) -> None:
        """A timer DP report (raw payload + its decoded frame)."""
        if payload == self._last_payload:
            return
        self._last_payload = payload
        if frame is None or not 0 <= frame.index < SLOTS:
            return
        if frame.timer is None:
            self._slots[frame.index] = None
            return
        timer = frame.timer.as_attribute()
        self._slots[frame.index] = timer
        # Tuya's cloud registry can map two timers onto one device slot (969:
        # 04:05 and 22:05 both as slot 1). A slot repeating another slot's
        # time and days is a stale duplicate of this same timer; drop it.
        for other, held in self._slots.items():
            if (
                other != frame.index
                and held
                and (held.get("hour"), held.get("minute"), held.get("days_mask"))
                == (timer["hour"], timer["minute"], timer["days_mask"])
            ):
                _LOGGER.warning(
                    "time_task slot %d duplicates slot %d (%02d:%02d) — dropping stale entry",
                    other, frame.index, timer["hour"], timer["minute"],
                )
                self._slots[other] = None

    def clear(self, slot: int) -> None:
        """The slot's DP clear was accepted by the device."""
        self._slots[slot] = None

    def restore(self, data: dict[Any, Any]) -> None:
        """Hydrate from the registry sensor's last state after a restart."""
        for i in range(SLOTS):
            held = data.get(str(i)) or data.get(i)
            self._slots[i] = held if isinstance(held, dict) else None

    def slot(self, index: int) -> dict[str, Any] | None:
        return self._slots.get(index)

    def attribute(self) -> dict[str, dict[str, Any] | None]:
        """Slots keyed by string index, for the JSON `slots` attribute."""
        return {str(i): held for i, held in self._slots.items()}

    @property
    def active_count(self) -> int:
        return sum(1 for held in self._slots.values() if held and held.get("enabled"))


@dataclass(frozen=True)
class LiveTimers:
    """A valve's timer state plus the way to publish it (the registry sensor)."""

    state: TimerState
    publish: Callable[[], None]


def register(hass: HomeAssistant, device_id: str, live: LiveTimers) -> Callable[[], None]:
    """Make a registry sensor's timers reachable for the timer service; returns the undo."""
    registry: dict[str, LiveTimers] = hass.data.setdefault(DATA_KEY, {})
    registry[device_id] = live

    def unregister() -> None:
        if registry.get(device_id) is live:
            del registry[device_id]

    return unregister


def live_timers(hass: HomeAssistant, device_id: str) -> LiveTimers | None:
    return hass.data.get(DATA_KEY, {}).get(device_id)
