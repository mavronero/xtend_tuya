"""OpenAPI hang guards (audit C4), against the real lib/tuya_iot/openapi.py.

requests has no default timeout, so a hung TCP connection parked an HA
executor thread forever; connect() set token_info.reconnecting without a
try/finally, so one raise (a non-JSON proxy error page) left the flag True
and every later refresh spun in reconnect()'s busy-wait for good.
"""

from __future__ import annotations

import pytest

from custom_components.xtend_tuya.lib.tuya_iot import openapi
from custom_components.xtend_tuya.lib.tuya_iot.openapi import TuyaOpenAPI, TuyaTokenInfo


class FakeResponse:
    def __init__(self, body):
        self.body = body

    def json(self):
        if isinstance(self.body, Exception):
            raise self.body
        return self.body


class FakeSession:
    def __init__(self, body):
        self.body = body
        self.kwargs: list[dict] = []

    def request(self, method, url, **kwargs):
        self.kwargs.append(kwargs)
        return FakeResponse(self.body)


def _api(body):
    api = TuyaOpenAPI("https://openapi.invalid", "id", "secret", TuyaTokenInfo())
    api.session = FakeSession(body)
    return api


def test_every_request_carries_a_timeout():
    api = _api({"success": True, "result": {}})
    api.get("/v1.0/devices/x")
    api.post("/v1.0/devices/x/commands", {"commands": []})
    assert [k.get("timeout") for k in api.session.kwargs] == [openapi.REQUEST_TIMEOUT] * 2
    assert openapi.REQUEST_TIMEOUT == 30


def test_connect_clears_reconnecting_when_the_request_raises():
    api = _api(ValueError("<html>502 Bad Gateway</html>"))
    with pytest.raises(Exception):
        api.connect("user", "pass", "49", "app")
    assert api.token_info.is_reconnecting() is False


@pytest.fixture
def sleeps(monkeypatch):
    calls: list[float] = []

    def fake_sleep(seconds):
        calls.append(seconds)
        if len(calls) > 10_000:  # an unbounded wait fails instead of hanging
            raise AssertionError("reconnect() busy-wait is unbounded")

    monkeypatch.setattr(openapi.time, "sleep", fake_sleep)
    return calls


def test_reconnect_wait_is_bounded_when_the_flag_is_never_cleared(sleeps):
    api = _api({"success": False})
    api.token_info.set_reconnecting(True)
    assert api.reconnect() is False
    assert len(sleeps) * 0.2 >= openapi.RECONNECT_WAIT_TIMEOUT
    assert len(sleeps) == 300


def test_reconnect_wakes_when_the_other_thread_finishes(sleeps, monkeypatch):
    api = _api({"success": False})
    api.token_info.set_reconnecting(True)
    real_sleep = openapi.time.sleep

    def finish_after_five(seconds):
        real_sleep(seconds)
        if len(sleeps) == 5:
            api.token_info.set_reconnecting(False)

    monkeypatch.setattr(openapi.time, "sleep", finish_after_five)
    api.reconnect()
    assert len(sleeps) == 5


def test_reconnect_does_not_wait_when_nobody_is_reconnecting(sleeps):
    _api({"success": False}).reconnect()
    assert sleeps == []
