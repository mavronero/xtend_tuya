import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { offlineSpans, packLanes, pairPlanRuns, Pairable, type HistoryPoint } from "./calendar-lanes";
import { EMPTY_FARM_DATA, loadFarmData, type FarmData } from "./farm/data.ts";
import { discoverValves, type HomeAssistantLike } from "./farm/discovery.ts";
import { NO_FILTER, sitePath, subtree, type ValveFilter } from "./farm/valve-filter.ts";
import { farmTokens } from "./components/theme.ts";
import "./components/valve-filter-bar.ts";
import "./components/spinner.ts";

/* Irrigation calendar: three views over the same two calendar entities
 * (Trello 9W8FXA4l).
 *   Day / Week  — Planyway-style time grid, coloured blocks, tap = valve.
 *   Timeline    — rows = valves under their home · room (as the matrix), x = time
 *                 (OpenSprinkler preview / Rain Bird Dryrun layout).
 * Every planned slot is paired with the run that answered it, so each block
 * IS an outcome: planned (ahead), ran, missed, unplanned run, running.
 * Colours follow the farm cards (components/theme.ts): water that ran is
 * blue and filled, a plan is an outline, missed is a red dashed outline, a
 * run that measured no water is red. The legend doubles as the counts.
 * Filter by site (with its sub-sites) and search, as on the Valves tab; the
 * timeline groups valves by site. */

interface HomeAssistant {
  callApi?: <T = unknown>(method: string, path: string) => Promise<T>;
  states?: Record<string, { state: string }>;
}

interface CalendarApiEvent {
  summary: string;
  description?: string;
  uid?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

interface Valve {
  device_id: string;
  registry_entity: string;
  valve_name: string;
  view_path: string;
  home?: string | null;
  room?: string | null;
  /** Battery % sensor, for the timeline's battery column. */
  battery?: string | null;
}

interface CardConfig {
  type: string;
  title?: string;
  valves?: Valve[];
  planned_entity?: string;
  completed_entity?: string;
  /** Pixels per hour in the day/week grid (default: 8 hours per screen). */
  hour_height?: number;
  /** Views offered, in order (default all three). The Timeline view uses
   * ["timeline"], the Calendar view ["day", "week"]. */
  modes?: Mode[];
}

interface GridEvent extends Pairable {
  key: string; // registry entity id = valve identity in both calendars
  summary: string;
  liters: number | null;
  path?: string;
}

type Mode = "day" | "week" | "timeline";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const PLANNED = "calendar.irrigation_planned";
const COMPLETED = "calendar.irrigation_completed";
const MODE_KEY = "xt-irrigation-calendar-mode";
const RANGE_KEY = "xt-irrigation-calendar-range";

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfWeek(d: Date): Date {
  const s = startOfDay(d);
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7)); // Monday
  return s;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fmtMin = (ms: number) => (ms > 0 ? String(Math.round(ms / 60_000)) : "–");
const fmtL = (l: number | null) => (l == null ? "–" : String(Math.round(l)));

/** "FF East 03 (826) · 10 min · 13.4 L/min · 134 L" → 134; "—" → null */
function litersFromSummary(summary: string): number | null {
  const m = /·\s*~?([\d.,]+)\s*L\s*$/.exec(summary);
  return m ? Number(m[1].replace(",", ".")) : null;
}

/** A run that measured no water: 0 L (unmetered valves report no liters). */
function isDry(e: { kind: string; liters?: number | null }): boolean {
  return (e.kind === "ran" || e.kind === "unplanned") && e.liters === 0;
}

function errText(e: unknown): string {
  const o = e as { body?: { message?: string }; message?: string };
  return o?.body?.message ?? o?.message ?? String(e);
}

const FILTER_KEY = "xt-irrigation-calendar-filter";

function loadFilter(): ValveFilter {
  try {
    return { ...NO_FILTER, ...JSON.parse(localStorage.getItem(FILTER_KEY) ?? "{}"), status: "all" };
  } catch {
    return NO_FILTER;
  }
}

/** Default hour height: 8 hours fill the visible grid (Trello Sijuj2Dd). */
function eightHours(): number {
  return Math.max(36, Math.round((window.innerHeight * 0.72) / 8));
}

