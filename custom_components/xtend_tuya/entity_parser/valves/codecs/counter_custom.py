"""`counter_custom`: the last completed run.

QT-08W-T3: a CSV string 'mode,flag,duration_s,volume_L,timestamp', e.g.
'0,1,600,113,20260714161000'; duration 65534 (0xFFFE) = aborted sentinel.
The value arrives as plain CSV or base64 depending on which manager filled
device.status (seen live 4.4.236-238). The QT-08W reports 'duration_s,liters'
of the run that just closed ('770,112', what SmartLife shows) or a bare
number ('9000'), which is not a run.
"""

from __future__ import annotations

import base64
import binascii
from dataclasses import dataclass

CODE = "counter_custom"
ABORTED_DURATION = 65534


@dataclass(frozen=True)
class LastRun:
    duration: int
    volume: int
    ts: str


def as_csv(raw: object) -> str | None:
    """The DP value as CSV text, whichever form it arrived in."""
    if not isinstance(raw, str) or not raw:
        return None
    if "," in raw:
        return raw
    try:
        decoded = base64.b64decode(raw).decode("ascii")
    except (binascii.Error, ValueError, UnicodeDecodeError):
        return None
    return decoded if "," in decoded else None


def parse(raw: object) -> LastRun | None:
    csv = as_csv(raw)
    if csv is None:
        return None
    parts = csv.split(",")
    if len(parts) < 5:
        return None
    try:
        return LastRun(duration=int(parts[2]), volume=int(parts[3]), ts=parts[4])
    except ValueError:
        return None


def parse_short(raw: object) -> tuple[int, int] | None:
    """QT-08W: (duration_s, liters) of the run that just closed."""
    parts = (as_csv(raw) or "").split(",")
    if len(parts) != 2:
        return None
    try:
        return int(parts[0]), int(parts[1])
    except ValueError:
        return None
