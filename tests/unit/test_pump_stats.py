"""Which entities the pump statistics endpoint reads: only those stored on
pumps and on metered pump connections, by statistic type."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from custom_components.xtend_tuya.farm import location_model as lm
from custom_components.xtend_tuya.farm.pump_stats import FLOW_RANGES, entities_by_type, flow_points

T1 = "2026-06-01T08:00:00+02:00"


def test_meters_and_gauges_come_from_the_store():
    d = lm.empty()
    p = lm.create_pump(
        d, "Big Farm 2", T1,
        meter_entity="sensor.big_farm_2_fct_total_delivered_flow_mc",
        flow_entity="sensor.big_farm_2_vf_flowliter",
        pressure_entity="sensor.big_farm_2_vp_pressurebar",
    )
    lm.connect_device(d, p["id"], "tank", "consumer", "sensor.tank_fill_volume", T1)
    lm.connect_device(d, p["id"], "level", "monitor", None, T1)
    meters, gauges = entities_by_type(d)
    assert meters == {"sensor.big_farm_2_fct_total_delivered_flow_mc", "sensor.tank_fill_volume"}
    assert gauges == {"sensor.big_farm_2_vf_flowliter", "sensor.big_farm_2_vp_pressurebar"}
    assert entities_by_type(lm.empty()) == (set(), set())


def test_flow_points_from_recorded_states():
    t0 = datetime(2026, 9, 28, 10, 0, tzinfo=timezone.utc)
    at = lambda sec, s: SimpleNamespace(state=s, last_changed=t0 + timedelta(seconds=sec))
    rows = flow_points([at(0, "0.0"), at(30, "41.5"), at(45, "unavailable"), at(50, "40")])
    ms = int(t0.timestamp() * 1000)
    assert rows == [
        {"start": ms, "mean": 0.0, "max": None},
        {"start": ms + 30_000, "mean": 41.5, "max": None},
        {"start": ms + 45_000, "mean": None, "max": None},  # a gap, not zero
        {"start": ms + 50_000, "mean": 40.0, "max": None},
    ]
    # 24 h reads the recorded states; longer ranges read statistics.
    assert [p for _, p in FLOW_RANGES.values()] == [None, "5minute", "hour"]
