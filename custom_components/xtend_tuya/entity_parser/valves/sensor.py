"""Irrigation valve (fdm5kw) data parser for raw Tuya DP codes."""

from __future__ import annotations
import base64
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Callable, Mapping

from homeassistant.const import (
    EntityCategory,
    UnitOfVolumeFlowRate,
    UnitOfVolume,
    PERCENTAGE,
)
from homeassistant.components.sensor import SensorStateClass, SensorDeviceClass
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.util.dt import DEFAULT_TIME_ZONE
from tuya_device_handlers.definition.sensor import (
    SensorDefinition as TuyaSensorDefinition,
)
from ...sensor import (
    XTSensorEntity,
    XTSensorEntityDescription,
)
from ...multi_manager.multi_manager import (
    XTDevice,
    MultiManager,
)
from ...ha_tuya_integration.tuya_integration_imports import (
    TuyaCustomerDevice,
    TuyaDPCodeRawWrapper,
    TuyaRawTypeInformation,
)
from ...farm.water_math import plausible_delta
from ...const import XTDPCode
from . import location_service
from .codecs import counter_custom, run_times, single_run, t3_status
from .codecs import time_task as tt

_LOGGER = logging.getLogger(__name__)

# DP codes not yet in XTDPCode — use string literals until PR is merged
DP_ONE_CONTROL = single_run.ONE_CONTROL_CODE
DP_TIME_TASK = tt.QT08W_CODE
DP_RUN_TASK_STA = "run_task_sta"
DP_CUR_CAP = "cur_cap"
DP_START_TIME = "start_time"

# How often to re-publish the flow-rate sensor state while a run is active.
# Pure local recomputation (no API call) — cost is one recorder row per tick
# per running valve. Simon asked for 10s in the 2026-05-12 review.
FLOW_RATE_REFRESH = timedelta(seconds=10)

from .const import DEVICE_CATEGORY


# ---------------------------------------------------------------------------
# Raw DP Wrappers
# ---------------------------------------------------------------------------


class XTDPCodeRawStatusWrapper(TuyaDPCodeRawWrapper):
    """Raw DP wrapper that also binds on status presence.

    tuya-device-handlers 0.0.22 changed ``DPCodeWrapper.find_dpcode`` to bind
    only when the DP is declared in the device *spec* (``device.function`` /
    ``device.status_range``) with ``type == RAW``. fdm5kw valves obtained over
    the sharing API report ``time_task`` / ``start_time`` / ``close_time`` /
    ``one_control`` as *status values* only — the sharing spec lists just DPs
    1 + 11 — so the strict lookup returns ``None`` and the timer/name/last-run
    entities silently vanish (regressed in the 0.0.22 merge, v4.4.181: ~85 of
    100 valves dropped to the bare "Valve" entity with no timer).

    Restore the pre-0.0.22 behaviour: try the spec-based lookup first (so
    OpenAPI-spec devices keep their real type information), and only if that
    misses, synthesize a ``RawTypeInformation`` from a DP that is present in
    ``device.status``. ``RawTypeInformation.read_device_value`` reads straight
    from ``device.status`` and base64-decodes — it never consults ``type_data``
    — so a synthesized instance decodes identically.
    """

    @classmethod
    def find_dpcode(
        cls,
        device: TuyaCustomerDevice,
        dpcodes: str | tuple[str, ...] | None,
        *,
        prefer_function: bool = False,
    ):
        if wrapper := super().find_dpcode(
            device, dpcodes, prefer_function=prefer_function
        ):
            return wrapper
        if dpcodes is None:
            return None
        if not isinstance(dpcodes, tuple):
            dpcodes = (dpcodes,)
        for dpcode in dpcodes:
            if device.status.get(dpcode) is not None:
                return cls(
                    dpcode=dpcode,
                    type_information=TuyaRawTypeInformation(
                        dpcode=dpcode, type_data="{}", report_type=None
                    ),
                )
        return None


class DPCodeLastReportWrapper(XTDPCodeRawStatusWrapper):
    """When this device last reported anything — NOT a DP value.

    Entity availability across the whole integration is the cloud `online`
    flag and nothing else, so a valve that stopped reporting keeps showing
    frozen values and looks perfectly healthy. That is the mechanism behind
    "HA disagrees with the SmartLife app" (audit C23). The multi-manager
    stamps `last_report_ts` (epoch seconds, 0.0 when unknown) on every
    XTDevice as reports arrive; this surfaces it.

    It is bound to a DP purely because entity creation is DP-presence-gated
    — the DP's own value is never read. A device whose manager predates the
    stamp simply reports unknown.
    """

    def read_device_status(self, device: TuyaCustomerDevice) -> datetime | None:
        try:
            ts = float(getattr(device, "last_report_ts", 0.0) or 0.0)
        except (TypeError, ValueError):
            return None
        if ts <= 0:
            return None
        return datetime.fromtimestamp(ts, tz=DEFAULT_TIME_ZONE)


