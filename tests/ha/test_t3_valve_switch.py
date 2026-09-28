"""QT-08W-T3 valve switch reports the run from sat_0 and stops via cyc_control_0.

switch_1 never goes on during a T3 run, so the Water-now card showed an idle
valve while it watered (Trello mG7aYEp3, valves 711/712, 2026-09-26).
"""

from __future__ import annotations

import pytest
from homeassistant.const import STATE_OFF, STATE_ON
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er

from custom_components.xtend_tuya.const import XTDeviceSourcePriority

from .conftest import FakeAccount, build_device, load_fixture_devices, setup_hub

SAT_IDLE = "AAEAXAABAP///////w=="  # 711, 2026-09-26 14:12:11 Z
SAT_RUNNING = "AAEAXAEBAP///////w=="  # 711, 14:12:38 Z (cyc_control_0 start at :37)
CYC_STOP = "AAAAAAAAAQAAAA=="  # codecs.single_run.encode_cyc_control(0, FLAG_IDLE)


@pytest.mark.usefixtures("fake_plugins")
async def test_t3_switch_follows_sat_0_and_stops_via_cyc_control(hass):
    devices = [build_device(d) for d in load_fixture_devices("solar")]
    solar = FakeAccount("tuya_iot", devices, XTDeviceSourcePriority.TUYA_IOT)
    entry = await setup_hub(hass, "solar-valves@test", [solar])
    t3 = next(d for d in entry.runtime_data.multi_manager.device_map.values() if d.product_name == "QT-08W-T3")

    entity_id = er.async_get(hass).async_get_entity_id("switch", "xtend_tuya", f"tuya.{t3.id}switch_1")
    assert entity_id, "T3 switch_1 entity missing"
    entity = hass.data["entity_components"]["switch"].get_entity(entity_id)

    async def report_sat(value: str) -> None:
        t3.status["sat_0"] = value
        await entity._handle_state_update(["sat_0"], None)
        await hass.async_block_till_done()

    await report_sat(SAT_RUNNING)
    assert hass.states.get(entity_id).state == STATE_ON
    assert hass.states.get(entity_id).attributes["timed_runs_only"] is True
    await report_sat(SAT_IDLE)
    assert hass.states.get(entity_id).state == STATE_OFF

    with pytest.raises(HomeAssistantError):
        await hass.services.async_call("switch", "turn_on", {"entity_id": entity_id}, blocking=True)

    solar.sent.clear()
    await hass.services.async_call("switch", "turn_off", {"entity_id": entity_id}, blocking=True)
    assert solar.sent == [(t3.id, {"code": "cyc_control_0", "value": CYC_STOP})]
