"""HA glue for irrigation locations (see location_model.py for the rules).

Persists the location/assignment table in .storage and serves it at
/api/xtend_tuya/irrigation_locations for the irrigation cards. Locations are
seeded ONCE by splitting the SmartLife names ("HM Verbs (701)"); after that
assignment is manual only (Simon 2026-09-16: an automation "will create too
many problems"), so a new valve shows up as unassigned until someone picks
its location in the valve list. Everything is computed from the in-memory runs
store: never the recorder, so a request stays far below Nabu Casa's 60 s
proxy cut.

Not the Tuya home/room "location" of entity_parser/valves/location_service.
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
from ..const import DOMAIN
from .contract import device_identifiers, discover_valves

_LOGGER = logging.getLogger(__name__)

STORE_KEY = "xtend_tuya.irrigation_locations"
STORE_VERSION = 2
SAVE_DELAY_SEC = 10
DOMAIN_KEY = "xtend_tuya_irrigation_locations"


class _LocationsStore(Store[dict[str, Any]]):
    async def _async_migrate_func(
        self, old_major_version: int, old_minor_version: int, old_data: dict[str, Any]
    ) -> dict[str, Any]:
        if old_major_version == 1:
            return lm.migrate_v1(old_data)
        raise NotImplementedError(old_major_version)


class IrrigationLocations:
    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store[dict[str, Any]] = _LocationsStore(hass, STORE_VERSION, STORE_KEY)
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


async def async_seed_once(hass: HomeAssistant) -> None:
    """One-time split of the SmartLife names into locations. A no-op once
    the store holds anything, so it is safe to call from calendar setup and
    its re-arm (the retry covers a setup that ran before the valves were
    known). Never raises: those callers must not break."""
    try:
        from .runs_store import async_get_store

        locations = await async_get_locations(hass)
        if locations.data["locations"] or locations.data["assignments"]:
            return
        runs = await async_get_store(hass)

        def first_run_start(device_id: str) -> str | None:
            rows = runs.runs.get(device_id)
            return rows[0]["start"] if rows else None

        devices = [
            (d["tuya_device_id"], d["valve_name"]) for d in discover_valves(hass)
        ]
        if lm.seed_from_names(locations.data, devices, _now_iso(), first_run_start):
            _LOGGER.info(
                "irrigation locations seeded from SmartLife names: %d locations",
                len(locations.data["locations"]),
            )
            locations.async_schedule_save()
    except Exception:  # noqa: BLE001
        _LOGGER.debug("irrigation location seed failed", exc_info=True)


async def async_seed_sites_once(hass: HomeAssistant) -> None:
    """One site per Tuya room, once the rooms are known. Never raises."""
    try:
        locations = await async_get_locations(hass)
        if locations.data["sites_seeded"]:
            return
        rooms = {d["tuya_device_id"]: d["room"] for d in discover_valves(hass)}
        if lm.seed_sites(locations.data, rooms.get, _now_iso()):
            _LOGGER.info("irrigation sites seeded from Tuya rooms: %d sites", len(locations.data["sites"]))
            locations.async_schedule_save()
    except Exception:  # noqa: BLE001
        _LOGGER.debug("irrigation site seed failed", exc_info=True)


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
        from .runs_store import async_get_store

        # Seed-once retry: calendar setup can run before the valve entities
        # exist (then the seed saw no devices). No-op once the store holds
        # anything, so this is not the rejected "automation".
        await async_seed_once(hass)
        await async_seed_sites_once(hass)
        runs = await async_get_store(hass)
        data = (await async_get_locations(hass)).data
        live = {d["tuya_device_id"]: d for d in discover_valves(hass)}
        dev_reg = dr.async_get(hass)

        def device_info(device_id: str) -> dict[str, Any]:
            ha_dev = dev_reg.async_get_device(identifiers=device_identifiers(device_id))
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
        now_iso = now.isoformat()

        def pump_info(location_id: str) -> dict[str, Any] | None:
            found = lm.pump_for(data, location_id, now_iso)
            if found is None:
                return None
            pump, kind, target_id = found
            inherited = None if kind == "location" else target_id
            return {**pump, "inherited_from": inherited}

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
            lat, lon = lm.lat_lon(loc)
            out.append(
                {
                    **{k: loc[k] for k in ("id", "name", "description", "expected_lpm")},
                    "lat": lat,
                    "lon": lon,
                    "site_id": loc["site_id"],
                    "pump": pump_info(loc["id"]),
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
                "sites": sorted(data["sites"].values(), key=lambda s: s["name"].casefold()),
                "pumps": sorted(data["pumps"].values(), key=lambda p: p["name"].casefold()),
                # Open pump assignments; the cards show which site or MP sets one.
                "pump_assignments": [a for a in data["pump_assignments"] if a["end"] is None],
                # Online valves only: offline ones are mostly retired hardware
                # the seed never saw. They get their own group with the
                # online/offline filter (Trello Sijuj2Dd).
                "unassigned": [
                    info
                    for dev in live
                    if dev not in open_devices and (info := device_info(dev))["online"]
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
            elif action == "create_site":
                result["site"] = lm.create_site(data, body.get("name"), body.get("parent_id"), now)
            elif action == "update_site":
                lm.update_site(data, body.get("id"), **{k: body[k] for k in ("name", "parent_id") if k in body})
            elif action == "delete_site":
                lm.delete_site(data, body.get("id"))
            elif action == "set_location_site":
                lm.set_location_site(data, body.get("location_id"), body.get("site_id"))
            elif action == "create_pump":
                result["pump"] = lm.create_pump(data, body.get("name"), body.get("meter_entity"), now)
            elif action == "assign_pump":
                lm.assign_pump(data, body.get("pump_id"), body.get("target_kind"), body.get("target_id"), now)
            elif action == "end_pump_assignment":
                lm.end_pump_assignment(data, body.get("target_kind"), body.get("target_id"), now)
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
