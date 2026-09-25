"""A watering run must be recorded exactly once, with real liters.

Standalone: python3 tests/test_runs_store.py
Loads runs_store.py under a synthetic package with stubbed Home Assistant
modules, so the real dedupe / plausibility code runs without HA installed.

Covers audit R4 (flow-derived T3 runs and their hand-off to counter_custom),
R6 (a 0.0 L row must be correctable), R10 (dedupe past the newest 20 rows)
and D3/R16 (liters come from the counter's climb, not its absolute value).
"""

import importlib.util
import os
import sys
import types
from datetime import datetime, timedelta

# --- stub just enough of Home Assistant to import the module --------------
_core = types.ModuleType("homeassistant.core")
_core.Event = object
_core.HomeAssistant = object
_core.callback = lambda f: f

_helpers = types.ModuleType("homeassistant.helpers")
_helpers.__path__ = []
_helpers.device_registry = types.ModuleType("homeassistant.helpers.device_registry")
_helpers.entity_registry = types.ModuleType("homeassistant.helpers.entity_registry")

_event = types.ModuleType("homeassistant.helpers.event")
DEFERRED: list = []


def _async_call_later(hass, delay, action):
    DEFERRED.append((delay, action))
    return lambda: None


_event.async_call_later = _async_call_later
_event.async_track_state_change_event = lambda *a, **k: (lambda: None)

_storage = types.ModuleType("homeassistant.helpers.storage")


class _Store:
    def __init__(self, *a, **k):
        self.saves = 0

    def async_delay_save(self, *a, **k):
        self.saves += 1


_storage.Store = _Store

_ha = types.ModuleType("homeassistant")
_ha.__path__ = []
for _name, _mod in (
    ("homeassistant", _ha),
    ("homeassistant.core", _core),
    ("homeassistant.helpers", _helpers),
    ("homeassistant.helpers.device_registry", _helpers.device_registry),
    ("homeassistant.helpers.entity_registry", _helpers.entity_registry),
    ("homeassistant.helpers.event", _event),
    ("homeassistant.helpers.storage", _storage),
):
    sys.modules[_name] = _mod

# --- load water_math + runs_store as a package, bypassing __init__.py -----
_DIR = os.path.join(
    os.path.dirname(__file__), "..", "custom_components", "xtend_tuya", "farm"
)
_pkg = types.ModuleType("xt")
_pkg.__path__ = [_DIR]
sys.modules["xt"] = _pkg


def _load(name):
    spec = importlib.util.spec_from_file_location(
        f"xt.{name}", os.path.join(_DIR, f"{name}.py")
    )
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    sys.modules[f"xt.{name}"] = mod
    spec.loader.exec_module(mod)
    return mod


_load("water_math")
rs = _load("runs_store")

T0 = datetime(2026, 9, 14, 6, 0, 0).astimezone()
DEV = "bfa5f0fb057e0bcf5dw3ky"


class _FakeStates:
    def __init__(self, values):
        self.values = values

    def get(self, entity_id):
        v = self.values.get(entity_id)
        return None if v is None else types.SimpleNamespace(state=v)


def store(states=None):
    s = rs.RunsStore(types.SimpleNamespace(states=_FakeStates(states or {})))
    return s


D = {
    "tuya_device_id": DEV,
    "start_entity": "sensor.v_start",
    "end_entity": "sensor.v_end",
    "volume_entity": "sensor.v_volume",
}


def end_event(value):
    return types.SimpleNamespace(
        data={
            "entity_id": D["end_entity"],
            "new_state": types.SimpleNamespace(state=value),
        }
    )


