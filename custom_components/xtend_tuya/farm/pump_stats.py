"""Pump figures from HA's long-term statistics: GET /api/xtend_tuya/pump_stats.

The pumps are measured by another integration (DAB Pumps). The farm layer
never talks to it: it reads the recorder's hourly/daily statistics of the
entities stored on each pump and on the metered consumers connected to it,
exactly as HA's own history and energy pages do. Statistics are the
aggregated tables (one row per hour), not a states scan, so a 30-day query
is small; answers are cached for a few minutes all the same.

  ?start=<ISO>&period=hour|day
  -> {"period", "start", "series": {entity_id: [{"start": ms, "change"|"mean"|"max": x}]}}

Meters (m³ totals) give `change` per period; flow and pressure give `mean`
and `max`.
"""

from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from aiohttp import web

from homeassistant.components.recorder.statistics import StatisticsRow, statistics_during_period
from homeassistant.helpers.recorder import get_instance
from homeassistant.core import HomeAssistant
from homeassistant.helpers.http import HomeAssistantView

from ..const import DOMAIN
from .irrigation_locations import async_get_locations

CACHE_SEC = 300
MAX_RANGE = timedelta(days=31)
PERIODS = ("hour", "day")
_CACHE_KEY = "xtend_tuya_pump_stats_cache"


def entities_by_type(data: dict[str, Any]) -> tuple[set[str], set[str]]:
    """(meters, gauges): the stored entity ids to read, by statistic type."""
    meters: set[str] = set()
    gauges: set[str] = set()
    for pump in data["pumps"].values():
        if pump.get("meter_entity"):
            meters.add(pump["meter_entity"])
        for key in ("flow_entity", "pressure_entity"):
            if pump.get(key):
                gauges.add(pump[key])
    for conn in data["pump_connections"]:
        if conn.get("meter_entity"):
            meters.add(conn["meter_entity"])
    return meters, gauges


def _rows(stats: dict[str, list[StatisticsRow]], keys: tuple[str, ...]) -> dict[str, list[dict[str, Any]]]:
    out: dict[str, list[dict[str, Any]]] = {}
    for entity_id, rows in stats.items():
        out[entity_id] = [
            # HA gives the period start as float seconds.
            {"start": int(r["start"] * 1000), **{k: r.get(k) for k in keys}}
            for r in rows
        ]
    return out


class XTPumpStatsView(HomeAssistantView):
    url = "/api/xtend_tuya/pump_stats"
    name = f"api:{DOMAIN}:pump_stats"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        period = request.query.get("period", "hour")
        if period not in PERIODS:
            return self.json({"error": f"period must be one of {PERIODS}"}, 400)
        now = datetime.now(timezone.utc)
        try:
            start = datetime.fromisoformat(request.query["start"]) if "start" in request.query else now - timedelta(days=1)
        except ValueError:
            return self.json({"error": "start must be an ISO timestamp"}, 400)
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        start = max(start, now - MAX_RANGE)
        # Round to the period so cache keys (and rows) line up.
        start = start.replace(minute=0, second=0, microsecond=0)
        if period == "day":
            start = start.replace(hour=0)

        data = (await async_get_locations(hass)).data
        meters, gauges = entities_by_type(data)
        key = (period, start.isoformat(), tuple(sorted(meters)), tuple(sorted(gauges)))
        cache: dict[Any, tuple[float, dict[str, Any]]] = hass.data.setdefault(_CACHE_KEY, {})
        hit = cache.get(key)
        if hit and time.monotonic() - hit[0] < CACHE_SEC:
            return self.json(hit[1])

        series = await self._read(hass, start, period, meters, gauges)  # type: ignore[arg-type]
        body = {"period": period, "start": start.isoformat(), "series": series}
        cache.clear()  # ponytail: one entry; the cards ask for one range at a time
        cache[key] = (time.monotonic(), body)
        return self.json(body)

    @staticmethod
    async def _read(
        hass: HomeAssistant,
        start: datetime,
        period: Literal["hour", "day"],
        meters: set[str],
        gauges: set[str],
    ) -> dict[str, list[dict[str, Any]]]:
        recorder = get_instance(hass)
        series: dict[str, list[dict[str, Any]]] = {}
        if meters:
            stats = await recorder.async_add_executor_job(
                statistics_during_period, hass, start, None, meters, period, None, {"change"}
            )
            series.update(_rows(stats, ("change",)))
        if gauges:
            stats = await recorder.async_add_executor_job(
                statistics_during_period, hass, start, None, gauges, period, None, {"mean", "max"}
            )
            series.update(_rows(stats, ("mean", "max")))
        return series
