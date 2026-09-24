"""Golden snapshot of the frozen HA surface (docs/architecture.md §6), read-only.

Captures everything prod consumers depend on, normalised so two snapshots of an
unchanged system diff empty:

  endpoints   /runs, /irrigation_locations, /valve_locations (volatile fields dropped)
  calendar    completed events [at-7d, at-1h], planned events [at+1h, at+7d]
  ics         VEVENTs of both ICS feeds within the same windows
  registry    xtend_tuya entities: entity_id, unique_id, translation_key, disabled_by
  attributes  per xtend_tuya entity: attribute NAMES (values change live)
  services    xtend_tuya service names + field names
  cards       /xtend_tuya_static/cards/*.js registered in the frontend index

Pass the same --at to the before and after snapshot; it pins every time window.

  HA_TOKEN=... python scripts/golden_snapshot.py capture URL out.json [--at ISO]
  python scripts/golden_snapshot.py diff before.json after.json   # exit 1 on difference

Needs aiohttp (present in .venv-test).
"""

from __future__ import annotations

import argparse
import asyncio
import datetime as dt
import difflib
import json
import os
import re
import sys

import aiohttp

DOMAIN = "xtend_tuya"
CALENDARS = ("calendar.irrigation_completed", "calendar.irrigation_planned")
HOUR = dt.timedelta(hours=1)
WEEK = dt.timedelta(days=7)
# Change on every call or with live sensor values, never part of the contract.
VOLATILE_KEYS = {"generated", "stats", "last_seen", "online"}


def _windows(at: dt.datetime) -> dict[str, tuple[dt.datetime, dt.datetime]]:
    return {
        "calendar.irrigation_completed": (at - WEEK, at - HOUR),
        "calendar.irrigation_planned": (at + HOUR, at + WEEK),
    }


def _strip_volatile(value):
    if isinstance(value, dict):
        return {k: _strip_volatile(v) for k, v in value.items() if k not in VOLATILE_KEYS}
    if isinstance(value, list):
        return [_strip_volatile(v) for v in value]
    return value


def _sorted(items: list, *keys: str) -> list:
    return sorted(items, key=lambda x: tuple(str(x.get(k)) for k in keys) if isinstance(x, dict) else str(x))


def _parse_ics(text: str, start: dt.datetime, end: dt.datetime) -> list[dict]:
    """VEVENTs starting inside [start, end); DTSTAMP dropped (changes per request)."""
    unfolded = re.sub(r"\r?\n[ \t]", "", text)
    events = []
    for block in re.findall(r"BEGIN:VEVENT\r?\n(.*?)END:VEVENT", unfolded, re.S):
        fields = dict(
            line.split(":", 1) for line in block.splitlines() if ":" in line and not line.startswith("DTSTAMP")
        )
        start_key = next((k for k in fields if k.startswith("DTSTART")), None)
        if start_key is None:
            continue
        begins = dt.datetime.strptime(fields[start_key].rstrip("Z"), "%Y%m%dT%H%M%S").replace(tzinfo=dt.timezone.utc)
        if start <= begins < end:
            events.append(fields)
    return _sorted(events, "UID", "DTSTART")


