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
async def test_every_valve_satisfies_the_farm_contract(hass):
    valves, found = await _discover(hass)
    assert len(valves) >= 100, f"fixture shrank: {len(valves)} valves"
    # Offline valves included: their registry sensor is `unavailable` with its
    # attributes stripped, and they used to vanish from the farm (32/111 on prod).
    assert any(not d.online for d in valves), "fixture has no offline valves"

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

