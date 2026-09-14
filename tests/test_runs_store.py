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
    os.path.dirname(__file__), "..", "custom_components", "xtend_tuya"
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
    for bad in ("0,1,65534,0,20260914061500", "0,1,40650,0,20260914061500", "415,211"):
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

    print("ok: runs are recorded once, with liters that survive an odometer")


if __name__ == "__main__":
    demo()
