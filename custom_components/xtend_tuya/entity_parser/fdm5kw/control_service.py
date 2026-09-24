"""Single-watering ("water now") services for the sfkzq valves.

QT-08W: `one_control`; QT-08W-T3: `cyc_control_0`. Payload layouts and the
captures behind them are in codecs/single_run.py. The device runs the cycle
and closes itself after `value` seconds, independent of HA and the cloud.
"""

from __future__ import annotations

import base64
import logging

from ...transport.port import TuyaPort, port_for_device
from .codecs.single_run import (
    CYC_CONTROL_CODE,
    FLAG_IDLE,
    FLAG_START,
    LEAD_SINGLE_RUN,
    LEAD_VOLUME,
    ONE_CONTROL_CODE,
    encode_cyc_control,
    encode_one_control,
)

_LOGGER = logging.getLogger(__name__)

SWITCH_CODE = "switch"


def _is_t3(port: TuyaPort, device_id: str) -> bool:
    """T3 valve = carries the `cyc_control_0` DP (no `one_control`)."""
    device = port.device(device_id)
    return device is not None and device.status.get(CYC_CONTROL_CODE) is not None


def _b64(frame: bytes) -> str:
    return base64.b64encode(frame).decode("ascii")


async def _send_commands(port: TuyaPort, device_id: str, commands: list[dict]) -> bool:
    return await port.send_dp(device_id, commands)


async def _write_one_control(
    port: TuyaPort, device_id: str, b64_value: str
) -> bool:
    return await _send_commands(
        port, device_id, [{"code": ONE_CONTROL_CODE, "value": b64_value}]
    )


async def start_watering(hass, data: dict) -> bool:
    """Start a single watering cycle by duration (sec) or volume (L).

    Duration mode sends the exact ``one_control`` payload that SmartLife's own
    single-watering button sends (lead byte 0, value = seconds, flag = 1) — see
    the constant block above for the captured packet. The device runs the cycle
    and auto-closes in hardware after ``value`` seconds, independent of HA/cloud.
    This replaces the previous lead-byte-1 ("duration mode") payload, which the
    firmware did not recognise — the cause of Simon's "mostly doesn't react / if
    it opens it never stops" report.

    Volume mode is still best-effort (lead byte unverified, flow-meter only).
    """
    device_id: str = data["device_id"]
    mode: str = data.get("mode", "duration")
    value: int = int(data["value"])
    if mode in ("idle", "stop"):
        raise ValueError("Use stop_watering for mode=idle/stop")
    if mode not in ("duration", "volume"):
        raise ValueError(f"mode must be 'duration' or 'volume', got {mode!r}")

    port = port_for_device(hass, device_id)
    if port is None:
        _LOGGER.error("No hub found for device %s", device_id)
        return False

    # T3: cyc_control_0 duration run (no one_control DP). Volume-mode cyclic run
    # not captured — duration only for now.
    if _is_t3(port, device_id):
        if mode == "volume":
            _LOGGER.warning(
                "start_watering: T3 %s volume mode unverified, running as duration",
                device_id,
            )
        b64 = _b64(encode_cyc_control(value, FLAG_START))
        return await _send_commands(
            port, device_id, [{"code": CYC_CONTROL_CODE, "value": b64}]
        )

    lead = LEAD_SINGLE_RUN if mode == "duration" else LEAD_VOLUME
    b64 = _b64(encode_one_control(lead, value, FLAG_START))
    return await _write_one_control(port, device_id, b64)


async def stop_watering(hass, data: dict) -> bool:
    """Stop an active watering cycle.

    Writes the SmartLife idle ``one_control`` frame (lead 0, value 0, flag 0) and
    also drops the ``switch`` DP as a belt-and-braces close. Either being a no-op
    on a given firmware is harmless.
    """
    device_id: str = data["device_id"]

    port = port_for_device(hass, device_id)
    if port is None:
        _LOGGER.error("No hub found for device %s", device_id)
        return False

    # T3: cyc_control_0 with flag byte[9]=0 stops the run.
    if _is_t3(port, device_id):
        return await _send_commands(
            port,
            device_id,
            [{"code": CYC_CONTROL_CODE, "value": _b64(encode_cyc_control(0, FLAG_IDLE))}],
        )

    ok = await _write_one_control(
        port,
        device_id,
        _b64(encode_one_control(LEAD_SINGLE_RUN, 0, FLAG_IDLE)),
    )
    await _send_commands(port, device_id, [{"code": SWITCH_CODE, "value": False}])
    return ok
