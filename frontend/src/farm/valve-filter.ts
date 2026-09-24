/** Filter and sections of the valve overview (pure). */

import type { Site } from "./data.ts";
import type { ValveSummary } from "./valve-summary.ts";

export type StatusFilter = "all" | "watering" | "attention" | "offline";

export interface ValveFilter {
  /** Site id; its whole subtree matches. null = every site. */
  site: string | null;
  status: StatusFilter;
  search: string;
}

export const NO_FILTER: ValveFilter = { site: null, status: "all", search: "" };

export type SectionKey = "watering" | "attention" | "sites" | "offline" | "unassigned";

export interface Group {
  /** Site id, or null for metering points without a site. */
  site: string | null;
  title: string;
  valves: ValveSummary[];
}

export interface Section {
  key: SectionKey;
  title: string;
  groups: Group[];
  count: number;
}

export const SECTION_TITLES: Record<SectionKey, string> = {
  watering: "Watering now",
  attention: "Needs attention",
  sites: "Valves",
  offline: "Offline",
  unassigned: "Without location",
};

export const ALL_SECTIONS: SectionKey[] = ["watering", "attention", "sites", "offline", "unassigned"];

/** The site and every site below it. */
export function subtree(sites: Site[], id: string): Set<string> {
  const out = new Set([id]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const s of sites) {
      if (s.parent_id && out.has(s.parent_id) && !out.has(s.id)) {
        out.add(s.id);
        grew = true;
      }
    }
  }
  return out;
}

/** "Big Farm › FF East" */
export function sitePath(sites: Site[], id: string): string {
  const byId = new Map(sites.map((s) => [s.id, s]));
  const names: string[] = [];
  for (let s = byId.get(id); s && names.length < 20; s = s.parent_id ? byId.get(s.parent_id) : undefined) {
    names.unshift(s.name);
  }
  return names.join(" › ");
}

export function needsAttention(v: ValveSummary): boolean {
  return v.status !== "offline" && v.badges.length > 0;
}

export function applyFilter(valves: ValveSummary[], f: ValveFilter, sites: Site[]): ValveSummary[] {
  const inSite = f.site ? subtree(sites, f.site) : null;
  const q = f.search.trim().toLowerCase();
  return valves.filter(
    (v) =>
      (!inSite || (v.site !== null && inSite.has(v.site.id))) &&
      (f.status === "all" ||
        (f.status === "watering" && v.status === "watering") ||
        (f.status === "offline" && v.status === "offline") ||
        (f.status === "attention" && needsAttention(v))) &&
      (!q ||
        v.name.toLowerCase().includes(q) ||
        (v.location?.name.toLowerCase().includes(q) ?? false) ||
        (v.site?.name.toLowerCase().includes(q) ?? false))
  );
}

/** Sections in order. Watering and attention are extra views on top: those
 * valves also stay in their site group. Offline and unassigned valves only
 * appear in their own section. Empty sections are left out. */
export function sectionize(valves: ValveSummary[], sites: Site[], keys: SectionKey[] = ALL_SECTIONS): Section[] {
  const byName = (a: ValveSummary, b: ValveSummary) => a.name.localeCompare(b.name);
  const single = (key: SectionKey, list: ValveSummary[]): Section => ({
    key,
    title: SECTION_TITLES[key],
    groups: [{ site: null, title: "", valves: [...list].sort(byName) }],
    count: list.length,
  });
  const online = valves.filter((v) => v.status !== "offline");
  const placed = online.filter((v) => v.location);

  const bySite = new Map<string | null, ValveSummary[]>();
  for (const v of placed) {
    const k = v.site?.id ?? null;
    bySite.set(k, [...(bySite.get(k) ?? []), v]);
  }
  const groups: Group[] = [...bySite.entries()]
    .map(([site, list]) => ({
      site,
      title: site ? sitePath(sites, site) : "No site",
      valves: list.sort(byName),
    }))
    // Tree order via the path; "No site" last.
    .sort((a, b) => (a.site === null ? 1 : b.site === null ? -1 : a.title.localeCompare(b.title)));

  const all: Record<SectionKey, Section> = {
    watering: single("watering", online.filter((v) => v.status === "watering")),
    attention: single("attention", online.filter(needsAttention)),
    sites: { key: "sites", title: SECTION_TITLES.sites, groups, count: placed.length },
    offline: single("offline", valves.filter((v) => v.status === "offline")),
    unassigned: single("unassigned", online.filter((v) => !v.location)),
  };
  return keys.map((k) => all[k]).filter((s) => s.count > 0);
}