class DPCodeTimestampWrapper(XTDPCodeRawStatusWrapper):
    """start_time / close_time as 'YYYY-MM-DD HH:MM:SS' (codecs/run_times.py)."""

    def read_device_status(self, device: TuyaCustomerDevice) -> str | None:
        if decoded := super().read_device_status(device):
            return run_times.decode(bytes(decoded))
        return None


class DPCodeOneControlWrapper(XTDPCodeRawStatusWrapper):
    """one_control status: (lead, value) of the last single watering (codecs/single_run.py)."""

    def __init__(self, dpcode: str, type_information: TuyaRawTypeInformation) -> None:
        super().__init__(dpcode, type_information)
        self.mode: int | None = None
        self.value: int | None = None

    def update_data(self, device: TuyaCustomerDevice) -> None:
        if decoded := super().read_device_status(device):
            if parsed := single_run.decode_one_control(bytes(decoded)):
                self.mode, self.value = parsed


class DPCodeOneControlModeWrapper(DPCodeOneControlWrapper):
    """"idle" / "duration" / "volume" (lead 0 = duration, 1 = volume, verified 2026-06-09)."""

    def read_device_status(self, device: TuyaCustomerDevice) -> str | None:
        self.update_data(device)
        if self.mode is None:
            return None
        return single_run.one_control_mode(self.mode, self.value or 0)


class DPCodeOneControlValueWrapper(DPCodeOneControlWrapper):
    """The one_control parameter value (duration in sec or volume in L)."""

    def read_device_status(self, device: TuyaCustomerDevice) -> int | None:
        self.update_data(device)
        return self.value


class DPCodeTimeTaskWrapper(XTDPCodeRawStatusWrapper):
    """The timer in the sliding-window timer DP (layouts in codecs/time_task.py).

    `decode` is the product's codec; the T3 variants below only swap it.
    """

    decode = staticmethod(tt.decode_qt08w)

    def __init__(self, dpcode: str, type_information: TuyaRawTypeInformation) -> None:
        super().__init__(dpcode, type_information)
        self.slot_index: int = 0
        self.timer: dict | None = None

    def update_data(self, device: TuyaCustomerDevice) -> None:
        if decoded := super().read_device_status(device):
            if (frame := self.decode(bytes(decoded))) is not None:
                self.slot_index = frame.index
                self.timer = frame.timer.as_attribute() if frame.timer else None


class DPCodeTimeTaskSlotWrapper(DPCodeTimeTaskWrapper):
    """Returns the slot index of the last-modified timer."""

    def read_device_status(self, device: TuyaCustomerDevice) -> int | None:
        self.update_data(device)
        return self.slot_index if self.timer else None


class DPCodeTimeTaskSummaryWrapper(DPCodeTimeTaskWrapper):
    """Returns a human-readable summary of the last-modified timer."""

    def read_device_status(self, device: TuyaCustomerDevice) -> str | None:
        self.update_data(device)
        if not self.timer:
            return "No timer data"
        t = self.timer
        status = "ON" if t["enabled"] else "OFF"
        days_str = ",".join(t["days"]) if t["days"] else "none"
        if t["mode"] == "duration":
            duration_min = t["value"] // 60
            return (
                f"Slot {t['slot']}: {t['hour']:02d}:{t['minute']:02d} "
                f"{duration_min}min {days_str} [{status}]"
            )
        return (
            f"Slot {t['slot']}: {t['hour']:02d}:{t['minute']:02d} "
            f"{t['value']}L {days_str} [{status}]"
        )


