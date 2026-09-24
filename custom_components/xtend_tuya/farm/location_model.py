"""Irrigation locations: the permanent irrigated place a valve serves.

SmartLife names valves "HM Verbs (701)": the place ("HM Verbs") outlives
the hardware ("701"). When a valve is swapped the history has to follow
the place, so runs are attributed through time-windowed assignments of a
Tuya device id to a location instead of through the device itself.

Not to be confused with entity_parser/fdm5kw/location_service.py, where
"location" means the Tuya home/room grouping.

Pure stdlib on purpose, so tests/test_location_model.py runs without HA.

data = {
  "locations": {id: {id, name, description, expected_lpm, lat, lon,
                     aliases: [normalized names], created}},
  "assignments": [{location_id, device_id, begin, end, source}],
}
begin None = since forever, end None = currently assigned.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime
from typing import Any, Callable, Iterable

_NAME_RE = re.compile(r"^(.*?)\s*\((\d+)\)\s*$")

_EDITABLE = ("name", "description", "expected_lpm", "lat", "lon")


def empty() -> dict[str, Any]:
    return {"locations": {}, "assignments": []}


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
    for loc in data["locations"].values():
        if key in loc["aliases"]:
            return loc
    return None


def _new_location(data: dict[str, Any], name: str, now_iso: str) -> dict[str, Any]:
    loc = {
        "id": uuid.uuid4().hex,
        "name": name,
        "description": "",
        "expected_lpm": None,
        "lat": None,
        "lon": None,
        "aliases": [normalize(name)],
        "created": now_iso,
    }
    data["locations"][loc["id"]] = loc
    return loc


def _open(data: dict[str, Any], device_id: str) -> dict[str, Any] | None:
    for a in data["assignments"]:
        if a["device_id"] == device_id and a["end"] is None:
            return a
    return None


def _add(data, location_id, device_id, begin, source) -> None:
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
    loc.update(clean)
    # Keep the old aliases so the SmartLife name still matches after a rename.
    if "name" in clean and normalize(clean["name"]) not in loc["aliases"]:
        loc["aliases"].append(normalize(clean["name"]))
    return loc


def assign_device(data: dict[str, Any], device_id: str, location_id: str, now_iso: str) -> None:
    _get(data, location_id)
    current = _open(data, device_id)
    if current is not None and current["location_id"] == location_id:
        current["source"] = "manual"
        return
    if current is not None:
        current["end"] = now_iso
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
            return data["locations"].get(a["location_id"])
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
    loc = data["locations"].get(location_id) if isinstance(location_id, str) else None
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
