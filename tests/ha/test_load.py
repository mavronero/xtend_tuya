"""Load the fork in a real HA with the prod device lists.

Guards the two failure classes that reached prod unseen:
- the entry loads, every platform sets up, valve entities exist, no ERROR
  from the integration (4.4.249 cancel, 4.4.251 NamedTuple / TIMESTAMP crashes)
- a second hub carrying the same device ids with 2-DP sharing copies must not
  collapse the first hub's full device map (4.4.251-254 mirror clobber)
"""

from __future__ import annotations

import logging

import pytest
from homeassistant.config_entries import ConfigEntryState
from homeassistant.helpers import entity_registry as er

from custom_components.xtend_tuya.const import XTDeviceSourcePriority

from .conftest import FakeAccount, build_device, load_fixture_devices, setup_hub

MIN_QT08W_FUNCTIONS = 20
T3_CODES = ("time_task_0", "cyc_control_0")
SHARING_DPS = {"switch", "countdown"}  # what SmartLife sharing exposes for sfkzq


def _valve_health(device_map) -> tuple[list[str], list[str], int, int]:
    thin, t3_bad, qt, t3 = [], [], 0, 0
    for d in device_map.values():
        if d.product_name == "Valve Controller":
            qt += 1
            if len(d.function) < MIN_QT08W_FUNCTIONS:
                thin.append(f"{d.name}({len(d.function)})")
        elif d.product_name == "QT-08W-T3":
            t3 += 1
            if not all(c in d.function or d.status.get(c) is not None for c in T3_CODES):
                t3_bad.append(d.name)
    return thin, t3_bad, qt, t3


def _integration_errors(caplog) -> list[str]:
    return [
        f"{r.name}: {r.getMessage()[:160]}"
        for r in caplog.records
        if r.levelno >= logging.ERROR and "xtend_tuya" in (r.name + r.pathname)
    ]


@pytest.mark.usefixtures("fake_plugins")
async def test_solar_hub_loads_full_and_creates_valve_entities(hass, caplog):
    devices = [build_device(d) for d in load_fixture_devices("solar")]
    solar = FakeAccount("tuya_iot", devices, XTDeviceSourcePriority.TUYA_IOT)

    entry = await setup_hub(hass, "solar-valves@test", [solar])

    assert entry.state is ConfigEntryState.LOADED
    mm = entry.runtime_data.multi_manager
    assert len(mm.device_map) == len(devices)
    thin, t3_bad, qt, t3 = _valve_health(mm.device_map)
    assert qt == 96 and t3 == 11
    assert not thin, f"QT-08W with < {MIN_QT08W_FUNCTIONS} functions: {thin[:8]}"
    assert not t3_bad, f"T3 without {T3_CODES}: {t3_bad}"

    registry = er.async_get(hass)
    by_key: dict[str, set[str]] = {}
    for e in registry.entities.values():
        if e.platform == "xtend_tuya":
            by_key.setdefault(e.translation_key or "", set()).add(e.unique_id)
    # Every QT-08W gets its valve switch + timer registry sensor; every T3 its switch_1.
    assert len(by_key.get("valve", ())) >= 96, "valve switches missing"
    assert len(by_key.get("irrigation_timer_registry", ())) >= 107, "timer registry sensors missing"
    t3_ids = {d.id for d in devices if d.product_name == "QT-08W-T3"}
    assert all(any(uid.endswith(f"{i}switch_1") or i in uid for uid in by_key.get("indexed_switch", set()) | by_key.get("valve", set())) for i in t3_ids), "T3 switch_1 missing"

    assert not _integration_errors(caplog), _integration_errors(caplog)


@pytest.mark.usefixtures("fake_plugins")
async def test_second_hub_with_same_ids_does_not_collapse_first(hass, caplog):
    solar_dicts = load_fixture_devices("solar")
    solar = FakeAccount("tuya_iot", [build_device(d) for d in solar_dicts], XTDeviceSourcePriority.TUYA_IOT)
    first = await setup_hub(hass, "solar-valves@test", [solar])
    assert not _valve_health(first.runtime_data.multi_manager.device_map)[0]

    # Simon's hub sees the same valves through SmartLife sharing: 2 DPs each.
    thin_copies = [build_device(d, keep=SHARING_DPS) for d in solar_dicts if d.get("product_name") in ("Valve Controller", "QT-08W-T3")]
    assert all(len(d.function) <= 2 for d in thin_copies)
    simon = FakeAccount("tuya_sharing", thin_copies, XTDeviceSourcePriority.TUYA_SHARED)
    second = await setup_hub(hass, "simon@test", [simon])
    assert second.state is ConfigEntryState.LOADED

    thin, t3_bad, qt, t3 = _valve_health(first.runtime_data.multi_manager.device_map)
    assert not thin, f"first hub collapsed by the second: {len(thin)}/{qt} QT-08W thin, e.g. {thin[:5]}"
    assert not t3_bad, f"first hub T3 collapsed: {t3_bad}"
    # The second hub never steals devices the first one owns.
    assert not any(d.id in first.runtime_data.multi_manager.device_map for d in second.runtime_data.multi_manager.device_map.values())
    assert not _integration_errors(caplog), _integration_errors(caplog)


