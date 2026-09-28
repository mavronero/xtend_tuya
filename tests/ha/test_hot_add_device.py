"""A valve added to Tuya while HA runs gets its entities (Trello qYyTmusI).

bindUser used to fetch the device into the source maps only: the accounts
refused the discovery signal (device_ids is rebuilt at setup only) and the
device skipped merge/CloudFixes/strategy, so it showed up at the next reload.
"""

from __future__ import annotations

import pytest
from homeassistant.const import STATE_UNAVAILABLE
from homeassistant.helpers import entity_registry as er

from custom_components.xtend_tuya.const import XTDeviceSourcePriority

from .conftest import FakeAccount, build_device, load_fixture_devices, setup_hub


@pytest.mark.usefixtures("fake_plugins")
async def test_bind_user_valve_gets_entities_without_reload(hass):
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

    def entities() -> dict[str, str]:
        return {
            e.entity_id: e.translation_key
            for e in registry.entities.values()
            if e.platform == "xtend_tuya" and e.unique_id.startswith(f"tuya.{new.id}")
        }

    async def bind() -> None:
        await hass.async_add_executor_job(solar.bind, new.id)  # MQ thread in prod
        # discovery -> add_job(generic entities) -> entity add tasks
        for _ in range(3):
            await hass.async_block_till_done()

    assert new.id not in mm.device_map and not entities()

    await bind()

    assert mm.device_map.get(new.id) is new
    assert new.force_compatibility and "xt_device_event_notify" in new.status, "skipped setup-time preparation"
    found = entities()
    keys = {key: entity_id for entity_id, key in found.items()}
    assert "valve" in keys and "irrigation_timer_registry" in keys, sorted(keys)
    assert hass.states.get(keys["valve"]).state != STATE_UNAVAILABLE

    # A second bindUser for the same device refreshes it; entities stay.
    await bind()
    assert entities() == found
    assert hass.states.get(keys["valve"]).state != STATE_UNAVAILABLE
