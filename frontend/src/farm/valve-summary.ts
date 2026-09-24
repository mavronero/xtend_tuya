/** What a valve card shows, computed from live states and farm data (pure).
 *
 * No DOM, no fetch: `summarize` takes everything as arguments so any view
 * can build the same summary and tests/test_valve_summary.mjs can run it
 * in node.
 */

import type { HassState, ValveEntities } from "./discovery.ts";
import { pairPlanRuns, type Pairable } from "../calendar-lanes.ts";
import type { FarmData, Run } from "./data.ts";

export type ValveStatus = "watering" | "idle" | "offline";
export type Badge = "low_battery" | "stale" | "missed" | "no_flow";

export interface RunInfo {
  start: number; // ms
  minutes: number;
  liters: number | null;
}

export interface ValveSummary {
  device_id: string;
  name: string;
  number: string | null;
  view_path: string;
  status: ValveStatus;
  /** watering: since when; offline: last change of the registry sensor. */
  since: number | null;
  flow_lpm: number | null;
  battery: number | null;
  has_flow_meter: boolean;
  last: RunInfo | null;
  next: RunInfo | null;
  /** Last 7 local days, oldest first: liters with a flow meter, else minutes. */
  week: { runs: number; liters: number; minutes: number; daily: number[]; unit: "L" | "min" };
  missed: number;
  badges: Badge[];
  location: { id: string; name: string } | null;
  site: { id: string; name: string } | null;
}

export const LOW_BATTERY_PCT = 20;
// Same figure as the valve matrix's stale marker (audit C23).
export const STALE_AFTER_MS = 36 * 3_600_000;
export const MISSED_WINDOW_MS = 24 * 3_600_000;
const DAY_MS = 86_400_000;

const NUMBER_RE = /\((\d+)\)\s*$/;

function num(state: HassState | undefined): number | null {
  if (!state) return null;
  const n = Number(state.state);
  return Number.isFinite(n) && state.state !== "" ? n : null;
}

function dead(state: HassState | undefined): boolean {
  return !state || state.state === "unavailable" || state.state === "unknown";
}

function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function summarize(
  v: ValveEntities,
  states: Record<string, HassState>,
  data: FarmData,
  now: number
): ValveSummary {
  const reg = states[v.registry_entity];
  const sw = v.switch ? states[v.switch] : undefined;
  const offline = dead(reg) && dead(sw);
  const watering = !offline && sw?.state === "on";

  const runs = data.runs
    .filter((r) => r.device_id === v.device_id)
    .map((r) => ({ r, start: Date.parse(r.start), end: Date.parse(r.end) }))
    .filter((x) => Number.isFinite(x.start) && Number.isFinite(x.end))
    .sort((a, b) => a.start - b.start);
  const info = (r: Run, start: number): RunInfo => ({
    start,
    minutes: (r.duration_seconds ?? 0) / 60,
    liters: typeof r.liters === "number" ? r.liters : null,
  });
  const lastRun = runs[runs.length - 1];

  const plans = data.planned
    .filter((p) => p.key === v.registry_entity)
    .sort((a, b) => a.start - b.start);
  const nextPlan = plans.find((p) => p.start > now);

  // Missed = a planned slot in the last 24 h that no run answered (same
  // pairing as the calendar).
  const recentPlans: Pairable[] = plans
    .filter((p) => p.end > now - MISSED_WINDOW_MS && p.end < now)
    .map((p) => ({ start: p.start, end: p.end, kind: "planned", name: v.valve_name, key: v.device_id }));
  const recentRuns: Pairable[] = runs
    .filter((x) => x.end > now - MISSED_WINDOW_MS - DAY_MS)
    .map((x) => ({ start: x.start, end: x.end, kind: "ran", name: v.valve_name, key: v.device_id }));
  const missed = pairPlanRuns(recentPlans, recentRuns, now).filter((e) => e.kind === "missed").length;

  const has_flow_meter = !!v.volume_sensor;
  const today = startOfLocalDay(now);
  const weekStart = today - 6 * DAY_MS;
  const daily = [0, 0, 0, 0, 0, 0, 0];
  let weekRuns = 0;
  let weekLiters = 0;
  let weekMinutes = 0;
  for (const x of runs) {
    if (x.start < weekStart) continue;
    const day = Math.min(6, Math.floor((startOfLocalDay(x.start) - weekStart) / DAY_MS + 0.5));
    const minutes = (x.r.duration_seconds ?? 0) / 60;
    const liters = typeof x.r.liters === "number" ? x.r.liters : 0;
    weekRuns += 1;
    weekLiters += liters;
    weekMinutes += minutes;
    daily[day] += has_flow_meter ? liters : minutes;
  }

  const battery = offline ? null : num(v.battery_level ? states[v.battery_level] : undefined);
  const lastReport = v.last_report ? Date.parse(states[v.last_report]?.state ?? "") : NaN;
  const last = lastRun ? info(lastRun.r, lastRun.start) : null;

  const badges: Badge[] = [];
  if (!offline) {
    if (battery !== null && battery < LOW_BATTERY_PCT) badges.push("low_battery");
    if (Number.isFinite(lastReport) && now - lastReport > STALE_AFTER_MS) badges.push("stale");
    if (missed > 0) badges.push("missed");
    if (has_flow_meter && last && last.liters === 0 && last.minutes >= 1) badges.push("no_flow");
  }

  const location = data.locationOf[v.device_id] ?? null;
  const site = location?.site_id ? data.sites.find((s) => s.id === location.site_id) ?? null : null;
  const changed = (s: HassState | undefined) => (s?.last_changed ? Date.parse(s.last_changed) : null);

  return {
    device_id: v.device_id,
    name: v.valve_name,
    number: NUMBER_RE.exec(v.valve_name)?.[1] ?? null,
    view_path: v.view_path,
    status: offline ? "offline" : watering ? "watering" : "idle",
    since: watering ? changed(sw) : offline ? changed(reg) : null,
    flow_lpm: watering ? num(v.flow_rate_sensor ? states[v.flow_rate_sensor] : undefined) : null,
    battery,
    has_flow_meter,
    last,
    next: nextPlan ? { start: nextPlan.start, minutes: (nextPlan.end - nextPlan.start) / 60_000, liters: null } : null,
    week: { runs: weekRuns, liters: weekLiters, minutes: weekMinutes, daily, unit: has_flow_meter ? "L" : "min" },
    missed,
    badges,
    location: location ? { id: location.id, name: location.name } : null,
    site: site ? { id: site.id, name: site.name } : null,
  };
}
