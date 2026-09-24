"""TimerState (the single writer of a valve's timer slots) and resync against it.

The resync cases were a standalone mirror (tests/test_resync_guard.py, audit
C7); they now run the real resync_from_cloud on a fake port.
"""

from __future__ import annotations

from types import MappingProxyType

import pytest

from custom_components.xtend_tuya.entity_parser.valves import driver, timer_service
from custom_components.xtend_tuya.entity_parser.valves import timer_state as ts
from custom_components.xtend_tuya.entity_parser.valves.codecs import time_task as tt
from custom_components.xtend_tuya.transport.port import CloudResult, DeviceSnapshot
from custom_components.xtend_tuya.transport.settings import HubSettings


def report(state: ts.TimerState, frame: bytes, decode=tt.decode_qt08w) -> None:
    state.apply_report(frame, decode(frame))


def timer(slot, hour, minute, mask=0x7F, enabled=True):
    return tt.Timer(slot, hour, minute, 0, 600, mask, enabled)


# --- TimerState ------------------------------------------------------------------

def test_reports_accumulate_the_sliding_window():
    state = ts.TimerState()
    report(state, tt.encode_qt08w(timer(0, 6, 0)))
    report(state, tt.encode_qt08w(timer(1, 18, 30, enabled=False)))
    assert state.slot(0)["hour"] == 6
    assert state.slot(1)["enabled"] is False  # a disabled timer is kept, greyed (4.4.179)
    assert state.active_count == 1
    report(state, tt.clear_qt08w(0))
    assert state.slot(0) is None and state.active_count == 0


def test_each_payload_applies_once():
    state = ts.TimerState()
    delete = tt.clear_qt08w(2)
    report(state, delete)
    state.restore({"2": timer(2, 5, 0).as_attribute()})
    report(state, delete)  # the DP re-reports its last write; must not wipe the restore
    assert state.slot(2)["hour"] == 5


def test_duplicate_slot_from_the_cloud_is_dropped():
    # 969: the cloud mapped 04:05 and 22:05 onto the same device slot
    state = ts.TimerState()
    report(state, tt.encode_qt08w(timer(0, 4, 5)))
    report(state, tt.encode_qt08w(timer(1, 4, 5)))
    assert state.slot(0) is None and state.slot(1)["hour"] == 4


def test_t3_frames_and_out_of_range_index():
    state = ts.TimerState()
    report(state, tt.encode_t3(timer(3, 7, 7)), tt.decode_t3)
    assert state.slot(3)["minute"] == 7
    frame = bytearray(tt.encode_t3(timer(3, 8, 8)))
    frame[1] = 9  # index outside the 7 slots: ignored
    report(state, bytes(frame), tt.decode_t3)
    assert state.slot(3)["minute"] == 7


def test_restore_and_attribute_round_trip():
    state = ts.TimerState()
    state.restore({"0": timer(0, 6, 0).as_attribute(), "4": None, "x": "junk"})
    assert ts.TimerState().attribute().keys() == state.attribute().keys() == {str(i) for i in range(7)}
    assert state.attribute()["0"]["hour"] == 6 and state.attribute()["4"] is None


# --- resync (was tests/test_resync_guard.py) ---------------------------------------

DEVICE = "bf01"


class FakePort:
    def __init__(self, cloud_keys):
        self.settings = HubSettings()
        self.has_cloud_account = True
        self.cloud_writes_blocked = False
        self._cloud = cloud_keys
        self.dp_writes: list = []

    def device(self, device_id):
        return DeviceSnapshot(DEVICE, "o6dagifntoafakst", "sfkzq", True, MappingProxyType({}))

    async def send_dp(self, device_id, commands):
        self.dp_writes.extend(commands)
        return True

    async def cloud(self, method, path, body=None):
        if self._cloud is None:
            return CloudResult("failed", "1108")
        groups = [{"id": str(i), "timers": [{"time": t, "loops": loops}]} for i, (t, loops) in enumerate(self._cloud)]
        return CloudResult("ok", None, {"success": True, "result": [{"groups": groups}]})


class FakeHass:
    def __init__(self):
        self.data = {}


def key(t: tt.Timer):
    return (f"{t.hour:02d}:{t.minute:02d}", tt.mask_to_loops(t.days_mask))


@pytest.fixture
def valve(monkeypatch):
    def setup(slots: list[tt.Timer], cloud_keys):
        hass, state, published = FakeHass(), ts.TimerState(), []
        state.restore({str(t.slot): t.as_attribute() for t in slots})
        ts.register(hass, DEVICE, ts.LiveTimers(state, lambda: published.append(True)))
        port = FakePort(cloud_keys)
        monkeypatch.setattr(driver, "port_for_device", lambda h, d: port)
        return hass, state, port, published

    return setup


LIVE = [timer(0, 4, 20), timer(1, 6, 30)]


async def test_empty_cloud_registry_clears_nothing(valve):
    # The incident shape (C7): cloud says "no timers" on a valve with two enabled ones.
    hass, state, port, _ = valve(LIVE, set())
    assert await timer_service.resync_from_cloud(hass, {"device_id": DEVICE}) == {
        "success": False, "error": "cloud_registry_empty",
    }
    assert port.dp_writes == [] and state.active_count == 2


async def test_cloud_failure_is_a_failure(valve):
    hass, *_ = valve(LIVE, None)
    assert (await timer_service.resync_from_cloud(hass, {"device_id": DEVICE}))["error"] == "cloud_get_failed"


async def test_live_orphan_is_cleared_and_published(valve):
    # The cloud knows 06:30 but not the 04:20 slot that would water offline.
    hass, state, port, published = valve(LIVE, {key(LIVE[1])})
    result = await timer_service.resync_from_cloud(hass, {"device_id": DEVICE})
    assert result == {"success": True, "checked": 2, "orphans_cleared": 1, "orphans_deferred": 0}
    assert state.slot(0) is None and state.slot(1) is not None
    assert port.dp_writes == [{"code": "time_task", "value": "AAAAAAAAAAAAAAA="}]
    assert published == [True]


async def test_agreement_and_disabled_slots_need_nothing(valve):
    hass, _, port, _ = valve(LIVE, {key(LIVE[0]), key(LIVE[1])})
    assert (await timer_service.resync_from_cloud(hass, {"device_id": DEVICE}))["orphans_cleared"] == 0
    hass, _, port, _ = valve([timer(0, 4, 20, enabled=False)], set())
    result = await timer_service.resync_from_cloud(hass, {"device_id": DEVICE})
    assert result["success"] and result["orphans_cleared"] == 0 and port.dp_writes == []


async def test_no_registered_timers(valve, monkeypatch):
    hass, *_ = valve(LIVE, set())
    hass.data.clear()
    assert (await timer_service.resync_from_cloud(hass, {"device_id": DEVICE}))["error"] == "no_registry_entity"


def test_unregister_only_removes_its_own_entry():
    hass = FakeHass()
    first = ts.LiveTimers(ts.TimerState(), lambda: None)
    undo_first = ts.register(hass, DEVICE, first)
    second = ts.LiveTimers(ts.TimerState(), lambda: None)
    ts.register(hass, DEVICE, second)  # entity re-added before the old one was removed
    undo_first()
    assert ts.live_timers(hass, DEVICE) is second
