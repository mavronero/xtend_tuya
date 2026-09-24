"""DP codecs against payloads captured from real valves.

Sources: ~/Documents/work/irrigation-dp-decoding.md (QT-08W) and
irrigation-t3-dp-decode.md (QT-08W-T3). A shifted byte offset fails here.
"""

from __future__ import annotations

import base64
from datetime import datetime

import pytest

from custom_components.xtend_tuya.entity_parser.valves.codecs import (
    counter_custom,
    run_times,
    single_run,
    t3_status,
)
from custom_components.xtend_tuya.entity_parser.valves.codecs import time_task as tt

b64 = base64.b64decode


# --- time_task (QT-08W, 11 bytes) -------------------------------------------------

@pytest.mark.parametrize(
    ("frame", "expected"),
    [
        # 2026-04-13 samples
        ([0, 1, 0, 0, 0, 4, 176, 8, 30, 18, 1], tt.Timer(0, 8, 30, 0, 1200, 0x12, True)),  # 08:30, 20 min, Tue+Fri
        ([1, 1, 1, 0, 0, 0, 50, 7, 0, 4, 1], tt.Timer(1, 7, 0, 1, 50, 0x04, True)),  # 07:00, 50 L, Wed
        ([2, 1, 0, 0, 0, 14, 16, 8, 0, 8, 1], tt.Timer(2, 8, 0, 0, 3600, 0x08, True)),  # 08:00, 60 min, Thu
        # 2026-06-05 S 809 on/off toggle: only byte[1] changes, a disabled timer is kept
        ([0, 0, 0, 0, 0, 0, 38, 10, 0, 31, 1], tt.Timer(0, 10, 0, 0, 38, 31, False)),
    ],
)
def test_qt08w_timer_captures(frame, expected):
    decoded = tt.decode_qt08w(bytes(frame))
    assert decoded == tt.TimeTaskFrame(expected.slot, expected)
    assert tt.encode_qt08w(expected) == bytes(frame)


def test_qt08w_delete_and_short_frames():
    assert tt.decode_qt08w(tt.clear_qt08w(3)) == tt.TimeTaskFrame(3, None)
    assert tt.decode_qt08w(bytes(10)) is None
    with pytest.raises(ValueError):
        tt.clear_qt08w(7)


def test_timer_attribute_shape_is_the_published_contract():
    assert tt.Timer(1, 7, 0, 1, 50, 0x04, True).as_attribute() == {
        "slot": 1, "hour": 7, "minute": 0, "mode": "volume", "value": 50, "value_unit": "L",
        "days": ["Wed"], "days_mask": 4, "enabled": True,
    }


# --- time_task_0 (QT-08W-T3, 12 bytes), 2026-07-15 on 706 --------------------------

@pytest.mark.parametrize(
    ("capture", "expected"),
    [
        ("AAAAAAAAALQDAwEB", tt.Timer(0, 3, 3, 0, 180, 0x01, True)),  # timer A: idx0, 3 min, Mon
        ("AAEBAAAAAWgGBgIB", tt.Timer(1, 6, 6, 0, 360, 0x02, True)),  # timer B: idx1, 6 min, Tue
        ("AAEBAQAAACEFB38B", tt.Timer(1, 5, 7, 1, 33, 0x7F, True)),  # volume: 33 L, every day
    ],
)
def test_t3_timer_captures(capture, expected):
    assert tt.decode_t3(b64(capture)) == tt.TimeTaskFrame(expected.slot, expected)


def test_t3_write_read_parity_and_clear():
    timer = tt.Timer(1, 6, 6, 0, 360, 0x02, True)
    assert tt.decode_t3(tt.encode_t3(timer)).timer == timer
    assert tt.encode_t3(timer)[2] == 1  # SmartLife writes the index into byte[2] as well
    assert tt.decode_t3(tt.clear_t3(3)) == tt.TimeTaskFrame(3, None)
    assert tt.decode_t3(bytes(12)).timer is None
    assert tt.decode_t3(bytes(11)) is None


def test_encode_rejects_out_of_range():
    with pytest.raises(ValueError):
        tt.encode_qt08w(tt.Timer(0, 6, 0, 0, 2**32, 1, True))
    with pytest.raises(ValueError):
        tt.encode_t3(tt.Timer(7, 6, 0, 0, 60, 1, True))


def test_days_and_modes():
    assert tt.days_to_mask(["Mon", "wed", "Fri"]) == 0x15
    assert tt.days_to_mask(["Mon", "Funday"]) == 0x01  # unknown day is logged and skipped
    assert tt.days_to_mask(0xFF) == 0x7F and tt.days_to_mask(None) == 0
    assert tt.mask_to_loops(0x15) == "1010100"  # 702: DP days 0x15 == cloud loops
    assert tt.mode_from_name("volume") == tt.MODE_VOLUME
    with pytest.raises(ValueError):
        tt.mode_from_name("idle")


# --- single runs -------------------------------------------------------------------

