/** Valve discovery shared by the strategy and the valve cards.
 *
 * Every valve has one `*_irrigation_timer_registry` sensor; its siblings are
 * mapped by translation_key (entity-id suffix for pre-4.4.150 installs).
 * Moved out of irrigation-valves-strategy.ts unchanged (2026-09-24).
 */

export interface HassState {
  state: string;
  attributes: Record<string, unknown>;
  last_changed?: string;
}

export interface HassEntityRegistryEntry {
  entity_id: string;
  device_id: string | null;
  platform: string;
  translation_key?: string | null;
}

export interface HassDeviceRegistryEntry {
  id: string;
  name: string | null;
  name_by_user: string | null;
}

export interface HomeAssistantLike {
  states: Record<string, HassState>;
  entities: Record<string, HassEntityRegistryEntry>;
  devices: Record<string, HassDeviceRegistryEntry>;
  callApi?: <T>(method: string, path: string) => Promise<T>;
}

/** device id (Tuya or HA registry) -> {home, room}, served by the backend
 * location service. Authoritative over live registry-sensor attributes:
 * an unavailable sensor loses its attrs, which used to dump every offline
 * valve into "Unassigned" (ticket c802BqOn). */
export type LocationMap = Record<string, { home?: string | null; room?: string | null }>;

export async function fetchLocations(hass: HomeAssistantLike): Promise<LocationMap> {
  if (!hass.callApi) return {};
  try {
    const r = await hass.callApi<{ locations?: LocationMap }>(
      "GET",
      "xtend_tuya/valve_locations"
    );
    return r?.locations ?? {};
  } catch {
    return {};
  }
}


export interface ValveEntities {
  device_id: string;
  registry_entity: string;
  valve_name: string;
  factory_name: string;
  /** SmartLife home / room the valve lives in (registry sensor attrs,
   * 4.4.207) — used to group the overview valve list. */
  valve_home: string | null;
  valve_room: string | null;
  view_path: string;
  switch?: string;
  duration?: string;
  volume_sensor?: string;
  flow_rate_sensor?: string;
  start_time_sensor?: string;
  end_time_sensor?: string;
  mode_sensor?: string;
  value_sensor?: string;
  battery_level?: string;
  /** Diagnostic TIMESTAMP of the device's last report (audit C23). */
  last_report?: string;
  sleep_mode?: string;
  rain_snow_delay?: string;
}

const REGISTRY_TRANSLATION_KEY_SUFFIX = "irrigation_timer_registry";
// v4.4.111 baseline names the registry entity sensor.<slug>_time_task_registry.
// Keep matching it so the dashboard discovers valves on the reverted code.
const REGISTRY_LEGACY_SUFFIX = "_time_task_registry";

const TRANSLATION_KEY_TO_FIELD: Record<string, keyof ValveEntities> = {
  // Sensors / numbers exposed by the integration (translation_key →
  // field on ValveEntities). Anything not in this map is ignored.
  start_time: "start_time_sensor",
  close_time: "end_time_sensor",
  // v4.4.111 baseline uses `end_time` for the CLOSE_TIME sensor.
  end_time: "end_time_sensor",
  watering_mode: "mode_sensor",
  watering_value: "value_sensor",
  watering_volume: "volume_sensor",
  watering_flow_rate: "flow_rate_sensor",
  battery_level: "battery_level",
  last_report: "last_report",
  watering_duration: "duration",
  rain_snow_delay: "rain_snow_delay",
  // QT-08W-T3 valves expose the same concepts under indexed / differently
  // named translation_keys (4-program model). Map them onto the same fields
  // so T3 valves get the full detail view (control card, battery tile, run
  // duration) with no separate code path.
  battery: "battery_level",
  indexed_irrigation_duration: "duration",
};

