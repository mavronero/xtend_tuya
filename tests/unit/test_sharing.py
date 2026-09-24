"""Sharing transport guards, against the real tuya_sharing modules.

- is_retryable_error: Tuya packs unrelated failures into code -9999999. The
  transient ones are retried; "sign invalid" never is. Retrying it turned an
  expired session into an entry stuck in SETUP_IN_PROGRESS until HA cancelled
  it (farm install, 2026-08-10).
- XTSharingMQ must not re-override the SDK's reconnect design (audit C1): the
  old _start/_on_disconnect overrides made three reconnectors race, Tuya
  evicted the duplicate client_id, and reports stopped while `online` stayed
  true. An upstream merge is the likely way back in, hence the guard.
"""

from __future__ import annotations

import pytest

from custom_components.xtend_tuya.multi_manager.managers.tuya_sharing.xt_tuya_sharing_api import (
    is_retryable_error,
)
from custom_components.xtend_tuya.multi_manager.managers.tuya_sharing.xt_tuya_sharing_mq import (
    XTSharingMQ,
)

# Response bodies copied from home-assistant.log, 2026-08-10.
SIGN_INVALID = {"code": "-9999999", "msg": "sign invalid", "t": 1786336835051, "success": False}
SERVER_ERROR = {
    "code": "-9999999",
    "msg": "network error:(SYSTEM_ERROR) Server Error",
    "t": 1786336801900,
    "success": False,
}


@pytest.mark.parametrize(
    ("response", "retry"),
    [
        (SIGN_INVALID, False),
        ({"code": "-9999999", "msg": "Sign Invalid"}, False),  # case-insensitive
        (SERVER_ERROR, True),
        ({"code": "-9999999"}, True),  # bare code keeps the old behaviour
        ({"code": "1010", "msg": "token invalid"}, False),  # only -9999999 is retried
        ({}, False),
    ],
)
def test_is_retryable_error(response, retry):
    assert is_retryable_error(response) is retry


@pytest.mark.parametrize("banned", ["_start", "_on_disconnect"])
def test_sharing_mq_keeps_the_sdk_reconnect(banned):
    """C1: overriding these revives the reconnect race."""
    assert banned not in vars(XTSharingMQ)


@pytest.mark.parametrize(
    "kept",
    ["_on_connect", "_on_message", "subscribe_to_mqtt_topics", "subscribe_device",
     "un_subscribe_device", "_get_mqtt_config"],
)
def test_sharing_mq_keeps_the_overrides_it_needs(kept):
    assert kept in vars(XTSharingMQ)