def test_one_control_capture_from_smartlife():
    # 2026-06-08, FF East 10 (920): SmartLife "single watering" 30 s
    assert single_run.encode_one_control(single_run.LEAD_SINGLE_RUN, 30, single_run.FLAG_START) == b64("AAAAAB4B")
    assert single_run.decode_one_control(b64("AAAAAB4B")) == (0, 30)
    assert single_run.decode_one_control(bytes(5)) is None


@pytest.mark.parametrize(
    ("lead", "value", "label"),
    [(0, 900, "duration"), (1, 5, "volume"), (1, 0, "idle"), (0, 0, "idle"), (3, 1, "unknown (3)")],
)
def test_one_control_status_labels(lead, value, label):
    # 2026-06-09 on 964/977: lead 0 = duration, 1 = volume, value 0 = idle
    assert single_run.one_control_mode(lead, value) == label


def test_cyc_control_capture_from_706():
    assert single_run.encode_cyc_control(60, single_run.FLAG_START) == bytes.fromhex("00000000003c01000001")
    assert single_run.encode_cyc_control(60, single_run.FLAG_IDLE)[9] == 0


# --- T3 status ----------------------------------------------------------------------

def test_sat_0_captures():
    sat = b64("AAEAZAABABoHDxAAAA==")  # 701: battery 100 %, next 2026-07-15 16:00
    assert t3_status.battery_percent(sat) == 100
    assert t3_status.next_run_stamp(sat) == datetime(2026, 7, 15, 16, 0)
    assert t3_status.battery_percent(b64("AAEA5AABABoHDg4tAA==")) == 100  # charge flag set (0xE4)
    assert t3_status.next_run_stamp(b64("AAEAZAEBAP///////w==")) is None  # idle frame, no schedule
    assert t3_status.battery_percent(b"\x00\x01") is None


def test_next_occurrence_rolls_a_rotten_date_forward():
    # D5: 704 published 2026-08-20 16:00 on 2026-09-14 while H:M was still right
    now = datetime(2026, 9, 14, 13, 36)  # a Monday
    stale = datetime(2026, 8, 20, 16, 0)
    assert t3_status.next_occurrence(stale, 0, now) == datetime(2026, 9, 14, 16, 0)
    assert t3_status.next_occurrence(stale, 0x15, now) == datetime(2026, 9, 14, 16, 0)  # Mon/Wed/Fri
    assert t3_status.next_occurrence(stale, 0x0A, now) == datetime(2026, 9, 15, 16, 0)  # Tue/Thu
    assert t3_status.next_occurrence(stale, 0x15, datetime(2026, 9, 14, 17, 0)) == datetime(2026, 9, 16, 16, 0)
    fresh = datetime(2026, 9, 15, 6, 30)
    assert t3_status.next_occurrence(fresh, 0x7F, now) == fresh


def test_flow_sta_0_captures():
    assert t3_status.flow_volume_liters(b64("AAAAAHEAAAJY//////////8A")) == 113  # 701 final frame (= app 113 L)
    assert t3_status.flow_volume_liters(b64("AAAAAFoAAAAADhAAAA4QCgAA")) == 90  # mid-run frame
    assert t3_status.flow_volume_liters(bytes(4)) is None


# --- counter_custom -----------------------------------------------------------------

@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("0,1,600,113,20260714161000", counter_custom.LastRun(600, 113, "20260714161000")),
        (base64.b64encode(b"0,1,900,151,20260807144500").decode(), counter_custom.LastRun(900, 151, "20260807144500")),
        ("0,1,65534,9,20260714155958", counter_custom.LastRun(65534, 9, "20260714155958")),  # sentinel is data here
        ("9000", None),  # QT-08W bare number
        ("0,1,x,3,1", None),
        ("", None),
        (None, None),
    ],
)
def test_counter_custom(raw, expected):
    assert counter_custom.parse(raw) == expected


# --- start_time / close_time ---------------------------------------------------------

def test_run_time_captures():
    assert run_times.decode(b64("GgQKBTs7")) == "2026-04-10 05:59:59"
    assert run_times.decode(b64("GgQKBg8A")) == "2026-04-10 06:15:00"  # 15-minute session
    assert run_times.decode(bytes([255, 1, 1, 0, 0, 0])) is None
    assert run_times.decode(bytes(5)) is None


# --- liters counter plausibility (device copy; farm/water_math.py has the farm's) ---

def test_device_and_farm_plausible_delta_agree():
    import random

    from custom_components.xtend_tuya.entity_parser.valves.codecs.liters import plausible_delta as device
    from custom_components.xtend_tuya.farm.water_math import plausible_delta as farm

    rnd = random.Random(3)
    for _ in range(5000):
        prev, cur, elapsed = rnd.uniform(0, 2e5), rnd.uniform(0, 2e5), rnd.uniform(0, 600)
        cur = rnd.choice([cur, prev + rnd.uniform(0, 80), rnd.uniform(0, 30)])
        assert device(prev, cur, elapsed) == farm(prev, cur, elapsed)
    assert device(130367.0, 130375.0, 10) == 8.0  # odometer valve
    assert device(91.0, 3.0, 10) == 3.0  # cycle reset
    assert device(100.0, 2100.0, 10) is None  # impossible jump
