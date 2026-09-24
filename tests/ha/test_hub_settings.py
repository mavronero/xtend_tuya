"""Hub settings options step in a real HA: form, validation, storage, effect after reload."""

from __future__ import annotations

import pytest
from homeassistant.data_entry_flow import FlowResultType

from custom_components.xtend_tuya import _LOAD_TASKS
from custom_components.xtend_tuya.const import XTDeviceSourcePriority
from custom_components.xtend_tuya.transport.settings import OPTION_KEY

from .conftest import FakeAccount, build_device, load_fixture_devices, setup_hub


async def _open_hub_settings(hass, entry):
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    assert flow["type"] is FlowResultType.MENU
    assert "hub_settings" in flow["menu_options"]
    form = await hass.config_entries.options.async_configure(flow["flow_id"], {"next_step_id": "hub_settings"})
    assert form["type"] is FlowResultType.FORM and form["step_id"] == "hub_settings"
    return form


@pytest.mark.usefixtures("fake_plugins")
async def test_hub_settings_step_stores_plan_and_applies_after_reload(hass):
    devices = [build_device(d) for d in load_fixture_devices("solar")]
    entry = await setup_hub(hass, "solar-valves@test", [FakeAccount("tuya_iot", devices, XTDeviceSourcePriority.TUYA_IOT)])
    # No option stored = today's behaviour.
    assert entry.runtime_data.multi_manager.port.settings.controllable_limit == 10

    form = await _open_hub_settings(hass, entry)
    rejected = await hass.config_entries.options.async_configure(
        form["flow_id"], {"plan": "custom", "cloud_timer_mirror": True}
    )
    assert rejected["errors"] == {"controllable_limit": "custom_limit_required"}

    done = await hass.config_entries.options.async_configure(
        form["flow_id"], {"plan": "paid", "cloud_timer_mirror": False}
    )
    assert done["type"] is FlowResultType.CREATE_ENTRY
    assert entry.options[OPTION_KEY] == {"plan": "paid", "controllable_limit": None, "cloud_timer_mirror": False}

    # The update listener reloads the entry; the new settings reach port and quota tracker.
    await hass.async_block_till_done()
    await _LOAD_TASKS[entry.entry_id]
    await hass.async_block_till_done()
    manager = entry.runtime_data.multi_manager
    assert manager.port.settings.cloud_timer_mirror is False
    assert manager.controllable_quota.limit is None
    assert manager.controllable_quota.remaining is None
