"""TuyaPort + per-hub quota breaker (docs/architecture.md §3), against the real code.

The hub (MultiManager) and its OpenAPI account are small fakes; everything
under test is transport/port.py and transport/breaker.py as shipped.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from custom_components.xtend_tuya.multi_manager.shared.threading import XTEventLoopProtector
from custom_components.xtend_tuya.transport import port as port_module
from custom_components.xtend_tuya.transport.breaker import LOCKOUT_SECONDS, QUOTA_EXCEEDED_CODE, QuotaBreaker
from custom_components.xtend_tuya.transport.port import CloudTuyaPort, port_for_device

OK = {"success": True, "result": []}
QUOTA = {"success": False, "code": QUOTA_EXCEEDED_CODE, "msg": "exceed control limit"}


class FakeAccount:
    def __init__(self, *responses):
        self.responses = list(responses)
        self.calls: list[tuple[str, str]] = []

    def call_api(self, method, path, body):
        self.calls.append((method, path))
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


class FakeHub:
    def __init__(self, account=None, devices=None, send_ok=True):
        self.accounts = {"tuya_iot": account} if account else {}
        self.device_map = devices or {}
        self.sent: list = []
        self.send_ok = send_ok
        self.port = CloudTuyaPort(self)

    def get_account_by_name(self, name):
        return self.accounts.get(name)

    def send_commands(self, device_id, commands):
        self.sent.append((device_id, commands))
        return self.send_ok


@pytest.fixture(autouse=True)
def _no_hass_executor(monkeypatch):
    """Run port calls inline. The HA harness tests leave the process-global
    XTEventLoopProtector.hass pointing at a stopped instance."""
    monkeypatch.setattr(XTEventLoopProtector, "hass", None)


class Clock:
    now = 1000.0

    def __call__(self):
        return self.now


def test_breaker_trips_for_six_hours_and_clears():
    clock = Clock()
    breaker = QuotaBreaker(clock)
    assert not breaker.is_open
    breaker.trip()
    clock.now += LOCKOUT_SECONDS - 1
    assert breaker.is_open
    clock.now += 2
    assert not breaker.is_open
    breaker.trip()
    breaker.clear()
    assert not breaker.is_open


async def test_quota_error_pauses_writes_on_that_hub_only():
    solar = FakeHub(FakeAccount(QUOTA, OK))
    simon = FakeHub(FakeAccount(OK))

    first = await solar.port.cloud("POST", "/v1.0/devices/a/timers", "{}")
    assert (first.status, first.reason) == ("failed", "quota_exceeded")
    assert solar.port.cloud_writes_blocked
    # Writes on the tripped hub stop without calling Tuya; reads still go out.
    blocked = await solar.port.cloud("DELETE", "/v1.0/devices/a/timers?group_id=1")
    assert (blocked.status, blocked.reason) == ("skipped", "quota_lockout")
    assert (await solar.port.cloud("GET", "/v1.0/devices/a/timers")).ok
    assert [m for m, _ in solar.accounts["tuya_iot"].calls] == ["POST", "GET"]
    # The other hub has its own quota: unaffected (was a module-global lockout).
    assert not simon.port.cloud_writes_blocked
    assert (await simon.port.cloud("POST", "/v1.0/devices/b/timers", "{}")).ok

    solar.port.clear_breaker()
    assert not solar.port.cloud_writes_blocked


@pytest.mark.parametrize(
    ("response", "expected"),
    [
        (OK, ("ok", None)),
        ({"success": False, "code": 1108}, ("failed", "1108")),
        (None, ("failed", "no_success")),
        (RuntimeError("boom"), ("failed", "exception")),
    ],
)
async def test_cloud_result_classification(response, expected):
    hub = FakeHub(FakeAccount(response))
    result = await hub.port.cloud("GET", "/v1.0/devices/a/timers")
    assert (result.status, result.reason) == expected


async def test_no_openapi_account():
    hub = FakeHub(account=None)
    assert not hub.port.has_cloud_account
    assert (await hub.port.cloud("GET", "/x")).reason == "no_openapi_account"


async def test_send_dp_reports_rejection_and_errors():
    hub = FakeHub(send_ok=True)
    assert await hub.port.send_dp("a", [{"code": "switch", "value": True}])
    assert hub.sent == [("a", [{"code": "switch", "value": True}])]
    assert not await FakeHub(send_ok=False).port.send_dp("a", [])

    broken = FakeHub()
    broken.send_commands = lambda *_: (_ for _ in ()).throw(RuntimeError("mq down"))
    assert not await broken.port.send_dp("a", [])


def test_device_snapshot_is_a_read_only_copy():
    live = SimpleNamespace(product_id="rjnqkjk1pct15ku2", category="sfkzq", online=True, status={"time_task_0": "AA"})
    hub = FakeHub(devices={"a": live})
    snapshot = hub.port.device("a")
    live.status["time_task_0"] = "changed"
    assert snapshot.status["time_task_0"] == "AA"
    with pytest.raises(TypeError):
        snapshot.status["x"] = 1  # type: ignore[index]
    assert hub.port.device("missing") is None


def test_port_for_device_picks_the_first_hub_that_knows_it(monkeypatch):
    device = SimpleNamespace(product_id="p", category="sfkzq", online=True, status={})
    first, second = FakeHub(devices={"a": device}), FakeHub(devices={"a": device, "b": device})
    monkeypatch.setattr(port_module, "get_all_multi_managers", lambda hass: [first, second])
    assert port_for_device(None, "a") is first.port
    assert port_for_device(None, "b") is second.port
    assert port_for_device(None, "c") is None
