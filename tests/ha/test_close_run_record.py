"""The end sensor carries the valve's own run record while it is fresh.

961 on 2026-10-01 was opened while offline: the start report never arrived,
the close came with counter_custom '770,112'. The runs store reads the run
length from these attributes.
"""

from __future__ import annotations

import base64

import pytest
from homeassistant.helpers import entity_registry as er

from custom_components.xtend_tuya.const import XTDeviceSourcePriority

from .conftest import FakeAccount, build_device, load_fixture_devices, setup_hub


def _close(hour: int, second: int) -> str:
    """close_time DP for 2026-09-01 hh:43:ss: in the past, so the runs store
    takes it as a real close, not a scheduled one it has to wait for."""
    return base64.b64encode(bytes([26, 9, 1, hour, 43, second])).decode()


@pytest.mark.usefixtures("fake_plugins")
async def test_close_carries_the_fresh_run_record(hass, freezer):
    raw = next(
        d for d in load_fixture_devices("solar")
        if d.get("product_name") != "QT-08W-T3" and d.get("online") and "close_time" in (d.get("status") or {})
    )
    valve = build_device(raw)
    valve.status["counter_custom"] = "1000,114"  # the run before
    await setup_hub(hass, "solar-close@test", [FakeAccount("tuya_iot", [valve], XTDeviceSourcePriority.TUYA_IOT)])

    entity_id = next(
        e.entity_id for e in er.async_get(hass).entities.values()
        if e.platform == "xtend_tuya" and e.translation_key == "close_time"
    )
    entity = hass.data["entity_components"]["sensor"].get_entity(entity_id)
    attrs = lambda: hass.states.get(entity_id).attributes  # noqa: E731
    assert "run_seconds" not in attrs(), "a record from before the boot belongs to no close"

    valve.status["close_time"] = _close(11, 14)
    valve.status["counter_custom"] = "770,112"
    await entity._handle_state_update(["close_time", "counter_custom"], None)
    await hass.async_block_till_done()
    state = hass.states.get(entity_id)
    assert state.state == "2026-09-01 11:43:14"
    assert (state.attributes["run_seconds"], state.attributes["run_liters"]) == (770, 112)

    # the second close frame, one second later and without the record
    valve.status["close_time"] = _close(11, 15)
    await entity._handle_state_update(["close_time"], None)
    await hass.async_block_till_done()
    assert attrs()["run_seconds"] == 770

    # the next run's close must not inherit it
    freezer.tick(3600)
    valve.status["close_time"] = _close(12, 15)
    await entity._handle_state_update(["close_time"], None)
    await hass.async_block_till_done()
    assert hass.states.get(entity_id).state == "2026-09-01 12:43:15"
    assert "run_seconds" not in attrs()