def demo():
    # --- R10: dedupe must reach past the newest 20 rows ----------------
    s = store()
    for i in range(40):
        assert s.add_run(DEV, T0 + timedelta(hours=i), T0 + timedelta(hours=i, minutes=10), 12.0)
    assert len(s.runs[DEV]) == 40
    # Re-import the oldest row: the last-20 scan used to miss it.
    assert s.add_run(DEV, T0, T0 + timedelta(minutes=10), 12.0) is False
    assert len(s.runs[DEV]) == 40

    # --- R6: a 0.0 L row must be correctable by a later real reading ---
    s = store()
    end = T0 + timedelta(minutes=3)
    assert s.add_run(DEV, T0, end, 0.0) is True
    assert s.add_run(DEV, T0, end, 8.0) is True
    assert s.runs[DEV][0]["total_l"] == 8.0
    # ... but a later 0.0 must not wipe a real reading.
    assert s.add_run(DEV, T0, end, 0.0) is False
    assert s.runs[DEV][0]["total_l"] == 8.0

    # --- liters plausibility scales with the run, not with a constant --
    assert rs._sane_liters(8.0, 180) == 8.0
    assert rs._sane_liters(130367.0, 900) is None   # odometer value, not a run total
    assert rs._sane_liters(600.0, 900) == 600.0     # 40 L/min over 15 min is real
    assert rs._sane_liters(None, 900) is None
    assert rs._sane_liters(-1.0, 900) is None

    # --- R4: the counter_custom row overrides a flow-derived one -------
    s = store()
    flow_end = T0 + timedelta(minutes=15)
    s.add_run(DEV, T0 + timedelta(seconds=20), flow_end, 100.0)
    assert s._row_near(DEV, flow_end + timedelta(seconds=60), 180) is not None
    assert s._row_near(DEV, flow_end + timedelta(seconds=600), 180) is None
    # Firmware reports the same run: 900 s / 103 L, ending 40 s later.
    real_end = flow_end + timedelta(seconds=40)
    s._record_counter_csv(
        {"tuya_device_id": DEV},
        f"0,1,900,103,{real_end.strftime('%Y%m%d%H%M%S')}",
    )
    assert len(s.runs[DEV]) == 1, s.runs[DEV]
    row = s.runs[DEV][0]
    assert row["duration_seconds"] == 900.0
    assert row["total_l"] == 103.0
    # ... and re-reporting it is still idempotent.
    s._record_counter_csv(
        {"tuya_device_id": DEV},
        f"0,1,900,103,{real_end.strftime('%Y%m%d%H%M%S')}",
    )
    assert len(s.runs[DEV]) == 1

    # --- garbage counter rows stay out --------------------------------
    s = store()
    for bad in ("0,1,65534,0,20260914061500", "0,1,40650,0,20260914061500", "0,1,0,0,20260914061500", "415,211"):
        s._record_counter_csv({"tuya_device_id": DEV}, bad)
    assert s.runs.get(DEV, []) == []

    # --- R5: a close paired with the previous cycle's start is garbage --
    now = datetime.now().astimezone()
    s = store(
        {
            D["start_entity"]: (now - timedelta(hours=9)).isoformat(),
            D["end_entity"]: (now - timedelta(seconds=5)).isoformat(),
            D["volume_entity"]: "120",
        }
    )
    s._end_entity_to_device = {D["end_entity"]: D}
    s._on_end_change(end_event(s.hass.states.get(D["end_entity"]).state))
    assert s.runs.get(DEV, []) == [], s.runs

    # ... while a 15-minute run on the same path is recorded at once.
    s = store(
        {
            D["start_entity"]: (now - timedelta(minutes=15)).isoformat(),
            D["end_entity"]: (now - timedelta(seconds=5)).isoformat(),
            D["volume_entity"]: "130367",
        }
    )
    s._end_entity_to_device = {D["end_entity"]: D}
    s._on_end_change(end_event(s.hass.states.get(D["end_entity"]).state))
    assert len(s.runs[DEV]) == 1
    # The odometer reading is not a run total, so no liters are invented.
    assert s.runs[DEV][0]["total_l"] is None

    # --- R6: a close still in the future is deferred, not recorded now --
    DEFERRED.clear()
    close = now + timedelta(seconds=90)   # inside MAX_FUTURE_SLACK_SEC
    s = store(
        {
            D["start_entity"]: (now - timedelta(seconds=90)).isoformat(),
            D["end_entity"]: close.isoformat(),
            D["volume_entity"]: "0",
        }
    )
    s._end_entity_to_device = {D["end_entity"]: D}
    s._on_end_change(end_event(close.isoformat()))
    assert s.runs.get(DEV, []) == [], "recorded before the water flowed"
    assert len(DEFERRED) == 1, DEFERRED
    delay, action = DEFERRED[0]
    assert 90 < delay <= 90 + rs.PREREPORT_SETTLE_SEC + 1, delay
    # By the time it fires the counter has moved.
    s.hass.states.values[D["volume_entity"]] = "9"
    action(None)
    assert len(s.runs[DEV]) == 1
    assert s.runs[DEV][0]["total_l"] == 9.0

    # ... and if the REAL close report lands while we wait, the deferred
    # stand-in must not store the same run a second time.
    DEFERRED.clear()
    s = store(
        {
            D["start_entity"]: (now - timedelta(seconds=90)).isoformat(),
            D["end_entity"]: close.isoformat(),
            D["volume_entity"]: "0",
        }
    )
    s._end_entity_to_device = {D["end_entity"]: D}
    s._on_end_change(end_event(close.isoformat()))
    real_close = now - timedelta(seconds=2)  # the valve really shut just now
    s.hass.states.values[D["end_entity"]] = real_close.isoformat()
    s.hass.states.values[D["volume_entity"]] = "9"
    s._on_end_change(end_event(real_close.isoformat()))
    assert len(s.runs[DEV]) == 1
    DEFERRED[0][1](None)
    assert len(s.runs[DEV]) == 1, s.runs[DEV]
    assert s.runs[DEV][0]["end"] == real_close.isoformat()

    # --- one run per start (2026-09-25 data check) ------------------------
    s = store()
    S = T0 + timedelta(days=2)
    assert s.add_run(DEV, S, S + timedelta(minutes=10), None)
    # the end sensor reports again later: no second row
    assert s.add_run(DEV, S, S + timedelta(hours=24), 207.0) is True  # only fills liters
    rows = [r for r in s.runs[DEV] if r["start"] == S.isoformat()]
    assert len(rows) == 1 and rows[0]["duration_seconds"] == 600 and rows[0]["total_l"] == 207.0
    assert s.add_run(DEV, S, S + timedelta(hours=48), 5.0) is False  # nothing new
    # an earlier end for the same start wins (it is the close)
    assert s.add_run(DEV, S, S + timedelta(minutes=9), None) is True
    rows = [r for r in s.runs[DEV] if r["start"] == S.isoformat()]
    assert len(rows) == 1 and rows[0]["duration_seconds"] == 540

    # load-time repair: 73 growing copies of one run collapse to the first
    iso = lambda t: t.isoformat()
    copies = [
        {"start": iso(S), "end": iso(S + timedelta(minutes=5 * k + 1)), "duration_seconds": 300.0 * k + 60, "total_l": None if k == 0 else 0.0}
        for k in range(73)
    ]
    other = {"start": iso(S + timedelta(days=1)), "end": iso(S + timedelta(days=1, minutes=10)), "duration_seconds": 600.0, "total_l": 50.0}
    rows, removed = rs.dedupe_by_start(copies[::-1] + [other])
    assert removed == 72 and len(rows) == 2
    assert rows[0]["end"] == iso(S + timedelta(minutes=1)) and rows[1] is other

    # --- cause 1 (2026-09-25): a valve closing ON schedule never re-reports
    # its pre-reported close, so the run is recorded at the scheduled close.
    DEFERRED.clear()
    now = datetime.now().astimezone()
    close = now + timedelta(minutes=30)
    s = store({D["end_entity"]: close.isoformat(), D["volume_entity"]: "0"})
    s._end_entity_to_device = {D["end_entity"]: D}
    s._on_end_change(end_event(close.isoformat()))  # end lands before start
    assert s.runs.get(DEV, []) == [] and len(DEFERRED) == 1
    assert 1800 < DEFERRED[0][0] <= 1800 + rs.PREREPORT_SETTLE_SEC + 1
    s.hass.states.values[D["start_entity"]] = now.isoformat()  # same batch
    s.hass.states.values[D["volume_entity"]] = "140"
    DEFERRED[0][1](None)
    assert len(s.runs[DEV]) == 1 and s.runs[DEV][0]["end"] == close.isoformat()
    assert s.runs[DEV][0]["total_l"] == 140.0
    # a close beyond MAX_RUN_SECONDS is not a run: nothing scheduled
    DEFERRED.clear()
    s._on_end_change(end_event((now + timedelta(hours=7)).isoformat()))
    assert DEFERRED == []

    # startup replay: the last run sitting in the sensors is recorded once
    s = store({D["start_entity"]: (now - timedelta(minutes=20)).isoformat(), D["end_entity"]: (now - timedelta(minutes=5)).isoformat(), D["volume_entity"]: "50"})
    s._record_end(D, now - timedelta(minutes=20), now - timedelta(minutes=5))
    s._record_end(D, now - timedelta(minutes=20), now - timedelta(minutes=5))
    assert len(s.runs[DEV]) == 1

    # --- backfill pairs by VALUE: the pre-reported close is the run's end
    t = lambda h, m=0: T0 + timedelta(hours=h, minutes=m)
    runs = rs.pair_by_value(
        [t(2, 30), t(2, 30), t(6), t(9), t(20)],  # redelivered start, lost-end start
        [t(2, 45), t(2, 45), t(6, 12), t(6, 15), t(20, 10)],  # 06:00 closed early
        [
            (t(2, 30), 0.0), (t(2, 31), 3.0), (t(2, 45), 120.0),
            (t(6), 0.0), (t(6, 12), 60.0),
            # 978, 2026-09-22: the previous run's 110 L still showing at the
            # start, then the reset — the run is 9 L, not 110 or 119
            (t(20) + timedelta(seconds=1), 110.0), (t(20, 1), 0.0), (t(20, 5), 9.0),
        ],
    )
    assert [(r["start"], r["end"]) for r in runs] == [(t(2, 30), t(2, 45)), (t(6), t(6, 12)), (t(20), t(20, 10))], runs
    assert [r["total_l"] for r in runs] == [120.0, 60.0, 9.0], runs

    # a run whose counter never moved is 0 L (no water), not unknown
    dry = rs.pair_by_value([t(22)], [t(22, 5)], [(t(22), 0.0), (t(22, 5), 0.0)])
    assert dry[0]["total_l"] == 0.0
    # ...and so is one resting at 0 that sent nothing during the run
    quiet = rs.pair_by_value([t(22)], [t(22, 5)], [(t(21), 0.0)])
    assert quiet[0]["total_l"] == 0.0
    unknown = rs.pair_by_value([t(22)], [t(22, 5)], [(t(21), 110.0)])
    assert unknown[0]["total_l"] is None

    # backfill repair: a stored carry-over (119 L) is replaced by the recorder's 9 L
    s = store()
    s.add_run(DEV, t(20), t(20, 10), 119.0)
    assert s.merge_backfill(DEV, [runs[2]], repair=True) == 1
    assert [r["total_l"] for r in s.runs[DEV]] == [9.0]
    assert s.merge_backfill(DEV, [runs[2]], repair=True) == 0

    # live: a counter reset drops liters left from a lost run, and marks the
    # valve per-run so its close reading is used even after a restart
    s = store({D["volume_entity"]: "0"})
    s._vol_entity_to_device = {D["volume_entity"]: D}
    vol = lambda v: types.SimpleNamespace(data={"entity_id": D["volume_entity"], "new_state": types.SimpleNamespace(state=str(v))})
    for v in (0, 40, 110):  # a run that was never recorded
        s._on_volume_change(vol(v))
    for v in (0, 5, 9):  # the next run
        s._on_volume_change(vol(v))
    assert DEV in s.per_cycle and s._vol[DEV]["delivered"] == 9.0
    s.hass.states.values[D["volume_entity"]] = "9"
    assert s._run_liters(D, 360) == 9.0

    # the last reading lands just after the close report: the run takes it
    now = datetime.now().astimezone()
    s.add_run(DEV, now - timedelta(minutes=5), now - timedelta(seconds=2), 93.0)
    s._late_close_reading(DEV, 94.0, now)
    assert s.runs[DEV][-1]["total_l"] == 94.0
    s._late_close_reading(DEV, 95.0, now + timedelta(minutes=5))  # too late: next run's
    assert s.runs[DEV][-1]["total_l"] == 94.0

    # merge skips a run already recorded with a few seconds' different start
    s = store()
    s.add_run(DEV, t(14, 0) + timedelta(seconds=6), t(14, 8), None)
    assert s.merge_backfill(DEV, [{"start": t(14), "end": t(14, 15), "total_l": None}]) == 0
    assert s.merge_backfill(DEV, [{"start": t(15), "end": t(15, 15), "total_l": None}]) == 1

    print("ok: runs are recorded once, with liters that survive an odometer")


if __name__ == "__main__":
    demo()
