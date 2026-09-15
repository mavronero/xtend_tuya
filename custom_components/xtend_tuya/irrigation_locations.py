"""HA glue for irrigation locations (see location_model.py for the rules).

Persists the location/assignment table in .storage, keeps it in step with
SmartLife valve names, and serves it at /api/xtend_tuya/irrigation_locations
for the irrigation card. Everything is computed from the in-memory runs
store: never the recorder, so a request stays far below Nabu Casa's 60 s
proxy cut.

Not the Tuya home/room "location" of entity_parser/fdm5kw/location_service.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from aiohttp import web

from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.http import HomeAssistantView
from homeassistant.helpers.storage import Store

from . import location_model as lm
from .const import DOMAIN, DOMAIN_ORIG

_LOGGER = logging.getLogger(__name__)

STORE_KEY = "xtend_tuya.irrigation_locations"
STORE_VERSION = 1
SAVE_DELAY_SEC = 10
DOMAIN_KEY = "xtend_tuya_irrigation_locations"


class IrrigationLocations:
    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store = Store(hass, STORE_VERSION, STORE_KEY)
        self.data: dict[str, Any] = lm.empty()

    async def async_load(self) -> None:
        self.data = await self._store.async_load() or lm.empty()

    def async_schedule_save(self) -> None:
        self._store.async_delay_save(lambda: self.data, SAVE_DELAY_SEC)


async def async_get_locations(hass: HomeAssistant) -> IrrigationLocations:
    """Process-wide singleton, loaded on first use."""
    store = hass.data.get(DOMAIN_KEY)
    if store is None:
        store = IrrigationLocations(hass)
        await store.async_load()
        hass.data[DOMAIN_KEY] = store
    return store


def _now_iso() -> str:
    return datetime.now().astimezone().isoformat()


async def async_sync(hass: HomeAssistant) -> None:
    """Auto-assign valves from their current names. Never raises: this runs
    from calendar setup and its re-arm timer, which must not break."""
    try:
        from .calendar import _iter_fdm5kw_devices
        from .runs_store import async_get_store

        runs = await async_get_store(hass)
        locations = await async_get_locations(hass)

        def first_run_start(device_id: str) -> str | None:
            rows = runs.runs.get(device_id)
            return rows[0]["start"] if rows else None

        devices = [
            (d["tuya_device_id"], d["valve_name"]) for d in _iter_fdm5kw_devices(hass)
        ]
        if lm.sync(locations.data, devices, _now_iso(), first_run_start):
            locations.async_schedule_save()
    except Exception:  # noqa: BLE001
        _LOGGER.debug("irrigation location sync failed", exc_info=True)


def _stats(rows: list[dict[str, Any]], now: datetime) -> dict[str, Any]:
    def window(days: int) -> list[dict[str, Any]]:
        cutoff = now - timedelta(days=days)
        return [r for r in rows if lm.to_dt(r["end"]) >= cutoff]

    def liters(rs: list[dict[str, Any]]) -> float:
        return float(sum(r["total_l"] for r in rs if r.get("total_l") is not None))

    r7, r30 = window(7), window(30)
    with_l = [r for r in r30 if r.get("total_l") is not None]
    minutes = sum(r["duration_seconds"] for r in with_l) / 60.0
    last = rows[-1] if rows else None
    return {
        "last_run_end": last["end"] if last else None,
        "last_run_liters": last.get("total_l") if last else None,
        "runs_7d": len(r7),
        "liters_7d": liters(r7),
        "runs_30d": len(r30),
        "liters_30d": liters(r30),
        "avg_lpm_30d": liters(with_l) / minutes if with_l and minutes > 0 else None,
    }


class XTIrrigationLocationsView(HomeAssistantView):
    url = "/api/xtend_tuya/irrigation_locations"
    name = f"api:{DOMAIN}:irrigation_locations"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        from .calendar import _iter_fdm5kw_devices
        from .runs_store import async_get_store

        # Pick up a valve renamed in SmartLife since the last re-arm.
        await async_sync(hass)
        runs = await async_get_store(hass)
        data = (await async_get_locations(hass)).data
        live = {d["tuya_device_id"]: d for d in _iter_fdm5kw_devices(hass)}
        dev_reg = dr.async_get(hass)

        def device_info(device_id: str) -> dict[str, Any]:
            ha_dev = dev_reg.async_get_device(
                identifiers={(DOMAIN, device_id), (DOMAIN_ORIG, device_id)}
            )
            d = live.get(device_id)
            name = d["valve_name"] if d else (
                (ha_dev.name_by_user or ha_dev.name) if ha_dev else None
            )
            return {
                "device_id": device_id,
                "ha_device_id": ha_dev.id if ha_dev else None,
                "valve_name": name,
                "online": (
                    d["registry_state"].state not in ("unavailable", "unknown")
                    if d
                    else None
                ),
            }

        now = datetime.now().astimezone()
        out = []
        for loc in data["locations"].values():
            assigned = [a for a in data["assignments"] if a["location_id"] == loc["id"]]
            # Open first, then newest begin first (None = since forever = oldest).
            assigned.sort(
                key=lambda a: (
                    a["end"] is not None,
                    -lm.to_dt(a["begin"]).timestamp() if a["begin"] else float("inf"),
                )
            )
            devices = []
            for a in assigned:
                info = device_info(a["device_id"])
                parsed = lm.parse_valve_name(info["valve_name"])
                devices.append(
                    {
                        **info,
                        "number": parsed[1] if parsed else None,
                        "begin": a["begin"],
                        "end": a["end"],
                        "source": a["source"],
                    }
                )
            out.append(
                {
                    **{k: loc[k] for k in ("id", "name", "description", "expected_lpm", "lat", "lon")},
                    "devices": devices,
                    "stats": _stats(lm.location_runs(data, loc["id"], runs.runs), now),
                }
            )
        out.sort(key=lambda l: l["name"].casefold())

        open_devices = {a["device_id"] for a in data["assignments"] if a["end"] is None}
        return self.json(
            {
                "generated": datetime.now(timezone.utc).isoformat(),
                "locations": out,
                "unassigned": [
                    device_info(dev) for dev in live if dev not in open_devices
                ],
            }
        )

    async def post(self, request: web.Request) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        user = request.get("hass_user")
        if user is None or not user.is_admin:
            return self.json({"error": "admin required"}, 403)
        try:
            body = await request.json()
        except ValueError:
            return self.json({"error": "invalid JSON"}, 400)
        if not isinstance(body, dict):
            return self.json({"error": "body must be an object"}, 400)

        store = await async_get_locations(hass)
        data, now, action = store.data, _now_iso(), body.get("action")
        result: dict[str, Any] = {"ok": True}
        try:
            if action == "create_location":
                loc = lm.create_location(data, body.get("name"), now)
                result["location"] = loc
            elif action == "update_location":
                fields = {k: body[k] for k in ("name", "description", "expected_lpm", "lat", "lon") if k in body}
                lm.update_location(data, body.get("id"), **fields)
            elif action == "assign_device":
                lm.assign_device(data, _str(body, "device_id"), body.get("location_id"), now)
            elif action == "end_assignment":
                lm.end_assignment(data, _str(body, "device_id"), body.get("location_id"), now)
            else:
                return self.json({"error": f"unknown action {action!r}"}, 400)
        except ValueError as err:
            return self.json({"error": str(err)}, 400)
        store.async_schedule_save()
        return self.json(result)


def _str(body: dict[str, Any], key: str) -> str:
    value = body.get(key)
    if not isinstance(value, str) or not value:
        raise ValueError(f"{key} must be a non-empty string")
    return value
