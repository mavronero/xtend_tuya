"""Materialized store of completed irrigation runs.

A watering run is immutable once it closes, but the calendar used to
re-derive every run on every render by scanning the recorder's raw
cur_cap series (~500 rows per run × 107 valves — millions of rows).
Even batched, that scan blew past Nabu Casa's 60 s proxy timeout and the
Calendar panel rendered empty (ticket 9W8FXA4l).

This module records each run exactly once, event-driven:

  - A state listener watches every fdm5kw end_time/close_time sensor.
  - The firmware pre-reports the SCHEDULED close time the moment a run
    starts; that value lies in the future and is skipped. The real close
    report lies in the (immediate) past and triggers recording.
  - Liters are read from the LIVE watering_volume state at close — the
    cur_cap counter rests at the run's final total, so no history scan
    is needed at all.

Persistence: homeassistant.helpers.storage.Store (JSON in .storage/),
debounced saves. Rows survive HA restarts AND the recorder's ~30-day
retention, so the calendar can show full-season history.

A one-time backfill (guarded by a flag in the store) imports the last
30 days from the recorder in the background at first setup.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from functools import partial
from typing import Any, Callable

from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.event import (
    async_call_later,
    async_track_state_change_event,
)
from homeassistant.helpers.storage import Store

from .water_math import plausible_delta, sum_plausible_deltas

_LOGGER = logging.getLogger(__name__)

STORE_KEY = "xtend_tuya.irrigation_runs"
STORE_VERSION = 1
SAVE_DELAY_SEC = 30

# Keep roughly two seasons; prune beyond that on save.
RETENTION_DAYS = 730

# A close report is "real" (not the pre-reported schedule) when its value
# is at most this far in the future. Clock skew margin.
MAX_FUTURE_SLACK_SEC = 120

# Physical plausibility cap for liters at close: 50 L/min (2× meter spec)
# times the run duration, floored at 50 L for sub-minute runs.
MAX_LPM_CAP = 50.0

# Runs longer than this are stuck-open/garbage records, not real watering
# cycles (mirrors calendar.MAX_SANE_RUN_SECONDS). Applies to every path.
MAX_RUN_SECONDS = 6 * 3600

# A T3 run is over when its volume counter has stopped climbing for this
# long. The firmware sends no close report, and counter_custom can go weeks
# stale while water still flows (audit R4: valve 705's counter was 25 days
# old while flow_sta_0 showed a 14:30→14:45 run).
IDLE_CLOSE_SEC = 120

# Slack for matching a flow-derived run against the authoritative
# counter_custom row for the same run.
RUN_DEDUPE_SLACK_SEC = 180

# Grace after a pre-reported close before its liters are read (R6): the
# counter publishes every ~10 s, so a few seconds past the scheduled close
# is enough for the final value to have landed.
PREREPORT_SETTLE_SEC = 15

# A real close report arrives in the same batch as the counter's last
# reading, in no fixed order: a per-run counter reading this soon after a
# stored close still belongs to that run (908: 93 L stored, 94 L real).
CLOSE_SETTLE_SEC = 30

# A counter falling to this or less is a per-run counter restarting, not a
# garbage sample on an odometer.
MIN_RESET_READING_L = 2.0

DOMAIN_KEY = "xtend_tuya_runs_store"


class RunsStore:
    """In-memory runs table with JSON persistence.

    runs[device_id] = list of
      {"start": iso, "end": iso, "duration_seconds": float,
       "total_l": float | None}
    sorted by end ascending.
    """

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store = Store(hass, STORE_VERSION, STORE_KEY)
        self.runs: dict[str, list[dict[str, Any]]] = {}
        self.backfilled = False
        # Recorder backfill generation already applied (see BACKFILL_VERSION).
        self.backfill_version = 0
        self._backfill_started = False
        self._unsub: list[Callable[[], None]] = []
        # entity_id -> device record (end sensor routing table)
        self._end_entity_to_device: dict[str, dict[str, Any]] = {}
        # entity_id -> device record for T3 counter_custom last-run sensors
        self._counter_entity_to_device: dict[str, dict[str, Any]] = {}
        # entity_id -> device record for the raw liters counter
        self._vol_entity_to_device: dict[str, dict[str, Any]] = {}
        # tuya device id -> live volume-counter accumulator, see _on_volume_change
        self._vol: dict[str, dict[str, Any]] = {}
        # Valves whose counter restarts at 0 every run: their reading at the
        # close IS the run total, which survives an HA restart mid-run.
        self.per_cycle: set[str] = set()
        # tuya device id -> {end iso: row}, the dedupe index (see _index)
        self._end_index: dict[str, dict[str, dict[str, Any]]] = {}

    # ------------------------------------------------------------- load/save

    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        self.runs = data.get("runs", {})
        self.backfilled = bool(data.get("backfilled"))
        self.backfill_version = int(data.get("backfill_version") or (1 if self.backfilled else 0))
        self.per_cycle = set(data.get("per_cycle") or [])
        # One-time repair of rows recorded before add_run deduped by start
        # (2026-09-25 data check: 189 copies, 170 of them one valve's).
        removed = 0
        for device_id, rows in self.runs.items():
            self.runs[device_id], n = dedupe_by_start(rows)
            removed += n
        if removed:
            _LOGGER.info("runs_store: merged %d duplicate run rows (same valve and start)", removed)
            self.async_schedule_save()

    def _data(self) -> dict[str, Any]:
        return {
            "runs": self.runs,
            "backfilled": self.backfilled,
            "backfill_version": self.backfill_version,
            "per_cycle": sorted(self.per_cycle),
        }

    def async_schedule_save(self) -> None:
        self._store.async_delay_save(self._data, SAVE_DELAY_SEC)

    def _prune(self, device_id: str) -> None:
        cutoff = (
            datetime.now().astimezone() - timedelta(days=RETENTION_DAYS)
        ).isoformat()
        rows = self.runs.get(device_id)
        if rows and rows[0]["end"] < cutoff:
            self.runs[device_id] = [r for r in rows if r["end"] >= cutoff]
            self._end_index.pop(device_id, None)

    # ------------------------------------------------------------- recording

    def add_run(
        self,
        device_id: str,
        start: datetime,
        end: datetime,
        total_l: float | None,
    ) -> bool:
        """Insert a closed run, deduped by end timestamp. Returns True if new."""
        if end <= start:
            return False
        rows = self.runs.setdefault(device_id, [])
        end_iso = end.isoformat()
        # Dedupe: DP redelivers and backfill overlaps land on the same end.
        # A full per-device index, not a scan of the newest 20 rows — the
        # backfill and any re-import duplicated anything older than that
        # (audit R10).
        index = self._index(device_id)
        if (existing := index.get(end_iso)) is not None:
            # Prefer a row that has liters over one that doesn't. `0.0` is
            # "recorded before the water was counted" (R6), not a real
            # reading, so a later non-zero value must be allowed to replace
            # it — `is None` alone never corrected those rows.
            if total_l and not existing.get("total_l"):
                existing["total_l"] = total_l
                return True
            return False
        # One run per start. The end sensor can report again after the valve
        # closed (a later or pre-reported close time), and each new end used
        # to become another row: FG Nursery (811) had 73 copies of one run on
        # 2026-09-19, some stretched to 24-48 h. The earliest end is the
        # close; a copy only contributes liters the kept row lacks.
        start_iso = start.isoformat()
        same = next((r for r in rows if r["start"] == start_iso), None)
        if same is not None:
            changed = False
            if end < datetime.fromisoformat(same["end"]):
                index.pop(same["end"], None)
                same["end"] = end_iso
                same["duration_seconds"] = (end - start).total_seconds()
                index[end_iso] = same
                rows.sort(key=lambda r: r["end"])
                changed = True
            if total_l and not same.get("total_l"):
                same["total_l"] = total_l
                changed = True
            return changed
        row = {
            "start": start_iso,
            "end": end_iso,
            "duration_seconds": (end - start).total_seconds(),
            "total_l": total_l,
        }
        rows.append(row)
        index[end_iso] = row
        rows.sort(key=lambda r: r["end"])
        self._prune(device_id)
        return True

    def _index(self, device_id: str) -> dict[str, dict[str, Any]]:
        """end-timestamp -> row, built on first use per device."""
        index = self._end_index.get(device_id)
        if index is None:
            index = {r["end"]: r for r in self.runs.get(device_id, [])}
            self._end_index[device_id] = index
        return index

    # ------------------------------------------------------------- queries

    def runs_in_window(
        self, device_id: str, start: datetime, end: datetime
    ) -> list[dict[str, Any]]:
        out = []
        for r in self.runs.get(device_id, []):
            try:
                r_end = datetime.fromisoformat(r["end"])
                r_start = datetime.fromisoformat(r["start"])
            except ValueError:
                continue
            if start <= r_end <= end:
                out.append(
                    {
                        "start": r_start,
                        "end": r_end,
                        "duration_seconds": r["duration_seconds"],
                        "total_l": r.get("total_l"),
                        "open": False,
                    }
                )
        return out

    def last_runs(self, device_id: str, n: int) -> list[dict[str, Any]]:
        rows = self.runs.get(device_id, [])[-n:]
        return [
            {
                "start": datetime.fromisoformat(r["start"]),
                "end": datetime.fromisoformat(r["end"]),
                "duration_seconds": r["duration_seconds"],
                "total_l": r.get("total_l"),
                "open": False,
            }
            for r in rows
        ]

    # ------------------------------------------------------------- listener

    def release(self) -> None:
        """Drop every state subscription this store holds.

        `_unsub` used to be appended to and never called, so subscriptions
        stacked up across every 15-minute re-arm and every config-entry
        reload (audit R14).
        """
        while self._unsub:
            self._unsub.pop()()
        for acc in self._vol.values():
            if acc.get("unsub") is not None:
                acc["unsub"]()
                acc["unsub"] = None

    def track_devices(self, devices: list[dict[str, Any]]) -> None:
        """(Re)arm the state listeners for the given device records
        (as produced by contract.discover_valves)."""
        end_map: dict[str, dict[str, Any]] = {}
        counter_map: dict[str, dict[str, Any]] = {}
        vol_map: dict[str, dict[str, Any]] = {}
        for d in devices:
            if d.get("end_entity") and d.get("start_entity"):
                end_map[d["end_entity"]] = d
            # T3 valves: no start/end sensors — record from the
            # counter_custom last-run sensor (the device's own record).
            if d.get("counter_entity"):
                counter_map[d["counter_entity"]] = d
            if d.get("volume_entity"):
                vol_map[d["volume_entity"]] = d
        c_added = set(counter_map) - set(self._counter_entity_to_device)
        e_added = set(end_map) - set(self._end_entity_to_device)
        self._end_entity_to_device = end_map
        self._counter_entity_to_device = counter_map
        self._vol_entity_to_device = vol_map

        self.release()
        for entities, handler in (
            (end_map, self._on_end_change),
            (counter_map, self._on_counter_change),
            (vol_map, self._on_volume_change),
        ):
            if entities:
                self._unsub.append(
                    async_track_state_change_event(
                        self.hass, list(entities), handler
                    )
                )

        # The counter DP retains the last completed run, so seed it on
        # first arm — covers runs finished while no listener was armed
        # (boot race, HA downtime). add_run's end-timestamp dedupe makes
        # the replay idempotent.
        for entity_id in c_added:
            if state := self.hass.states.get(entity_id):
                self._record_counter_csv(counter_map[entity_id], state.state)
        # Same for start/end valves: the sensors hold the last run (restored
        # or re-read at startup), which a run ending while HA was down or
        # before the listener was armed would otherwise lose. add_run makes
        # the replay idempotent.
        now = datetime.now().astimezone()
        for entity_id in e_added:
            dev = end_map[entity_id]
            end_state = self.hass.states.get(entity_id)
            start_state = self.hass.states.get(dev["start_entity"])
            end = _parse_iso(end_state.state) if end_state else None
            start = _parse_iso(start_state.state) if start_state else None
            if (
                start is not None
                and end is not None
                and start < end <= now
                and (end - start).total_seconds() <= MAX_RUN_SECONDS
            ):
                self._record_end(dev, start, end)

    @callback
    def _on_end_change(self, event: Event) -> None:
        entity_id = event.data.get("entity_id")
        new_state = event.data.get("new_state")
        d = self._end_entity_to_device.get(entity_id)
        if d is None or new_state is None:
            return
        end = _parse_iso(new_state.state)
        if end is None:
            return
        now = datetime.now().astimezone()
        if end > now:
            # Pre-reported SCHEDULED close: the firmware writes it the moment
            # a run starts. A valve that then closes exactly on schedule
            # reports the SAME value again, which fires no state change, so
            # waiting for "the real close report" lost the run: about 149
            # runs fleet-wide in 7 days (2026-09-25, FF East 01 & co.).
            # Record at the scheduled close instead; a different real close
            # arriving first wins (_record_end drops the stand-in, add_run
            # keeps one run per start with the earliest end).
            # This report marks a run START: liters counted since the last
            # recorded run belong to no run (one that was lost), and used to
            # be added to this one (978: 119 L stored, 9 L real).
            self._reset_accumulator(d["tuya_device_id"])
            delay = (end - now).total_seconds()
            if delay <= MAX_RUN_SECONDS:
                async_call_later(
                    self.hass,
                    delay + PREREPORT_SETTLE_SEC,
                    partial(self._record_scheduled, d, end),
                )
            return
        start_state = self.hass.states.get(d["start_entity"])
        start = _parse_iso(start_state.state) if start_state else None
        if start is None or end <= start:
            return
        # A close pushed before its own start pairs with the PREVIOUS cycle's
        # start; the other two recording paths cap at 6 h, this one only
        # required end > start and let the bogus row into the export (R5).
        if (end - start).total_seconds() > MAX_RUN_SECONDS:
            _LOGGER.debug(
                "runs_store: skipping run %s %s→%s, over the %d s cap",
                d["tuya_device_id"], start, end, MAX_RUN_SECONDS,
            )
            return
        self._record_end(d, start, end, None)

    def _late_close_reading(self, device_id: str, value: float, now: datetime) -> None:
        """Raise the last run's liters to a per-run counter reading that
        landed just after its close report."""
        rows = self.runs.get(device_id)
        last = rows[-1] if rows else None
        if last is None or last.get("total_l") is None or value <= last["total_l"]:
            return
        if (now - datetime.fromisoformat(last["end"])).total_seconds() > CLOSE_SETTLE_SEC:
            return
        if _sane_liters(value, last["duration_seconds"]) is not None:
            last["total_l"] = value
            self.async_schedule_save()

    def _reset_accumulator(self, device_id: str) -> None:
        if acc := self._vol.get(device_id):
            acc["delivered"] = 0.0
            acc["first_rise"] = acc["last_rise"] = None

    @callback
    def _record_scheduled(self, d: dict[str, Any], end: datetime, _now: Any = None) -> None:
        """A pre-reported close has passed: pair it with the start sensor as
        it reads now (at run start the start and end DPs arrive in one
        batch, in no fixed order) and record it unless the real close
        already did."""
        start_state = self.hass.states.get(d["start_entity"])
        start = _parse_iso(start_state.state) if start_state else None
        if start is None or end <= start or (end - start).total_seconds() > MAX_RUN_SECONDS:
            return
        self._record_end(d, start, end, deferred=True)

    @callback
    def _record_end(
        self,
        d: dict[str, Any],
        start: datetime,
        end: datetime,
        _now: Any = None,
        deferred: bool = False,
    ) -> None:
        if deferred and self._row_near(
            d["tuya_device_id"], end, MAX_FUTURE_SLACK_SEC
        ):
            # The real close report landed while we were waiting — that one
            # carries the true close time, so drop the scheduled stand-in
            # instead of storing the same run twice.
            return
        total_l = self._run_liters(d, (end - start).total_seconds())
        if self.add_run(d["tuya_device_id"], start, end, total_l):
            self.async_schedule_save()
            _LOGGER.debug(
                "runs_store: recorded run %s %s→%s %.0f L",
                d["tuya_device_id"],
                start,
                end,
                total_l if total_l is not None else -1,
            )

    # --------------------------------------------------- volume accumulator

    @callback
    def _on_volume_change(self, event: Event) -> None:
        """Accumulate delivered liters from the raw volume counter.

        The counter is per-cycle on some valves and a lifetime odometer on
        others, so its value at close is NOT the run total (audit D3/R16);
        summing plausible deltas is exact for both shapes.

        On the T3 this doubles as the run detector: that firmware sends no
        close report, and counter_custom can be weeks stale while water
        flows (R4). A counter that climbed and then stopped climbing for
        IDLE_CLOSE_SEC is a finished run.
        """
        d = self._vol_entity_to_device.get(event.data.get("entity_id"))
        new_state = event.data.get("new_state")
        if d is None or new_state is None:
            return
        try:
            value = float(new_state.state)
        except (TypeError, ValueError):
            return
        now = datetime.now().astimezone()
        acc = self._vol.setdefault(d["tuya_device_id"], _new_accumulator(now))
        prev, prev_ts = acc["last"], acc["last_ts"]
        acc["last"], acc["last_ts"] = value, now
        if prev is None:
            return
        if value < prev and value <= MIN_RESET_READING_L:
            # The counter restarted: a new run began. Nothing counted before
            # belongs to it, and this valve's close reading is its run total.
            acc["delivered"] = 0.0
            if d["tuya_device_id"] not in self.per_cycle:
                self.per_cycle.add(d["tuya_device_id"])
                self.async_schedule_save()
        if d["tuya_device_id"] in self.per_cycle:
            self._late_close_reading(d["tuya_device_id"], value, now)
        delta = plausible_delta(prev, value, (now - prev_ts).total_seconds())
        if delta is None:
            # Impossible jump — discard the sample and keep the old baseline.
            acc["last"], acc["last_ts"] = prev, prev_ts
            return
        if delta <= 0:
            return
        acc["delivered"] += delta
        if acc["first_rise"] is None:
            acc["first_rise"] = now
        acc["last_rise"] = now
        if d.get("end_entity"):
            return  # old-gen valve: the close report closes the run
        if acc["unsub"] is not None:
            acc["unsub"]()
        acc["unsub"] = async_call_later(
            self.hass, IDLE_CLOSE_SEC, partial(self._close_idle_run, d)
        )

    @callback
    def _close_idle_run(self, d: dict[str, Any], _now: Any) -> None:
        """Record a run whose volume counter stopped climbing (T3, R4)."""
        device_id = d["tuya_device_id"]
        acc = self._vol.get(device_id)
        if acc is None:
            return
        acc["unsub"] = None
        end, first, liters = acc["last_rise"], acc["first_rise"], acc["last"]
        acc["delivered"] = 0.0
        acc["first_rise"] = acc["last_rise"] = None
        if end is None or first is None:
            return
        # ponytail: the duration is the counter's own rise window, so it
        # misses the impeller's spin-up and spin-down. flow_sta_0 bytes[5:9]
        # carries the firmware's figure, but that is a raw DP and this store
        # only sees entity states — expose it as a sensor if those few
        # seconds ever matter. The counter_custom row overrides this one
        # anyway whenever the device reports it.
        duration = (end - first).total_seconds()
        if duration <= 0 or duration > MAX_RUN_SECONDS:
            return
        if self._row_near(device_id, end, RUN_DEDUPE_SLACK_SEC) is not None:
            return  # already recorded from counter_custom
        start = end - timedelta(seconds=duration)
        if self.add_run(device_id, start, end, _sane_liters(liters, duration)):
            self.async_schedule_save()
            _LOGGER.debug(
                "runs_store: recorded flow-derived run %s %s→%s %.0f L",
                device_id, start, end, liters if liters is not None else -1,
            )

    def delivered_since_rise(self, device_id: str) -> float | None:
        """Liters counted so far in the run currently in progress, if any."""
        acc = self._vol.get(device_id)
        if acc is None or acc["delivered"] <= 0:
            return None
        return float(acc["delivered"])

    def _run_liters(self, d: dict[str, Any], duration_s: float) -> float | None:
        """Liters for a closing run.

        Prefers the accumulated climb of the volume counter: reading the
        counter's current value only works while it is a per-cycle counter,
        and on the odometer valves that value was rejected outright, so
        every one of their runs was stored with liters=null (D3/R16).
        """
        device_id = d["tuya_device_id"]
        vol_entity = d.get("volume_entity")
        if device_id in self.per_cycle and vol_entity and (vs := self.hass.states.get(vol_entity)):
            try:
                reading = _sane_liters(float(vs.state), duration_s)
            except (TypeError, ValueError):
                reading = None
            if reading is not None:
                self._reset_accumulator(device_id)
                return reading
        acc = self._vol.get(device_id)
        if acc is not None and acc["delivered"] > 0:
            liters = float(acc["delivered"])
            acc["delivered"] = 0.0
            acc["first_rise"] = acc["last_rise"] = None
            return _sane_liters(liters, duration_s)
        if vol_entity and (vs := self.hass.states.get(vol_entity)):
            try:
                return _sane_liters(float(vs.state), duration_s)
            except (TypeError, ValueError):
                return None
        return None

    def _row_near(
        self, device_id: str, end: datetime, slack_sec: float
    ) -> dict[str, Any] | None:
        """The stored row whose end is within `slack_sec` of `end`, if any.

        Rows are sorted by end, so scanning back from the tail stops after a
        couple of comparisons for the recent ends this is used with.
        ponytail: ISO string compare — correct while every row carries the
        same UTC offset, which only a DST switch breaks (audit D15).
        """
        lower = (end - timedelta(seconds=slack_sec)).isoformat()
        upper = (end + timedelta(seconds=slack_sec)).isoformat()
        for r in reversed(self.runs.get(device_id, [])):
            if r["end"] < lower:
                return None
            if r["end"] <= upper:
                return r
        return None

    @callback
    def _on_counter_change(self, event: Event) -> None:
        """T3 counter_custom CSV: 'mode,flag,duration_s,volume_L,YYYYMMDDHHMMSS'.
        The timestamp is the run's END in device-local time (== HA local time,
        the HA box sits on the farm). Reported once per completed run; the DP
        retains the last run, so a restart replays it and the end-timestamp
        dedupe in add_run absorbs the redelivery."""
        new_state = event.data.get("new_state")
        d = self._counter_entity_to_device.get(event.data.get("entity_id"))
        if d is None or new_state is None:
            return
        self._record_counter_csv(d, new_state.state)

    def _record_counter_csv(self, d: dict[str, Any], raw: Any) -> None:
        parts = str(raw).split(",")
        if len(parts) < 5:
            return
        try:
            duration = int(parts[2])
            volume = float(parts[3])
            end = datetime.strptime(parts[4], "%Y%m%d%H%M%S").astimezone()
        except ValueError:
            return
        # 0xFFFE = aborted sentinel; beyond 6 h = stuck-open/garbage record
        # (real T3 anomalies seen: 40650 s and 65471 s, both 0 L).
        if duration <= 0 or duration == 65534 or duration > MAX_RUN_SECONDS:
            return
        device_id = d["tuya_device_id"]
        total_l = _sane_liters(volume, duration)
        start = end - timedelta(seconds=duration)
        near = self._row_near(device_id, end, RUN_DEDUPE_SLACK_SEC)
        if near is not None and near["end"] != end.isoformat():
            # _close_idle_run already logged this run from the counter's
            # rise window. counter_custom is the firmware's own record, so
            # it wins — correct the row in place instead of doubling it.
            near.update(
                {
                    "start": start.isoformat(),
                    "end": end.isoformat(),
                    "duration_seconds": float(duration),
                    "total_l": total_l,
                }
            )
            self.runs[device_id].sort(key=lambda r: r["end"])
            self._end_index.pop(device_id, None)
            self.async_schedule_save()
            return
        if self.add_run(device_id, start, end, total_l):
            self.async_schedule_save()
            _LOGGER.debug(
                "runs_store: recorded T3 run %s end=%s %.0f L",
                device_id,
                end,
                total_l if total_l is not None else -1,
            )

    # ------------------------------------------------------------- backfill

    def merge_backfill(
        self, device_id: str, runs: list[dict[str, Any]], repair: bool = False
    ) -> int:
        """Add recorder runs; with `repair`, also replace a stored run's liters
        by the recorder's (the live accumulator mis-counted some runs: carried
        liters over from a lost run, or lost them on a restart mid-run).
        Returns how many runs were added or corrected."""
        added = 0
        have = [
            (datetime.fromisoformat(x["start"]), datetime.fromisoformat(x["end"]))
            for x in self.runs.get(device_id, [])
        ]
        for r in runs:
            if r.get("open") or not r.get("end"):
                continue
            # Already recorded under a slightly different start (a live
            # manual run logs its own clock, the sensor the device's).
            if any(s < r["end"] and r["start"] < e and s != r["start"] for s, e in have):
                continue
            if self.add_run(
                device_id, r["start"], r["end"], r.get("total_l")
            ):
                added += 1
            elif repair and r.get("total_l") is not None:
                start_iso = r["start"].isoformat()
                row = next((x for x in self.runs.get(device_id, []) if x["start"] == start_iso), None)
                if row is not None and (
                    row.get("total_l") is None or abs(row["total_l"] - r["total_l"]) > 1
                ):
                    row["total_l"] = r["total_l"]
                    added += 1
        return added


# 2: pair by value, catches pre-reported closes
# 3: liters = summed counter climb, repairs stored liters (2026-09-25 check)
BACKFILL_VERSION = 3


def pair_by_value(
    starts: list[datetime],
    ends: list[datetime],
    volumes: list[tuple[datetime, float]],
) -> list[dict[str, Any]]:
    """Runs from the start/end sensors' recorded VALUES (not when the rows
    were written): each start pairs with the earliest end value after it,
    before the next start and within MAX_RUN_SECONDS. A pre-reported close
    arrives in the same batch as its start and, when the valve closes on
    schedule, is never reported again; pairing by recorder time dropped
    exactly those runs. Liters: the counter's summed climb while the run
    was open (sum_plausible_deltas) — its peak picked up the previous
    run's total still showing before the reset (978: 119 L for a 9 L run).
    None when the counter sent nothing in the run, 0 when it never moved."""
    starts = sorted(set(starts))
    ends = sorted(set(ends))
    volumes = sorted(volumes)
    runs: list[dict[str, Any]] = []
    for i, start in enumerate(starts):
        limit = start + timedelta(seconds=MAX_RUN_SECONDS)
        if i + 1 < len(starts):
            limit = min(limit, starts[i + 1])
        end = next((e for e in ends if start < e <= limit), None)
        if end is None:
            continue
        duration = (end - start).total_seconds()
        until = end + timedelta(seconds=PREREPORT_SETTLE_SEC * 4)
        if i + 1 < len(starts):
            until = min(until, starts[i + 1])
        # Count from the counter's restart when it shows one (per-run
        # counters): anything before it is the previous run's total.
        reset = next(
            (
                t
                for t, v in volumes
                if start - timedelta(seconds=5) <= t <= start + timedelta(minutes=2)
                and v <= MIN_RESET_READING_L
            ),
            start,
        )
        climbed = sum_plausible_deltas(volumes, reset, until)
        if climbed is None:
            # No reading during the run: HA records no row for a counter
            # that stays put, so one resting at 0 means no water flowed.
            before = [v for t, v in volumes if t <= start]
            climbed = 0.0 if before and before[-1] == 0 else None
        total_l = _sane_liters(climbed, duration)
        runs.append({"start": start, "end": end, "total_l": total_l})
    return runs


def dedupe_by_start(rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], int]:
    """Collapse rows sharing a start into one (the add_run rule): the
    earliest end is the close, liters come from the kept row or, if it has
    none, from a copy. Returns (rows sorted by end, number removed)."""
    kept: dict[str, dict[str, Any]] = {}
    for row in rows:
        other = kept.get(row["start"])
        if other is None:
            kept[row["start"]] = row
            continue
        first, second = (
            (row, other)
            if datetime.fromisoformat(row["end"]) < datetime.fromisoformat(other["end"])
            else (other, row)
        )
        if not first.get("total_l") and second.get("total_l"):
            first["total_l"] = second["total_l"]
        kept[row["start"]] = first
    out = sorted(kept.values(), key=lambda r: r["end"])
    return out, len(rows) - len(out)


def _new_accumulator(now: datetime) -> dict[str, Any]:
    return {
        "last": None,
        "last_ts": now,
        "delivered": 0.0,
        "first_rise": None,
        "last_rise": None,
        "unsub": None,
    }


def _sane_liters(value: float | None, duration_s: float) -> float | None:
    """Reject a per-run total no impeller could have delivered."""
    if value is None or value < 0:
        return None
    return value if value <= max(50.0, MAX_LPM_CAP * duration_s / 60.0) else None


def _parse_iso(raw: Any) -> datetime | None:
    if not isinstance(raw, str):
        return None
    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.astimezone()
    return parsed


async def async_get_store(hass: HomeAssistant) -> RunsStore:
    """Process-wide singleton, loaded on first use."""
    store = hass.data.get(DOMAIN_KEY)
    if store is None:
        store = RunsStore(hass)
        await store.async_load()
        hass.data[DOMAIN_KEY] = store
    return store