class DPCodeTimeTaskRegistryWrapper(DPCodeTimeTaskWrapper):
    """Accumulates all 7 timer slots across DP updates.

    The device's time_task DP is a sliding window that only shows the
    last-written slot. This wrapper maintains a dict of all 7 slots,
    updating each slot as its data comes through the DP. The registry
    persists across HA restarts via the companion entity's state
    restoration. The device DP is the single source of truth — no cloud
    timer registry is consulted.
    """

    NUM_SLOTS = 7

    def __init__(self, dpcode: str, type_information: TuyaRawTypeInformation) -> None:
        super().__init__(dpcode, type_information)
        self.slots: dict[int, dict | None] = {i: None for i in range(self.NUM_SLOTS)}
        # The DP is a sliding window that shows the last write/delete. Apply
        # each unique payload to slots once; without this guard, every state
        # read would re-apply the last delete and wipe a previously restored
        # slot.
        self._last_applied_payload: bytes | None = None

    def read_device_status(self, device: TuyaCustomerDevice) -> str | None:
        """Parse DP, apply once per unique payload, return active count."""
        raw = super().read_device_status(device)
        payload = bytes(raw) if isinstance(raw, (bytes, bytearray)) else None
        if payload is not None and payload != self._last_applied_payload:
            self.update_data(device)
            if self.timer is not None:
                idx = self.timer["slot"]
                if 0 <= idx < self.NUM_SLOTS:
                    self.slots[idx] = dict(self.timer)
                    # Tuya's cloud registry can map two timers onto the same
                    # device slot (seen live on 969: 04:05 and 22:05 both as
                    # slot 1). When that slot's push carries a time+days that
                    # another slot already holds, the other entry is a stale
                    # duplicate of this same timer — drop it so the registry
                    # doesn't show one timer twice / a ghost that never fires.
                    for other, s in self.slots.items():
                        if (
                            other != idx
                            and s
                            and s.get("hour") == self.timer["hour"]
                            and s.get("minute") == self.timer["minute"]
                            and s.get("days_mask") == self.timer["days_mask"]
                        ):
                            _LOGGER.warning(
                                "time_task slot %d duplicates slot %d (%02d:%02d) — dropping stale entry",
                                other,
                                idx,
                                self.timer["hour"],
                                self.timer["minute"],
                            )
                            self.slots[other] = None
            elif self.slot_index is not None and 0 <= self.slot_index < self.NUM_SLOTS:
                # count=0 means slot was deleted
                self.slots[self.slot_index] = None
            self._last_applied_payload = payload
        active = sum(1 for s in self.slots.values() if s and s.get("enabled"))
        return str(active)

    def get_slots_dict(self) -> dict[str, dict | None]:
        """Return slots keyed by string index (for JSON-safe HA attributes)."""
        return {str(k): v for k, v in self.slots.items()}

    def restore_slots(self, data: dict) -> None:
        """Hydrate slots from HA state restoration."""
        for i in range(self.NUM_SLOTS):
            slot_data = data.get(str(i)) or data.get(i)
            if isinstance(slot_data, dict):
                self.slots[i] = slot_data
            else:
                self.slots[i] = None


# ---------------------------------------------------------------------------
# Custom Entity for Timer Registry
# ---------------------------------------------------------------------------


class Fdm5kwTimerRegistryEntity(XTSensorEntity):
    """Sensor that exposes all 7 timer slots as attributes.

    State value = count of active (enabled) timers.
    Attributes contain the full slot registry for the irrigation-timer-card.
    Slots accumulate from the device's time_task DP push events; the
    registry survives HA restarts via state restoration.
    """

    # device_id → live entity instance
    INSTANCES: dict[str, "Fdm5kwTimerRegistryEntity"] = {}

    @property
    def extra_state_attributes(self) -> Mapping[str, Any] | None:
        wrapper = self._dpcode_wrapper
        if not isinstance(wrapper, DPCodeTimeTaskRegistryWrapper):
            return None
        slots = wrapper.get_slots_dict()
        active = sum(1 for s in slots.values() if s and s.get("enabled"))
        location = location_service.get_location(self.device.id) or {}
        return {
            "slots": slots,
            "active_count": active,
            "valve_name": self.device.name,
            "valve_home": location.get("home"),
            "valve_room": location.get("room"),
            "device_id": self.device.id,
            "product_name": getattr(self.device, "product_name", None),
        }

    async def async_added_to_hass(self) -> None:
        """Restore slot registry from previous HA state."""
        await super().async_added_to_hass()
        Fdm5kwTimerRegistryEntity.INSTANCES[self.device.id] = self

        # Populate the valve home/room map (and put the owning hub on a slow
        # refresh) the first time any timer sensor is added. Fire-and-forget:
        # a location fetch must never block or break entity setup.
        multi_manager = self.device.get_multi_manager(self.hass)
        if multi_manager is not None:
            self.hass.async_create_task(
                location_service.async_ensure_scheduled(self.hass, multi_manager)
            )

        wrapper = self._dpcode_wrapper
        if not isinstance(wrapper, DPCodeTimeTaskRegistryWrapper):
            return

        # Prime the idempotency guard with the device's current DP payload
        # before restoring slots; otherwise the next state read would re-apply
        # the last DP push (often a delete) and trample the restored data.
        try:
            wrapper.read_device_status(self.device)
        except Exception:
            _LOGGER.debug(
                "fdm5kw: priming read_device_status for %s failed",
                self.entity_id,
                exc_info=True,
            )

        last_state = await self.async_get_last_state()
        if last_state is not None:
            slots_data = last_state.attributes.get("slots")
            if isinstance(slots_data, dict):
                wrapper.restore_slots(slots_data)
                _LOGGER.debug(
                    "Restored timer registry for %s: %s",
                    self.entity_id,
                    slots_data,
                )

        # Force a state write so attributes (valve_name, slots, etc.) reach
        # the frontend immediately. Without this, devices that haven't seen
        # a fresh DP push since boot keep the prior boot's attributes — the
        # dashboard strategy then falls back to device_id for the tile name.
        self.async_write_ha_state()

    async def async_will_remove_from_hass(self) -> None:
        Fdm5kwTimerRegistryEntity.INSTANCES.pop(self.device.id, None)
        await super().async_will_remove_from_hass()


