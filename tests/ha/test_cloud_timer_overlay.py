"""Daily cloud timer read labels the valve slots; the planned calendar follows.

Target cases (2026-09-29): 915 old valve switched off in the app but on in
HA -> `off`; 703 T3 app timer deleted, HA still plans 14:30 -> `missing`;
824 13:00 app timer HA never saw -> `cloud_only`.
"""

from __future__ import annotations

import base64
from datetime import timedelta

import pytest
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from custom_components.xtend_tuya.const import XTDeviceSourcePriority
from custom_components.xtend_tuya.entity_parser.valves import timer_reconcile
from custom_components.xtend_tuya.entity_parser.valves.codecs import time_task as tt

from .conftest import FakeAccount, build_device, load_fixture_devices, setup_hub

DAILY = 0x7F


def _pick(raws, product, code):
    return build_device(
        next(d for d in raws if d.get("product_name") == product and d.get("online") and code in (d.get("status") or {}))
    )


def _registry(hass, device_id):
    ent_reg = er.async_get(hass)
    for e in ent_reg.entities.values():
        if e.platform == "xtend_tuya" and e.translation_key == "irrigation_timer_registry":
            state = hass.states.get(e.entity_id)
            if state and state.attributes.get("device_id") == device_id:
                return e.entity_id
    raise AssertionError(f"no registry sensor for {device_id}")


@pytest.mark.usefixtures("fake_plugins")
async def test_sweep_labels_slots_and_calendar_follows(hass, freezer, monkeypatch):
    monkeypatch.setattr(timer_reconcile, "GET_SPACING_S", 0)
    raws = load_fixture_devices("solar")
    old = _pick(raws, "Valve Controller", "time_task")
    t3 = _pick(raws, "QT-08W-T3", "time_task_0")
    old.status["time_task"] = base64.b64encode(tt.encode_qt08w(tt.Timer(0, 6, 0, 0, 600, DAILY, True))).decode()
    t3.status["time_task_0"] = base64.b64encode(tt.encode_t3(tt.Timer(0, 14, 30, 0, 420, DAILY, True))).decode()

    cloud = FakeAccount("tuya_iot", [old, t3], XTDeviceSourcePriority.TUYA_IOT)
    cloud.timers = {
        # 915: the app switched slot 0 off (old valve: functions[0].value.start)
        old.id: [{"alias_name": "0", "time": "06:00", "loops": "1111111", "status": 1,
                  "functions": [{"code": "time_task", "value": {"start": False, "duration": 600}}]}],
        # 703 + 824: no 14:30 in the cloud; a 13:00 app timer (T3: functions [], status 0)
        t3.id: [{"alias_name": "", "time": "13:00", "loops": "1111111", "status": 0, "functions": []}],
    }
    start = dt_util.utcnow()
    entry = await setup_hub(hass, "solar-overlay@test", [cloud])
    port = entry.runtime_data.multi_manager.port
    gets = lambda: [c for c in cloud.api_calls if c[1].endswith("/timers")]  # noqa: E731

    freezer.move_to(start + timedelta(minutes=14))
    async_fire_time_changed(hass, start + timedelta(minutes=14))
    await hass.async_block_till_done(wait_background_tasks=True)
    assert gets() == [], "no cloud read in the first 15 min after load"

    freezer.move_to(start + timedelta(minutes=16))
    async_fire_time_changed(hass, start + timedelta(minutes=16))
    await hass.async_block_till_done(wait_background_tasks=True)
    assert len(gets()) == 2

    old_reg, t3_reg = _registry(hass, old.id), _registry(hass, t3.id)
    old_cloud = hass.states.get(old_reg).attributes["cloud"]
    t3_cloud = hass.states.get(t3_reg).attributes["cloud"]
    assert old_cloud["slots"] == {"0": "off"}
    assert t3_cloud["slots"] == {"0": "missing"}
    assert [(t["hour"], t["minute"], t["value"]) for t in t3_cloud["cloud_only"]] == [(13, 0, 0)]

    calendar = next(
        e for e in hass.data["entity_components"]["calendar"].entities if "planned" in e.entity_id
    )
    now = dt_util.now()
    events = calendar._build_events(now, now + timedelta(days=2))
    uids = {e.uid for e in events}
    assert not any(u.startswith(old_reg) for u in uids), "slot switched off in the app is not planned"
    assert {u for u in uids if u.startswith(t3_reg)} == {f"{t3_reg}#c0"}
    marker = next(e for e in events if e.uid == f"{t3_reg}#c0")
    assert (marker.start.hour, marker.start.minute) == (13, 0)
    assert marker.end - marker.start == timedelta(minutes=1)  # T3 app timer: no duration

    # A failed read (1106) a day later keeps the overlay and its checked_at.
    cloud.timers[t3.id] = None
    freezer.move_to(start + timedelta(hours=21))
    assert await timer_reconcile.async_sweep(hass, port) == 2
    assert hass.states.get(t3_reg).attributes["cloud"] == t3_cloud

    # Nothing is read again within 20 h of the last good read.
    cloud.api_calls.clear()
    freezer.move_to(start + timedelta(hours=22))
    assert await timer_reconcile.async_sweep(hass, port) == 1  # only the failed one
    assert [c[1] for c in gets()] == [f"/v1.0/devices/{t3.id}/timers"]
