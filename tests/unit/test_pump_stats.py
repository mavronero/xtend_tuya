"""Which entities the pump statistics endpoint reads: only those stored on
pumps and on metered pump connections, by statistic type."""

from __future__ import annotations

from custom_components.xtend_tuya.farm import location_model as lm
from custom_components.xtend_tuya.farm.pump_stats import entities_by_type

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