async def capture(url: str, token: str, at: dt.datetime) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    windows = _windows(at)
    snap: dict = {"at": at.isoformat()}
    async with aiohttp.ClientSession(url, headers=headers, timeout=aiohttp.ClientTimeout(total=120)) as http:

        async def get_json(path: str, **params):
            async with http.get(path, params=params) as resp:
                resp.raise_for_status()
                return await resp.json()

        async def get_text(path: str, **params) -> str:
            async with http.get(path, params=params) as resp:
                resp.raise_for_status()
                return await resp.text()

        runs = await get_json(f"/api/{DOMAIN}/runs", since=(at - 30 * WEEK / 7).isoformat())
        runs["runs"] = _sorted(
            [r for r in runs["runs"] if dt.datetime.fromisoformat(r["end"]) < at - HOUR], "device_id", "end"
        )
        runs.pop("count", None)
        snap["runs"] = _strip_volatile(runs)
        locations = _strip_volatile(await get_json(f"/api/{DOMAIN}/irrigation_locations"))
        for key, value in locations.items():
            if isinstance(value, list):
                locations[key] = _sorted(value, "id", "device_id")
        snap["irrigation_locations"] = locations
        snap["valve_locations"] = _strip_volatile(await get_json(f"/api/{DOMAIN}/valve_locations"))

        snap["calendar"], snap["ics"] = {}, {}
        for entity_id in CALENDARS:
            start, end = windows[entity_id]
            events = await get_json(f"/api/calendars/{entity_id}", start=start.isoformat(), end=end.isoformat())
            snap["calendar"][entity_id] = _sorted(events, "uid", "start", "summary")
            # Status is part of the surface: the feed has answered 401 to every
            # token since it shipped (awaits a sync @callback), see docs/architecture.md §9.
            async with http.get(f"/api/{DOMAIN}/calendar/{entity_id}.ics", params={"past_days": "8", "future_days": "8"}) as resp:
                body = await resp.text()
                snap["ics"][entity_id] = {"status": resp.status, "events": _parse_ics(body, start, end) if resp.ok else []}

        index = await get_text("/")
        snap["cards"] = sorted(set(re.findall(r"/xtend_tuya_static/cards/[\w.-]+\.js", index)))

        async with http.ws_connect("/api/websocket", max_msg_size=0) as ws:
            await ws.receive_json()
            await ws.send_json({"type": "auth", "access_token": token})
            if (await ws.receive_json()).get("type") != "auth_ok":
                raise SystemExit("websocket auth failed")
            msg_id = 0

            async def call(message: dict):
                nonlocal msg_id
                msg_id += 1
                await ws.send_json({"id": msg_id, **message})
                while (reply := await ws.receive_json()).get("id") != msg_id:
                    pass
                if not reply.get("success"):
                    raise SystemExit(f"{message['type']} failed: {reply.get('error')}")
                return reply["result"]

            registry = [e for e in await call({"type": "config/entity_registry/list"}) if e["platform"] == DOMAIN]
            snap["registry"] = _sorted(
                [
                    {k: e.get(k) for k in ("entity_id", "unique_id", "translation_key", "disabled_by", "entity_category")}
                    for e in registry
                ],
                "entity_id",
            )
            ours = {e["entity_id"] for e in registry}
            states = await call({"type": "get_states"})
            snap["attributes"] = {
                s["entity_id"]: sorted(s["attributes"]) for s in sorted(states, key=lambda s: s["entity_id"]) if s["entity_id"] in ours
            }
            services = (await call({"type": "get_services"})).get(DOMAIN, {})
            snap["services"] = {name: sorted(spec.get("fields", {})) for name, spec in sorted(services.items())}
    return snap


def diff(before: dict, after: dict) -> list[str]:
    lines = []
    for section in sorted((set(before) | set(after)) - {"at"}):
        a = json.dumps(before.get(section), indent=1, sort_keys=True).splitlines()
        b = json.dumps(after.get(section), indent=1, sort_keys=True).splitlines()
        lines += difflib.unified_diff(a, b, f"before/{section}", f"after/{section}", lineterm="", n=2)
    return lines


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)
    cap = sub.add_parser("capture")
    cap.add_argument("url")
    cap.add_argument("out")
    cap.add_argument("--at", help="ISO timestamp pinning all windows (default: now, rounded to the hour)")
    dif = sub.add_parser("diff")
    dif.add_argument("before")
    dif.add_argument("after")
    args = parser.parse_args()

    if args.cmd == "capture":
        at = (
            dt.datetime.fromisoformat(args.at)
            if args.at
            else dt.datetime.now(dt.timezone.utc).replace(minute=0, second=0, microsecond=0)
        )
        snap = asyncio.run(capture(args.url.rstrip("/"), os.environ["HA_TOKEN"], at))
        with open(args.out, "w") as f:
            json.dump(snap, f, indent=1, sort_keys=True)
        print(f"{args.out}: at={snap['at']} runs={len(snap['runs']['runs'])} entities={len(snap['registry'])} cards={len(snap['cards'])}")
        return 0

    with open(args.before) as a, open(args.after) as b:
        before, after = json.load(a), json.load(b)
    if before.get("at") != after.get("at"):
        print(f"warning: different --at ({before.get('at')} vs {after.get('at')}); time windows differ", file=sys.stderr)
    lines = diff(before, after)
    print("\n".join(lines) if lines else "no difference")
    return 1 if lines else 0


if __name__ == "__main__":
    sys.exit(main())
