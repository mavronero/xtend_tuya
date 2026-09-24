"""Liters-counter plausibility for the valves' `cur_cap` / `flow_sta_0` counters.

The counters come in two shapes on the farm: reset to 0 at every cycle start,
or a lifetime odometer (14 of 101 QT-08W, up to 171 904 L). Plausibility is
therefore judged on the delta between two samples against the impeller's
physical flow limit, never on the absolute value (audit 2026-09-14, D3/R16).

The farm layer keeps its own copy in farm/water_math.py on purpose: it must
not import device internals (docs/architecture.md §5). Change both together.
"""

from __future__ import annotations

# 2x the QT-08W impeller's 25 L/min spec: margin for the DP's ~10 s publish lag.
MAX_RATE_L_PER_MIN = 50.0
# Floor so a burst arriving in the same second as its predecessor isn't rejected.
# ponytail: calibration knob; raise it if a faster meter ever shows up.
MIN_PLAUSIBLE_DELTA_L = 50.0


def plausible_delta(prev: float, cur: float, elapsed_s: float) -> float | None:
    """Liters delivered between two samples, or None for a physically impossible jump.

    On None the caller discards the sample and keeps `prev` as its baseline. A drop
    means the counter reset at a cycle start, so `cur` is this cycle's water.
    """
    delta = cur - prev if cur >= prev else cur
    ceiling = max(MIN_PLAUSIBLE_DELTA_L, MAX_RATE_L_PER_MIN * max(elapsed_s, 0.0) / 60.0)
    if delta > ceiling:
        return None
    return delta if delta > 0 else 0.0
