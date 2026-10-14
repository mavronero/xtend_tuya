/** What the Checks view lists: every valve problem someone has to act on,
 * one list per kind (pure, like valve-summary.ts).
 *
 * Replaces the daily Mattermost drift report (k8s CronJob valve-drift-check,
 * Simon 23.09.: "so we have another view"). Everything comes from HA: the
 * valve summaries and the registry sensor's `slots` + daily `cloud` overlay
 * (timer_reconcile.py; farm/contract.py documents its shape).
 */

import type { HassState, ValveEntities } from "./discovery.ts";
import type { ValveSummary } from "./valve-summary.ts";
import { plannedOf, type FarmData } from "./data.ts";
import { since, when } from "../components/format.ts";

export type CheckKind = "stopped" | "no_flow" | "timer" | "all_off" | "battery" | "offline";

export interface Check {
  kind: CheckKind;
  summary: ValveSummary;
  /** Plain-language finding, e.g. "06:00 daily: on in SmartLife, off in the valve". */
  detail: string;
}

export interface CheckSection {
  kind: CheckKind;
  title: string;
  /** What to do about it, one line. */
  hint: string;
  checks: Check[];
}

export const BATTERY_WARN_PCT = 80; // Simon 16.09. (Trello QQTzetSS)

export const SECTIONS: { kind: CheckKind; title: string; hint: string }[] = [
  { kind: "stopped", title: "Stopped watering", hint: "Check on site: battery, Wi‑Fi, water supply." },
  { kind: "no_flow", title: "Ran without water", hint: "Check the water supply and the pump." },
  {
    kind: "timer",
    title: "Valve and SmartLife disagree",
    hint: "SmartLife and the valve's own copy of the timers differ, so it may water at other times than the app shows. Fix: delete the timer in SmartLife and create it again.",
  },
  { kind: "all_off", title: "Nothing planned", hint: "All timers are off, the valve will not water. Switch one on in SmartLife if it should." },
  { kind: "battery", title: `Battery under ${BATTERY_WARN_PCT} %`, hint: "Charge or replace before it runs flat." },
  { kind: "offline", title: "Offline", hint: "Not reachable, cannot water. Check battery and Wi‑Fi." },
];

// An overlay older than this says nothing (mirrors CLOUD_MAX_AGE_DAYS).
const CLOUD_MAX_AGE_MS = 3 * 86_400_000;
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// ponytail: T3 valves fire ~50 % of their runs, one miss is noise (same rule
// as the drift report). Planned slots reach back 2 days (data.ts), so a daily
// timer trips this after two silent days.
export const STOPPED_AFTER_MISSES = 2;
const H = 3_600_000;

/** Planned runs after the last run (+1 h grace) that are at least 2 h past. */
export function missedSinceLast(plans: { start: number }[], last: number | null, now: number): number {
  const lo = (last ?? 0) + H;
  return plans.filter((p) => p.start > lo && p.start <= now - 2 * H).length;
}

interface Slot {
  hour?: number;
  minute?: number;
  days_mask?: number;
  enabled?: boolean;
}

interface Cloud {
  checked_at?: string | null;
  slots?: Record<string, string>;
  cloud_only?: Slot[];
  collision?: string[];
}

function slotText(s: Slot): string {
  const hm = `${String(s.hour ?? 0).padStart(2, "0")}:${String(s.minute ?? 0).padStart(2, "0")}`;
  const mask = s.days_mask ?? 0;
  const days = mask === 127 ? "daily" : DAY_NAMES.filter((_, i) => (mask >> i) & 1).join("/");
  return `${hm} ${days}`;
}

/** Timer findings of one valve from its registry sensor attributes. */
export function timerChecks(reg: HassState | undefined, now: number): { timer: string[]; allOff: boolean } {
  const attrs = (reg?.attributes ?? {}) as { slots?: Record<string, Slot | null>; cloud?: Cloud | null };
  const slots = attrs.slots ?? {};
  const cloud = attrs.cloud ?? null;
  const checked = Date.parse(String(cloud?.checked_at ?? ""));
  const fresh = Number.isFinite(checked) && now - checked <= CLOUD_MAX_AGE_MS;
  const overlay = fresh ? cloud?.slots ?? {} : {};
  const timer: string[] = [];
  for (const [i, held] of Object.entries(slots)) {
    if (!held) continue;
    const state = overlay[i];
    if (state === "on" && !held.enabled) timer.push(`${slotText(held)}: on in SmartLife, off in the valve`);
    if (state === "off" && held.enabled) timer.push(`${slotText(held)}: off in SmartLife, on in the valve`);
    if (state === "missing") timer.push(`${slotText(held)}: in the valve, not in SmartLife`);
  }
  if (cloud?.collision?.length) timer.push(`two SmartLife timers share one slot (${cloud.collision.join(" + ")})`);
  // Planned the way the calendar plans (farm/calendar.py): the app wins on off / missing.
  const held = Object.values(slots).filter((s): s is Slot => !!s);
  const on = Object.entries(slots).some(
    ([i, s]) => s?.enabled && overlay[i] !== "off" && overlay[i] !== "missing"
  );
  const allOff = held.length > 0 && !on && !(fresh && cloud?.cloud_only?.length);
  return { timer, allOff };
}

export function computeChecks(
  summaries: ValveSummary[],
  valves: ValveEntities[],
  states: Record<string, HassState>,
  data: FarmData,
  now: number
): CheckSection[] {
  const regOf = new Map(valves.map((v) => [v.device_id, v.registry_entity]));
  const found: Check[] = [];
  const add = (kind: CheckKind, summary: ValveSummary, detail: string) => found.push({ kind, summary, detail });
  for (const s of summaries) {
    if (s.status === "offline") {
      add("offline", s, s.since ? `offline for ${since(s.since, now)}` : "offline");
      continue; // an offline valve can't be judged on anything else
    }
    const last = s.last ? `last run ${when(s.last.start)}` : "no run in 30 days";
    const missed = missedSinceLast(plannedOf(data, regOf.get(s.device_id) ?? ""), s.last?.start ?? null, now);
    if (missed >= STOPPED_AFTER_MISSES) add("stopped", s, `${last}, planned runs missed since`)  // ponytail: no count, plans only reach back 2 days;
    else if (s.badges.includes("stale")) add("stopped", s, `no report for over 24 h although runs were due · ${last}`);
    if (s.badges.includes("no_flow") && s.last) add("no_flow", s, `${when(s.last.start)} · ${Math.round(s.last.minutes)} min · 0 L`);
    const t = timerChecks(states[regOf.get(s.device_id) ?? ""], now);
    for (const d of t.timer) add("timer", s, d);
    if (t.allOff) add("all_off", s, "all timers off");
    if (s.battery !== null && s.battery < BATTERY_WARN_PCT) add("battery", s, `${Math.round(s.battery)} %`);
  }
  const order: Partial<Record<CheckKind, (a: Check, b: Check) => number>> = {
    battery: (a, b) => (a.summary.battery ?? 0) - (b.summary.battery ?? 0),
    offline: (a, b) => (a.summary.since ?? 0) - (b.summary.since ?? 0),
  };
  return SECTIONS.map((sec) => ({
    ...sec,
    checks: found.filter((c) => c.kind === sec.kind).sort(order[sec.kind] ?? (() => 0)),
  })).filter((sec) => sec.checks.length);
}
