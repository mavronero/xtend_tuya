"""Irrigation locations: the permanent irrigated place a valve serves.

SmartLife names valves "HM Verbs (701)": the place ("HM Verbs") outlives
the hardware ("701"). When a valve is swapped the history has to follow
the place, so runs are attributed through time-windowed assignments of a
Tuya device id to a location instead of through the device itself.

Not to be confused with entity_parser/valves/location_service.py, where
"location" means the Tuya home/room grouping.

Pure stdlib on purpose, so tests/test_location_model.py runs without HA.

A location is a metering point (MP): it holds at most one valve at a time
and belongs to one site. Sites form a tree. Pumps (a meter entity) are
assigned, dated, to a site or an MP and inherited down the tree
(docs/architecture.md §5.1).

data = {
  "sites": {id: {id, name, parent_id, geometry, created}},
  "locations": {id: {id, name, site_id, description, expected_lpm, geometry,
                     aliases: [normalized names], created}},
  "assignments": [{location_id, device_id, begin, end, source}],
  "pumps": {id: {id, name, meter_entity, created}},
  "pump_assignments": [{pump_id, target_kind, target_id, begin, end}],
  "sites_seeded": bool,
}
begin None = since forever, end None = currently assigned. geometry is a
GeoJSON geometry (RFC 7946, lon/lat) or None; an MP's lat/lon is its Point.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime
from typing import Any, Callable, Iterable

_NAME_RE = re.compile(r"^(.*?)\s*\((\d+)\)\s*$")

_EDITABLE = ("name", "description", "expected_lpm", "lat", "lon")
TARGET_KINDS = ("site", "location")


def empty() -> dict[str, Any]:
    return {
        "sites": {},
        "locations": {},
        "assignments": [],
        "pumps": {},
        "pump_assignments": [],
        "sites_seeded": False,
    }


def migrate_v1(data: dict[str, Any]) -> dict[str, Any]:
    """Store version 1 -> 2: sites, pumps, and lat/lon as a GeoJSON Point."""
    out = {**empty(), **data}
    for loc in out["locations"].values():
        lat, lon = loc.pop("lat", None), loc.pop("lon", None)
        loc.setdefault("site_id", None)
        loc.setdefault("geometry", _point(lat, lon))
    return out


def lat_lon(loc: dict[str, Any]) -> tuple[float | None, float | None]:
    """An MP's lat/lon, read from its Point (the API still speaks lat/lon)."""
    g = loc.get("geometry")
    if g and g.get("type") == "Point":
        lon, lat = g["coordinates"][:2]
        return lat, lon
    return None, None


def _point(lat: float | None, lon: float | None) -> dict[str, Any] | None:
    return None if lat is None or lon is None else {"type": "Point", "coordinates": [lon, lat]}


def parse_valve_name(name: str | None) -> tuple[str, str] | None:
    """"HM Verbs (701)" -> ("HM Verbs", "701"); None when there is no place."""
    m = _NAME_RE.match(name or "")
    if not m:
        return None
    place = " ".join(m.group(1).split())
    return (place, m.group(2)) if place else None


def normalize(place: str) -> str:
    return " ".join(place.split()).casefold()


def to_dt(iso: str) -> datetime:
    parsed = datetime.fromisoformat(iso)
    # Naive stamps would raise when compared with aware ones.
    return parsed if parsed.tzinfo else parsed.astimezone()


def _find_by_alias(data: dict[str, Any], key: str) -> dict[str, Any] | None:
    loc: dict[str, Any]
    for loc in data["locations"].values():
        if key in loc["aliases"]:
            return loc
    return None


def _new_location(data: dict[str, Any], name: str, now_iso: str) -> dict[str, Any]:
    loc = {
        "id": uuid.uuid4().hex,
        "name": name,
        "description": "",
        "site_id": None,
        "expected_lpm": None,
        "geometry": None,
        "aliases": [normalize(name)],
        "created": now_iso,
    }
    data["locations"][loc["id"]] = loc
    return loc


def _open(data: dict[str, Any], device_id: str) -> dict[str, Any] | None:
    a: dict[str, Any]
    for a in data["assignments"]:
        if a["device_id"] == device_id and a["end"] is None:
            return a
    return None


