"""QT-08W-T3 valve switch reports the run from sat_0 / flow_sta_0 and stops via cyc_control_0.

switch_1 never goes on during a T3 run, so the Water-now card showed an idle
valve while it watered (Trello mG7aYEp3, valves 711/712, 2026-09-26).
"""

from __future__ import annotations

import base64
from datetime import datetime, timedelta

import pytest
from homeassistant.const import STATE_OFF, STATE_ON
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from custom_components.xtend_tuya.const import XTDeviceSourcePriority
from custom_components.xtend_tuya.switch import _t3_farm_time

from .conftest import FakeAccount, build_device, load_fixture_devices, setup_hub

SAT_IDLE = "AAEAXAABAP///////w=="  # 711, 2026-09-26 14:12:11 Z
SAT_RUNNING = "AAEAXAEBAP///////w=="  # 711, 14:12:38 Z (cyc_control_0 start at :37)
FLOW_IDLE = "AAAAACgAAAEs//////////8A"  # 711 after the run: window cleared to 0xFF
CYC_STOP = "AAAAAAAAAQAAAA=="  # codecs.single_run.encode_cyc_control(0, FLAG_IDLE)


def flow_frame(start: datetime, end: datetime) -> str:
    """flow_sta_0 mid-run: bytes[9..16] = start and end as [D, H, M, S]."""
    window = bytes([start.day, start.hour, start.minute, start.second, end.day, end.hour, end.minute, end.second])
    return base64.b64encode(bytes(9) + window + b"\x00").decode()


def test_farm_time_takes_the_nearest_month():
    now = datetime(2026, 10, 1, 0, 2, 0)
    assert _t3_farm_time(30, 23, 58, 0, now) == datetime(2026, 9, 30, 23, 58, 0)
    assert _t3_farm_time(1, 0, 3, 0, datetime(2026, 9, 30, 23, 59)) == datetime(2026, 10, 1, 0, 3, 0)
    assert _t3_farm_time(28, 12, 45, 1, datetime(2026, 9, 28, 12, 46)) == datetime(2026, 9, 28, 12, 45, 1)
    assert _t3_farm_time(31, 1, 0, 0, datetime(2026, 9, 15)) is None  # no 31 Sep / 31 Aug is 15+ days off


@pytest.mark.usefixtures("fake_plugins")
async def test_t3_switch_follows_the_valve_and_stops_via_cyc_control(hass, freezer):
    devices = [build_device(d) for d in load_fixture_devices("solar")]
    solar = FakeAccount("tuya_iot", devices, XTDeviceSourcePriority.TUYA_IOT)
    entry = await setup_hub(hass, "solar-valves@test", [solar])
    t3 = next(d for d in entry.runtime_data.multi_manager.device_map.values() if d.product_name == "QT-08W-T3")

    entity_id = er.async_get(hass).async_get_entity_id("switch", "xtend_tuya", f"tuya.{t3.id}switch_1")
    assert entity_id, "T3 switch_1 entity missing"
    entity = hass.data["entity_components"]["switch"].get_entity(entity_id)
    state = lambda: hass.states.get(entity_id)  # noqa: E731
    now = dt_util.now().replace(microsecond=0)

    def snapshot(sat: str, flow: str) -> None:
        t3.status["sat_0"], t3.status["flow_sta_0"] = sat, flow
        entity.async_write_ha_state()

    async def report(sat: str, flow: str | None = None) -> None:
        t3.status["sat_0"] = sat
        if flow is not None:
            t3.status["flow_sta_0"] = flow
        await entity._handle_state_update(["sat_0"] + (["flow_sta_0"] if flow else []), None)
        await hass.async_block_till_done()

    # 719, 2026-09-28: an "open" frame from before startup, no live window: off.
    snapshot(SAT_RUNNING, FLOW_IDLE)
    assert state().state == STATE_OFF
    snapshot(SAT_RUNNING, flow_frame(now - timedelta(days=1, minutes=5), now - timedelta(days=1)))
    assert state().state == STATE_OFF

    # Restart mid-run: the snapshot window says the valve is open, no frame needed.
    snapshot(SAT_RUNNING, flow_frame(now - timedelta(minutes=1), now + timedelta(minutes=4)))
    assert state().state == STATE_ON
    assert state().attributes["timed_runs_only"] is True
    assert dt_util.parse_datetime(state().attributes["run_end"]) == now + timedelta(minutes=4)

    # Manual stop inside the window: the live closed frame wins.
    await report(SAT_IDLE)
    assert state().state == STATE_OFF

    # A run that ends without a close frame drops at the window end.
    await report(SAT_RUNNING, flow_frame(now - timedelta(seconds=5), now + timedelta(seconds=30)))
    assert state().state == STATE_ON
    entity._open_frame_at -= 3 * 3600  # the open frame alone would have expired
    freezer.move_to(now + timedelta(seconds=31))
    async_fire_time_changed(hass, now + timedelta(seconds=31))
    await hass.async_block_till_done()
    assert state().state == STATE_OFF

    # Live open frame without a window (seen before the first flow_sta_0 frame): on.
    await report(SAT_RUNNING, FLOW_IDLE)
    assert state().state == STATE_ON
    assert "run_end" not in state().attributes
    await report(SAT_IDLE)
    assert state().state == STATE_OFF

    with pytest.raises(HomeAssistantError):
        await hass.services.async_call("switch", "turn_on", {"entity_id": entity_id}, blocking=True)

    solar.sent.clear()
    await hass.services.async_call("switch", "turn_off", {"entity_id": entity_id}, blocking=True)
    assert solar.sent == [(t3.id, {"code": "cyc_control_0", "value": CYC_STOP})]
