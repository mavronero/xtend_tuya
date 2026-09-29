"""Timer slots of each valve: one owner, one writer (docs/architecture.md §4.5).

The device's timer DP is a sliding window that shows only the last-written
slot, so HA accumulates the 7 slots itself. `TimerState` is the only thing
that changes them: fed by decoded DP reports, by the timer service after a
confirmed DP clear, and by restore after a restart. The registry sensor and
the timer service only read it.

The device DP is the truth; the cloud registry is a mirror (a SmartLife
disable does not reach the DP, verified 2026-08-12 on three valves). The
cloud read (timer_reconcile.py, resync) only annotates the slots
(`apply_cloud`); it never changes them.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from homeassistant.core import HomeAssistant

from .codecs.time_task import SLOTS, TimeTaskFrame, days_of, mask_to_loops

_LOGGER = logging.getLogger(__name__)

DATA_KEY = "xtend_tuya_valve_timer_states"

# Cloud overlay state per slot (documented for the farm in farm/contract.py).
CLOUD_ON = "on"
CLOUD_OFF = "off"  # old QT-08W only: switched off in the app (functions[0].value.start)
CLOUD_MISSING = "missing"  # enabled in HA, no cloud timer, while the hub mirrors to the cloud
CLOUD_UNKNOWN = "unknown"


class TimerState:
    def __init__(self) -> None:
        self._slots: dict[int, dict[str, Any] | None] = {i: None for i in range(SLOTS)}
        # The DP keeps re-reporting its last write. Apply each payload once, or
        # every state read would re-apply the last delete over restored slots.
        self._last_payload: bytes | None = None
        # When the planned runs last changed (ISO, UTC; None = unknown). The
        # calendar expands the CURRENT slots over past days too; plans before
        # this moment were never the schedule, so they can't be "missed".
        self.changed_at: str | None = None
        # The last trusted cloud timer read: {checked_at, slots: {"i": state},
        # cloud_only: [slot-shaped dicts]}. None = never read.
        self.cloud: dict[str, Any] | None = None
        self._restored = False

    def apply_report(self, payload: bytes, frame: TimeTaskFrame | None) -> None:
        """A timer DP report (raw payload + its decoded frame)."""
        if payload == self._last_payload:
            return
        self._last_payload = payload
        before, planned = dict(self._slots), self._planned()
        self._apply(frame)
        self._restored = False
        if self._slots != before or self._planned() != planned:
            self._touch()

    def _touch(self) -> None:
        self.changed_at = datetime.now(UTC).isoformat(timespec="seconds")

    def _apply(self, frame: TimeTaskFrame | None) -> None:
        if frame is None or not 0 <= frame.index < SLOTS:
            return
        timer = frame.timer.as_attribute() if frame.timer else None
        # A report of this slot is newer than any cloud read of it, except the
        # DP's standing value read right after a restore: unchanged, no news.
        if not (self._restored and self._slots.get(frame.index) == timer):
            self._forget_cloud(frame.index)
        self._slots[frame.index] = timer
        if timer is None:
            return
        # Tuya's cloud registry can map two timers onto one device slot (969:
        # 04:05 and 22:05 both as slot 1). A slot repeating another slot's
        # time and days is a stale duplicate of this same timer; drop it.
        for other, held in self._slots.items():
            if other != frame.index and held and _key(held) == _key(timer):
                _LOGGER.warning(
                    "time_task slot %d duplicates slot %d (%02d:%02d) — dropping stale entry",
                    other, frame.index, timer["hour"], timer["minute"],
                )
                self._slots[other] = None
                self._forget_cloud(other)

    def clear(self, slot: int) -> None:
        """The slot's DP clear was accepted by the device."""
        if self._slots.get(slot) is not None:
            self._touch()
        self._slots[slot] = None
        self._forget_cloud(slot)

    def restore(
        self, data: dict[Any, Any], changed_at: str | None = None, cloud: Any = None
    ) -> None:
        """Hydrate from the registry sensor's last state after a restart."""
        self.changed_at = changed_at
        ok = isinstance(cloud, dict) and isinstance(cloud.get("slots"), dict)
        self.cloud = cloud if ok else None
        self._restored = True
        for i in range(SLOTS):
            held = data.get(str(i)) or data.get(i)
            self._slots[i] = held if isinstance(held, dict) else None

    def apply_cloud(self, timers: list[dict[str, Any]], mirror_on: bool) -> bool:
        """Annotate the slots from a successful cloud `/timers` read; False = not applied.

        Each held slot gets on / off / missing / unknown; enabled cloud timers
        no slot claims go to `cloud_only`. A read we can't trust keeps the
        previous overlay: an empty list while HA holds enabled slots (the C7
        shape), or an alias / time the cloud lists twice (the 969 collision).
        """
        if not timers and self.active_count:
            return False
        parsed = [p for t in timers if isinstance(t, dict) and (p := _parse_cloud_timer(t))]
        aliases = [p["alias"] for p in parsed if p["alias"]]
        keys = [_key(p) for p in parsed]
        if len(set(aliases)) != len(aliases) or len(set(keys)) != len(keys):
            _LOGGER.warning("cloud timers collide (alias or time listed twice), overlay kept: %s", timers)
            return False

        planned = self._planned()
        free = list(parsed)
        states: dict[str, str] = {}
        for i, held in self._slots.items():
            if not held:
                continue
            # Old valves: alias_name = device slot. Newer app / T3 timers
            # leave it blank, so those match on time + days.
            match = next((p for p in free if p["alias"] == str(i)), None) or next(
                (p for p in free if not p["alias"] and _key(p) == _key(held)), None
            )
            if match is not None:
                free.remove(match)
                states[str(i)] = CLOUD_ON if match["enabled"] else CLOUD_OFF
            elif held.get("enabled") and mirror_on:
                states[str(i)] = CLOUD_MISSING
            else:
                # Without the mirror HA timers never reach the cloud, and a
                # disabled one never does (set_timer): no match proves nothing.
                states[str(i)] = CLOUD_UNKNOWN
        self.cloud = {
            "checked_at": datetime.now(UTC).isoformat(timespec="seconds"),
            "slots": states,
            "cloud_only": [
                {k: v for k, v in p.items() if k != "alias"} for p in free if p["enabled"]
            ],
        }
        if self._planned() != planned:
            self._touch()
        return True

    def _forget_cloud(self, slot: int) -> None:
        # A new dict, never in place: the published state (or the restored
        # one) may hold the old one.
        if self.cloud and str(slot) in self.cloud["slots"]:
            slots = {k: v for k, v in self.cloud["slots"].items() if k != str(slot)}
            self.cloud = {**self.cloud, "slots": slots}

    def _planned(self) -> frozenset[tuple[Any, ...]]:
        """The runs the calendar plans from this state (mirrors farm/calendar.py)."""
        overlay = (self.cloud or {}).get("slots", {})
        held = [
            (_key(t), t.get("value"))
            for i, t in self._slots.items()
            if t and t.get("enabled") and overlay.get(str(i)) not in (CLOUD_OFF, CLOUD_MISSING)
        ]
        extra = [(_key(t), t.get("value")) for t in (self.cloud or {}).get("cloud_only", [])]
        return frozenset(held + extra)

    def slot(self, index: int) -> dict[str, Any] | None:
        return self._slots.get(index)

    def attribute(self) -> dict[str, dict[str, Any] | None]:
        """Slots keyed by string index, for the JSON `slots` attribute."""
        return {str(i): held for i, held in self._slots.items()}

    @property
    def active_count(self) -> int:
        return sum(1 for held in self._slots.values() if held and held.get("enabled"))


