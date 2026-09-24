"""Valve profiles: what each sfkzq product can do and which codecs drive it.

Device differences live here as data (docs/architecture.md §4.3), so the
timer and single-run services never branch on the product. A profile is
chosen by product_id; an unknown product with a known timer DP falls back to
the DP signature, which is how the services detected the T3 before profiles.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from typing import Any, Literal

from .codecs import single_run
from .codecs import time_task as tt


@dataclass(frozen=True)
class Capabilities:
    run_signal: Literal["switch", "counter", "none"]  # how a run shows up in HA
    flow_meter: bool
    single_run: frozenset[str]  # supported "water now" modes
    timers: bool
    battery: bool
    channels: int = 1  # valves per device; the QT-10W gateway will have 4


@dataclass(frozen=True)
class TimerCodec:
    code: str
    encode: Callable[[tt.Timer], bytes]
    clear: Callable[[int], bytes]


@dataclass(frozen=True)
class SingleRunCodec:
    code: str
    start: Callable[[str, int], bytes]  # (mode, value) -> frame
    stop: bytes
    also_close_switch: bool  # belt and braces: drop `switch` after the stop frame


@dataclass(frozen=True)
class ValveProfile:
    product_id: str
    name: str
    capabilities: Capabilities
    timer: TimerCodec | None = None
    single_run: SingleRunCodec | None = None


def _one_control_start(mode: str, value: int) -> bytes:
    lead = single_run.LEAD_SINGLE_RUN if mode == "duration" else single_run.LEAD_VOLUME
    return single_run.encode_one_control(lead, value, single_run.FLAG_START)


def _cyc_control_start(mode: str, value: int) -> bytes:
    # Only duration was captured on the T3; a volume request runs as duration.
    return single_run.encode_cyc_control(value, single_run.FLAG_START)


QT08W = ValveProfile(
    product_id="o6dagifntoafakst",
    name="QT-08W",
    capabilities=Capabilities(
        run_signal="switch",
        flow_meter=True,  # Hall impeller, 2-25 L/min, stalls below 2
        single_run=frozenset({"duration", "volume"}),  # volume lead byte unverified
        timers=True,
        battery=True,
    ),
    timer=TimerCodec(tt.QT08W_CODE, tt.encode_qt08w, tt.clear_qt08w),
    single_run=SingleRunCodec(
        single_run.ONE_CONTROL_CODE,
        _one_control_start,
        single_run.encode_one_control(single_run.LEAD_SINGLE_RUN, 0, single_run.FLAG_IDLE),
        also_close_switch=True,
    ),
)

QT08W_T3 = ValveProfile(
    product_id="rjnqkjk1pct15ku2",
    name="QT-08W-T3",
    capabilities=Capabilities(
        run_signal="counter",  # no switch goes on during a run; counter_custom reports it
        flow_meter=True,  # flow_sta_0 liters
        single_run=frozenset({"duration"}),
        timers=True,
        battery=True,  # packed into sat_0
    ),
    timer=TimerCodec(tt.T3_CODE, tt.encode_t3, tt.clear_t3),
    single_run=SingleRunCodec(
        single_run.CYC_CONTROL_CODE,
        _cyc_control_start,
        single_run.encode_cyc_control(0, single_run.FLAG_IDLE),
        also_close_switch=False,
    ),
)

# Read-only profiles (decided 2026-09-24): capabilities for L3, no commands.
SMART_WATER_TIMER = ValveProfile(
    product_id="nxquc5lb",
    name="Smart Water Timer",
    capabilities=Capabilities(
        run_signal="switch", flow_meter=False, single_run=frozenset(), timers=False, battery=True
    ),
)

BLE_WATER_TIMER = ValveProfile(
    product_id="t2cak5zb",
    name="Bluetooth Water Timer",
    # Flow/FlowCount exist in the spec but were never decoded.
    capabilities=Capabilities(
        run_signal="none", flow_meter=False, single_run=frozenset(), timers=False, battery=False
    ),
)

PROFILES: Mapping[str, ValveProfile] = {
    p.product_id: p for p in (QT08W, QT08W_T3, SMART_WATER_TIMER, BLE_WATER_TIMER)
}


def profile_for(product_id: str, status: Mapping[str, Any]) -> ValveProfile | None:
    if profile := PROFILES.get(product_id):
        return profile
    if status.get(tt.T3_CODE) is not None:
        return QT08W_T3
    if status.get(tt.QT08W_CODE) is not None:
        return QT08W
    return None
