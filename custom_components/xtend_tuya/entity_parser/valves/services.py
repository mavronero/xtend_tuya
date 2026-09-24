"""The valve plugin's services, registered through XTCustomEntityParser.get_services().

Names and request schemas are part of the frozen surface (docs/architecture.md §6):
the dashboard cards, prod_smoke and automations call them. Responses keep the
`success` key and add the CommandResult fields; every service may be called
with return_response.
"""

from __future__ import annotations

from typing import Any

import homeassistant.helpers.config_validation as cv
import voluptuous as vol
from homeassistant.const import CONF_DEVICE_ID
from homeassistant.core import HomeAssistant

from ..entity_parser import XTPluginService
from . import control_service, timer_service

SET_TIMER_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_DEVICE_ID): cv.string,
        vol.Required("slot"): vol.All(cv.positive_int, vol.Range(min=0, max=6)),
        vol.Required("hour"): vol.All(cv.positive_int, vol.Range(min=0, max=23)),
        vol.Required("minute"): vol.All(cv.positive_int, vol.Range(min=0, max=59)),
        vol.Required("mode"): vol.In(["duration", "volume"]),
        vol.Required("value"): cv.positive_int,
        vol.Optional("days"): vol.Any([cv.string], cv.positive_int),
        vol.Optional("enabled", default=True): cv.boolean,
    }
)

DELETE_TIMER_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_DEVICE_ID): cv.string,
        vol.Required("slot"): vol.All(cv.positive_int, vol.Range(min=0, max=6)),
        vol.Optional("hour"): vol.All(cv.positive_int, vol.Range(min=0, max=23)),
        vol.Optional("minute"): vol.All(cv.positive_int, vol.Range(min=0, max=59)),
        vol.Optional("days"): vol.Any([cv.string], cv.positive_int),
    }
)

START_WATERING_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_DEVICE_ID): cv.string,
        vol.Required("mode"): vol.In(["duration", "volume"]),
        vol.Required("value"): cv.positive_int,
    }
)

DEVICE_ONLY_SCHEMA = vol.Schema({vol.Required(CONF_DEVICE_ID): cv.string})


async def _set_timer(hass: HomeAssistant, data: dict[str, Any]) -> dict[str, Any]:
    return (await timer_service.set_timer(hass, data)).as_response()


async def _delete_timer(hass: HomeAssistant, data: dict[str, Any]) -> dict[str, Any]:
    return (await timer_service.delete_timer(hass, data)).as_response()


async def _start_watering(hass: HomeAssistant, data: dict[str, Any]) -> dict[str, Any]:
    return (await control_service.start_watering(hass, data)).as_response()


async def _stop_watering(hass: HomeAssistant, data: dict[str, Any]) -> dict[str, Any]:
    return (await control_service.stop_watering(hass, data)).as_response()


SERVICES = [
    XTPluginService("fdm5kw_set_timer", SET_TIMER_SCHEMA, _set_timer),
    XTPluginService("fdm5kw_delete_timer", DELETE_TIMER_SCHEMA, _delete_timer),
    XTPluginService("fdm5kw_start_watering", START_WATERING_SCHEMA, _start_watering),
    XTPluginService("fdm5kw_stop_watering", DEVICE_ONLY_SCHEMA, _stop_watering),
    # Returns per-valve reconcile counts so the dashboard button can report
    # "cleared N / all clean" instead of a blind fire.
    XTPluginService("fdm5kw_resync_timers", DEVICE_ONLY_SCHEMA, timer_service.resync_from_cloud),
]