def _republish_valve_location() -> None:
    """Re-publish timer-registry state so newly-fetched home/room attributes
    reach the frontend immediately (the map fills async, after the entities'
    first state write). Runs in the event loop via location_service."""
    for entity in list(Fdm5kwTimerRegistryEntity.INSTANCES.values()):
        if entity.hass is not None:
            entity.async_write_ha_state()


if _republish_valve_location not in location_service.REFRESH_LISTENERS:
    location_service.REFRESH_LISTENERS.append(_republish_valve_location)


# ---------------------------------------------------------------------------
# Custom Entity for Derived Flow Rate (l/min)
# ---------------------------------------------------------------------------


class Fdm5kwFlowRateEntity(XTSensorEntity):
    """Derived instantaneous flow-rate sensor (liters/minute).

    Uses a differential method: between two 10 s samples, flow rate is
    `(cur_cap_now - cur_cap_prev) * 60 / delta_seconds`. The FDM5KW has
    a real Hall-effect impeller inside the valve body (2–25 L/min range
    per the QOTO QT-08W spec), so `cur_cap` reflects actual liters and
    the resulting graph captures real flow variations — pressure dips,
    partial restrictions, etc.

    The 10 s tick is purely local: it reads `device.status["cur_cap"]`,
    which is kept fresh by the upstream MQTT push. No Tuya API calls
    are issued.

    Idle state (run_task_sta != 1) reports 0.0. Below ~2 L/min the
    impeller doesn't tick and `cur_cap` stalls, so the derived rate
    will read 0 even with water flowing — a hardware limit, not a bug.
    """

    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 2

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._refresh_unsub: Callable[[], None] | None = None
        self._was_running: bool = False
        self._last_cur_cap: int | None = None
        self._last_ts: datetime | None = None
        self._current_flow: float = 0.0

    @property
    def native_unit_of_measurement(self) -> str:
        # Hard-coded as a property to defeat the base XTSensorEntity's
        # unit inheritance from the `cur_cap` Tuya DP data-model, which
        # carries a Chinese-localized "升 (L)" unit string. This sensor
        # is a derived rate; force "L/min" regardless of what the upstream
        # DP definition says.
        return str(UnitOfVolumeFlowRate.LITERS_PER_MINUTE)

    @property
    def device_class(self) -> str | None:
        # Same reason: prevent the base class from injecting
        # SensorDeviceClass.WATER which forces a volume unit.
        return None

    @property
    def native_value(self) -> float:
        return self._current_flow

    def _recompute(self) -> bool:
        """Update self._current_flow. Returns True if a state write
        should fire (state changed, or run is active and the recorder
        wants a fresh row)."""
        running = self.device.status.get(DP_RUN_TASK_STA) == 1
        cur_cap_raw = self.device.status.get(DP_CUR_CAP) or 0
        try:
            cur_cap = int(cur_cap_raw)
        except (TypeError, ValueError):
            cur_cap = 0
        now = datetime.now()

        if not running:
            changed = self._was_running or self._current_flow != 0.0
            self._current_flow = 0.0
            self._last_cur_cap = None
            self._last_ts = None
            self._was_running = False
            return changed

        if not self._was_running or self._last_ts is None or self._last_cur_cap is None:
            # Run just started: capture baseline, emit 0 once.
            self._last_cur_cap = cur_cap
            self._last_ts = now
            changed = self._current_flow != 0.0 or not self._was_running
            self._current_flow = 0.0
            self._was_running = True
            return changed

        delta_t = (now - self._last_ts).total_seconds()
        if delta_t <= 0:
            return False
        # Glitch spikes are rejected per-DELTA, not per-absolute-value: on the
        # valves whose cur_cap is a lifetime odometer an absolute ceiling
        # latches and pins this rate at 0 forever (audit D3/R16). None = the
        # jump is impossible — drop the sample and keep the old baseline, so
        # the next real reading resumes a sane delta.
        delta_cap = plausible_delta(self._last_cur_cap, cur_cap, delta_t)
        if delta_cap is None:
            return False
        self._current_flow = round(delta_cap * 60.0 / delta_t, 2)
        self._last_cur_cap = cur_cap
        self._last_ts = now
        self._was_running = True
        # Always emit while running so the graph has dense rows.
        return True

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self._refresh_unsub = async_track_time_interval(
            self.hass, self._on_tick, FLOW_RATE_REFRESH
        )

    async def async_will_remove_from_hass(self) -> None:
        if self._refresh_unsub is not None:
            self._refresh_unsub()
            self._refresh_unsub = None
        await super().async_will_remove_from_hass()

    async def _on_tick(self, _now: datetime) -> None:
        if self._recompute():
            self.async_write_ha_state()


