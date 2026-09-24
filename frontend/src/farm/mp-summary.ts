/** What a metering-point card shows (pure).
 *
 * A metering point is a place; valves come and go. Its history is the runs
 * of every valve that served it, each counted for the metering point it was
 * assigned to when the run ended (half-open [begin, end), as
 * location_model.location_runs does in the backend). Live state (status,
 * battery, next run, missed) comes from the valves it holds now.
 */

import type { FarmData, MeteringPoint } from "./data.ts";
import { weekStats, type Badge, type RunInfo, type ValveStatus, type ValveSummary, type Week } from "./valve-summary.ts";

export type MpBadge = Badge | "no_valve" | "flow_low" | "flow_high";

export interface MpValve {
  device_id: string;
  number: string | null;
  name: string;
  status: ValveStatus;
  battery: number | null;
  view_path: string;
}

export interface MpSummary {
  id: string;
  name: string;
  site_id: string | null;
  valves: MpValve[];
  status: ValveStatus | "empty";
  last: RunInfo | null;
  next: RunInfo | null;
  week: Week;
  /** Mean flow of the last 30 days' metered runs. */
  avg_lpm: number | null;
  expected_lpm: number | null;
  pump: { name: string; via: string | null } | null;
  missed: number;
  badges: MpBadge[];
}

/** Mean flow further than this from the expected L/min is flagged. */
export const FLOW_TOLERANCE = 0.25;
const MIN_METERED_MINUTES = 1;
const DAY_MS = 86_400_000;

export function mpRuns(mp: MeteringPoint, data: FarmData): RunInfo[] {
  const out: RunInfo[] = [];
  for (const r of data.runs) {
    const end = Date.parse(r.end);
    const inWindow = mp.assignments.some(
      (a) => a.device_id === r.device_id && (a.begin === null || a.begin <= end) && (a.end === null || end < a.end)
    );
    if (inWindow) {
      out.push({ start: Date.parse(r.start), minutes: (r.duration_seconds ?? 0) / 60, liters: typeof r.liters === "number" ? r.liters : null });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

export function summarizeMp(mp: MeteringPoint, data: FarmData, valves: ValveSummary[], now: number): MpSummary {
  const current = mp.valves
    .map((id) => valves.find((v) => v.device_id === id))
    .filter((v): v is ValveSummary => !!v);
  const runs = mpRuns(mp, data);
  const metered = current.some((v) => v.has_flow_meter) || runs.some((r) => r.liters !== null && r.liters > 0);

  const recent = runs.filter((r) => r.start >= now - 30 * DAY_MS && r.liters !== null && r.minutes >= MIN_METERED_MINUTES);
  const minutes = recent.reduce((t, r) => t + r.minutes, 0);
  const avg_lpm = metered && minutes > 0 ? recent.reduce((t, r) => t + (r.liters ?? 0), 0) / minutes : null;

  const status: MpSummary["status"] = !current.length
    ? "empty"
    : current.some((v) => v.status === "watering")
      ? "watering"
      : current.every((v) => v.status === "offline")
        ? "offline"
        : "idle";

  const nexts = current.map((v) => v.next).filter((n): n is RunInfo => !!n);
  const last = runs[runs.length - 1] ?? null;
  const missed = current.reduce((t, v) => t + v.missed, 0);

  const badges: MpBadge[] = [];
  if (!mp.valves.length) badges.push("no_valve");
  // Hardware warnings of the valves it holds now, once each.
  for (const b of ["low_battery", "stale"] as const) if (current.some((v) => v.badges.includes(b))) badges.push(b);
  if (missed > 0) badges.push("missed");
  if (metered && last && last.liters === 0 && last.minutes >= MIN_METERED_MINUTES) badges.push("no_flow");
  if (avg_lpm !== null && mp.expected_lpm) {
    const dev = (avg_lpm - mp.expected_lpm) / mp.expected_lpm;
    if (dev < -FLOW_TOLERANCE) badges.push("flow_low");
    else if (dev > FLOW_TOLERANCE) badges.push("flow_high");
  }

  return {
    id: mp.id,
    name: mp.name,
    site_id: mp.site_id,
    valves: current.map((v) => ({
      device_id: v.device_id,
      number: v.number,
      name: v.name,
      status: v.status,
      battery: v.battery,
      view_path: v.view_path,
    })),
    status,
    last,
    next: nexts.length ? nexts.reduce((a, b) => (b.start < a.start ? b : a)) : null,
    week: weekStats(runs, now, metered),
    avg_lpm,
    expected_lpm: mp.expected_lpm,
    pump: mp.pump,
    missed,
    badges,
  };
}