def _key(timer: dict[str, Any]) -> tuple[Any, Any, Any]:
    return (timer.get("hour"), timer.get("minute"), timer.get("days_mask"))


def _parse_cloud_timer(timer: dict[str, Any]) -> dict[str, Any] | None:
    """One cloud `/timers` entry as a slot-shaped dict plus its alias, or None.

    `loops` maps to the DP days mask char for char (tt.mask_to_loops, the
    same mapping resync matches on). Enabled: an old QT-08W timer carries
    functions[0].value.start. T3 app timers come back with `functions: []`
    and `status` 0 while they still water (2026-09-29: 755, 702), so a
    timer without a start flag counts as on; `status` is never read.
    """
    funcs = timer.get("functions") or []
    value = funcs[0].get("value") if funcs and isinstance(funcs[0], dict) else None
    value = value if isinstance(value, dict) else {}
    time_str = str(timer.get("time") or value.get("startTimeStr") or "")
    loops = str(timer.get("loops") or value.get("loops") or "")
    try:
        hour, minute = (int(x) for x in time_str.split(":"))
    except ValueError:
        return None
    mask = sum(1 << i for i, c in enumerate(loops) if c == "1")
    if mask_to_loops(mask) != loops:
        return None
    capacity = int(value.get("capacity") or 0)
    alias = str(timer.get("alias_name") or "").strip()
    return {
        "alias": alias if alias.isdigit() else "",
        "hour": hour,
        "minute": minute,
        "days_mask": mask,
        "days": days_of(mask),
        # T3 app timers carry no duration: value 0 = a zero-length marker in the calendar.
        "mode": "volume" if capacity else "duration",
        "value": capacity or int(value.get("duration") or 0),
        "enabled": bool(value.get("start", True)),
    }


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
    registry: dict[str, LiveTimers] = hass.data.get(DATA_KEY, {})
    return registry.get(device_id)
