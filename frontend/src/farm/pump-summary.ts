/** What the Pumps view shows (pure): whom a pump feeds, and its water
 * balance over a time range.
 *
 * A pump feeds metering points through the dated pump assignments: an MP's
 * own assignment first, else its site's, else up the parent sites (the
 * tree itself is taken as it is now). Valves are never connected by hand;
 * they follow from that. Devices connected by hand add consumers (whose
 * meter counts in the balance) and monitors.
 *
 * Balance: pump delivered = valves (runs of the MPs it fed at the time) +
 * metered consumers + unaccounted. A pump also fills tanks and taps, so
 * unaccounted is never zero; its size and trend are the signal.
 */

import { mpAt, type FarmData, type MeteringPoint, type Pump, type PumpAssignment, type PumpConnection } from "./data.ts";

/** One statistics row from /api/xtend_tuya/pump_stats. */
export interface StatRow {
  start: number;
  change?: number | null;
  mean?: number | null;
  max?: number | null;
}
export type StatSeries = Record<string, StatRow[]>;

export interface Bucket {
  start: number;
  /** Liters the pump delivered in this period, null without meter data. */
  pump: number | null;
  valves: number;
  consumers: number;
}

export interface Balance {
  pump: number | null;
  valves: number;
  consumers: number;
  /** pump - valves - consumers; null without meter data. */
  unaccounted: number | null;
  buckets: Bucket[];
}

export interface PumpFeeds {
  /** Sites the pump is set on now (each with its subtree). */
  sites: string[];
  /** MPs that get this pump now, own assignment or inherited. */
  mps: string[];
  /** MPs inside those sites that another pump overrides now. */
  overridden: { mp: string; pump: string }[];
}

const M3 = 1000;

function openAt(a: { begin: number | null; end: number | null }, at: number): boolean {
  return (a.begin === null || a.begin <= at) && (a.end === null || at < a.end);
}

/** The pump feeding an MP at a time, or null. */
export function pumpOfMpAt(data: FarmData, mp: MeteringPoint, at: number): string | null {
  const find = (kind: PumpAssignment["target_kind"], id: string) =>
    data.pumpAssignments.find((a) => a.target_kind === kind && a.target_id === id && openAt(a, at))?.pump_id ?? null;
  const own = find("location", mp.id);
  if (own) return own;
  const byId = new Map(data.sites.map((s) => [s.id, s]));
  for (let s = mp.site_id ? byId.get(mp.site_id) : undefined, hops = 0; s && hops < 20; hops++) {
    const p = find("site", s.id);
    if (p) return p;
    s = s.parent_id ? byId.get(s.parent_id) : undefined;
  }
  return null;
}

export function pumpFeeds(data: FarmData, pumpId: string, now: number): PumpFeeds {
  const sites = data.pumpAssignments
    .filter((a) => a.pump_id === pumpId && a.target_kind === "site" && openAt(a, now))
    .map((a) => a.target_id);
  const mps: string[] = [];
  const overridden: PumpFeeds["overridden"] = [];
  const inSite = (mp: MeteringPoint) => {
    const byId = new Map(data.sites.map((s) => [s.id, s]));
    for (let s = mp.site_id ? byId.get(mp.site_id) : undefined, hops = 0; s && hops < 20; hops++) {
      if (sites.includes(s.id)) return true;
      s = s.parent_id ? byId.get(s.parent_id) : undefined;
    }
    return false;
  };
  for (const mp of data.locations) {
    const p = pumpOfMpAt(data, mp, now);
    if (p === pumpId) mps.push(mp.id);
    else if (p && inSite(mp)) overridden.push({ mp: mp.id, pump: p });
  }
  return { sites, mps, overridden };
}

/** Connections of a pump that were open at some point in [from, to). */
export function connectionsIn(data: FarmData, pumpId: string, from: number, to: number): PumpConnection[] {
  return data.pumpConnections.filter(
    (c) => c.pump_id === pumpId && (c.begin === null || c.begin < to) && (c.end === null || c.end > from)
  );
}

/** Start of the period (hour or local day) containing ms. */
export function periodStart(ms: number, period: "hour" | "day"): number {
  const d = new Date(ms);
  d.setMinutes(0, 0, 0);
  if (period === "day") d.setHours(0);
  return d.getTime();
}

export function balance(
  data: FarmData,
  pump: Pump,
  stats: StatSeries,
  from: number,
  to: number,
  period: "hour" | "day"
): Balance {
  const buckets = new Map<number, Bucket>();
  const bucket = (ms: number) => {
    const k = periodStart(ms, period);
    let b = buckets.get(k);
    if (!b) buckets.set(k, (b = { start: k, pump: null, valves: 0, consumers: 0 }));
    return b;
  };
  // Every period in the range, so gaps show as empty bars.
  const step = period === "hour" ? 3_600_000 : 86_400_000;
  for (let t = periodStart(from, period); t < to; t += step) bucket(t);

  let pumpTotal: number | null = null;
  for (const r of stats[pump.meter_entity] ?? []) {
    if (r.start < from || r.start >= to || typeof r.change !== "number") continue;
    const b = bucket(r.start);
    b.pump = (b.pump ?? 0) + r.change * M3;
    pumpTotal = (pumpTotal ?? 0) + r.change * M3;
  }

  // Valves: each run counts for the MP it served when it ended, and for the
  // pump that MP had at that moment.
  let valves = 0;
  for (const r of data.runs) {
    const end = Date.parse(r.end);
    if (end < from || end >= to || typeof r.liters !== "number") continue;
    const mp = mpAt(data, r.device_id, end);
    if (!mp || pumpOfMpAt(data, mp, end) !== pump.id) continue;
    valves += r.liters;
    bucket(Date.parse(r.start)).valves += r.liters;
  }

  // Metered consumers, only while connected.
  let consumers = 0;
  for (const c of connectionsIn(data, pump.id, from, to)) {
    if (c.role !== "consumer" || !c.meter_entity) continue;
    for (const r of stats[c.meter_entity] ?? []) {
      if (r.start < from || r.start >= to || typeof r.change !== "number" || !openAt(c, r.start)) continue;
      consumers += r.change * M3;
      bucket(r.start).consumers += r.change * M3;
    }
  }

  return {
    pump: pumpTotal,
    valves,
    consumers,
    unaccounted: pumpTotal === null ? null : pumpTotal - valves - consumers,
    buckets: [...buckets.values()].sort((a, b) => a.start - b.start),
  };
}