def _add(data: dict[str, Any], location_id: str, device_id: str, begin: str | None, source: str) -> None:
    data["assignments"].append(
        {
            "location_id": location_id,
            "device_id": device_id,
            "begin": begin,
            "end": None,
            "source": source,
        }
    )


def seed_from_names(
    data: dict[str, Any],
    devices: Iterable[tuple[str, str]],
    now_iso: str,
    first_run_start: Callable[[str], str | None],
) -> bool:
    """Assign valves to locations from their SmartLife names.

    Meant as a one-time seed (the HA glue only runs it on an empty store):
    after that, assignment is manual. Idempotent and safe on a populated
    store all the same: never closes an assignment because a valve is
    offline or missing, and manual assignments and manually ended ones
    always win over the name.
    """
    changed = False
    for device_id, valve_name in devices:
        parsed = parse_valve_name(valve_name)
        if parsed is None:
            continue
        place = parsed[0]
        loc = _find_by_alias(data, normalize(place))
        if loc is None:
            loc = _new_location(data, place, now_iso)
            changed = True
        current = _open(data, device_id)
        if current is not None:
            if current["location_id"] == loc["id"] or current["source"] != "auto":
                continue
            # Renamed in SmartLife: the valve moved to another place.
            current["end"] = now_iso
            _add(data, loc["id"], device_id, now_iso, "auto")
            changed = True
            continue
        history = [a for a in data["assignments"] if a["device_id"] == device_id]
        if any(a["location_id"] == loc["id"] for a in history):
            continue  # ended on purpose, don't reopen
        # First sighting: claim the device's recorded runs for this place.
        begin = now_iso if history else (first_run_start(device_id) or now_iso)
        _add(data, loc["id"], device_id, begin, "auto")
        changed = True
    return changed


def create_location(data: dict[str, Any], name: Any, now_iso: str) -> dict[str, Any]:
    name = _clean_name(name)
    if _find_by_alias(data, normalize(name)) is not None:
        raise ValueError(f"location {name!r} already exists")
    return _new_location(data, name, now_iso)


def update_location(data: dict[str, Any], location_id: str, **fields: Any) -> dict[str, Any]:
    loc = _get(data, location_id)
    unknown = set(fields) - set(_EDITABLE)
    if unknown:
        raise ValueError(f"unknown fields: {sorted(unknown)}")
    clean: dict[str, Any] = {}
    if "name" in fields:
        clean["name"] = _clean_name(fields["name"])
        key = normalize(clean["name"])
        other = _find_by_alias(data, key)
        if other is not None and other is not loc:
            raise ValueError(f"name {clean['name']!r} belongs to another location")
    if "description" in fields:
        if not isinstance(fields["description"], str):
            raise ValueError("description must be a string")
        clean["description"] = fields["description"]
    for field, lo, hi in (("expected_lpm", 0, None), ("lat", -90, 90), ("lon", -180, 180)):
        if field in fields:
            clean[field] = _number(field, fields[field], lo, hi)
    if "lat" in clean or "lon" in clean:
        lat, lon = lat_lon(loc)
        lat, lon = clean.pop("lat", lat), clean.pop("lon", lon)
        clean["geometry"] = _point(lat, lon)
    loc.update(clean)
    # Keep the old aliases so the SmartLife name still matches after a rename.
    if "name" in clean and normalize(clean["name"]) not in loc["aliases"]:
        loc["aliases"].append(normalize(clean["name"]))
    return loc


def assign_device(data: dict[str, Any], device_id: str, location_id: str, now_iso: str) -> None:
    """Put a valve on an MP. An MP holds one valve at a time: the valve it
    held is exchanged (its assignment ends), and so does the new valve's
    previous MP assignment. The MP's metering history stays."""
    _get(data, location_id)
    current = _open(data, device_id)
    if current is not None and current["location_id"] == location_id:
        current["source"] = "manual"
        return
    if current is not None:
        current["end"] = now_iso
    for a in data["assignments"]:
        if a["location_id"] == location_id and a["end"] is None:
            a["end"] = now_iso
    _add(data, location_id, device_id, now_iso, "manual")


def end_assignment(data: dict[str, Any], device_id: str, location_id: str, now_iso: str) -> None:
    current = _open(data, device_id)
    if current is None or current["location_id"] != location_id:
        raise ValueError("no open assignment for that device and location")
    current["end"] = now_iso


