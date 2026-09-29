"""Daily read of each valve's cloud timer registry, as an overlay on its slots.

HA plans from the device's timer slots, but the DP is a sliding window: a
timer deleted or switched off in SmartLife may never reach HA (703 still
planned daily 14:30 after its app timer was deleted; 915 off in the app, on
in HA), and an app timer HA never saw a report for is not planned at all
(824 13:00). Once a day each valve's `/timers` GET labels the slots
(TimerState.apply_cloud); the calendar reads the labels. Nothing is written
to the device or the cloud.

Cost: one GET per valve per day from the 26k/month API pool (reads never
count against the 10-controllable cap). A valve read less than 20 h ago
(resync, a restart) is skipped; GETs are ~2 s apart so a sweep never bursts.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_call_later, async_track_time_interval

from ...const import DOMAIN
from ...transport.port import TuyaPort, port_for_device
from . import timer_state

_LOGGER = logging.getLogger(__name__)

FIRST_SWEEP_DELAY = timedelta(minutes=15)  # after entry load: entities restored, boot quiet
SWEEP_INTERVAL = timedelta(hours=24)
RECHECK_AFTER = timedelta(hours=20)
GET_SPACING_S = 2.0
GET_TIMEOUT_S = 30.0

_SCHEDULED_KEY = f"{DOMAIN}_timer_reconcile_scheduled"


async def fetch_cloud_timers(port: TuyaPort, device_id: str) -> list[dict[str, Any]] | None:
    """Every timer in the device's cloud registry, flattened; None if the read failed.

    None is never "no timers": a non-success (1106, quota, ...), an
    exception or a timeout must not look like an empty registry."""
    try:
        async with asyncio.timeout(GET_TIMEOUT_S):
            listing = await port.cloud("GET", f"/v1.0/devices/{device_id}/timers")
    except TimeoutError:
        _LOGGER.warning("cloud timer GET timed out for %s", device_id)
        return None
    if not listing.ok or not isinstance(listing.payload, dict):
        _LOGGER.warning("cloud timer GET non-success for %s: %s", device_id, listing.reason)
        return None
    return [
        timer
        for category in listing.payload.get("result") or []
        for group in category.get("groups") or []
        for timer in group.get("timers") or []
    ]


def _due(state: timer_state.TimerState, now: datetime) -> bool:
    try:
        checked = datetime.fromisoformat(str((state.cloud or {}).get("checked_at")))
    except ValueError:
        return True
    return now - checked >= RECHECK_AFTER


async def async_sweep(hass: HomeAssistant, port: TuyaPort) -> int:
    """Read the cloud timers of this hub's valves; returns the number of GETs."""
    if not port.has_cloud_account:
        return 0
    gets = 0
    registry: dict[str, timer_state.LiveTimers] = hass.data.get(timer_state.DATA_KEY, {})
    for device_id in list(registry):
        live = registry.get(device_id)
        # A valve both hubs know is read once, by the hub that owns it.
        if live is None or port_for_device(hass, device_id) is not port:
            continue
        if not _due(live.state, datetime.now(UTC)):
            continue
        if gets:
            await asyncio.sleep(GET_SPACING_S)
        gets += 1
        timers = await fetch_cloud_timers(port, device_id)
        if timers is not None and live.state.apply_cloud(timers, port.settings.cloud_timer_mirror):
            live.publish()
    _LOGGER.info("valve cloud timer sweep: %d GETs", gets)
    return gets


@callback
def async_ensure_scheduled(hass: HomeAssistant, entry: ConfigEntry, port: TuyaPort) -> None:
    """Put this hub on the daily sweep (once per entry load, bound to the entry)."""
    scheduled: set[str] = hass.data.setdefault(_SCHEDULED_KEY, set())
    key = entry.entry_id
    if key in scheduled:
        return
    scheduled.add(key)
    entry.async_on_unload(lambda: scheduled.discard(key))
    running: list[asyncio.Task] = []

    @callback
    def _start(_now: Any) -> None:
        if running and not running[0].done():
            return
        running[:] = [
            entry.async_create_background_task(
                hass, async_sweep(hass, port), f"{DOMAIN} valve cloud timer sweep"
            )
        ]

    entry.async_on_unload(async_call_later(hass, FIRST_SWEEP_DELAY, _start))
    entry.async_on_unload(async_track_time_interval(hass, _start, SWEEP_INTERVAL))