@pytest.mark.usefixtures("fake_plugins")
async def test_irrigation_locations_seed_once_from_names(hass, hass_client, caplog):
    """/api/xtend_tuya/irrigation_locations: seeded once from "Place (NNN)" names,
    then manual only (Simon 2026-09-16); new valves land in `unassigned`."""
    devices = [build_device(d) for d in load_fixture_devices("solar")]
    solar = FakeAccount("tuya_iot", devices, XTDeviceSourcePriority.TUYA_IOT)
    await setup_hub(hass, "solar-valves@test", [solar])
    await hass.async_block_till_done()

    client = await hass_client()
    resp = await client.get("/api/xtend_tuya/irrigation_locations")
    assert resp.status == 200, await resp.text()
    body = await resp.json()
    named = [d for d in devices if d.product_name in ("Valve Controller", "QT-08W-T3") and "(" in d.name]
    assert len(body["locations"]) >= 50, f"seed produced {len(body['locations'])} locations from {len(named)} named valves"
    assigned = {dev["device_id"] for loc in body["locations"] for dev in loc["devices"] if not dev["end"]}
    assert assigned, "no open assignments after seed"
    assert all(dev["source"] == "auto" for loc in body["locations"] for dev in loc["devices"])

    # A location renamed in HA must survive: seed never runs again once the store holds data.
    loc = body["locations"][0]
    resp = await client.post("/api/xtend_tuya/irrigation_locations", json={"action": "update_location", "id": loc["id"], "name": "Renamed Plot"})
    assert resp.status == 200, await resp.text()
    from custom_components.xtend_tuya.irrigation_locations import async_seed_once

    await async_seed_once(hass)
    body2 = await (await client.get("/api/xtend_tuya/irrigation_locations")).json()
    assert any(l["name"] == "Renamed Plot" for l in body2["locations"])
    assert len(body2["locations"]) == len(body["locations"])
    assert not _integration_errors(caplog), _integration_errors(caplog)


@pytest.mark.usefixtures("fake_plugins")
async def test_irrigation_locations_seed_once_from_names(hass, hass_client, caplog):
    """/api/xtend_tuya/irrigation_locations: seeded once from "Place (NNN)" names,
    then manual only (Simon 2026-09-16); new valves land in `unassigned`."""
    devices = [build_device(d) for d in load_fixture_devices("solar")]
    solar = FakeAccount("tuya_iot", devices, XTDeviceSourcePriority.TUYA_IOT)
    await setup_hub(hass, "solar-valves@test", [solar])
    await hass.async_block_till_done()

    client = await hass_client()
    resp = await client.get("/api/xtend_tuya/irrigation_locations")
    assert resp.status == 200, await resp.text()
    body = await resp.json()
    named = [d for d in devices if d.product_name in ("Valve Controller", "QT-08W-T3") and "(" in d.name]
    assert len(body["locations"]) >= 50, f"seed produced {len(body['locations'])} locations from {len(named)} named valves"
    assigned = {dev["device_id"] for loc in body["locations"] for dev in loc["devices"] if not dev["end"]}
    assert assigned, "no open assignments after seed"
    assert all(dev["source"] == "auto" for loc in body["locations"] for dev in loc["devices"])

    # A location renamed in HA must survive: seed never runs again once the store holds data.
    loc = body["locations"][0]
    resp = await client.post("/api/xtend_tuya/irrigation_locations", json={"action": "update_location", "id": loc["id"], "name": "Renamed Plot"})
    assert resp.status == 200, await resp.text()
    from custom_components.xtend_tuya.irrigation_locations import async_seed_once

    await async_seed_once(hass)
    body2 = await (await client.get("/api/xtend_tuya/irrigation_locations")).json()
    assert any(l["name"] == "Renamed Plot" for l in body2["locations"])
    assert len(body2["locations"]) == len(body["locations"])
    assert not _integration_errors(caplog), _integration_errors(caplog)