def _in_window(a: dict[str, Any], end: datetime) -> bool:
    # ponytail: half-open [begin, end) so a run ending exactly at a
    # reassignment instant counts for one location only, not both.
    return (a["begin"] is None or to_dt(a["begin"]) <= end) and (
        a["end"] is None or end < to_dt(a["end"])
    )


def location_for_run(data: dict[str, Any], device_id: str, run_end_iso: str) -> dict[str, Any] | None:
    end = to_dt(run_end_iso)
    for a in data["assignments"]:
        if a["device_id"] == device_id and _in_window(a, end):
            found: dict[str, Any] | None = data["locations"].get(a["location_id"])
            return found
    return None


def location_runs(
    data: dict[str, Any],
    location_id: str,
    runs_by_device: dict[str, list[dict[str, Any]]],
) -> list[dict[str, Any]]:
    out = []
    for a in data["assignments"]:
        if a["location_id"] != location_id:
            continue
        for r in runs_by_device.get(a["device_id"], []):
            if _in_window(a, to_dt(r["end"])):
                out.append(r)
    out.sort(key=lambda r: to_dt(r["end"]))
    return out


def _get(data: dict[str, Any], location_id: Any) -> dict[str, Any]:
    loc: dict[str, Any] | None = data["locations"].get(location_id) if isinstance(location_id, str) else None
    if loc is None:
        raise ValueError(f"unknown location {location_id!r}")
    return loc


def _clean_name(name: Any) -> str:
    if not isinstance(name, str) or not name.strip():
        raise ValueError("name must be a non-empty string")
    return " ".join(name.split())


def _number(field: str, value: Any, lo: float, hi: float | None) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{field} must be a number or null")
    if value < lo or (hi is not None and value > hi) or value != value:
        raise ValueError(f"{field} out of range")
    return float(value)


# --- sites -------------------------------------------------------------


def seed_sites(data: dict[str, Any], room_of: Callable[[str], str | None], now_iso: str) -> bool:
    """One site per Tuya room of an MP's open valve; runs once.

    Only acts when at least one room is known (the home walk fills them
    after startup), then marks the store seeded. MPs whose valve has no
    room keep site_id None. The tree and the pumps are set by hand."""
    if data["sites_seeded"]:
        return False
    rooms: dict[str, str] = {}
    for a in data["assignments"]:
        if a["end"] is None and (room := room_of(a["device_id"])):
            rooms.setdefault(a["location_id"], " ".join(room.split()))
    if not rooms:
        return False
    by_name = {normalize(s["name"]): s for s in data["sites"].values()}
    for location_id, room in rooms.items():
        loc = data["locations"].get(location_id)
        if loc is None or loc["site_id"] is not None:
            continue
        site = by_name.get(normalize(room))
        if site is None:
            site = by_name[normalize(room)] = create_site(data, room, None, now_iso)
        loc["site_id"] = site["id"]
    data["sites_seeded"] = True
    return True


def create_site(data: dict[str, Any], name: Any, parent_id: Any, now_iso: str) -> dict[str, Any]:
    name = _clean_name(name)
    if any(normalize(s["name"]) == normalize(name) for s in data["sites"].values()):
        raise ValueError(f"site {name!r} already exists")
    site = {"id": uuid.uuid4().hex, "name": name, "parent_id": None, "geometry": None, "created": now_iso}
    data["sites"][site["id"]] = site
    if parent_id is not None:
        update_site(data, site["id"], parent_id=parent_id)
    return site


def update_site(data: dict[str, Any], site_id: Any, **fields: Any) -> dict[str, Any]:
    site = _get_site(data, site_id)
    unknown = set(fields) - {"name", "parent_id"}
    if unknown:
        raise ValueError(f"unknown fields: {sorted(unknown)}")
    if "name" in fields:
        name = _clean_name(fields["name"])
        if any(s is not site and normalize(s["name"]) == normalize(name) for s in data["sites"].values()):
            raise ValueError(f"name {name!r} belongs to another site")
        site["name"] = name
    if "parent_id" in fields:
        parent_id = fields["parent_id"]
        if parent_id is not None:
            _get_site(data, parent_id)
            if site["id"] in site_chain(data, parent_id):
                raise ValueError("parent would create a cycle")
        site["parent_id"] = parent_id
    return site


