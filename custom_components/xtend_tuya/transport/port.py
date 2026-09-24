"""TuyaPort: the interface between the Tuya transport (L1) and device drivers (L2).

L2 asks for a device snapshot, writes DPs and calls the OpenAPI through the
port. The port hides MultiManager, its device map, the account objects and
the event-loop plumbing, and applies the per-hub quota breaker to cloud writes.
"""

from __future__ import annotations

import logging
from collections.abc import Mapping
from dataclasses import dataclass
from types import MappingProxyType
from typing import TYPE_CHECKING, Any, Literal, Protocol

from homeassistant.core import HomeAssistant

from ..multi_manager.shared.threading import XTEventLoopProtector
from ..util import get_all_multi_managers
from .breaker import QUOTA_EXCEEDED_CODE, QuotaBreaker
from .settings import HubSettings

if TYPE_CHECKING:
    from ..multi_manager.multi_manager import MultiManager

_LOGGER = logging.getLogger(__name__)

OPENAPI_ACCOUNT = "tuya_iot"
_WRITE_METHODS = frozenset({"POST", "PUT", "DELETE", "PATCH"})


@dataclass(frozen=True)
class DeviceSnapshot:
    device_id: str
    product_id: str
    category: str
    online: bool
    status: Mapping[str, Any]  # read-only copy, never the live dict


@dataclass(frozen=True)
class CloudResult:
    status: Literal["ok", "skipped", "failed"]
    reason: str | None = None  # "quota_lockout", "quota_exceeded", "no_openapi_account", "exception", Tuya code
    payload: Any = None  # raw OpenAPI response, when there was one

    @property
    def ok(self) -> bool:
        return self.status == "ok"


class TuyaPort(Protocol):
    @property
    def settings(self) -> HubSettings: ...

    @property
    def has_cloud_account(self) -> bool: ...

    @property
    def cloud_writes_blocked(self) -> bool: ...

    def device(self, device_id: str) -> DeviceSnapshot | None: ...

    async def send_dp(self, device_id: str, commands: list[dict[str, Any]]) -> bool: ...

    async def cloud(self, method: str, path: str, body: str | None = None) -> CloudResult: ...

    def clear_breaker(self) -> None: ...


class CloudTuyaPort:
    """TuyaPort for one hub, backed by its MultiManager (cloud + MQ)."""

    def __init__(
        self,
        multi_manager: MultiManager,
        settings: HubSettings | None = None,
        breaker: QuotaBreaker | None = None,
    ) -> None:
        self._mm = multi_manager
        self._settings = settings or HubSettings()
        self._breaker = breaker or QuotaBreaker()

    @property
    def settings(self) -> HubSettings:
        return self._settings

    @property
    def has_cloud_account(self) -> bool:
        return self._mm.get_account_by_name(OPENAPI_ACCOUNT) is not None

    @property
    def cloud_writes_blocked(self) -> bool:
        return self._breaker.is_open

    def clear_breaker(self) -> None:
        self._breaker.clear()

    def device(self, device_id: str) -> DeviceSnapshot | None:
        device = self._mm.device_map.get(device_id)
        if device is None:
            return None
        return DeviceSnapshot(
            device_id=device_id,
            product_id=device.product_id,
            category=device.category,
            online=device.online,
            status=MappingProxyType(dict(device.status)),
        )

    async def send_dp(self, device_id: str, commands: list[dict[str, Any]]) -> bool:
        try:
            ok = await XTEventLoopProtector.execute_out_of_event_loop_and_return(
                self._mm.send_commands, device_id, commands
            )
        except Exception:
            _LOGGER.exception("DP write failed for %s: %s", device_id, commands)
            return False
        if not ok:
            _LOGGER.warning("DP write rejected for %s: %s", device_id, commands)
        return bool(ok)

    async def cloud(self, method: str, path: str, body: str | None = None) -> CloudResult:
        account = self._mm.get_account_by_name(OPENAPI_ACCOUNT)
        if account is None:
            return CloudResult("failed", "no_openapi_account")
        # Reads never count against the controllable quota, so only writes stop.
        if method.upper() in _WRITE_METHODS and self._breaker.is_open:
            return CloudResult("skipped", "quota_lockout")
        try:
            resp = await XTEventLoopProtector.execute_out_of_event_loop_and_return(
                account.call_api, method, path, body
            )
        except Exception:
            _LOGGER.warning("Cloud %s %s raised (non-fatal)", method, path, exc_info=True)
            return CloudResult("failed", "exception")
        if isinstance(resp, dict) and resp.get("code") == QUOTA_EXCEEDED_CODE:
            self._breaker.trip()
            _LOGGER.warning("Tuya quota error %s on %s %s: cloud writes paused for this hub", QUOTA_EXCEEDED_CODE, method, path)
            return CloudResult("failed", "quota_exceeded", resp)
        if isinstance(resp, dict) and resp.get("success"):
            return CloudResult("ok", None, resp)
        code = resp.get("code") if isinstance(resp, dict) else None
        return CloudResult("failed", str(code) if code is not None else "no_success", resp)


def port_for_device(hass: HomeAssistant, device_id: str) -> TuyaPort | None:
    """The port of the first hub that knows the device (same order as before)."""
    for multi_manager in get_all_multi_managers(hass):
        if multi_manager.device_map.get(device_id):
            return multi_manager.port
    return None


def all_ports(hass: HomeAssistant) -> list[TuyaPort]:
    return [multi_manager.port for multi_manager in get_all_multi_managers(hass)]
