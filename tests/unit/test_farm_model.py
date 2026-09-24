"""Farm model: sites, one valve per metering point, pumps (docs/architecture.md §5.1)."""

from __future__ import annotations

import pytest

from custom_components.xtend_tuya.farm import location_model as lm

T1 = "2026-06-01T08:00:00+02:00"
T2 = "2026-07-01T08:00:00+02:00"
T3 = "2026-08-01T08:00:00+02:00"


def _open(data, **match):
    return [a for a in data["assignments"] if a["end"] is None and all(a[k] == v for k, v in match.items())]


def test_migrate_v1_moves_lat_lon_into_a_point():
    v1 = {
        "locations": {
            "a": {"id": "a", "name": "A", "description": "", "expected_lpm": None, "lat": 34.9, "lon": 32.5, "aliases": ["a"], "created": T1},
            "b": {"id": "b", "name": "B", "description": "", "expected_lpm": None, "lat": None, "lon": None, "aliases": ["b"], "created": T1},
        },
        "assignments": [{"location_id": "a", "device_id": "d1", "begin": None, "end": None, "source": "auto"}],
    }
    v2 = lm.migrate_v1(v1)
    a, b = v2["locations"]["a"], v2["locations"]["b"]
    assert a["geometry"] == {"type": "Point", "coordinates": [32.5, 34.9]} and "lat" not in a
    assert lm.lat_lon(a) == (34.9, 32.5) and lm.lat_lon(b) == (None, None)
    assert a["site_id"] is None and v2["sites"] == {} and v2["sites_seeded"] is False
    assert v2["assignments"] == v1["assignments"]


def test_lat_lon_edit_updates_the_point():
    d = lm.empty()
    loc = lm.create_location(d, "Bed", T1)
    lm.update_location(d, loc["id"], lat=34.9, lon=32.5)
    assert loc["geometry"] == {"type": "Point", "coordinates": [32.5, 34.9]}
    lm.update_location(d, loc["id"], lat=None, lon=None)
    assert loc["geometry"] is None


def test_new_valve_on_a_metering_point_exchanges_the_old_one():
    d = lm.empty()
    mp = lm.create_location(d, "FF East 07", T1)
    other = lm.create_location(d, "FF East 08", T1)
    lm.assign_device(d, "907", mp["id"], T1)
    lm.assign_device(d, "950", other["id"], T1)
    lm.assign_device(d, "950", mp["id"], T2)  # 950 moves over, 907 is exchanged
    assert [a["device_id"] for a in _open(d, location_id=mp["id"])] == ["950"]
    assert not _open(d, device_id="907") and not _open(d, location_id=other["id"])
    # the MP keeps the metering history of both valves
    runs = {"907": [{"end": "2026-06-15T08:00:00+02:00"}], "950": [{"end": "2026-07-15T08:00:00+02:00"}]}
    assert len(lm.location_runs(d, mp["id"], runs)) == 2


def test_sites_seed_once_from_rooms():
    d = lm.empty()
    lm.seed_from_names(d, [("1", "FF East 01 (701)"), ("2", "FF East 02 (702)"), ("3", "HM Olive (703)"), ("4", "X (704)")], T1, lambda _d: None)
    rooms = {"1": "FF East", "2": "ff  east", "3": "Honeymoon"}
    assert not lm.seed_sites(d, lambda _d: None, T1)  # rooms not known yet: wait
    assert lm.seed_sites(d, rooms.get, T1)
    names = {s["name"] for s in d["sites"].values()}
    assert names == {"FF East", "Honeymoon"}
    by_loc = {l["name"]: l["site_id"] for l in d["locations"].values()}
    assert by_loc["FF East 01"] == by_loc["FF East 02"] and by_loc["X"] is None
    assert not lm.seed_sites(d, rooms.get, T2)  # once


def test_site_tree_rejects_cycles_and_filters_by_subtree():
    d = lm.empty()
    farm = lm.create_site(d, "Big Farm", None, T1)
    east = lm.create_site(d, "FF East", farm["id"], T1)
    row = lm.create_site(d, "Row 1", east["id"], T1)
    lm.create_site(d, "Honeymoon", None, T1)
    assert lm.subtree(d, farm["id"]) == {farm["id"], east["id"], row["id"]}
    with pytest.raises(ValueError, match="cycle"):
        lm.update_site(d, farm["id"], parent_id=row["id"])
    with pytest.raises(ValueError, match="cycle"):
        lm.update_site(d, farm["id"], parent_id=farm["id"])
    with pytest.raises(ValueError, match="already exists"):
        lm.create_site(d, " big  farm", None, T1)


