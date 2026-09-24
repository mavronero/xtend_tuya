"""`counter_custom`: the last completed run.

QT-08W-T3: a CSV string 'mode,flag,duration_s,volume_L,timestamp', e.g.
'0,1,600,113,20260714161000'; duration 65534 (0xFFFE) = aborted sentinel.
The value arrives as plain CSV or base64 depending on which manager filled
device.status (seen live 4.4.236-238). The QT-08W reports a bare number
('9000') here, which is not a run.
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