// Existing entities created before 4.4.150 have null `translation_key`
// in the entity registry (HA only writes translation_key on first
// registration). The strategy must fall back to entity-id suffix
// matching for those installs. Suffix patterns are checked AFTER the
// translation_key map so newly-registered entities take precedence.
// Order matters: longer / more specific suffixes first.
const ENTITY_ID_SUFFIX_TO_FIELD: Array<[RegExp, keyof ValveEntities]> = [
  [/_last_watering_start$/, "start_time_sensor"],
  [/_last_watering_end$/, "end_time_sensor"],
  [/_watering_flow_rate$/, "flow_rate_sensor"],
  [/_watering_value$/, "value_sensor"],
  [/_watering_volume$/, "volume_sensor"],
  [/_watering_duration$/, "duration"],
  [/_watering_mode$/, "mode_sensor"],
  [/_rain_snow_delay$/, "rain_snow_delay"],
  [/_battery_level$/, "battery_level"],
];


/* ------------------------------------------------------------------ *
 * Discovery                                                           *
 * ------------------------------------------------------------------ */

export function discoverValves(
  hass: HomeAssistantLike,
  locations: LocationMap = {}
): ValveEntities[] {
  // Find every registry entity. Prefer the entity registry's
  // translation_key when available (stable), and fall back to entity_id
  // suffix matching for installs predating that field.
  const registryIds = new Set<string>();
  for (const e of Object.values(hass.entities)) {
    if (e.translation_key === REGISTRY_TRANSLATION_KEY_SUFFIX) {
      registryIds.add(e.entity_id);
    }
  }
  for (const id of Object.keys(hass.states)) {
    if (
      id.startsWith("sensor.") &&
      (id.endsWith(REGISTRY_TRANSLATION_KEY_SUFFIX) ||
        id.endsWith(REGISTRY_LEGACY_SUFFIX))
    ) {
      registryIds.add(id);
    }
  }

  const valves: ValveEntities[] = [];
  for (const regId of registryIds) {
    const regState = hass.states[regId];
    const regEntry = hass.entities[regId];
    if (!regState || !regEntry || !regEntry.device_id) continue;

    // HA's device-registry id is used to discover sibling entities;
    // Tuya's own device id (exposed by the registry sensor as the
    // `device_id` attribute) is what the fdm5kw timer services expect.
    // Manual YAML dashboards always passed the Tuya id; the strategy
    // previously fed the HA UUID, breaking set/delete service lookups.
    const tuyaDeviceId =
      (regState.attributes.device_id as string | undefined) ??
      regEntry.device_id;
    const valve = collectValveEntities(
      hass,
      regId,
      regEntry.device_id,
      tuyaDeviceId,
      regState,
      locations
    );
    if (valve) valves.push(valve);
  }

  // Stable ordering for deterministic dashboard layout.
  valves.sort((a, b) => a.valve_name.localeCompare(b.valve_name));
  return valves;
}

