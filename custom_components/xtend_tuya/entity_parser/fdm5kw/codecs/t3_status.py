"""QT-08W-T3 status DPs `sat_0` and `flow_sta_0` (decoded live 2026-07-15).

sat_0, 13 bytes: 00 01 00 [BB] 00 01 00 [Y M D H M] 00
  byte[3] & 0x7F = battery % (high bit = charge/sun flag); bytes[7..11] =
  next irrigation [Y-2000, M, D, H, M], 0xFF year / month 0 = no schedule.
flow_sta_0: bytes[1:5] BE = liters, live during a run, then the run total.
"""

from __future__ import annotations

from datetime import datetime, timedelta

SAT_CODE = "sat_0"
FLOW_STA_CODE = "flow_sta_0"


def battery_percent(sat: bytes) -> int | None:
    # ponytail: a lone byte3=0x00 glitch was seen once (07-13) and reads 0 %.
    # Debounce if it proves noisy in the field.
    return sat[3] & 0x7F if len(sat) >= 4 else None


def next_run_stamp(sat: bytes) -> datetime | None:
    """The firmware's next-irrigation stamp as a naive local datetime.

    Its DATE part rots (audit D5), so callers roll it with `next_occurrence`.
    """
    if len(sat) < 12:
        return None
    y, mo, d, h, mi = sat[7], sat[8], sat[9], sat[10], sat[11]
    if y == 0xFF or mo == 0 or mo > 12 or d == 0 or d > 31:
        return None
    try:
        return datetime(2000 + y, mo, d, h, mi)
    except ValueError:
        return None


def next_occurrence(naive: datetime, days_mask: int, now: datetime, max_days: int = 9) -> datetime:
    """Roll a schedule stamp forward to its next real occurrence.

    days_mask bit 0 = Monday; 0 = no day info (every day). Naive arithmetic on
    purpose: a 16:00 timer stays at 16:00 across a DST change.
    """
    if naive > now:
        return naive
    candidate = naive + timedelta(days=max((now - naive).days, 0))
    for _ in range(max_days):
        if candidate > now and (not days_mask or days_mask & (1 << candidate.weekday())):
            return candidate
        candidate += timedelta(days=1)
    return naive


def flow_volume_liters(flow_sta: bytes) -> int | None:
    # Raw counter, no ceiling: see water_math (audit D3/R16).
    return int.from_bytes(flow_sta[1:5], "big") if len(flow_sta) >= 5 else None
