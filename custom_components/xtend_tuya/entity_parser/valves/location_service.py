"""Build + cache a device_id -> (home, room) map for fdm5kw valves.

A valve's home and room are not in any DP, nor in the SmartLife sharing
device payload, nor in the OpenAPI thing-model (`bind_space_id` there points
at the home, and the space tree is empty for these accounts). The room
grouping lives only in the Tuya OpenAPI *Home Management* API:

    /v1.0/users/{uid}/homes              -> home id + name
    /v1.0/homes/{home}/rooms             -> room id + name
    /v1.0/homes/{home}/rooms/{rid}/devices -> which devices are in the room

We fetch it per hub through that hub's TuyaPort, cache the result
process-wide, and refresh on a slow timer. These are read-only GETs
that do NOT count against the 10-controllable-devices/month quota (only
commands do), and the data is near-static, so the cost is negligible.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import timedelta
from typing import Any

from aiohttp import web

from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.http import HomeAssistantView

from homeassistant.config_entries import ConfigEntry

from ...const import DOMAIN
from ...transport.port import CloudResult, TuyaPort

_LOGGER = logging.getLogger(__name__)

# device_id -> {"home": str, "room": str}
DATA_KEY = f"{DOMAIN}_valve_locations"


@dataclass
class _Locations:
    """Per-HA-instance state: the home/room map and the entries on a refresh timer."""

    by_device: dict[str, dict[str, str]] = field(default_factory=dict)
    # Keyed by entry_id, not id(multi_manager): CPython reuses ids after GC,
    # so a new manager could collide with a dead one's id and never build its
    # map (audit C16). Discarded on unload so a reload re-arms.
    scheduled: set[str] = field(default_factory=set)


def _state(hass: HomeAssistant) -> _Locations:
    return hass.data.setdefault(DATA_KEY, _Locations())


# Dispatched after the map changes, so the registry sensors re-publish
# their home/room attributes without this module importing the sensor module.
SIGNAL_LOCATIONS_UPDATED = "xtend_tuya_valve_locations_updated"

REFRESH_INTERVAL = timedelta(hours=12)

_VIEW_REGISTERED_KEY = f"{DOMAIN}_valve_locations_view"


async def _build_map(port: TuyaPort) -> dict[str, dict[str, str]]:
    """Walk homes -> rooms -> room devices of one hub (read-only GETs)."""
    result: dict[str, dict[str, str]] = {}
    uid = port.openapi_uid
    if not uid:
        return result
    homes = await port.cloud("GET", f"/v1.0/users/{uid}/homes")
    if not homes.ok:
        return result
    for home in homes.payload.get("result") or []:
        home_id = home.get("home_id") or home.get("homeId")
        home_name = home.get("name") or ""
        if home_id is None:
            continue
        rooms = _payload(await port.cloud("GET", f"/v1.0/homes/{home_id}/rooms"))
        rooms_result = rooms.get("result") or {}
        # /homes/{id}/rooms returns either {"rooms": [...]} or a bare list,
        # depending on DC/account; tolerate both.
        room_list = rooms_result if isinstance(rooms_result, list) else rooms_result.get("rooms") or []
        for room in room_list:
            room_id = room.get("room_id")
            room_name = room.get("name") or ""
            if room_id is None:
                continue
            devices = _payload(await port.cloud("GET", f"/v1.0/homes/{home_id}/rooms/{room_id}/devices"))
            for dev in devices.get("result") or []:
                device_id = dev.get("device_id") or dev.get("id") or dev.get("dev_id")
                if device_id:
                    result[device_id] = {"home": home_name, "room": room_name}
    return result


def _payload(result: CloudResult) -> dict[str, Any]:
    return result.payload if isinstance(result.payload, dict) else {}


async def async_refresh(hass: HomeAssistant, port: TuyaPort) -> None:
    """Refresh the home/room map for one hub. Safe to call repeatedly."""
    if not port.has_cloud_account:
        return
    try:
        mapping = await _build_map(port)
    except Exception:  # noqa: BLE001 - never let a location fetch break setup
        _LOGGER.debug("fdm5kw: valve home/room refresh failed", exc_info=True)
        return
    if mapping:
        _state(hass).by_device.update(mapping)
        _LOGGER.info("fdm5kw: refreshed valve home/room for %d devices", len(mapping))
        async_dispatcher_send(hass, SIGNAL_LOCATIONS_UPDATED)


async def async_ensure_scheduled(hass: HomeAssistant, entry: ConfigEntry, port: TuyaPort) -> None:
    """Fill the map now and put this hub on a slow refresh timer (once per entry)."""
    scheduled = _state(hass).scheduled
    key = entry.entry_id
    if key in scheduled:
        return
    scheduled.add(key)
    entry.async_on_unload(lambda: scheduled.discard(key))

    # One view registration across all hubs/entries (same pattern as the
    # calendar ICS view — the view reads the process-wide map at request time).
    if not hass.data.get(_VIEW_REGISTERED_KEY):
        hass.http.register_view(XTValveLocationsView())
        hass.data[_VIEW_REGISTERED_KEY] = True

    await async_refresh(hass, port)

    async def _tick(_now: Any) -> None:
        await async_refresh(hass, port)

    # Bound to the entry: an unregistered 12 h timer kept a dead manager and
    # its API client alive per reload, so the homes/rooms walk multiplied with
    # the reload count.
    entry.async_on_unload(async_track_time_interval(hass, _tick, REFRESH_INTERVAL))


def get_location(hass: HomeAssistant, device_id: str) -> dict[str, str] | None:
    """Return {'home', 'room'} for a device, or None if unknown."""
    return _state(hass).by_device.get(device_id)


class XTValveLocationsView(HomeAssistantView):
    """Serve the home/room map so the dashboard can group OFFLINE valves too.

    An unavailable registry sensor loses its valve_home/valve_room state
    attributes, so any grouping built from live states shows offline valves
    as "Unassigned" even though the cloud walk knows their room. This view
    is backed by the cloud data directly and is keyed by BOTH the Tuya
    device id and the HA device-registry id (the frontend only has the HA
    id for a valve whose registry sensor is unavailable).
    """

    url = f"/api/{DOMAIN}/valve_locations"
    name = f"api:{DOMAIN}:valve_locations"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        by_device = _state(hass).by_device
        payload: dict[str, dict[str, str]] = dict(by_device)
        dev_reg = dr.async_get(hass)
        for tuya_id, loc in by_device.items():
            device = dev_reg.async_get_device(identifiers={(DOMAIN, tuya_id)})
            if device is not None:
                payload[device.id] = loc
        return self.json({"locations": payload})
