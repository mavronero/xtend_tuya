"""Plausibility math for the irrigation valves' liters counters.

`cur_cap` (QT-08W) and `flow_sta_0` bytes[1:5] (T3) are liters counters, but
the fleet runs them in two different shapes: most valves reset to 0 at the
start of every cycle, while others run them as a lifetime odometer — 14 of
101 QT-08W read 23 000 … 171 904 L live, and the DP's own `status_range`
declares `{min: 0, max: 999999999, scale: 0}`.

The fork used to reject any reading above 9000 L as a glitch spike (four
copies of the same constant). That filter latches on an odometer valve: it
never comes back under the ceiling, so its `watering_volume` sensor read
`unknown` forever, its runs were stored with `liters=null` and every
downstream total was 0 (audit 2026-09-14, D3/R16 — 7 online valves).

Plausibility belongs on the *delta* between two samples, not on the absolute
value: the impeller's physical limit is a flow RATE, not a total. Summing
plausible deltas counts every cycle exactly once in both shapes.

The device layer keeps its own copy of plausible_delta in
entity_parser/valves/codecs/liters.py (the farm must not import device
internals). Change both together.

Pure stdlib on purpose — tests/test_water_math.py loads this module by path,
without Home Assistant.
"""

from __future__ import annotations

from datetime import datetime

# 2x the QT-08W impeller's 25 L/min spec — margin for the DP's ~10 s publish
# lag and for report jitter. A sample-to-sample jump implying more than this
# is garbage (valve 824 once summed 10 303 L over 1.5 h of runtime).
MAX_RATE_L_PER_MIN = 50.0

# Floor on the per-delta ceiling, so a burst that arrives in the same second
# as its predecessor isn't rejected by a near-zero elapsed time.
# ponytail: calibration knob — raise it if a genuinely faster meter ever
# shows up on the farm and real liters start getting dropped.
MIN_PLAUSIBLE_DELTA_L = 50.0


# A counter reset falls to (near) 0; a drop to more than this share of the
# previous reading is a late, out-of-order sample instead.
RESET_FRACTION = 0.5
# ...when it lands this soon after the previous reading. Across a longer gap a
# drop is a reset whose 0 reading was missed (the previous run ended hours ago).
LATE_SAMPLE_WINDOW_S = 60.0


def plausible_delta(prev: float, cur: float, elapsed_s: float) -> float | None:
    """Liters delivered between two counter samples.

    Returns None when the jump is physically impossible — the caller must
    then DISCARD the sample and keep `prev` as its baseline, so a one-off
    garbage reading neither adds liters nor poisons the next delta. (The
    elapsed time keeps growing while samples are discarded, so the ceiling
    grows with it and the series re-anchors by itself.)

    A drop means the counter reset to 0 at a cycle start (the per-cycle
    shape), so everything it has climbed back to since the reset is this
    cycle's water. A lifetime odometer never takes that branch.
    """
    if cur < prev and cur > prev * RESET_FRACTION and elapsed_s < LATE_SAMPLE_WINDOW_S:
        # A small drop is an old sample delivered late (the valve's readings
        # arrive twice, out of order: …9, 10, 9, 10…), not a reset. Crediting
        # it as one added ~its whole value each time (951: 200 L for 168).
        return None
    delta = cur - prev if cur >= prev else cur
    ceiling = max(MIN_PLAUSIBLE_DELTA_L, MAX_RATE_L_PER_MIN * max(elapsed_s, 0.0) / 60.0)
    if delta > ceiling:
        return None
    return delta if delta > 0 else 0.0


def sum_plausible_deltas(
    series: list[tuple[datetime, float]],
    start: datetime,
    end: datetime,
) -> float | None:
    """Liters delivered in [start, end] from `series` = sorted (ts, value).

    The last sample at or before `start` is used as the anchor, so a cycle
    reset that happened right at the run start still counts. Returns None
    when the window holds no sample at all — the caller renders that as
    "no data", not as 0 L.
    """
    total = 0.0
    seen = False
    prev: float | None = None
    prev_ts: datetime | None = None
    for ts, value in series:
        if ts > end:
            continue
        in_window = ts >= start
        seen = seen or in_window
        if prev is not None and prev_ts is not None:
            delta = plausible_delta(prev, value, (ts - prev_ts).total_seconds())
            if delta is None:
                continue  # garbage sample — keep the previous baseline
            if in_window:
                total += delta
        prev, prev_ts = value, ts
    return total if seen else None
