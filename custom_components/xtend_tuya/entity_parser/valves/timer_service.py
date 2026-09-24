"""Timer services for the sfkzq valves: set, delete, resync.

Each timer is written twice. The DP (`time_task` / `time_task_0`, from the
valve's profile) is what the device executes, offline-safe. The cloud timer
registry is a mirror so SmartLife shows the timer; it is optional per hub
(HubSettings.cloud_timer_mirror) and skipped while the hub's quota breaker is
open. Results come back as CommandResult: `dp` for the device, `cloud` for the
mirror. Byte layouts are in codecs/time_task.py.
"""

from __future__ import annotations

import base64
import json
import logging

from ...transport.port import CloudResult, TuyaPort
from .codecs import time_task as tt
from .driver import CommandResult, target
from .const import (
    TUYA_ERR_DEVICE_POOL_QUOTA,
    TUYA_ERR_DEVICE_POOL_QUOTA_MSG,
)

_LOGGER = logging.getLogger(__name__)

_QUOTA_NOTIFICATION_ID = "xtend_tuya_fdm5kw_cloud_quota"

def _notify_quota_exceeded(hass) -> None:
    """Surface the controllable-device quota error as a persistent
    notification once per HA session. The cloud rejected the timer write
    but the device DP still saved locally, so we want the user to know
    *why* SmartLife/cloud sync is degraded without spamming the log on
    every subsequent write."""
    try:
        from homeassistant.components import persistent_notification

        persistent_notification.async_create(
            hass,
            TUYA_ERR_DEVICE_POOL_QUOTA_MSG,
            title="Tuya quota exceeded",
            notification_id=_QUOTA_NOTIFICATION_ID,
        )
    except Exception:  # noqa: BLE001
        _LOGGER.warning("Failed to emit persistent quota notification", exc_info=True)


def _handle_cloud_result(hass, op: str, device_id: str, result: CloudResult) -> None:
    """Surface known soft failures. The port has already paused this hub's
    cloud writes; logging and the notification are the contract. Callers
    continue regardless so the DP write path stays best-effort."""
    if result.reason == "quota_exceeded":
        _LOGGER.warning(
            "Cloud %s for %s hit Tuya quota error %s — %s",
            op,
            device_id,
            TUYA_ERR_DEVICE_POOL_QUOTA,
            TUYA_ERR_DEVICE_POOL_QUOTA_MSG,
        )
        _notify_quota_exceeded(hass)


def _b64(frame: bytes) -> str:
    return base64.b64encode(frame).decode("ascii")


def _get_prior_slot(hass, device_id: str, slot: int) -> dict | None:
    """Look up the current slot data from the registry entity so we can
    match it against the cloud timer registry when deleting/overwriting.
    Returns None if the entity isn't loaded yet or the slot is empty."""
    # Local import avoids a circular import at module load time.
    from .sensor import Fdm5kwTimerRegistryEntity, DPCodeTimeTaskRegistryWrapper

    entity = Fdm5kwTimerRegistryEntity.INSTANCES.get(device_id)
    if entity is None:
        return None
    wrapper = entity._dpcode_wrapper
    if not isinstance(wrapper, DPCodeTimeTaskRegistryWrapper):
        return None
    return wrapper.slots.get(slot)


async def _write_time_task(port: TuyaPort, device_id: str, b64_value: str, code: str) -> bool:
    return await port.send_dp(device_id, [{"code": code, "value": b64_value}])