# ---------------------------------------------------------------------------
# QT-08W-T3 valve — raw DP wrappers (product rjnqkjk1pct15ku2)
# ---------------------------------------------------------------------------
# The T3 is a DIFFERENT product from the QT-08W (o6dagifntoafakst): indexed DP
# model (switch_1, time_task_0, flow_sta_0, sat_0, counter_custom), no
# vbat_state / cur_cap / one_control. Battery is byte-packed inside sat_0.
# Decoders validated against live captures 2026-07-15 — see
# ~/Documents/work/irrigation-t3-dp-decode.md. All descriptors below are
# DP-presence-gated, so they only spawn on T3 devices and never touch the old
# QT-08W (which lacks these codes) — same coexistence model as every other
# fdm5kw descriptor.

DP_T3_SAT = t3_status.SAT_CODE
DP_T3_FLOW_STA = t3_status.FLOW_STA_CODE
DP_T3_COUNTER = counter_custom.CODE
DP_T3_TIME_TASK = tt.T3_CODE


class DPCodeSat0BatteryWrapper(XTDPCodeRawStatusWrapper):
    """T3 battery % from sat_0 (codecs/t3_status.py)."""

    def read_device_status(self, device: TuyaCustomerDevice) -> str | None:
        decoded = super().read_device_status(device)
        if decoded and (percent := t3_status.battery_percent(bytes(decoded))) is not None:
            return str(percent)
        return None


class DPCodeSat0NextRunWrapper(XTDPCodeRawStatusWrapper):
    """T3 next irrigation from sat_0.

    The firmware stops refreshing the DATE part while H:M stays right (6 of 11
    valves published a past stamp, one three weeks old; audit D5), so roll it
    forward the way SmartLife does, honouring the day mask of the timer in
    time_task_0 when its H:M agrees.
    """

    def read_device_status(self, device: TuyaCustomerDevice) -> datetime | None:
        decoded = super().read_device_status(device)
        naive = t3_status.next_run_stamp(bytes(decoded)) if decoded else None
        if naive is None:
            return None
        days_mask = _scheduled_days_mask(device, naive.hour, naive.minute)
        rolled = t3_status.next_occurrence(naive, days_mask, datetime.now())
        return rolled.replace(tzinfo=DEFAULT_TIME_ZONE)


def _scheduled_days_mask(device: TuyaCustomerDevice, hour: int, minute: int) -> int:
    """Day mask of the time_task_0 timer at `hour`:`minute`, else 0 (= every day).

    The DP only holds the last-written timer, so this is a best effort.
    """
    raw = device.status.get(tt.T3_CODE)
    if not isinstance(raw, str) or not raw:
        return 0
    try:
        frame = tt.decode_t3(base64.b64decode(raw))
    except ValueError:
        return 0
    timer = frame.timer if frame else None
    if timer is None or timer.hour != hour or timer.minute != minute:
        return 0
    return timer.days_mask


class DPCodeFlowStaVolumeWrapper(XTDPCodeRawStatusWrapper):
    """T3 watering volume (L) from flow_sta_0: live during a run, then the run total."""

    def read_device_status(self, device: TuyaCustomerDevice) -> str | None:
        decoded = super().read_device_status(device)
        if decoded and (liters := t3_status.flow_volume_liters(bytes(decoded))) is not None:
            return str(liters)
        return None


class DPCodeCounterCustomLastRunWrapper(XTDPCodeRawStatusWrapper):
    """T3 last completed run: the counter_custom CSV as the state (codecs/counter_custom.py).

    The runs store listens on this entity to record T3 runs (the QT-08W path
    keys off start/end-time sensors the T3 firmware does not provide).
    """

    # NOTE 1: do NOT gate binding in find_dpcode here. Entity creation is
    # decided by XTEntity._supports_description ("dpcode in device.status"),
    # not by the wrapper — a find_dpcode that returns None does not suppress
    # the entity, it just drops it to the generic raw handler (live regression
    # 4.4.237). Old valves report counter_custom as a bare number ('9000');
    # parse rejects it and the sensor stays 'unknown' — those dead entities
    # are disabled in the entity registry instead (one-time, persisted).
    # NOTE 2: this override is load-bearing — without it the inherited RAW
    # read base64-"decodes" the CSV into byte garbage (4.4.237/238 dropped it
    # by accident and every last-run state broke).
    def read_device_status(self, device: TuyaCustomerDevice) -> str | None:
        raw = device.status.get(self.dpcode)
        if counter_custom.parse(raw) is None:
            return None
        return counter_custom.as_csv(raw)


