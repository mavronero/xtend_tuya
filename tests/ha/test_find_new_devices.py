"""A valve paired in Tuya shows up without bindUser (Trello qYyTmusI).

Nothing guarantees Tuya delivers bindUser to us, so xtend_tuya.find_new_devices
(also the hub button and a 6 h timer) lists the account's devices and hot-adds
the ones the hub doesn't serve yet.
"""

from __future__ import annotations

import pytest
from homeassistant.const import STATE_UNAVAILABLE
from homeassistant.helpers import entity_registry as er

from custom_components.xtend_tuya.const import DOMAIN, XTDeviceSourcePriority

from .conftest import FakeAccount, build_device, load_fixture_devices, setup_hub


@pytest.mark.usefixtures("fake_plugins")
async def test_find_new_devices_adds_paired_valve_once(hass):
    devices = [build_device(d) for d in load_fixture_devices("solar")]
    new = next(d for d in devices if d.category == "sfkzq" and d.product_name == "Valve Controller" and d.online)
    solar = FakeAccount(
        "tuya_iot",
        [d for d in devices if d is not new],
        XTDeviceSourcePriority.TUYA_IOT,
        unbound=[new],
    )
    entry = await setup_hub(hass, "solar-valves@test", [solar])
    mm = entry.runtime_data.multi_manager
    registry = er.async_get(hass)
    before = dict(mm.device_map.items())
    entities_before = {e.entity_id for e in registry.entities.values() if e.platform == DOMAIN}

    async def find() -> list[str]:
        response = await hass.services.async_call(
            DOMAIN,
            "find_new_devices",
            {"config_entry_id": entry.entry_id},
            blocking=True,
            return_response=True,
        )
        for _ in range(3):  # discovery -> add_job(entities) -> entity add tasks
            await hass.async_block_till_done()
        return response["added"]

    # Not paired yet: the listing doesn't have it, nothing is added.
    assert await find() == []
    assert solar.listings == 1

    solar.paired.add(new.id)
    assert await find() == [new.id]

    assert mm.device_map.get(new.id) is new
    assert new.force_compatibility, "skipped setup-time preparation"
    new_entities = {
        e.translation_key: e.entity_id
        for e in registry.entities.values()
        if e.platform == DOMAIN and e.unique_id.startswith(f"tuya.{new.id}")
    }
    assert "valve" in new_entities, sorted(new_entities)
    assert hass.states.get(new_entities["valve"]).state != STATE_UNAVAILABLE

    # Second run finds nothing; the existing devices are the same objects.
    assert await find() == []
    assert all(mm.device_map.get(k) is v for k, v in before.items())
    after = {e.entity_id for e in registry.entities.values() if e.platform == DOMAIN}
    assert entities_before <= after

    # The hub button runs the same path.
    button = next(
        e.entity_id
        for e in registry.entities.values()
        if e.unique_id == f"{entry.entry_id}_find_new_devices"
    )
    await hass.services.async_call("button", "press", {"entity_id": button}, blocking=True)
    await hass.async_block_till_done()
    assert solar.listings == 4
