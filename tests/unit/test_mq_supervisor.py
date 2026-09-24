"""IOT MQ supervisor (audit C5), against the real
XTTuyaIOTDeviceManagerInterface._register_mq_supervisor.

lib/tuya_iot/openmq.py stops its own thread after 10 consecutive failures and
nothing restarted it: a 10-minute cloud outage froze the hub's IOT stream
until an entry reload, with DP counts and `online` unchanged.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from custom_components.xtend_tuya.multi_manager.managers.tuya_iot import init as iot_init
from custom_components.xtend_tuya.multi_manager.shared.threading import XTEventLoopProtector


class FakeMQ:
    def __init__(self, alive=True):
        self.alive = alive

    def is_alive(self):
        return self.alive


class Harness:
    """Stub interface `self`; refresh_mq swaps in a live MQ like the real one."""

    def __init__(self, mq):
        self.iot_account = SimpleNamespace(device_manager=SimpleNamespace(mq=mq))
        self.restarts = 0

    def refresh_mq(self):
        self.restarts += 1
        self.iot_account.device_manager.mq = FakeMQ(alive=True)


@pytest.fixture
def supervise(monkeypatch):
    # Off the loop thread: execute_out_of_event_loop runs the callback inline.
    monkeypatch.setattr(XTEventLoopProtector, "hass", SimpleNamespace(loop_thread_id=-1))
    logs: list = []
    monkeypatch.setattr(iot_init, "LOGGER", SimpleNamespace(error=lambda *a, **k: logs.append(a)))

    def _make(mq):
        ticks: list = []
        monkeypatch.setattr(
            iot_init, "async_track_time_interval", lambda hass, cb, interval: ticks.append(cb)
        )
        iface = Harness(mq)
        entry = SimpleNamespace(title="hub", async_on_unload=lambda unsub: None)
        iot_init.XTTuyaIOTDeviceManagerInterface._register_mq_supervisor(iface, None, entry)
        (check,) = ticks
        return iface, lambda: check(None), logs

    return _make


def test_healthy_mq_is_left_alone(supervise):
    iface, tick, logs = supervise(FakeMQ(alive=True))
    for _ in range(5):
        tick()
    assert (iface.restarts, len(logs)) == (0, 0)


def test_dead_mq_is_restarted_once_and_logged_once(supervise):
    iface, tick, logs = supervise(FakeMQ(alive=False))
    tick()
    assert (iface.restarts, len(logs)) == (1, 1)
    tick()  # the replacement is alive: quiet again
    assert (iface.restarts, len(logs)) == (1, 1)


def test_repeatedly_dying_mq_restarts_every_tick_but_logs_once(supervise):
    iface, tick, logs = supervise(FakeMQ(alive=False))
    for _ in range(3):
        iface.iot_account.device_manager.mq.alive = False
        tick()
    assert (iface.restarts, len(logs)) == (3, 1)


def test_missing_mq_counts_as_dead(supervise):
    iface, tick, _ = supervise(None)
    tick()
    assert iface.restarts == 1
