"""The contract between the valve device layer (L2) and the farm (L3).

Every entity, translation key and attribute name the farm layer relies on is
named here and nowhere else in farm/. The device layer must keep these stable;
tests/ha checks them against the prod fixtures. See docs/architecture.md §5.
"""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er

from ..const import DOMAIN, DOMAIN_ORIG

# Valve devices carry their Tuya id under either domain (xtend or core tuya).
VALVE_DEVICE_DOMAINS = (DOMAIN, DOMAIN_ORIG)

REGISTRY_SUFFIX = "irrigation_timer_registry"
WATERING_VOLUME_TRANSLATION_KEY = "watering_volume"
START_TIME_TRANSLATION_KEY = "start_time"
END_TIME_TRANSLATION_KEY = "end_time"
CLOSE_TIME_TRANSLATION_KEY = "close_time"
# T3 valves have no start/end-time sensors; their completed runs come from
# the counter_custom last-run sensor instead (runs_store listens on it).
LAST_RUN_TRANSLATION_KEY = "last_watering_run"

# Entity-id suffix fallbacks for installs whose entities pre-date the
# translation_key bump in 4.4.150 (registry stores translation_key only
# at first registration). Mirrors the same pattern in the dashboard
# strategy so calendar + dashboard agree on which sibling is which.
_ENTITY_SUFFIX_TO_ROLE: tuple[tuple[str, str], ...] = (
    ("_last_watering_start", "start_entity"),
    ("_last_watering_end", "end_entity"),
    ("_watering_volume", "volume_entity"),
)


def device_identifiers(tuya_device_id: str) -> set[tuple[str, str]]:
    """Device-registry identifiers under which a valve can be registered."""
    return {(domain, tuya_device_id) for domain in VALVE_DEVICE_DOMAINS}


def tuya_id_of(device: dr.DeviceEntry | dr.ChildDeviceEntry) -> str | None:
    """The Tuya device id a valve's HA device is registered under."""
    return next((ident for domain, ident in device.identifiers if domain in VALVE_DEVICE_DOMAINS), None)


def discover_valves(
    hass: HomeAssistant,
) -> list[dict[str, Any]]:
    """One record per valve: its registry entity, valve name and the sibling
    watering_volume / start_time / end_time / last-run entity ids.

    The only way the farm layer finds valves. It relies solely on the HA
    contract of the device layer: the registry sensor and its attributes,
    sibling translation keys, and the device identifiers."""
    dev_reg = dr.async_get(hass)
    ent_reg = er.async_get(hass)
    out: list[dict[str, Any]] = []

    for state in hass.states.async_all("sensor"):
        if not state.entity_id.endswith(REGISTRY_SUFFIX):
            continue
        # Resolve the device through the registry, not the state: an offline
        # valve's sensor is `unavailable` and HA strips its attributes,
        # device_id included, so an attribute-only lookup lost every offline
        # valve (and its past runs) from the farm layer.
        entry = ent_reg.async_get(state.entity_id)
        ha_device = dev_reg.async_get(entry.device_id) if entry and entry.device_id else None
        if ha_device is None:
            continue
        tuya_device_id = state.attributes.get("device_id") or tuya_id_of(ha_device)
        if not tuya_device_id:
            continue

        roles: dict[str, str] = {}
        for ent in er.async_entries_for_device(ent_reg, ha_device.id):
            tk = ent.translation_key
            if tk == START_TIME_TRANSLATION_KEY:
                roles.setdefault("start_entity", ent.entity_id)
            elif tk in (END_TIME_TRANSLATION_KEY, CLOSE_TIME_TRANSLATION_KEY):
                roles.setdefault("end_entity", ent.entity_id)
            elif tk == WATERING_VOLUME_TRANSLATION_KEY:
                roles.setdefault("volume_entity", ent.entity_id)
            elif tk == LAST_RUN_TRANSLATION_KEY:
                roles.setdefault("counter_entity", ent.entity_id)
        # Fallback for legacy installs whose entities have no
        # translation_key — match by entity-id suffix.
        for ent in er.async_entries_for_device(ent_reg, ha_device.id):
            for suffix, role in _ENTITY_SUFFIX_TO_ROLE:
                if ent.entity_id.endswith(suffix):
                    roles.setdefault(role, ent.entity_id)
                    break

        # When the registry sensor is unavailable HA strips its custom
        # attributes, so fall back to the device-registry name.
        valve_name = (
            state.attributes.get("valve_name")
            or ha_device.name_by_user
            or ha_device.name
            or state.attributes.get("friendly_name")
            or state.entity_id
        )
        out.append(
            {
                "tuya_device_id": tuya_device_id,
                "registry_entity_id": state.entity_id,
                "registry_state": state,
                "valve_name": str(valve_name),
                "volume_entity": roles.get("volume_entity"),
                "start_entity": roles.get("start_entity"),
                "end_entity": roles.get("end_entity"),
                "counter_entity": roles.get("counter_entity"),
            }
        )
    return out
