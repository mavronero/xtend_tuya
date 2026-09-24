"""Smart-home device list fallback, against the real
XTIOTDeviceManager._fetch_smart_home_device_list.

/v1.0/users/<uid>/devices started answering 1106 "permission deny" fleet-wide
in Aug 2026, silently emptying the OpenAPI device map and dropping every valve
to the 2-DP sharing subset. The fallback pages
/v1.0/iot-01/associated-users/devices by last_row_key.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from homeassistant.exceptions import ConfigEntryNotReady

from custom_components.xtend_tuya.multi_manager.managers.tuya_iot.xt_tuya_iot_manager import (
    XTIOTDeviceManager,
)

PERMISSION_DENY = {"code": 1106, "msg": "permission deny", "success": False}
FALLBACK = "/v1.0/iot-01/associated-users/devices"


class StubApi:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls: list = []
        self.token_info = SimpleNamespace(uid="uid")

    def get(self, path, params=None):
        self.calls.append((path, params))
        return self.responses.pop(0)


def page(ids, has_more, last_row_key=""):
    return {
        "success": True,
        "result": {"devices": [{"id": i} for i in ids], "has_more": has_more,
                   "last_row_key": last_row_key, "total": 105},
    }


def fetch(api):
    return XTIOTDeviceManager._fetch_smart_home_device_list(SimpleNamespace(api=api))


def test_old_endpoint_still_works():
    api = StubApi([{"success": True, "result": [{"id": "a"}]}])
    assert fetch(api) == [{"id": "a"}]
    assert api.calls == [("/v1.0/users/uid/devices", None)]


def test_fallback_pages_until_done():
    api = StubApi([PERMISSION_DENY, page(["a", "b"], True, "K1"), page(["c"], False)])
    assert [d["id"] for d in fetch(api)] == ["a", "b", "c"]
    assert api.calls[1:] == [(FALLBACK, {"size": 100}), (FALLBACK, {"size": 100, "last_row_key": "K1"})]


def test_fallback_page_failure_is_a_failed_fetch():
    """C17: a failed page 2 used to return page 1 only, silently halving the
    hub; the dropped devices then ran on the 2-DP sharing descriptors."""
    api = StubApi([PERMISSION_DENY, page(["a"], True, "K1"), {"code": 1004, "msg": "sign invalid", "success": False}])
    with pytest.raises(ConfigEntryNotReady):
        fetch(api)


def test_missing_last_row_key_stops_the_loop():
    api = StubApi([PERMISSION_DENY, page(["a"], True, "")])
    assert [d["id"] for d in fetch(api)] == ["a"]
