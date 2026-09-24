"""Command side of the valve driver: target resolution and the command result.

The timer and single-run services (timer_service.py, control_service.py) find
their device through `target()` and report through `CommandResult`. Expected
failures (unknown device, unsupported product, quota lockout, no OpenAPI
account) are results, not exceptions (docs/architecture.md §1, principle 4).
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Literal

from homeassistant.core import HomeAssistant

from ...transport.port import TuyaPort, port_for_device
from .profiles import ValveProfile, profile_for


@dataclass(frozen=True)
class CommandResult:
    device_id: str
    dp: Literal["ok", "failed", "unsupported"]  # the device-side effect
    cloud: Literal["ok", "skipped", "failed", "n/a"] = "n/a"  # SmartLife visibility
    reason: str | None = None

    @property
    def ok(self) -> bool:
        return self.dp == "ok"

    def as_response(self) -> dict[str, Any]:
        """Service / HTTP response. `success` is the pre-6b contract, the rest is additive."""
        return {"success": self.ok, **asdict(self)}


@dataclass(frozen=True)
class Target:
    port: TuyaPort
    profile: ValveProfile


def target(hass: HomeAssistant, device_id: str) -> Target | CommandResult:
    """The device's hub port and profile, or the failed result explaining why not."""
    port = port_for_device(hass, device_id)
    if port is None:
        return CommandResult(device_id, "failed", reason="unknown_device")
    device = port.device(device_id)
    profile = profile_for(device.product_id, device.status) if device else None
    if profile is None:
        return CommandResult(device_id, "unsupported", reason="unknown_product")
    return Target(port, profile)
