/** What a site card and a site header show (pure): the site's whole subtree
 * aggregated from its metering points (places, so the history survives
 * valve exchanges), plus its pump. */

import type { FarmData, Pump, Site } from "./data.ts";
import type { MpSummary } from "./mp-summary.ts";
import { sitePath, subtree } from "./valve-filter.ts";

/** Pseudo site for metering points that belong to no site. */
export const NO_SITE = "__no_site__";

export interface SiteSummary {
  id: string;
  name: string;
  /** "Big Farm › FF East" */
  path: string;
  parent_id: string | null;
  /** Direct child site ids, by name. */
  children: string[];
  mps: number;
  valves: number;
  online: number;
  watering: number;
  /** Metering points with a warning. */
  attention: number;
  offline: number;
  last: number | null;
  next: number | null;
  /** Last 7 local days, liters of the metered valves, oldest first. */
  week: { runs: number; liters: number; daily: number[] };
  pump: { name: string; via: string | null } | null;
}

export function childSites(sites: Site[], parent: string | null): Site[] {
  return sites.filter((s) => s.parent_id === parent).sort((a, b) => a.name.localeCompare(b.name));
}

/** The pump feeding a site now: its own, else the nearest ancestor's. */
export function pumpForSite(data: FarmData, siteId: string): { pump: Pump; via: string | null } | null {
  const byId = new Map(data.sites.map((s) => [s.id, s]));
  for (let s = byId.get(siteId), hops = 0; s && hops < 20; s = s.parent_id ? byId.get(s.parent_id) : undefined, hops++) {
    const a = data.pumpAssignments.find((p) => p.target_kind === "site" && p.target_id === s!.id);
    const pump = a && data.pumps.find((p) => p.id === a.pump_id);
    if (pump) return { pump, via: s.id === siteId ? null : s.name };
  }
  return null;
}

export function summarizeSite(siteId: string, data: FarmData, mps: MpSummary[]): SiteSummary {
  const noSite = siteId === NO_SITE;
  const site = noSite ? null : data.sites.find((s) => s.id === siteId) ?? null;
  const ids = noSite ? null : subtree(data.sites, siteId);
  const mine = mps.filter((m) => (ids ? !!m.site_id && ids.has(m.site_id) : !m.site_id));
  const valves = mine.flatMap((m) => m.valves);
  const daily = [0, 0, 0, 0, 0, 0, 0];
  let runs = 0;
  let liters = 0;
  for (const m of mine) {
    runs += m.week.runs;
    liters += m.week.liters;
    if (m.week.unit === "L") m.week.daily.forEach((x, i) => (daily[i] += x));
  }
  const lasts = mine.map((m) => m.last?.start).filter((x): x is number => typeof x === "number");
  const nexts = mine.map((m) => m.next?.start).filter((x): x is number => typeof x === "number");
  const pump = noSite ? null : pumpForSite(data, siteId);
  return {
    id: siteId,
    name: site?.name ?? "No site",
    path: site ? sitePath(data.sites, site.id) : "No site",
    parent_id: site?.parent_id ?? null,
    children: noSite ? [] : childSites(data.sites, siteId).map((s) => s.id),
    mps: mine.length,
    valves: valves.length,
    online: valves.filter((v) => v.status !== "offline").length,
    watering: valves.filter((v) => v.status === "watering").length,
    attention: mine.filter((m) => m.status !== "offline" && m.badges.length > 0).length,
    offline: valves.filter((v) => v.status === "offline").length,
    last: lasts.length ? Math.max(...lasts) : null,
    next: nexts.length ? Math.min(...nexts) : null,
    week: { runs, liters, daily },
    pump: pump ? { name: pump.pump.name, via: pump.via } : null,
  };
}
