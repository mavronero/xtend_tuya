"""Entry lifecycle in a real HA: update-listener registration (C14), load-time report seed (C23).

The unit halves live in tests/unit/test_entry_hygiene.py (the reload decision)
and tests/unit/test_last_report_ts.py (MQ stamping, mirror, deepcopy).
"""

from __future__ import annotations

import pytest

from custom_components.xtend_tuya import _LOAD_TASKS
from custom_components.xtend_tuya.const import XTDeviceSourcePriority

from .conftest import FakeAccount, build_device, load_fixture_devices, setup_hub


async def _small_hub(hass):
    devices = [build_device(d) for d in load_fixture_devices("solar")[:3]]
    return await setup_hub(hass, "solar-valves@test", [FakeAccount("tuya_iot", devices, XTDeviceSourcePriority.TUYA_IOT)])


@pytest.mark.usefixtures("fake_plugins")
async def test_c23_device_list_fetch_seeds_last_report_ts(hass):
    entry = await _small_hub(hass)
    device_map = entry.runtime_data.multi_manager.device_map
    assert device_map
    assert all(d.last_report_ts > 0 for d in device_map.values()), "the device-list fetch is itself a report"


@pytest.mark.usefixtures("fake_plugins")
async def test_c14_options_change_reloads_but_a_no_op_write_does_not(hass):
    entry = await _small_hub(hass)
    first = entry.runtime_data.multi_manager

    # HA fires update listeners on any entry write; this one leaves options alone.
    hass.config_entries.async_update_entry(entry, title="renamed")
    await hass.async_block_till_done()
    assert entry.runtime_data.multi_manager is first, "a no-op options write must not reload the hub"

    hass.config_entries.async_update_entry(entry, options={"some_option": True})
    await hass.async_block_till_done()
    await _LOAD_TASKS[entry.entry_id]
    await hass.async_block_till_done()
    assert entry.runtime_data.multi_manager is not first, "an options change must reload the hub"