def test_only_empty_sites_can_be_deleted():
    d = lm.empty()
    farm = lm.create_site(d, "Big Farm", None, T1)
    east = lm.create_site(d, "FF East", farm["id"], T1)
    mp = lm.create_location(d, "FF East 07", T1)
    lm.set_location_site(d, mp["id"], east["id"])
    for site in (farm, east):
        with pytest.raises(ValueError, match="not empty"):
            lm.delete_site(d, site["id"])
    lm.set_location_site(d, mp["id"], None)
    lm.delete_site(d, east["id"])
    lm.delete_site(d, farm["id"])
    assert d["sites"] == {}


def test_pump_is_inherited_down_the_tree_and_overridable():
    d = lm.empty()
    farm = lm.create_site(d, "Big Farm", None, T1)
    east = lm.create_site(d, "FF East", farm["id"], T1)
    mp = lm.create_location(d, "FF East 07", T1)
    lm.set_location_site(d, mp["id"], east["id"])
    p1 = lm.create_pump(d, "Big Farm 1", T1, meter_entity="sensor.big_farm_1_fct_total_delivered_flow_mc")
    p2 = lm.create_pump(d, "Big Farm 2", T1, meter_entity="sensor.big_farm_2_fct_total_delivered_flow_mc")

    assert lm.pump_for(d, mp["id"], T2) is None
    lm.assign_pump(d, p1["id"], "site", farm["id"], T1)
    assert lm.pump_for(d, mp["id"], T2) == (p1, "site", farm["id"])
    lm.assign_pump(d, p2["id"], "location", mp["id"], T2)  # override on the MP
    assert lm.pump_for(d, mp["id"], T3) == (p2, "location", mp["id"])
    # the first pump of a target holds since forever; a change is dated
    assert lm.pump_for(d, mp["id"], "2026-01-01T08:00:00+01:00")[0] is p2
    lm.assign_pump(d, p1["id"], "location", mp["id"], T3)
    assert lm.pump_for(d, mp["id"], "2026-07-15T08:00:00+02:00")[0] is p2
    assert lm.pump_for(d, mp["id"], "2026-08-15T08:00:00+02:00")[0] is p1
    lm.end_pump_assignment(d, "location", mp["id"], T3)
    assert lm.pump_for(d, mp["id"], "2026-09-01T08:00:00+02:00")[0] is p1
    with pytest.raises(ValueError):
        lm.create_pump(d, "Bad", T1, meter_entity="switch.pump")
    with pytest.raises(ValueError):
        lm.assign_pump(d, p1["id"], "valve", mp["id"], T1)


def test_pump_entities_are_validated_and_editable():
    d = lm.empty()
    p = lm.create_pump(
        d, "Big Farm 2", T1,
        meter_entity="sensor.big_farm_2_fct_total_delivered_flow_mc",
        flow_entity="sensor.big_farm_2_vf_flowliter",
    )
    assert p["pressure_entity"] is None and p["flow_entity"] == "sensor.big_farm_2_vf_flowliter"
    lm.update_pump(d, p["id"], name="Big Farm B", pressure_entity="sensor.big_farm_2_vp_pressurebar", flow_entity=None)
    assert (p["name"], p["pressure_entity"], p["flow_entity"]) == ("Big Farm B", "sensor.big_farm_2_vp_pressurebar", None)
    for bad in ({"meter_entity": None}, {"flow_entity": "switch.x"}, {"colour": "red"}):
        with pytest.raises(ValueError):
            lm.update_pump(d, p["id"], **bad)
    with pytest.raises(ValueError, match="required"):
        lm.create_pump(d, "No meter", T1)


def test_consumer_has_one_pump_monitor_many():
    d = lm.empty()
    p1 = lm.create_pump(d, "P1", T1, meter_entity="sensor.p1")
    p2 = lm.create_pump(d, "P2", T1, meter_entity="sensor.p2")
    lm.connect_device(d, p1["id"], "tank_valve", "consumer", "sensor.tank_fill", T1)
    lm.connect_device(d, p1["id"], "pressure", "monitor", None, T1)
    lm.connect_device(d, p2["id"], "pressure", "monitor", None, T1)  # a monitor may watch both
    lm.connect_device(d, p2["id"], "tank_valve", "consumer", "sensor.tank_fill", T2)  # moves
    open_ = [(c["pump_id"], c["device_id"]) for c in d["pump_connections"] if c["end"] is None]
    assert sorted(open_) == sorted(
        [(p1["id"], "pressure"), (p2["id"], "pressure"), (p2["id"], "tank_valve")]
    )
    ended = next(c for c in d["pump_connections"] if c["end"] is not None)
    assert (ended["pump_id"], ended["device_id"], ended["end"]) == (p1["id"], "tank_valve", T2)
    with pytest.raises(ValueError, match="already connected"):
        lm.connect_device(d, p2["id"], "pressure", "monitor", None, T3)
    with pytest.raises(ValueError):
        lm.connect_device(d, p1["id"], "x", "tank", None, T3)
    lm.disconnect_device(d, p2["id"], "pressure", T3)
    with pytest.raises(ValueError, match="not connected"):
        lm.disconnect_device(d, p2["id"], "pressure", T3)
