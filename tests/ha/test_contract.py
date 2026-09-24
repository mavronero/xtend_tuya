"""The L2 -> L3 contract (farm/contract.py) holds for every prod valve.

The farm layer finds valves only through `discover_valves`: the registry
sensor plus sibling entities found by translation key. If the device layer
renames a key or drops an entity, the farm silently loses runs and calendar
entries. This test catches that against the real prod device lists.
"""

from __future__ import annotations

import pytest

from custom_components.xtend_tuya.const import XTDeviceSourcePriority
from custom_components.xtend_tuya.farm.contract import discover_valves

from .conftest import FakeAccount, build_device, load_fixture_devices, setup_hub

# Sibling roles the farm needs, per product: runs come from start/end/volume
# on the QT-08W and from the counter_custom last-run sensor on the T3.
REQUIRED_ROLES = {
    "Valve Controller": ("start_entity", "end_entity", "volume_entity"),
    "QT-08W-T3": ("counter_entity",),
}


async def _discover(hass) -> tuple[list, dict]:
    devices = [build_device(d) for d in load_fixture_devices("solar")]
    await setup_hub(hass, "solar-valves@test", [FakeAccount("tuya_iot", devices, XTDeviceSourcePriority.TUYA_IOT)])
    await hass.async_block_till_done()
    found = {record["tuya_device_id"]: record for record in discover_valves(hass)}
    return [d for d in devices if d.product_name in REQUIRED_ROLES], found


@pytest.mark.usefixtures("fake_plugins")
async def test_every_online_valve_satisfies_the_farm_contract(hass):
    all_valves, found = await _discover(hass)
    assert len(all_valves) >= 100, f"fixture shrank: {len(all_valves)} valves"
    valves = [d for d in all_valves if d.online]

    missing = [d.name for d in valves if d.id not in found]
    assert not missing, f"valves without a registry sensor: {missing}"

    broken = [
        f"{d.name}: {role}"
        for d in valves
        for role in REQUIRED_ROLES[d.product_name]
        if not found[d.id][role]
    ]
    assert not broken, f"contract roles missing: {broken}"
    assert all(found[d.id]["valve_name"] for d in valves)


@pytest.mark.xfail(
    strict=True,
    reason="known bug: an offline valve's registry sensor is unavailable, HA strips "
    "its device_id attribute and discover_valves skips the valve (prod 2026-09-24: "
    "32 of 111). Its past runs vanish from the calendar. Fix in its own release, "
    "then drop this marker.",
)
@pytest.mark.usefixtures("fake_plugins")
async def test_offline_valves_are_discovered(hass):
    all_valves, found = await _discover(hass)
    offline = [d for d in all_valves if not d.online]
    assert offline, "fixture has no offline valves"
    assert not [d.name for d in offline if d.id not in found]