class DPCodeT3TimeTaskWrapper(DPCodeTimeTaskWrapper):
    """T3 time_task_0: same sliding-window model, 12-byte layout.

    Ghost caveat (proven live): a SmartLife delete neither clears the DP nor
    sets enabled=0, so deletions are invisible here and need the resync path.
    """

    decode = staticmethod(tt.decode_t3)


class DPCodeT3TimeTaskSlotWrapper(DPCodeTimeTaskSlotWrapper):
    decode = staticmethod(tt.decode_t3)


class DPCodeT3TimeTaskSummaryWrapper(DPCodeTimeTaskSummaryWrapper):
    decode = staticmethod(tt.decode_t3)


class DPCodeT3TimeTaskRegistryWrapper(DPCodeTimeTaskRegistryWrapper):
    decode = staticmethod(tt.decode_t3)


# ---------------------------------------------------------------------------
# Entity Descriptors
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Fdm5kwSensorEntityDescription(XTSensorEntityDescription):
    """Describes fdm5kw irrigation valve sensor entity."""

    pass


@dataclass(frozen=True)
class Fdm5kwTimerRegistryDescription(Fdm5kwSensorEntityDescription):
    """Descriptor that returns a Fdm5kwTimerRegistryEntity instead of base XTSensorEntity."""

    def get_entity_instance(
        self,
        device: XTDevice,
        device_manager: MultiManager,
        description: XTSensorEntityDescription,
        definition: TuyaSensorDefinition,
        supported_descriptors: dict[str, tuple[XTSensorEntityDescription, ...]],
    ) -> Fdm5kwTimerRegistryEntity:
        return Fdm5kwTimerRegistryEntity(
            device=device,
            device_manager=device_manager,
            description=XTSensorEntityDescription(**description.__dict__),
            definition=definition,
            supported_descriptors=supported_descriptors,
        )


@dataclass(frozen=True)
class Fdm5kwFlowRateDescription(Fdm5kwSensorEntityDescription):
    """Descriptor that returns a Fdm5kwFlowRateEntity (derived l/min)."""

    def get_entity_instance(
        self,
        device: XTDevice,
        device_manager: MultiManager,
        description: XTSensorEntityDescription,
        definition: TuyaSensorDefinition,
        supported_descriptors: dict[str, tuple[XTSensorEntityDescription, ...]],
    ) -> Fdm5kwFlowRateEntity:
        return Fdm5kwFlowRateEntity(
            device=device,
            device_manager=device_manager,
            description=XTSensorEntityDescription(**description.__dict__),
            definition=definition,
            supported_descriptors=supported_descriptors,
        )


