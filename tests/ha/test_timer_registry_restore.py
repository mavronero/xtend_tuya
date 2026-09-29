"""After a restart the valve's live timer DP beats the restored registry slot.

815/904 (2026-09): slot 0 moved from daily to Tue/Thu/Sat; every restart
restored the old daily slot over the live DP because the once-per-payload
guard was primed before the restore.
"""

from __future__ import annotations

import base64

import pytest
from homeassistant.core import State
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import mock_restore_cache

from custom_components.xtend_tuya import _LOAD_TASKS
from custom_components.xtend_tuya.const import XTDeviceSourcePriority
from custom_components.xtend_tuya.entity_parser.valves.codecs import time_task as tt

from .conftest import FakeAccount, build_device, load_fixture_devices, setup_hub

TUE_THU_SAT = tt.days_to_mask(["Tue", "Thu", "Sat"])


@pytest.mark.usefixtures("fake_plugins")
async def test_live_dp_wins_over_restored_slot(hass):
    raw = next(
        d for d in load_fixture_devices("solar")
        if d.get("product_name") == "Valve Controller" and d.get("online") and "time_task" in (d.get("status") or {})
    )
    valve = build_device(raw)
    live = tt.Timer(0, 11, 0, 0, 600, TUE_THU_SAT, True)
    valve.status["time_task"] = base64.b64encode(tt.encode_qt08w(live)).decode()
    entry = await setup_hub(hass, "solar-restore@test", [FakeAccount("tuya_iot", [valve], XTDeviceSourcePriority.TUYA_IOT)])

    entity_id = next(
        e.entity_id for e in er.async_get(hass).entities.values()
        if e.platform == "xtend_tuya" and e.translation_key == "irrigation_timer_registry"
    )
    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()

    stale = tt.Timer(0, 11, 0, 0, 600, 0x7F, True).as_attribute()  # daily, the pre-move slot
    mock_restore_cache(hass, [State(entity_id, "1", {"slots": {"0": stale}})])
    assert await hass.config_entries.async_setup(entry.entry_id)
    await _LOAD_TASKS[entry.entry_id]
    await hass.async_block_till_done()

    slot0 = hass.states.get(entity_id).attributes["slots"]["0"]
    assert (slot0["hour"], slot0["minute"], slot0["days_mask"]) == (11, 0, TUE_THU_SAT)