function collectValveEntities(
  hass: HomeAssistantLike,
  registryEntityId: string,
  haDeviceId: string,
  tuyaDeviceId: string,
  registryState: HassState,
  locations: LocationMap = {}
): ValveEntities | null {
  // When the registry sensor is unavailable HA strips its custom
  // attributes (valve_name, valve_factory_name, device_id), so fall back
  // to the device-registry name before the raw Tuya id. Without this
  // every offline valve renders as a 32-char HA device UUID.
  const device = hass.devices[haDeviceId];
  const valve_name =
    (registryState.attributes.valve_name as string | undefined) ??
    (registryState.attributes.valve_factory_name as string | undefined) ??
    device?.name_by_user ??
    device?.name ??
    tuyaDeviceId;
  const factory_name =
    (registryState.attributes.valve_factory_name as string | undefined) ??
    device?.name ??
    valve_name;

  const view_path = makeViewPath(tuyaDeviceId);

  const v: ValveEntities = {
    device_id: tuyaDeviceId,
    registry_entity: registryEntityId,
    valve_name,
    factory_name,
    // Backend location map first (cloud-backed, covers offline valves whose
    // sensor attrs are stripped); live attrs as fallback for old backends.
    valve_home:
      locations[tuyaDeviceId]?.home ??
      locations[haDeviceId]?.home ??
      (registryState.attributes.valve_home as string | undefined) ??
      null,
    valve_room:
      locations[tuyaDeviceId]?.room ??
      locations[haDeviceId]?.room ??
      (registryState.attributes.valve_room as string | undefined) ??
      null,
    view_path,
  };

  const setField = (field: keyof ValveEntities, entity_id: string) => {
    if (!v[field]) {
      (v as unknown as Record<string, string | undefined>)[field] = entity_id;
    }
  };

  // Second-choice valve switch, used only if nothing matched the primary
  // rules below — see the switch_1 note there.
  let switchFallback: string | undefined;

  for (const e of Object.values(hass.entities)) {
    if (e.device_id !== haDeviceId) continue;

    // Only reference entities that are actually loaded as states. When a hub
    // fails setup (e.g. expired Tuya auth) its entities stay in the registry
    // but drop out of hass.states; emitting those entity_ids made HA-core
    // tile / history-graph / entities cards throw "Cannot read properties of
    // undefined (reading 'friendly_name')", which errored the whole view.
    // Skipping them degrades a down valve gracefully (fewer cards) instead of
    // taking the dashboard down with it.
    if (!hass.states[e.entity_id]) continue;

    // The valve on/off switch carries translation_key "valve". Its
    // entity_id is normally <slug>_valve, but when the unique_id collides
    // with the official Tuya integration HA renames it (e.g.
    // <slug>_switch_2), so the old endsWith("_valve") check missed every
    // valve that also lives in the official integration — leaving the
    // control widget empty. Match the stable translation_key first, fall
    // back to the suffix for legacy entities with no translation_key.
    if (
      e.entity_id.startsWith("switch.") &&
      (e.translation_key === "valve" ||
        e.translation_key === "indexed_switch" ||
        e.entity_id.endsWith("_valve"))
    ) {
      if (!v.switch) v.switch = e.entity_id;
      continue;
    }
    // QT-08W-T3 valves: the valve sits on the indexed DP switch_1 and the
    // cross-category table used to name it "Switch 1", so none of the rules
    // above matched and v.switch stayed undefined on all 11 T3 valves — no
    // control card, no bars, counted offline (audit D4/R1). The integration
    // now gives sfkzq's switch_1 the "valve" key, but registries written by
    // an older build still carry "switch_1", so accept it too. Second
    // choice on purpose: a device that really does have both keeps its
    // proper valve entity.
    if (e.entity_id.startsWith("switch.") && e.translation_key === "switch_1") {
      if (!switchFallback) switchFallback = e.entity_id;
      continue;
    }
    if (
      e.entity_id.startsWith("switch.") &&
      e.entity_id.endsWith("_sleep_mode")
    ) {
      v.sleep_mode = e.entity_id;
      continue;
    }

    const tk = e.translation_key;
    if (tk) {
      const field = TRANSLATION_KEY_TO_FIELD[tk];
      if (field) {
        setField(field, e.entity_id);
        continue;
      }
    }

    // Legacy entities (created before 4.4.150) have no translation_key.
    // Match the entity-id suffix instead so the dashboard still finds
    // start/end/mode/etc. for older installs.
    for (const [pattern, field] of ENTITY_ID_SUFFIX_TO_FIELD) {
      if (pattern.test(e.entity_id)) {
        setField(field, e.entity_id);
        break;
      }
    }
  }

  if (!v.switch && switchFallback) v.switch = switchFallback;

  return v;
}

export const VALVE_VIEW_PATH = "valve";

export function makeViewPath(deviceId: string): string {
  // The Tuya id, not the name: a SmartLife rename keeps links working.
  return `${VALVE_VIEW_PATH}?id=${encodeURIComponent(deviceId)}`;
}