def delete_site(data: dict[str, Any], site_id: Any) -> None:
    """Only an empty site: no child sites, no MPs, no pump history."""
    site = _get_site(data, site_id)
    if (
        any(s["parent_id"] == site["id"] for s in data["sites"].values())
        or any(l["site_id"] == site["id"] for l in data["locations"].values())
        or any(p["target_kind"] == "site" and p["target_id"] == site["id"] for p in data["pump_assignments"])
    ):
        raise ValueError("site is not empty")
    del data["sites"][site["id"]]


def set_location_site(data: dict[str, Any], location_id: Any, site_id: Any) -> None:
    loc = _get(data, location_id)
    if site_id is not None:
        _get_site(data, site_id)
    loc["site_id"] = site_id


def site_chain(data: dict[str, Any], site_id: str | None) -> list[str]:
    """The site and its ancestors, nearest first."""
    chain: list[str] = []
    while site_id is not None and site_id not in chain:
        chain.append(site_id)
        site_id = data["sites"][site_id]["parent_id"]
    return chain


def subtree(data: dict[str, Any], site_id: str) -> set[str]:
    """The site and all its descendants (filtering by a site includes them)."""
    return {s for s in data["sites"] if site_id in site_chain(data, s)}


# --- pumps -------------------------------------------------------------


def create_pump(data: dict[str, Any], name: Any, meter_entity: Any, now_iso: str) -> dict[str, Any]:
    name = _clean_name(name)
    if not isinstance(meter_entity, str) or not meter_entity.startswith("sensor."):
        raise ValueError("meter_entity must be a sensor entity id")
    pump = {"id": uuid.uuid4().hex, "name": name, "meter_entity": meter_entity, "created": now_iso}
    data["pumps"][pump["id"]] = pump
    return pump


def assign_pump(data: dict[str, Any], pump_id: Any, target_kind: Any, target_id: Any, now_iso: str) -> None:
    """Set the pump of a site or MP from now on (ends the target's previous one)."""
    if not isinstance(pump_id, str) or pump_id not in data["pumps"]:
        raise ValueError(f"unknown pump {pump_id!r}")
    _get_target(data, target_kind, target_id)
    current = _open_pump(data, target_kind, target_id)
    if current is not None:
        if current["pump_id"] == pump_id:
            return
        current["end"] = now_iso
    data["pump_assignments"].append(
        {"pump_id": pump_id, "target_kind": target_kind, "target_id": target_id, "begin": now_iso, "end": None}
    )


def end_pump_assignment(data: dict[str, Any], target_kind: Any, target_id: Any, now_iso: str) -> None:
    """Back to inheriting from the parent."""
    current = _open_pump(data, target_kind, target_id)
    if current is None:
        raise ValueError("no pump assigned there")
    current["end"] = now_iso


def pump_for(data: dict[str, Any], location_id: str, at_iso: str) -> tuple[dict[str, Any], str, str] | None:
    """(pump, target_kind, target_id) feeding an MP at a time: its own
    assignment, else its site's, else up the parent sites."""
    at = to_dt(at_iso)
    loc = data["locations"].get(location_id)
    if loc is None:
        return None
    targets = [("location", location_id)] + [("site", s) for s in site_chain(data, loc["site_id"])]
    for kind, target_id in targets:
        for a in data["pump_assignments"]:
            if a["target_kind"] == kind and a["target_id"] == target_id and _in_window(a, at):
                return data["pumps"][a["pump_id"]], kind, target_id
    return None


def _open_pump(data: dict[str, Any], kind: Any, target_id: Any) -> dict[str, Any] | None:
    return next(
        (
            a
            for a in data["pump_assignments"]
            if a["target_kind"] == kind and a["target_id"] == target_id and a["end"] is None
        ),
        None,
    )


def _get_target(data: dict[str, Any], kind: Any, target_id: Any) -> dict[str, Any]:
    if kind == "site":
        return _get_site(data, target_id)
    if kind == "location":
        return _get(data, target_id)
    raise ValueError(f"target_kind must be one of {TARGET_KINDS}")


def _get_site(data: dict[str, Any], site_id: Any) -> dict[str, Any]:
    site: dict[str, Any] | None = data["sites"].get(site_id) if isinstance(site_id, str) else None
    if site is None:
        raise ValueError(f"unknown site {site_id!r}")
    return site
