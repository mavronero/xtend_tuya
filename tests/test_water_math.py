"""Liters counters must read the same whether they reset or run as odometers.

Standalone: python3 tests/test_water_math.py
Loads custom_components/xtend_tuya/farm/water_math.py by path — no HA needed.

Regression guard for audit D3/R16: the old absolute 9000 L ceiling latched on
the 14 QT-08W whose cur_cap is a lifetime odometer (up to 171 904 L), leaving
7 online valves with `watering_volume = unknown` and every run stored with
null liters.
"""

import importlib.util
import os
import sys
from datetime import datetime, timedelta

_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "custom_components",
    "xtend_tuya",
    "farm",
    "water_math.py",
)
_spec = importlib.util.spec_from_file_location("water_math", _PATH)
assert _spec and _spec.loader
wm = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wm)

T0 = datetime(2026, 9, 14, 6, 0, 0)


def series(values, step_s=10, first_offset_s=0):
    return [
        (T0 + timedelta(seconds=first_offset_s + i * step_s), float(v))
        for i, v in enumerate(values)
    ]


def demo():
    # --- plausible_delta ----------------------------------------------
    assert wm.plausible_delta(100.0, 105.0, 10) == 5.0
    assert wm.plausible_delta(100.0, 100.0, 10) == 0.0
    # Odometer values are fine as long as the STEP is sane — this is the
    # exact case the 9000 L ceiling used to throw away.
    assert wm.plausible_delta(130367.0, 130375.0, 10) == 8.0
    # A reset to a lower value credits the new value as this cycle's water.
    assert wm.plausible_delta(91.0, 3.0, 10) == 3.0
    # Rate garbage: 2000 L in 10 s = 12000 L/min, far past the 50 L/min cap.
    # None = "discard the sample", not "0 L delivered".
    assert wm.plausible_delta(100.0, 2100.0, 10) is None
    # ... but the 50 L floor keeps a same-second burst.
    assert wm.plausible_delta(100.0, 140.0, 0) == 40.0
    assert wm.plausible_delta(100.0, 200.0, 0) is None

    # --- per-cycle counter shape (resets to 0 each run) ----------------
    # rest at 91 L, reset, ramp to 58 L.
    s = series([91, 0, 12, 30, 47, 58, 58])
    assert wm.sum_plausible_deltas(s, T0, s[-1][0]) == 58.0

    # --- lifetime odometer shape --------------------------------------
    # 130367 -> 130425 across one run: same 58 L, and every sample is far
    # above the old ceiling.
    s = series([130367, 130379, 130397, 130414, 130425, 130425])
    assert wm.sum_plausible_deltas(s, T0, s[-1][0]) == 58.0

    # --- anchoring on the resting value before the window -------------
    # The calendar's window starts at the run's start row, and the counter
    # rests at its previous value until the first in-run report lands. The
    # climb off that resting anchor is this run's water, so a sparsely
    # sampled run still reports its liters instead of 0.
    s = series([130367, 130425, 130425], step_s=600, first_offset_s=-600)
    got = wm.sum_plausible_deltas(s, T0, T0 + timedelta(hours=1))
    assert got == 58.0, got

    # Same for the per-cycle shape when the reset-to-0 sample is missed:
    # the drop off the anchor credits the new value.
    s = series([91, 58, 58], step_s=600, first_offset_s=-600)
    got = wm.sum_plausible_deltas(s, T0, T0 + timedelta(hours=1))
    assert got == 58.0, got

    # --- no sample in the window = "no data", not 0 L -----------------
    s = series([130367, 130425], first_offset_s=-3600)
    assert wm.sum_plausible_deltas(s, T0, T0 + timedelta(minutes=5)) is None

    # --- a single garbage spike must not inflate the total ------------
    # Valve 824's failure mode: one 177610 L sample in the middle of a run.
    s = series([0, 10, 177610, 177610, 22, 30])
    got = wm.sum_plausible_deltas(s, T0, s[-1][0])
    assert got == 30.0, got

    print("ok: cur_cap reads the same as counter and as odometer")


if __name__ == "__main__":
    demo()
