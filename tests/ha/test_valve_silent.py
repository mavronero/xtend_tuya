"""`last_valve_report` on the registry sensor: only watering-relevant DPs stamp it.

T3 valves 712/706/707 (2026-09) stopped sending sat_0 / counter_custom while
HA still showed them online and the `last_report` sensor looked fresh after
every restart. The frontend's silent badge reads this attribute instead.
"""

from __future__ import annotations

from datetime import datetime

import pytest
from homeassistant.core import State
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import mock_restore_cache

from custom_components.xtend_tuya import _LOAD_TASKS
from custom_components.xtend_tuya.const import XTDeviceSourcePriority

from .conftest import FakeAccount, build_device, load_fixture_devices, setup_hub


@pytest.mark.usefixtures("fake_plugins")
async def test_only_watering_reports_stamp_last_valve_report(hass, freezer):
    raw = next(
        d for d in load_fixture_devices("solar")
        if d.get("product_name") == "QT-08W-T3" and d.get("online") and "time_task_0" in (d.get("status") or {})
    )
    t3 = build_device(raw)
    t3.status["counter_custom"] = "0,1,600,113,20260914161000"  # last run 14.09 16:10 farm time
    entry = await setup_hub(hass, "solar-silent@test", [FakeAccount("tuya_iot", [t3], XTDeviceSourcePriority.TUYA_IOT)])

    entity_id = next(
        e.entity_id for e in er.async_get(hass).entities.values()
        if e.platform == "xtend_tuya" and e.translation_key == "irrigation_timer_registry"
    )
    entity = hass.data["entity_components"]["sensor"].get_entity(entity_id)
    stamp = lambda: dt_util.parse_datetime(hass.states.get(entity_id).attributes["last_valve_report"])  # noqa: E731
    seeded = datetime(2026, 9, 14, 16, 10, tzinfo=dt_util.DEFAULT_TIME_ZONE)
    assert stamp() == seeded, "no report since boot: seeded from the T3's last run"

    freezer.tick(3600)
    await entity._handle_state_update(["switch_1", "xt_event_notify"], None)  # heartbeat-ish traffic
    entity.async_write_ha_state()
    assert stamp() == seeded

    await entity._handle_state_update(["sat_0"], None)
    await hass.async_block_till_done()
    live = stamp()
    assert abs((live - dt_util.now()).total_seconds()) < 2

    # A restart keeps the newer restored stamp over the counter_custom seed.
    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    mock_restore_cache(hass, [State(entity_id, "1", {"slots": {}, "last_valve_report": live.isoformat()})])
    assert await hass.config_entries.async_setup(entry.entry_id)
    await _LOAD_TASKS[entry.entry_id]
    await hass.async_block_till_done()
    assert stamp() == live