def _ha_timezone(hass) -> tuple[str, str]:
    """Return (timezone_id, '+H:MM' utc offset) for HA's configured TZ."""
    from datetime import datetime
    try:
        import zoneinfo
    except ImportError:  # pragma: no cover
        from backports import zoneinfo  # type: ignore

    tz_name = getattr(hass.config, "time_zone", None) or "UTC"
    try:
        tz = zoneinfo.ZoneInfo(tz_name)
    except Exception:
        tz = zoneinfo.ZoneInfo("UTC")
    offset = datetime.now(tz).utcoffset()
    if offset is None:
        return tz_name, "+0:00"
    total_minutes = int(offset.total_seconds() // 60)
    sign = "+" if total_minutes >= 0 else "-"
    total_minutes = abs(total_minutes)
    return tz_name, f"{sign}{total_minutes // 60}:{total_minutes % 60:02d}"


async def _post_cloud_timer(
    hass,
    port: TuyaPort,
    device_id: str,
    hour: int,
    minute: int,
    days_mask: int,
    mode: int,
    value: int,
    enabled: bool,
    code: str,
) -> CloudResult:
    """Mirror the timer into the cloud registry so SmartLife shows it.
    Schema (verified 2026-05-12 against Mavronero fleet, fdm5kw category):
    - top-level: category, loops, timezone_id, time_zone, instruct
    - each instruct[]: time (HH:mm), functions [{code, value}]
    The GET response renders the same data with a different layout
    (timer rows nested under groups). Do NOT mirror the GET shape on POST.
    """
    if port.cloud_writes_blocked:
        _LOGGER.warning(
            "Cloud timer POST skipped for %s — quota lockout active (DP-only)",
            device_id,
        )
        return CloudResult("skipped", "quota_lockout")
    time_str = f"{hour:02d}:{minute:02d}"
    loops = tt.mask_to_loops(days_mask)
    start_time_sec = hour * 3600 + minute * 60
    # SmartLife's scheduler UI requires the rich `value` shape — verified
    # against the Mavronero account on 2026-05-12. A minimal body still
    # gets stored, but SL renders it as a half-broken "Single watering"
    # entry and its edit flow hangs.
    func_value = {
        "startTimeStr": time_str,
        "loops": loops,
        "duration": value if mode == tt.MODE_DURATION else 0,
        "capacity": value if mode == tt.MODE_VOLUME else 0,
        "startTime": start_time_sec,
        "start": True,
        "current": 0,
    }
    timezone_id, time_zone = _ha_timezone(hass)
    body = json.dumps(
        {
            "category": "timer",
            "loops": loops,
            "timezone_id": timezone_id,
            "time_zone": time_zone,
            "instruct": [
                {
                    "time": time_str,
                    "date": "00000000",
                    "functions": [{"code": code, "value": func_value}],
                }
            ],
        }
    )
    url = f"/v1.0/devices/{device_id}/timers"
    _LOGGER.warning("Cloud timer POST -> %s body=%s", url, body)
    result = await port.cloud("POST", url, body)
    _LOGGER.warning("Cloud timer POST response for %s: %s", device_id, result.payload)
    _handle_cloud_result(hass, "POST", device_id, result)
    if not result.ok:
        _LOGGER.warning(
            "Cloud timer POST returned no success for %s: %s", device_id, result.reason
        )
    return result


async def _delete_cloud_timer_by_match(
    hass, port: TuyaPort, device_id: str, hour: int, minute: int, days_mask: int
) -> CloudResult:
    """List cloud timers, delete the one matching time+days. Best-effort.

    The result is the first failed DELETE, else ok (reason "no_cloud_match"
    when nothing matched)."""
    if port.cloud_writes_blocked:
        _LOGGER.warning(
            "Cloud timer GET/DELETE skipped for %s — quota lockout active",
            device_id,
        )
        return CloudResult("skipped", "quota_lockout")
    list_url = f"/v1.0/devices/{device_id}/timers"
    _LOGGER.warning(
        "Cloud timer GET -> %s (match %02d:%02d mask=%d)",
        list_url,
        hour,
        minute,
        days_mask,
    )
    listing = await port.cloud("GET", list_url)
    _LOGGER.warning("Cloud timer GET response for %s: %s", device_id, listing.payload)
    _handle_cloud_result(hass, "GET", device_id, listing)
    if not listing.ok:
        _LOGGER.warning(
            "Cloud timer GET non-success for %s, skipping delete", device_id
        )
        return listing
    resp = listing.payload
    time_str = f"{hour:02d}:{minute:02d}"
    loops = tt.mask_to_loops(days_mask)
    matched = False
    outcome = CloudResult("ok")
    for category in resp.get("result", []):
        for group in category.get("groups", []):
            for timer in group.get("timers", []):
                # Prefer the top-level time/loops — always present, including
                # T3 app-created timers whose `functions` list comes back empty.
                funcs = timer.get("functions") or []
                v = funcs[0].get("value", {}) if funcs else {}
                t_time = timer.get("time") or v.get("startTimeStr")
                t_loops = timer.get("loops") or v.get("loops")
                if t_time == time_str and t_loops == loops:
                    # Tuya's selective timer delete takes the timer-group
                    # id as a *query-string* parameter; both path-style
                    # variants (/timers/{group_id}, /timer/group/{id}, …)
                    # return 1108 "uri path invalid". Verified against the
                    # Mavronero account on 2026-05-12 with a throwaway
                    # group: DELETE /timers?group_id=<gid> succeeds and
                    # only removes that group.
                    group_id = group.get("id")
                    if not group_id:
                        continue
                    matched = True
                    del_url = f"/v1.0/devices/{device_id}/timers?group_id={group_id}"
                    _LOGGER.warning("Cloud timer DELETE -> %s", del_url)
                    deleted = await port.cloud("DELETE", del_url)
                    _LOGGER.warning(
                        "Cloud timer DELETE response for %s: %s",
                        device_id,
                        deleted.payload if deleted.payload is not None else deleted.reason,
                    )
                    _handle_cloud_result(hass, "DELETE", device_id, deleted)
                    if outcome.ok and not deleted.ok:
                        outcome = deleted
    if not matched:
        _LOGGER.warning(
            "Cloud timer no entries matched %s for %s", time_str, device_id
        )
        return CloudResult("ok", "no_cloud_match")
    return outcome


async def set_timer(hass, data: dict) -> CommandResult:
    device_id: str = data["device_id"]
    slot: int = int(data["slot"])
    hour: int = int(data["hour"])
    minute: int = int(data["minute"])
    mode: int = tt.mode_from_name(data.get("mode", "duration"))
    value: int = int(data["value"])
    days_mask: int = tt.days_to_mask(data.get("days"))
    enabled: bool = bool(data.get("enabled", True))

    found = target(hass, device_id)
    if isinstance(found, CommandResult):
        _LOGGER.error("set_timer: %s for device %s", found.reason, device_id)
        return found
    port, codec = found.port, found.profile.timer
    if codec is None:
        return CommandResult(device_id, "unsupported", reason="no_timers")

    # When this is an edit (not a create), look up the prior slot state so
    # we can delete the cloud entry that's about to be replaced. Avoids
    # duplicate SmartLife timer entries after time/day changes.
    prior = _get_prior_slot(hass, device_id, slot)

    # The cloud POST uses the profile's DP code as its function code; T3
    # `time_task_0` renders back on GET (verified 2026-07-15).
    timer = tt.Timer(slot, hour, minute, mode, value, days_mask, enabled)
    if not await _write_time_task(port, device_id, _b64(codec.encode(timer)), codec.code):
        return CommandResult(device_id, "failed")

    if not port.has_cloud_account:
        _LOGGER.warning("set_timer: no tuya_iot account for %s (DP write only)", device_id)
        return CommandResult(device_id, "ok", reason="no_openapi_account")
    if not port.settings.cloud_timer_mirror:
        _LOGGER.info("set_timer: SmartLife mirror off for this hub, %s is DP-only", device_id)
        return CommandResult(device_id, "ok", reason="mirror_disabled")
    _LOGGER.warning(
        "set_timer: tuya_iot account found for %s, proceeding to cloud write",
        device_id,
    )

    if prior is not None:
        _LOGGER.warning(
            "set_timer: prior slot %d for %s = %s, deleting cloud match first",
            slot,
            device_id,
            prior,
        )
        await _delete_cloud_timer_by_match(
            hass,
            port,
            device_id,
            int(prior.get("hour", hour)),
            int(prior.get("minute", minute)),
            int(prior.get("days_mask", days_mask)),
        )

    # Tuya's OpenAPI has no per-timer enable/disable toggle (PUT
    # /timers/groups/{gid}/status is rejected with 1108; PUT on the
    # group body ignores `status` and resets it to 1). The closest
    # equivalent: when HA marks the timer disabled, leave it out of
    # the cloud registry entirely so the cloud can't fire it. The
    # device DP still carries the disabled bit for offline execution.
    # Net effect in SmartLife: the entry disappears from the schedule
    # tab when disabled and reappears on re-enable. Verified
    # 2026-05-12.
    if not enabled:
        _LOGGER.warning(
            "set_timer: enabled=False for slot %d on %s — skipping cloud POST "
            "so SmartLife schedule doesn't fire (no API to keep a disabled entry)",
            slot,
            device_id,
        )
        return CommandResult(device_id, "ok", reason="disabled_timer_not_mirrored")

    posted = await _post_cloud_timer(
        hass, port, device_id, hour, minute, days_mask, mode, value, enabled,
        code=codec.code,
    )
    return CommandResult(device_id, "ok", cloud=posted.status, reason=posted.reason)


async def _get_cloud_timer_keys(port: TuyaPort, device_id: str) -> set[tuple[str, str]] | None:
    """GET the cloud timer registry and return the set of (time_str, loops)
    keys it holds. Read-only — draws the 26k/mo API-call pool, NOT the
    10-controllable-device cap. Returns None if the GET failed (so callers
    don't mistake an API failure for an empty cloud registry and wipe every
    HA slot as a ghost)."""
    list_url = f"/v1.0/devices/{device_id}/timers"
    listing = await port.cloud("GET", list_url)
    if not listing.ok:
        _LOGGER.warning("resync: cloud timer GET non-success for %s: %s", device_id, listing.reason)
        return None
    resp = listing.payload
    keys: set[tuple[str, str]] = set()
    for category in resp.get("result", []):
        for group in category.get("groups", []):
            for timer in group.get("timers", []):
                # Top-level time/loops first — T3 app timers report empty
                # `functions`, so keying off the value dict alone would miss
                # them and (in resync) flag every enabled slot as an orphan.
                funcs = timer.get("functions") or []
                v = funcs[0].get("value", {}) if funcs else {}
                t = timer.get("time") or v.get("startTimeStr")
                loops = timer.get("loops") or v.get("loops")
                if t is not None and loops is not None:
                    keys.add((t, loops))
    return keys


async def resync_from_cloud(hass, data: dict) -> dict:
    """Reconcile the HA timer registry against the Tuya cloud, clearing the
    live orphan (zombie) slots the cloud no longer knows about.

    A *live orphan* = an ENABLED HA slot with no matching cloud timer. Enabled
    timers are always cloud-posted (`set_timer` posts on enable), so a missing
    cloud entry means the cloud rolled back / a SmartLife delete left the
    device slot live — it WILL water offline with no cloud entry (the 969
    04:20 case). Clear the device slot: a control write, 1 unit against the
    10/valve/month cap for this account.

    DISABLED slots are deliberately left alone. `set_timer` never posts a
    disabled timer to the cloud, so a legitimately user-disabled timer is
    indistinguishable from a disabled ghost by cloud state alone — dropping it
    would delete a real timer the user just toggled off. Disabled ghosts don't
    fire, so they're harmless clutter; leave manual cleanup for those.

    Read-first by construction: the GET is always free against the control
    cap; a write happens only per live orphan found. User-triggered per valve,
    so it can't runaway the quota the way a periodic sweep would."""
    device_id: str = data["device_id"]
    found = target(hass, device_id)
    if isinstance(found, CommandResult) or not found.port.has_cloud_account:
        _LOGGER.warning("resync: no tuya_iot account for %s — cannot reconcile", device_id)
        return {"success": False, "error": "no_cloud_account"}
    port, codec = found.port, found.profile.timer
    if codec is None:
        return {"success": False, "error": "no_timers"}
    # Without the mirror no HA timer is in the cloud, so every enabled slot
    # would look like an orphan and be cleared. Refuse instead.
    if not port.settings.cloud_timer_mirror:
        return {"success": False, "error": "cloud_mirror_disabled"}

    from .sensor import Fdm5kwTimerRegistryEntity

    entity = Fdm5kwTimerRegistryEntity.INSTANCES.get(device_id)
    if entity is None:
        _LOGGER.warning("resync: no timer registry entity loaded for %s", device_id)
        return {"success": False, "error": "no_registry_entity"}
    wrapper = entity._dpcode_wrapper
    slots: dict = getattr(wrapper, "slots", None)
    if slots is None:
        return {"success": False, "error": "no_registry_slots"}

    cloud_keys = await _get_cloud_timer_keys(port, device_id)
    if cloud_keys is None:
        return {"success": False, "error": "cloud_get_failed"}

    # A GET that succeeds but comes back empty is not proof that every timer
    # is an orphan: a degraded-but-successful response (device offline,
    # project moved, registry not yet consistent) would have us clear every
    # enabled slot on the valve and burn a control write per slot, with no
    # way back — the DP is overwritten (audit C7). A device with timers and
    # an empty cloud registry is a cloud problem, not an orphan problem.
    enabled_slots = [idx for idx, s in slots.items() if s and s.get("enabled")]
    if not cloud_keys and enabled_slots:
        _LOGGER.warning(
            "resync: the cloud reports zero timers for %s while HA holds %d "
            "enabled slot(s) %s — that is a cloud/registry problem, not "
            "orphans; nothing cleared",
            device_id,
            len(enabled_slots),
            enabled_slots,
        )
        return {"success": False, "error": "cloud_registry_empty"}

    locked_out = port.cloud_writes_blocked

    checked = orphans_cleared = orphans_deferred = 0
    for slot_idx, s in list(slots.items()):
        if not s:
            continue
        checked += 1
        # Only enabled slots are judged — disabled ones are never in the cloud
        # by design (see docstring), so "no cloud match" tells us nothing.
        if not s.get("enabled"):
            continue
        key = (
            f"{int(s.get('hour', 0)):02d}:{int(s.get('minute', 0)):02d}",
            tt.mask_to_loops(int(s.get("days_mask", 0))),
        )
        if key in cloud_keys:
            continue  # legit — cloud agrees it exists
        # Live orphan — fires offline with no cloud entry. Needs a device slot
        # clear (control write). Skip if quota-locked; the write would just
        # fail, so report it deferred rather than burn a call.
        if locked_out:
            orphans_deferred += 1
            _LOGGER.warning(
                "resync: live orphan slot %d on %s left in place (quota lockout / no manager)",
                slot_idx, device_id,
            )
            continue
        if await _write_time_task(port, device_id, _b64(codec.clear(slot_idx)), codec.code):
            slots[slot_idx] = None
            orphans_cleared += 1
            _LOGGER.warning(
                "resync: cleared live orphan slot %d on %s (no cloud entry)",
                slot_idx, device_id,
            )
        else:
            orphans_deferred += 1

    if orphans_cleared:
        entity.async_write_ha_state()

    result = {
        "success": True,
        "checked": checked,
        "orphans_cleared": orphans_cleared,
        "orphans_deferred": orphans_deferred,
    }
    _LOGGER.warning("resync %s: %s", device_id, result)
    return result


async def delete_timer(hass, data: dict) -> CommandResult:
    device_id: str = data["device_id"]
    slot: int = int(data["slot"])

    found = target(hass, device_id)
    if isinstance(found, CommandResult):
        _LOGGER.error("delete_timer: %s for device %s", found.reason, device_id)
        return found
    port, codec = found.port, found.profile.timer
    if codec is None:
        return CommandResult(device_id, "unsupported", reason="no_timers")

    # Capture the slot's current time/days BEFORE we wipe the DP so we can
    # match the cloud timer entry on the way out.
    prior = _get_prior_slot(hass, device_id, slot)
    _LOGGER.warning(
        "delete_timer: device=%s slot=%d prior=%s", device_id, slot, prior
    )

    # The cloud delete-by-match below is code-agnostic (matches on time/loops).
    if not await _write_time_task(port, device_id, _b64(codec.clear(slot)), codec.code):
        return CommandResult(device_id, "failed")

    if not port.has_cloud_account:
        _LOGGER.warning("delete_timer: no tuya_iot account for %s (DP-only delete)", device_id)
        return CommandResult(device_id, "ok", reason="no_openapi_account")
    if not port.settings.cloud_timer_mirror:
        _LOGGER.info("delete_timer: SmartLife mirror off for this hub, %s is DP-only", device_id)
        return CommandResult(device_id, "ok", reason="mirror_disabled")
    if prior is None:
        _LOGGER.warning(
            "delete_timer: no prior slot data for %s slot %d — cannot match cloud entry",
            device_id,
            slot,
        )
        return CommandResult(device_id, "ok", reason="no_prior_slot")

    removed = await _delete_cloud_timer_by_match(
        hass,
        port,
        device_id,
        int(prior.get("hour", 0)),
        int(prior.get("minute", 0)),
        int(prior.get("days_mask", 0)),
    )
    return CommandResult(device_id, "ok", cloud=removed.status, reason=removed.reason)