function pref(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function setPref(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

export class IrrigationCalendarCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config: CardConfig | null = null;
  @state() private _mode: Mode = (["day", "week", "timeline"].includes(pref(MODE_KEY, "day"))
    ? pref(MODE_KEY, "day")
    : "day") as Mode;
  @state() private _range: 1 | 3 | 7 = ([1, 3, 7].includes(Number(pref(RANGE_KEY, "1")))
    ? Number(pref(RANGE_KEY, "1"))
    : 1) as 1 | 3 | 7;
  @state() private _anchor: Date = startOfDay(new Date());
  @state() private _events: GridEvent[] = [];
  @state() private _problemsOnly = false;
  @state() private _filter: ValveFilter = loadFilter();
  @state() private _farm: FarmData = EMPTY_FARM_DATA;
  private _farmLoaded = false;
  /** Valves found at runtime when the config carries none (then a new or
   * renamed valve shows without re-syncing the dashboard). */
  private _found: Valve[] | null = null;
  private _foundAt = 0;
  /** Registry entity -> offline stretches in the loaded range (timeline). */
  @state() private _offline = new Map<string, [number, number][]>();
  @state() private _loading = false;
  @state() private _error: string | null = null;
  private _loadedKey = "";
  private _timer: number | undefined;

  setConfig(config: CardConfig): void {
    this._config = config;
    const modes = this._modes();
    if (!modes.includes(this._mode)) this._mode = modes[0];
  }

  private _modes(): Mode[] {
    const m = (this._config?.modes ?? []).filter((x): x is Mode => ["day", "week", "timeline"].includes(x));
    return m.length ? m : ["day", "week", "timeline"];
  }

  getCardSize(): number {
    return 12;
  }

  connectedCallback(): void {
    super.connectedCallback();
    // ponytail: plain 5-min poll; runs land in the store on valve close,
    // the calendar is not a live monitor.
    this._timer = window.setInterval(() => this._load(true), 5 * 60_000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._timer) window.clearInterval(this._timer);
  }

  updated(): void {
    if (!this._farmLoaded && this.hass?.callApi) {
      this._farmLoaded = true;
      loadFarmData(this.hass as Parameters<typeof loadFarmData>[0]).then(
        (d) => (this._farm = d),
        () => undefined
      );
    }
    const key = `${this._mode}|${this._range}|${this._anchor.getTime()}`;
    if (key !== this._loadedKey && this.hass?.callApi) {
      this._loadedKey = key;
      this._load();
    }
  }

  // ------------------------------------------------------------- data

  private _window(): [Date, Date] {
    if (this._mode === "week") {
      const from = startOfWeek(this._anchor);
      return [from, addDays(from, 7)];
    }
    const from = startOfDay(this._anchor);
    return [from, addDays(from, this._mode === "timeline" ? this._range : 1)];
  }

  /** The valves: from the config if it lists them (saved dashboards), else
   * discovered from HA, refreshed at most once a minute. */
  private _valves(): Valve[] {
    if (this._config?.valves?.length) return this._config.valves;
    const hass = this.hass as unknown as HomeAssistantLike;
    if (hass?.entities && (!this._found || Date.now() - this._foundAt > 60_000)) {
      this._found = discoverValves(hass).map((v) => ({
        device_id: v.device_id,
        registry_entity: v.registry_entity,
        valve_name: v.valve_name,
        view_path: v.view_path,
        home: v.valve_home,
        room: v.valve_room,
        battery: v.battery_level ?? null,
      }));
      this._foundAt = Date.now();
    }
    return this._found ?? [];
  }

  private _valveByRegistry(): Map<string, Valve> {
    const m = new Map<string, Valve>();
    for (const v of this._valves()) m.set(v.registry_entity, v);
    return m;
  }

  private async _load(silent = false): Promise<void> {
    if (!this.hass?.callApi) return;
    const [from, to] = this._window();
    if (this._mode === "timeline") void this._loadOffline(from, to);
    const q = `?start=${encodeURIComponent(from.toISOString())}&end=${encodeURIComponent(to.toISOString())}`;
    const planned = this._config?.planned_entity ?? PLANNED;
    const completed = this._config?.completed_entity ?? COMPLETED;
    if (!silent) this._loading = true;
    this._error = null;
    try {
      const [p, c] = await Promise.all([
        this.hass.callApi<CalendarApiEvent[]>("GET", `calendars/${planned}${q}`),
        this.hass.callApi<CalendarApiEvent[]>("GET", `calendars/${completed}${q}`),
      ]);
      const valves = this._valveByRegistry();
      const toEvent = (e: CalendarApiEvent, kind: GridEvent["kind"]): GridEvent | null => {
        const start = Date.parse(e.start.dateTime ?? e.start.date ?? "");
        let end = Date.parse(e.end.dateTime ?? e.end.date ?? "");
        if (!Number.isFinite(start)) return null;
        if (!Number.isFinite(end) || end <= start) end = start + 60_000;
        const key = (e.uid ?? "").split("#")[0];
        const v = valves.get(key);
        return {
          start,
          end,
          kind,
          key,
          name: v?.valve_name ?? e.summary.split(" · ")[0],
          summary: e.summary,
          liters: kind === "planned" ? null : litersFromSummary(e.summary),
          path: v?.view_path,
        };
      };
      const runs = (c ?? [])
        .map((e) => toEvent(e, /Type: In progress/.test(e.description ?? "") ? "running" : "ran"))
        .filter((e): e is GridEvent => !!e);
      const plans = (p ?? [])
        .map((e) => toEvent(e, "planned"))
        .filter((e): e is GridEvent => !!e);
      this._events = pairPlanRuns(plans, runs, Date.now());
    } catch (e) {
      this._error = errText(e);
    } finally {
      this._loading = false;
      if (!silent) this.updateComplete.then(() => this._scrollToFirst());
    }
  }

  /** Offline stretches of every valve's registry sensor in the range
   * (Trello Sijuj2Dd: the timeline shows whether a valve was online). */
  private async _loadOffline(from: Date, to: Date): Promise<void> {
    const ids = this._valves().map((v) => v.registry_entity);
    const out = new Map<string, [number, number][]>();
    // ponytail: chunks keep the URL short; one request per 40 valves.
    for (let i = 0; i < ids.length; i += 40) {
      const chunk = ids.slice(i, i + 40);
      try {
        const res = await this.hass.callApi!<HistoryPoint[][]>(
          "GET",
          `history/period/${encodeURIComponent(from.toISOString())}?end_time=${encodeURIComponent(
            to.toISOString()
          )}&filter_entity_id=${chunk.join(",")}&minimal_response&no_attributes`
        );
        for (const series of res ?? []) {
          const id = (series[0] as HistoryPoint & { entity_id?: string })?.entity_id;
          if (id) out.set(id, offlineSpans(series, from.getTime(), Math.min(to.getTime(), Date.now())));
        }
      } catch {
        /* the timeline still shows the runs */
      }
    }
    this._offline = out;
  }

  private _scrollToFirst(): void {
    if (this._mode === "timeline") return;
    const [from, to] = this._window();
    let firstHour: number | null = null;
    for (const e of this._events) {
      if (e.end <= from.getTime() || e.start >= to.getTime()) continue;
      const d = new Date(Math.max(e.start, from.getTime()));
      const h = d.getHours() + d.getMinutes() / 60;
      if (firstHour === null || h < firstHour) firstHour = h;
    }
    const scroller = this.renderRoot.querySelector<HTMLElement>(".scroll");
    if (!scroller || firstHour === null) return;
    scroller.scrollTop = Math.max(0, (firstHour - 1) * this._hourPx());
  }

  private _hourPx(): number {
    return this._config?.hour_height ?? eightHours();
  }

  // ------------------------------------------------------------- actions

  private _setMode(mode: Mode): void {
    this._mode = mode;
    setPref(MODE_KEY, mode);
  }

  private _setRange(r: 1 | 3 | 7): void {
    this._range = r;
    setPref(RANGE_KEY, String(r));
  }

  private _shift(n: number): void {
    const step = this._mode === "week" ? 7 : this._mode === "timeline" ? this._range : 1;
    this._anchor = addDays(this._anchor, step * n);
  }

  private _open(path?: string): void {
    if (!path) return;
    const base = window.location.pathname.split("/")[1] || "lovelace";
    window.history.pushState(null, "", `/${base}/${path}`);
    this.dispatchEvent(new Event("location-changed", { bubbles: true, composed: true }));
  }

  // ------------------------------------------------------------- render

  private _rangeLabel(): string {
    const [from, to] = this._window();
    const long: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
    if (to.getTime() - from.getTime() <= DAY_MS) return from.toLocaleDateString(undefined, long);
    return `${from.toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${addDays(
      to,
      -1
    ).toLocaleDateString(undefined, long)}`;
  }

  /** Site path and metering point of a valve, from the farm data. */
  private _placeOf(v: Valve): { site: string | null; siteName: string | null; mp: string | null } {
    const mp = this._farm.locationOf[v.device_id];
    const site = mp?.site_id ?? null;
    return { site, siteName: site ? sitePath(this._farm.sites, site) : null, mp: mp?.name ?? null };
  }

  /** Valves passing the site filter and search. */
  private _visible(): Valve[] {
    const f = this._filter;
    const inSite = f.site ? subtree(this._farm.sites, f.site) : null;
    const q = f.search.trim().toLowerCase();
    return this._valves().filter((v) => {
      const p = this._placeOf(v);
      if (inSite && !(p.site && inSite.has(p.site))) return false;
      return !q || [v.valve_name, p.mp, p.siteName].some((x) => x?.toLowerCase().includes(q));
    });
  }

  private _shownEvents(): GridEvent[] {
    if (!this._filter.site && !this._filter.search.trim()) return this._events;
    const keys = new Set(this._visible().map((v) => v.registry_entity));
    return this._events.filter((e) => keys.has(e.key));
  }

  private _onFilter(e: CustomEvent<ValveFilter>): void {
    this._filter = e.detail;
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify(e.detail));
    } catch {
      /* private mode */
    }
  }

  /** Legend and counts in one: each chip names an outcome and its number. */
  private _legend(events: GridEvent[]) {
    const c = { planned: 0, ran: 0, missed: 0, unplanned: 0, running: 0, dry: 0 };
    for (const e of events) {
      c[e.kind]++;
      if (isDry(e)) c.dry++;
    }
    const chip = (cls: string, n: number, label: string, title: string) =>
      html`<span class="lg" title=${title}><i class="sw ${cls}"></i><b>${n}</b> ${label}</span>`;
    return html`<div class="legend">
      ${chip("ran", c.ran, "ran", "Planned runs that happened (filled blue)")}
      ${chip("missed", c.missed, "missed", "Planned runs that did not happen (red outline)")}
      ${chip("planned", c.planned, "ahead", "Planned runs still to come (outline)")}
      ${c.unplanned ? chip("unplanned", c.unplanned, "unplanned", "Runs nobody planned (striped)") : nothing}
      ${c.running ? chip("running", c.running, "running", "Watering now") : nothing}
      ${c.dry ? chip("dry", c.dry, "no water", "Runs that measured no water (red)") : nothing}
      ${this._mode === "timeline"
        ? html`<span class="lg" title="Periods the valve was not reachable (grey hatching)"><i class="sw offline"></i>offline</span>`
        : nothing}
    </div>`;
  }

  render() {
    if (!this._config) return nothing;
    const mode = this._mode;
    const events = this._shownEvents();
    const chip = (on: boolean, label: string, click: () => void) =>
      html`<button class="chip ${on ? "on" : ""}" aria-pressed=${on} @click=${click}>${label}</button>`;
    return html`
      <ha-card>
        <div class="head">
          <div class="title-row">
            <h2>${this._config.title ?? (this._modes().join() === "timeline" ? "Timeline" : "Irrigation calendar")}</h2>
            ${this._loading ? html`<xt-spinner></xt-spinner>` : nothing}
          </div>
          <div class="bar">
            ${this._modes().length > 1
              ? html`<div class="chips" role="group" aria-label="View">
                  ${this._modes().map((m) => chip(mode === m, m === "day" ? "Day" : m === "week" ? "Week" : "Timeline", () => this._setMode(m)))}
                </div>`
              : nothing}
            ${mode === "timeline"
              ? html`<div class="chips" role="group" aria-label="Range">
                  ${([1, 3, 7] as const).map((r) => chip(this._range === r, `${r} d`, () => this._setRange(r)))}
                </div>`
              : nothing}
            <div class="datenav">
              <button class="icon" @click=${() => this._shift(-1)} aria-label="Previous"><ha-icon icon="mdi:chevron-left"></ha-icon></button>
              <span class="range-label">${this._rangeLabel()}</span>
              <button class="icon" @click=${() => this._shift(1)} aria-label="Next"><ha-icon icon="mdi:chevron-right"></ha-icon></button>
              ${chip(false, "Today", () => (this._anchor = startOfDay(new Date())))}
            </div>
          </div>
          <xt-valve-filter-bar
            .sites=${this._farm.sites}
            .value=${this._filter}
            .statuses=${false}
            @xt-filter-changed=${this._onFilter}
          ></xt-valve-filter-bar>
          <div class="bar">
            ${this._legend(events)}
            ${mode === "timeline"
              ? chip(this._problemsOnly, this._problemsOnly ? "Showing problems" : "Problems only", () => (this._problemsOnly = !this._problemsOnly))
              : nothing}
          </div>
        </div>
        ${this._error ? html`<div class="err">${this._error}</div>` : nothing}
        ${mode === "timeline" ? this._renderTimeline(events) : this._renderGrid(events)}
      </ha-card>
    `;
  }

  // Day / Week: vertical time grid, lanes for overlaps.
  private _renderGrid(events: GridEvent[]) {
    const [from] = this._window();
    const days = this._mode === "day" ? 1 : 7;
    const hourPx = this._hourPx();
    const today = startOfDay(new Date()).getTime();
    return html`
      <div class="scroll">
        <div class="grid" style="--hour:${hourPx}px;--days:${days}">
          <div class="hours">
            ${days > 1 ? html`<div class="colhead"></div>` : nothing}
            ${Array.from({ length: 24 }, (_, h) => html`<div class="hour">${pad(h)}:00</div>`)}
          </div>
          ${Array.from({ length: days }, (_, i) => {
            const dayStart = addDays(from, i).getTime();
            const dayEnd = dayStart + DAY_MS;
            // Blocks are drawn at least 15 min tall, so pack lanes on that
            // visual length too or a 1-min slot's block overlaps its successor.
            const inDay = events
              .filter((e) => e.start < dayEnd && e.end > dayStart)
              .map((e) => ({
                ...e,
                start: Math.max(e.start, dayStart),
                end: Math.min(Math.max(e.end, e.start + 15 * 60_000), dayEnd),
              }));
            const placed = packLanes(inDay);
            // ponytail: 05:00 on the fleet is 20+ valves at once; widen the
            // column instead of shrinking blocks to slivers (grid scrolls).
            const maxLanes = placed.reduce((m, p) => Math.max(m, p.lanes), 1);
            const laneW = days > 1 ? 40 : 72;
            return html`
              <div
                class="col ${dayStart === today ? "today" : ""}"
                style="min-width:${Math.max(110, maxLanes * laneW)}px"
              >
                ${days > 1
                  ? html`<div class="colhead"><span>${new Date(dayStart).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</span></div>`
                  : nothing}
                <div class="lines"></div>
                ${placed.map(({ ev, lane, lanes }) => {
                  const top = ((ev.start - dayStart) / HOUR_MS) * hourPx;
                  const h = Math.max(((ev.end - ev.start) / HOUR_MS) * hourPx, hourPx / 4);
                  const w = 100 / lanes;
                  return html`<div
                    class="ev ${ev.kind} ${isDry(ev) ? "dry" : ""} ${ev.path ? "link" : ""}"
                    style="top:${top}px;height:${h}px;left:${lane * w}%;width:calc(${w}% - 2px)"
                    title=${ev.summary}
                    @click=${() => this._open(ev.path)}
                  >
                    <b>${ev.name}</b>
                    <span>${hhmm(ev.start)}–${hhmm(ev.end)}${ev.liters != null ? ` · ${Math.round(ev.liters)} L` : ""}</span>
                  </div>`;
                })}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  private _online(v: Valve): boolean {
    const s = this.hass?.states?.[v.registry_entity]?.state;
    return !!s && s !== "unavailable" && s !== "unknown";
  }

  private _battery(v: Valve): number | null {
    const s = v.battery ? this.hass?.states?.[v.battery]?.state : undefined;
    const n = Number(s);
    return s && s !== "" && Number.isFinite(n) ? Math.round(n) : null;
  }

  // Timeline: one row per valve, grouped by site.
  private _renderTimeline(events: GridEvent[]) {
    const [from, to] = this._window();
    const t0 = from.getTime();
    const span = to.getTime() - t0;
    const pct = (ms: number) => ((ms - t0) / span) * 100;
    const now = Date.now();

    const byKey = new Map<string, GridEvent[]>();
    for (const e of events) (byKey.get(e.key) ?? byKey.set(e.key, []).get(e.key)!).push(e);

    // Grouped by site, like the Valves tab.
    const valves = this._visible();
    const groupOf = (v: Valve) => {
      const p = this._placeOf(v);
      return p.siteName ?? (p.mp ? "No site" : "No metering point");
    };
    const groups = new Map<string, Valve[]>();
    for (const v of [...valves].sort(
      (a, b) => groupOf(a).localeCompare(groupOf(b)) || a.valve_name.localeCompare(b.valve_name)
    ))
      (groups.get(groupOf(v)) ?? groups.set(groupOf(v), []).get(groupOf(v))!).push(v);
    const groupNames = [...groups.keys()];

    // axis ticks: every 3 h for one day, 12 h for three, a day for seven
    const stepH = this._range === 1 ? 3 : this._range === 3 ? 12 : 24;
    const ticks: { left: number; label: string }[] = [];
    for (let ms = t0; ms < to.getTime(); ms += stepH * HOUR_MS) {
      const d = new Date(ms);
      ticks.push({
        left: pct(ms),
        label:
          stepH >= 24
            ? d.toLocaleDateString(undefined, { weekday: "short" })
            : d.getHours() === 0 && this._range > 1
              ? d.toLocaleDateString(undefined, { weekday: "short" })
              : `${pad(d.getHours())}`,
      });
    }
    const dayLines = Array.from({ length: this._range - 1 }, (_, i) => pct(t0 + (i + 1) * DAY_MS));
    const nowPct = now > t0 && now < to.getTime() ? pct(now) : null;

    let shown = 0;
    const rows = groupNames.map((g) => {
      const items = groups
        .get(g)!
        .map((v) => {
          const evs = byKey.get(v.registry_entity) ?? [];
          const problem = evs.some(
            (e) =>
              e.kind === "missed" || e.kind === "unplanned" || e.end - e.start > 4 * HOUR_MS
          );
          return { v, evs, problem };
        })
        .filter((r) => !this._problemsOnly || r.problem);
      if (!items.length) return nothing;
      shown += items.length;
      return html`
        <div class="grouphdr">${g}</div>
        ${items.map(({ v, evs, problem }) => {
          const planMs = evs.reduce((s, e) => {
            if (e.kind === "planned" || e.kind === "missed") return s + (e.end - e.start);
            if (e.planStart != null && e.planEnd != null) return s + (e.planEnd - e.planStart);
            return s;
          }, 0);
          const ranEvs = evs.filter((e) => e.kind === "ran" || e.kind === "unplanned" || e.kind === "running");
          const runMs = ranEvs.reduce((s, e) => s + (e.end - e.start), 0);
          const liters = ranEvs.reduce<number | null>(
            (s, e) => (e.liters == null ? s : (s ?? 0) + e.liters),
            null
          );
          return html`
            <div class="row clickable ${problem ? "problem" : ""}" @click=${() => this._open(v.view_path)}>
              <div class="name" title=${v.valve_name}>
                <i class="dot ${this._online(v) ? "" : "off"}" title=${this._online(v) ? "Online now" : "Offline now"}></i>${v.valve_name}
              </div>
              <div class="track">
                ${(this._offline.get(v.registry_entity) ?? []).map(
                  ([s, e]) => html`<i
                    class="offline"
                    style="left:${pct(s)}%;width:${Math.max(pct(e) - pct(s), 0.3)}%"
                    title="Offline ${hhmm(s)}–${hhmm(e)}"
                  ></i>`
                )}
                ${dayLines.map((l) => html`<i class="dayline" style="left:${l}%"></i>`)}
                ${evs.map(
                  (e) => html`<i
                    class="bar ${e.kind} ${isDry(e) ? "dry" : ""}"
                    style="left:${pct(e.start)}%;width:${Math.max(pct(e.end) - pct(e.start), 0.4)}%"
                    title=${e.summary}
                  ></i>`
                )}
                ${nowPct !== null ? html`<i class="now" style="left:${nowPct}%"></i>` : nothing}
              </div>
              <div class="metric ${planMs ? "" : "muted"}">${fmtMin(planMs)}</div>
              <div class="metric ${runMs ? "" : "muted"}">${fmtMin(runMs)}</div>
              <div class="metric ${liters == null ? "muted" : ""}">${fmtL(liters)}</div>
              <div class="metric ${this._battery(v) == null ? "muted" : ""}" title="Battery now">
                ${this._battery(v) == null ? "–" : `${this._battery(v)} %`}
              </div>
            </div>
          `;
        })}
      `;
    });

    return html`
      <div class="tl">
        <div class="row header">
          <div></div>
          <div class="axis">
            ${ticks.map((t) => html`<span style="left:${t.left}%">${t.label}</span>`)}
          </div>
          <div class="metric" title="Planned minutes in this range"><span class="lbl-long">plan min</span><span class="lbl-short">plan</span></div>
          <div class="metric" title="Minutes actually watered in this range"><span class="lbl-long">ran min</span><span class="lbl-short">ran</span></div>
          <div class="metric"><span class="lbl-long">water (L)</span><span class="lbl-short">L</span></div>
          <div class="metric" title="Battery now"><span class="lbl-long">battery</span><span class="lbl-short">bat</span></div>
        </div>
        ${rows}
        ${!valves.length
          ? html`<div class="empty">No valves on this dashboard yet. Use "Re-sync valves" on the overview.</div>`
          : this._problemsOnly && shown === 0
            ? html`<div class="empty">No missed or unplanned runs in this range.</div>`
            : nothing}
      </div>
    `;
  }

  static styles = [
    farmTokens,
    css`
    :host {
      --cc-text: var(--primary-text-color, #212121);
      --cc-dim: var(--xt-dim);
      --cc-line: var(--xt-track);
      --cc-primary: var(--primary-color, #03a9f4);
      --cc-bg: var(--card-background-color, #fff);
      --cc-hover: var(--secondary-background-color, #f5f5f5);
      /* water that ran: blue; a plan: an outline; missed: red dashed */
      --cc-water: var(--xt-water);
      --cc-ran-bg: color-mix(in srgb, var(--xt-water) 28%, var(--cc-bg));
      --cc-missed: var(--xt-bad);
      --cc-dry-bg: color-mix(in srgb, var(--xt-bad) 20%, var(--cc-bg));
      /* unplanned run: still water, but striped so it reads as "nobody scheduled this" */
      --cc-water-stripes: repeating-linear-gradient(
        135deg,
        color-mix(in srgb, var(--cc-water) 45%, var(--cc-bg)) 0 3px,
        color-mix(in srgb, var(--cc-water) 12%, var(--cc-bg)) 3px 7px
      );
    }
    ha-card {
      padding-bottom: 8px;
      color: var(--cc-text);
    }
    .head {
      padding: 16px 16px 8px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    h2 {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 400;
    }
    .bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 16px;
    }
    .chips {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .chip {
      font: inherit;
      font-size: 0.9rem;
      color: var(--cc-text);
      background: var(--cc-bg);
      border: 1px solid var(--cc-line);
      border-radius: 18px;
      padding: 4px 12px;
      min-height: 32px;
      cursor: pointer;
    }
    .chip.on {
      background: var(--cc-primary);
      border-color: var(--cc-primary);
      color: var(--text-primary-color, #fff);
    }
    .chip:focus-visible,
    .icon:focus-visible {
      outline: 2px solid var(--cc-primary);
      outline-offset: 1px;
    }
    .datenav {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .icon {
      border: none;
      background: none;
      cursor: pointer;
      border-radius: 50%;
      padding: 4px;
      display: flex;
      color: var(--cc-text);
    }
    .icon:hover {
      background: var(--cc-hover);
    }
    .range-label {
      font-weight: 500;
      padding: 0 4px;
      min-width: 9em;
      text-align: center;
    }
    xt-valve-filter-bar {
      margin-bottom: 0;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 14px;
      font-size: 0.9rem;
      flex: 1;
    }
    .lg {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-variant-numeric: tabular-nums;
    }
    .lg b {
      font-weight: 500;
    }
    .sw {
      display: inline-block;
      width: 14px;
      height: 12px;
      border-radius: 3px;
      box-sizing: border-box;
    }
    .sw.planned {
      box-shadow: inset 0 0 0 1.5px var(--cc-dim);
    }
    .sw.ran {
      background: var(--cc-ran-bg);
      border-left: 3px solid var(--cc-water);
    }
    .sw.running {
      background: var(--cc-water);
    }
    .sw.missed {
      border: 1.5px dashed var(--cc-missed);
    }
    .sw.unplanned {
      background: var(--cc-water-stripes);
    }
    .sw.offline,
    .track i.offline {
      background: repeating-linear-gradient(
        135deg,
        color-mix(in srgb, var(--xt-off) 55%, transparent) 0 2px,
        transparent 2px 5px
      );
    }
    .track i.offline {
      z-index: 0;
    }
    .name .dot {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--xt-ok);
      margin-right: 6px;
      vertical-align: middle;
    }
    .name .dot.off {
      background: var(--xt-off);
    }
    .sw.dry {
      background: var(--cc-dry-bg);
      border-left: 3px solid var(--cc-missed);
    }
    .err {
      color: var(--cc-missed);
      padding: 0 16px 8px;
      font-size: 0.85rem;
    }
    .empty {
      padding: 12px 16px 8px;
      color: var(--cc-dim);
      font-size: 0.9rem;
    }

    /* ---- day / week grid ---- */
    .scroll {
      max-height: 72vh;
      overflow: auto;
      border-top: 1px solid var(--cc-line);
    }
    .grid {
      display: grid;
      /* auto tracks so a column's inline min-width (lanes × width) grows it */
      grid-template-columns: 48px repeat(var(--days), auto);
      min-width: max-content;
      position: relative;
    }
    .hours {
      position: sticky;
      left: 0;
      background: var(--cc-bg);
      z-index: 2;
    }
    .hour {
      height: var(--hour);
      font-size: 0.72rem;
      color: var(--cc-dim);
      text-align: right;
      padding-right: 6px;
      box-sizing: border-box;
      transform: translateY(-0.6em);
      font-variant-numeric: tabular-nums;
    }
    .colhead {
      position: sticky;
      top: 0;
      z-index: 3;
      background: var(--cc-bg);
      height: 22px;
      line-height: 22px;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid var(--cc-line);
      color: var(--cc-dim);
    }
    .colhead span {
      position: sticky;
      left: 54px;
      padding: 0 8px;
    }
    .col {
      position: relative;
      border-left: 1px solid var(--cc-line);
    }
    .col.today .colhead {
      color: var(--cc-primary);
      font-weight: 600;
    }
    /* 5-minute grid (Trello Sijuj2Dd): faint 5-min, stronger 15-min, solid hour lines */
    .lines {
      height: calc(var(--hour) * 24);
      background-image:
        linear-gradient(to bottom, var(--cc-line) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in srgb, var(--cc-line) 70%, transparent) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in srgb, var(--cc-line) 35%, transparent) 1px, transparent 1px);
      background-size:
        100% var(--hour),
        100% calc(var(--hour) / 4),
        100% calc(var(--hour) / 12);
    }
    .ev {
      position: absolute;
      box-sizing: border-box;
      overflow: hidden;
      border-radius: 3px;
      padding: 1px 4px;
      font-size: 0.72rem;
      line-height: 1.2;
      color: var(--cc-text);
      background: var(--cc-bg);
      z-index: 1;
    }
    .col .ev {
      margin-top: 22px;
    }
    .grid[style*="--days:1"] .col .ev {
      margin-top: 0;
    }
    .ev.link {
      cursor: pointer;
    }
    /* one line: a 15-min block is ~20 px tall (8 h per screen) */
    .ev {
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .ev b,
    .ev span {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ev span {
      flex: 1 1 0;
      min-width: 0;
    }
    .ev b {
      flex: 0 1 auto;
    }
    .ev b {
      font-weight: 500;
    }
    .ev span {
      color: var(--cc-dim);
    }
    .ev.planned {
      box-shadow: inset 0 0 0 1.5px var(--cc-dim);
    }
    .ev.ran,
    .ev.running {
      background: var(--cc-ran-bg);
      border-left: 3px solid var(--cc-water);
    }
    .ev.unplanned {
      background: var(--cc-water-stripes);
    }
    .ev.running {
      box-shadow: inset 0 0 0 2px var(--cc-water);
    }
    .ev.missed {
      border: 1.5px dashed var(--cc-missed);
      background: color-mix(in srgb, var(--cc-missed) 6%, var(--cc-bg));
    }
    .ev.dry {
      background: var(--cc-dry-bg);
      border-left: 3px solid var(--cc-missed);
    }

    /* ---- timeline ---- */
    .tl {
      display: flex;
      flex-direction: column;
    }
    .row {
      display: grid;
      grid-template-columns: 170px 1fr 74px 70px 68px 58px;
      align-items: center;
      gap: 12px;
      height: 32px;
      padding: 0 16px;
    }
    .row.header {
      height: 22px;
      color: var(--cc-dim);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .row.clickable {
      cursor: pointer;
    }
    .row.clickable:hover {
      background: var(--cc-hover);
    }
    .name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.9rem;
    }
    .row.problem .name {
      color: var(--cc-missed);
    }
    .axis {
      position: relative;
      height: 100%;
      font-variant-numeric: tabular-nums;
    }
    .axis span {
      position: absolute;
      top: 3px;
      transform: translateX(-50%);
    }
    .axis span:first-child {
      transform: none;
    }
    .track {
      position: relative;
      height: 22px;
      border-radius: 3px;
      box-shadow: inset 0 0 0 1px var(--cc-line);
      overflow: hidden;
      /* hour gridlines: one faint tick per hour of the range */
      background-image: repeating-linear-gradient(
        to right,
        var(--cc-line) 0 1px,
        transparent 1px calc(100% / (24 * var(--days, 1)))
      );
      background-size: calc(100% + 1px) 6px;
      background-repeat: repeat-x;
      background-position: 0 bottom;
    }
    .track i {
      position: absolute;
      top: 0;
      bottom: 0;
      display: block;
      /* a 10-min run is 0.7% of a day: keep it a visible mark, like the matrix */
      min-width: 3px;
    }
    .dayline {
      width: 1px;
      background: var(--cc-line);
    }
    .bar {
      border-radius: 2px;
      box-sizing: border-box;
    }
    .bar.planned {
      background: color-mix(in srgb, var(--cc-dim) 12%, var(--cc-bg));
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--cc-dim) 70%, transparent);
    }
    .bar.missed {
      border: 1.5px dashed var(--cc-missed);
    }
    .bar.ran,
    .bar.running {
      background: var(--cc-water);
    }
    .bar.unplanned {
      background: var(--cc-water-stripes);
    }
    .bar.running {
      box-shadow: inset 0 0 0 2px var(--cc-text);
    }
    .bar.dry {
      background: var(--cc-missed);
    }
    .now {
      width: 1px;
      min-width: 1px;
      background: var(--cc-text);
      opacity: 0.5;
    }
    .metric {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-size: 0.9rem;
      white-space: nowrap;
    }
    .metric.muted {
      color: var(--cc-dim);
    }
    .grouphdr {
      padding: 10px 16px 3px;
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--cc-primary);
      border-top: 1px solid var(--cc-line);
    }
    .row.header + .grouphdr {
      border-top: none;
    }
    .lbl-short {
      display: none;
    }
    @media (max-width: 620px) {
      .row {
        grid-template-columns: 100px 1fr 36px 36px 40px 36px;
        gap: 6px;
        padding: 0 10px;
      }
      .name {
        font-size: 0.8rem;
      }
      .metric {
        font-size: 0.78rem;
      }
      .lbl-long {
        display: none;
      }
      .lbl-short {
        display: inline;
      }
      .grouphdr {
        padding: 10px 10px 3px;
      }
      .head {
        padding-left: 10px;
        padding-right: 10px;
      }
    }
    @media (prefers-reduced-motion: no-preference) {
      .bar.running {
        animation: xt-pulse 2s ease-in-out infinite;
      }
      @keyframes xt-pulse {
        50% {
          opacity: 0.6;
        }
      }
    }
  `,
  ];
}

if (!customElements.get("irrigation-calendar-card")) {
  customElements.define("irrigation-calendar-card", IrrigationCalendarCard);
  const w = window as unknown as { customCards?: unknown[] };
  w.customCards = w.customCards || [];
  if (!w.customCards.some((c) => (c as { type?: string }).type === "irrigation-calendar-card")) {
    w.customCards.push({
      type: "irrigation-calendar-card",
      name: "Irrigation Calendar",
      description: "Planned, ran, missed and unplanned irrigation runs as a day grid, week grid or per-valve timeline.",
    });
  }
}