class Fdm5kwSensor:
    FDM5KW_SENSORS: dict[str, tuple[XTSensorEntityDescription, ...]] = {}

    @staticmethod
    def initialize_sensor() -> None:
        sensors: list[Fdm5kwSensorEntityDescription] = [
            # --- Timestamps ---
            # translation_key is what the strategy + calendar use to map a
            # sibling entity to its role (start/end/mode/registry). Existing
            # entities created before 4.4.150 have null translation_key in
            # the entity registry; the strategy + calendar fall back to
            # entity-id suffix matching for those.
            # NOTE: every descriptor below sets ignore_other_dp_code_handler=True.
            # Three descriptors share dpcode=time_task and two share one_control,
            # so the first to register marks the DP "handled" and the rest would
            # be suppressed by _supports_description (entity.py). Worse, once any
            # of these entities orphans (e.g. a hub re-add / device-id churn),
            # register_current_entities_as_handled_dpcode marks the DP handled on
            # every boot, so the parser permanently suppresses re-creating them
            # (the "914 timer never shows" regression). The flag makes each
            # entity register regardless — same fix as the cur_cap flow_rate race.
            Fdm5kwSensorEntityDescription(
                key=f"{XTDPCode.START_TIME}_timestamp",
                dpcode=XTDPCode.START_TIME,
                translation_key="start_time",
                name="Last watering start",
                icon="mdi:clock-start",
                entity_registry_enabled_default=True,
                ignore_other_dp_code_handler=True,
                wrapper_class=(DPCodeTimestampWrapper,),
            ),
            Fdm5kwSensorEntityDescription(
                key=f"{XTDPCode.CLOSE_TIME}_timestamp",
                dpcode=XTDPCode.CLOSE_TIME,
                translation_key="close_time",
                name="Last watering end",
                icon="mdi:clock-end",
                entity_registry_enabled_default=True,
                ignore_other_dp_code_handler=True,
                wrapper_class=(DPCodeTimestampWrapper,),
            ),
            # --- Staleness (C23) ---
            # Two descriptors, one per product family, because entity spawn
            # is DP-presence-gated and the QT-08W and the T3 share no DP.
            # They carry the same translation_key, exactly like the two
            # irrigation_timer_registry descriptors below.
            Fdm5kwSensorEntityDescription(
                key=f"{DP_CUR_CAP}_last_report",
                dpcode=DP_CUR_CAP,
                translation_key="last_report",
                name="Last report",
                device_class=SensorDeviceClass.TIMESTAMP,
                native_unit_of_measurement="",  # TIMESTAMP has no unit table entry; "" keeps the lib lookup away (see start_time)
                entity_category=EntityCategory.DIAGNOSTIC,
                entity_registry_enabled_default=True,
                ignore_other_dp_code_handler=True,
                wrapper_class=(DPCodeLastReportWrapper,),
            ),
            Fdm5kwSensorEntityDescription(
                key=f"{DP_T3_SAT}_last_report",
                dpcode=DP_T3_SAT,
                translation_key="last_report",
                name="Last report",
                device_class=SensorDeviceClass.TIMESTAMP,
                native_unit_of_measurement="",  # TIMESTAMP has no unit table entry; "" keeps the lib lookup away (see start_time)
                entity_category=EntityCategory.DIAGNOSTIC,
                entity_registry_enabled_default=True,
                ignore_other_dp_code_handler=True,
                wrapper_class=(DPCodeLastReportWrapper,),
            ),
            # --- One-shot control status ---
            Fdm5kwSensorEntityDescription(
                key=f"{DP_ONE_CONTROL}_mode",
                dpcode=DP_ONE_CONTROL,
                translation_key="watering_mode",
                name="Watering mode",
                icon="mdi:water-pump",
                entity_registry_enabled_default=True,
                ignore_other_dp_code_handler=True,
                wrapper_class=(DPCodeOneControlModeWrapper,),
            ),
            Fdm5kwSensorEntityDescription(
                key=f"{DP_ONE_CONTROL}_value",
                dpcode=DP_ONE_CONTROL,
                translation_key="watering_value",
                name="Watering value",
                icon="mdi:water",
                entity_registry_enabled_default=True,
                ignore_other_dp_code_handler=True,
                wrapper_class=(DPCodeOneControlValueWrapper,),
            ),
            # --- Timer schedule ---
            Fdm5kwSensorEntityDescription(
                key=f"{DP_TIME_TASK}_slot",
                dpcode=DP_TIME_TASK,
                translation_key="timer_slot",
                name="Timer slot",
                icon="mdi:timer-outline",
                entity_registry_enabled_default=True,
                ignore_other_dp_code_handler=True,
                wrapper_class=(DPCodeTimeTaskSlotWrapper,),
            ),
            Fdm5kwSensorEntityDescription(
                key=f"{DP_TIME_TASK}_summary",
                dpcode=DP_TIME_TASK,
                translation_key="timer_schedule",
                name="Timer schedule",
                icon="mdi:calendar-clock",
                entity_registry_enabled_default=True,
                ignore_other_dp_code_handler=True,
                wrapper_class=(DPCodeTimeTaskSummaryWrapper,),
            ),
            # --- Timer registry (accumulates all 7 slots) ---
            Fdm5kwTimerRegistryDescription(
                key=f"{DP_TIME_TASK}_registry",
                dpcode=DP_TIME_TASK,
                translation_key="irrigation_timer_registry",
                name="Irrigation timer registry",
                icon="mdi:timer-cog",
                entity_registry_enabled_default=True,
                ignore_other_dp_code_handler=True,
                wrapper_class=(DPCodeTimeTaskRegistryWrapper,),
            ),
            # --- Derived flow rate (l/min) for watering-history graph ---
            # ignore_other_dp_code_handler keeps the upstream cur_cap
            # `watering_volume` entity registering even though both
            # descriptors share dpcode=cur_cap. Without it, the first
            # descriptor to register claims the DP and the other entity
            # never spawns -> "Volume Unavailable" in the Last Watering
            # card after the v4.4.136 upgrade.
            Fdm5kwFlowRateDescription(
                key=f"{DP_CUR_CAP}_flow_rate",
                dpcode=DP_CUR_CAP,
                translation_key="watering_flow_rate",
                name="Watering flow rate",
                icon="mdi:water-percent",
                entity_registry_enabled_default=True,
                ignore_other_dp_code_handler=True,
            ),
            # --- QT-08W-T3 valve (product rjnqkjk1pct15ku2) ---
            # DP-presence-gated to T3; these codes are absent on the old QT-08W.
            Fdm5kwSensorEntityDescription(
                key=f"{DP_T3_SAT}_battery",
                dpcode=DP_T3_SAT,
                translation_key="battery",
                name="Battery level",
                device_class=SensorDeviceClass.BATTERY,
                native_unit_of_measurement=PERCENTAGE,
                state_class=SensorStateClass.MEASUREMENT,
                entity_registry_enabled_default=True,
                ignore_other_dp_code_handler=True,
                wrapper_class=(DPCodeSat0BatteryWrapper,),
            ),
            Fdm5kwSensorEntityDescription(
                key=f"{DP_T3_FLOW_STA}_volume",
                dpcode=DP_T3_FLOW_STA,
                translation_key="watering_volume",
                name="Watering volume",
                device_class=SensorDeviceClass.WATER,
                native_unit_of_measurement=UnitOfVolume.LITERS,
                # Per-run counter that resets to 0 when the next run starts
                # — TOTAL_INCREASING, same as the QT-08W cur_cap twin. Without
                # a state_class HA keeps no long-term statistics, so the
                # per-valve "Hourly water" statistics-graph card (stat_types
                # ["change"], which only exists for TOTAL/TOTAL_INCREASING)
                # was permanently empty on every T3 (audit D2).
                state_class=SensorStateClass.TOTAL_INCREASING,
                icon="mdi:water",
                entity_registry_enabled_default=True,
                ignore_other_dp_code_handler=True,
                wrapper_class=(DPCodeFlowStaVolumeWrapper,),
            ),
            Fdm5kwSensorEntityDescription(
                key=f"{DP_T3_COUNTER}_last_run",
                dpcode=DP_T3_COUNTER,
                translation_key="last_watering_run",
                name="Last watering run",
                icon="mdi:history",
                entity_registry_enabled_default=True,
                ignore_other_dp_code_handler=True,
                wrapper_class=(DPCodeCounterCustomLastRunWrapper,),
            ),
            Fdm5kwSensorEntityDescription(
                key=f"{DP_T3_SAT}_next_run",
                dpcode=DP_T3_SAT,
                translation_key="next_watering",
                name="Next watering",
                device_class=SensorDeviceClass.TIMESTAMP,
                native_unit_of_measurement="",  # TIMESTAMP has no unit table entry; "" keeps the lib lookup away (see start_time)
                icon="mdi:clock-outline",
                entity_registry_enabled_default=True,
                ignore_other_dp_code_handler=True,
                wrapper_class=(DPCodeSat0NextRunWrapper,),
            ),
            # T3 timers — same registry/slot/summary as the old valve, on
            # time_task_0 with the 12-byte decoder. Matching translation_keys so
            # the dashboard strategy + timer card treat T3 like the old valves.
            Fdm5kwSensorEntityDescription(
                key=f"{DP_T3_TIME_TASK}_slot",
                dpcode=DP_T3_TIME_TASK,
                translation_key="timer_slot",
                name="Timer slot",
                icon="mdi:timer-outline",
                entity_registry_enabled_default=True,
                ignore_other_dp_code_handler=True,
                wrapper_class=(DPCodeT3TimeTaskSlotWrapper,),
            ),
            Fdm5kwSensorEntityDescription(
                key=f"{DP_T3_TIME_TASK}_summary",
                dpcode=DP_T3_TIME_TASK,
                translation_key="timer_schedule",
                name="Timer schedule",
                icon="mdi:calendar-clock",
                entity_registry_enabled_default=True,
                ignore_other_dp_code_handler=True,
                wrapper_class=(DPCodeT3TimeTaskSummaryWrapper,),
            ),
            Fdm5kwTimerRegistryDescription(
                key=f"{DP_T3_TIME_TASK}_registry",
                dpcode=DP_T3_TIME_TASK,
                translation_key="irrigation_timer_registry",
                name="Irrigation timer registry",
                icon="mdi:timer-cog",
                entity_registry_enabled_default=True,
                ignore_other_dp_code_handler=True,
                wrapper_class=(DPCodeT3TimeTaskRegistryWrapper,),
            ),
        ]

        Fdm5kwSensor.FDM5KW_SENSORS = {
            DEVICE_CATEGORY: tuple(sensors),
        }

    @staticmethod
    def get_descriptors_to_merge() -> (
        dict[str, tuple[XTSensorEntityDescription, ...]] | None
    ):
        return Fdm5kwSensor.FDM5KW_SENSORS
