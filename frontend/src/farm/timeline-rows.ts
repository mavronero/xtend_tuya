/** Timeline rows: one per metering point, so history follows the place.
 *
 * A run belongs to the metering point its valve was assigned to when the run
 * started (the dated assignments), not to the valve's point today. So a valve
 * swap, rename or removal keeps the history on the place (Trello efPZtmdz:
 * removing 977 from Tuya took FG Carob Bed off the timeline). Valves without a
 * metering point at the time keep a row of their own.
 */

import { mpAt, type FarmData, type MeteringPoint, type Run } from "./data.ts";
import { sitePath, subtree } from "./valve-filter.ts";

export const NO_SITE_GROUP = "No site";
export const NO_MP_GROUP = "No metering point";

export interface TlValve {
  device_id: string;
  registry_entity: string;
  valve_name: string;
}

export interface TlRow<V extends TlValve, E> {
  key: string;
  group: string;
  name: string;
  mp: MeteringPoint | null;
  /** The valve there now (an MP row) or the row's own valve. */
  valve: V | null;
  evs: E[];
}

export interface TlFilter {
  site: string | null;
  search: string;
}

/**
 * `retired` turns a stored run of a valve HA no longer knows (removed from
 * Tuya) into an event: the calendars only list valves HA can see.
 */
export function timelineRows<V extends TlValve, E extends { key: string; start: number }>(
  valves: V[],
  events: E[],
  data: FarmData,
  retired: (run: Run, mp: MeteringPoint) => E,
  window: [number, number],
  filter: TlFilter
): TlRow<V, E>[] {
  const byRegistry = new Map(valves.map((v) => [v.registry_entity, v]));
  const known = new Set(valves.map((v) => v.device_id));
  const rows = new Map<string, TlRow<V, E>>();

  const mpRow = (mp: MeteringPoint): TlRow<V, E> => {
    const key = `mp:${mp.id}`;
    let row = rows.get(key);
    if (!row) {
      row = {
        key,
        group: mp.site_id ? sitePath(data.sites, mp.site_id) : NO_SITE_GROUP,
        name: mp.name,
        mp,
        valve: valves.find((v) => mp.valves.includes(v.device_id)) ?? null,
        evs: [],
      };
      rows.set(key, row);
    }
    return row;
  };
  const valveRow = (v: V): TlRow<V, E> => {
    const key = `valve:${v.registry_entity}`;
    let row = rows.get(key);
    if (!row) rows.set(key, (row = { key, group: NO_MP_GROUP, name: v.valve_name, mp: null, valve: v, evs: [] }));
    return row;
  };

  for (const mp of data.locations) mpRow(mp);
  for (const v of valves) if (!data.locationOf[v.device_id]) valveRow(v);

  for (const e of events) {
    const v = byRegistry.get(e.key);
    if (!v) continue;
    const mp = mpAt(data, v.device_id, e.start);
    (mp ? mpRow(mp) : valveRow(v)).evs.push(e);
  }

  const [from, to] = window;
  for (const r of data.runs) {
    if (known.has(r.device_id)) continue;
    const start = Date.parse(r.start);
    if (!(start < to && Date.parse(r.end) > from)) continue;
    const mp = mpAt(data, r.device_id, start);
    // ponytail: a removed valve without a metering point has no name to show.
    if (mp) mpRow(mp).evs.push(retired(r, mp));
  }

  const inSite = filter.site ? subtree(data.sites, filter.site) : null;
  const q = filter.search.trim().toLowerCase();
  return [...rows.values()]
    .filter((row) => !inSite || (row.mp?.site_id != null && inSite.has(row.mp.site_id)))
    .filter((row) => !q || [row.name, row.valve?.valve_name, row.group].some((x) => x?.toLowerCase().includes(q)))
    .sort((a, b) => rank(a.group) - rank(b.group) || a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
}

/** Sites first, then the two catch-all groups. */
function rank(group: string): number {
  return group === NO_MP_GROUP ? 2 : group === NO_SITE_GROUP ? 1 : 0;
}
