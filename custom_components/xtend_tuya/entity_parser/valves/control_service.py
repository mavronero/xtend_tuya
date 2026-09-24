"""Single-watering ("water now") services for the sfkzq valves.

The profile supplies the DP and payloads (QT-08W: `one_control`, QT-08W-T3:
`cyc_control_0`; layouts and captures in codecs/single_run.py). The device
runs the cycle and closes itself after `value` seconds, independent of HA
and the cloud.
"""

from __future__ import annotations

import base64
import logging

from .driver import CommandResult, target

_LOGGER = logging.getLogger(__name__)

SWITCH_CODE = "switch"


def _b64(frame: bytes) -> str:
    return base64.b64encode(frame).decode("ascii")


async def start_watering(hass, data: dict) -> CommandResult:
    """Start a single watering by duration (s) or volume (L)."""
    device_id: str = data["device_id"]
    mode: str = data.get("mode", "duration")
    value: int = int(data["value"])
    if mode in ("idle", "stop"):
        raise ValueError("Use stop_watering for mode=idle/stop")
    if mode not in ("duration", "volume"):
        raise ValueError(f"mode must be 'duration' or 'volume', got {mode!r}")

    found = target(hass, device_id)
    if isinstance(found, CommandResult):
        _LOGGER.error("start_watering: %s for device %s", found.reason, device_id)
        return found
    codec = found.profile.single_run
    if codec is None:
        return CommandResult(device_id, "unsupported", reason="no_single_run")

    reason = None
    if mode not in found.profile.capabilities.single_run:
        _LOGGER.warning(
            "start_watering: %s mode unverified on %s (%s), running as duration",
            mode, device_id, found.profile.name,
        )
        reason = f"{mode}_ran_as_duration"
    ok = await found.port.send_dp(device_id, [{"code": codec.code, "value": _b64(codec.start(mode, value))}])
    return CommandResult(device_id, "ok" if ok else "failed", reason=reason)


async def stop_watering(hass, data: dict) -> CommandResult:
    """Stop a running single watering with the profile's idle frame."""
    device_id: str = data["device_id"]

    found = target(hass, device_id)
    if isinstance(found, CommandResult):
        _LOGGER.error("stop_watering: %s for device %s", found.reason, device_id)
        return found
    codec = found.profile.single_run
    if codec is None:
        return CommandResult(device_id, "unsupported", reason="no_single_run")

    ok = await found.port.send_dp(device_id, [{"code": codec.code, "value": _b64(codec.stop)}])
    if codec.also_close_switch:
        # Harmless when the stop frame already closed the valve.
        await found.port.send_dp(device_id, [{"code": SWITCH_CODE, "value": False}])
    return CommandResult(device_id, "ok" if ok else "failed")
