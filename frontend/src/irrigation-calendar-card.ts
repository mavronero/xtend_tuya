import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { packLanes, pairPlanRuns, Pairable } from "./calendar-lanes";

/* Irrigation calendar: three views over the same two calendar entities
 * (Trello 9W8FXA4l).
 *   Day / Week  — Planyway-style time grid, coloured blocks, tap = valve.
 *   Timeline    — rows = valves under their home · room (as the matrix), x = time
 *                 (OpenSprinkler preview / Rain Bird Dryrun layout).
 * Every planned slot is paired with the run that answered it, so each block
 * IS an outcome: planned (ahead), ran, missed, unplanned run, running.
 * Colour only says "water flowed" (amber) or "problem" (red).
 * Visual language follows the valves overview matrix: same header, subtitle
 * with text-button actions, 150px name column, outlined 1fr track, tabular
 * metrics, uppercase group headers in the primary colour, 620px phone
 * breakpoint. Amber = water flowing, exactly as in the matrix. */

interface HomeAssistant {
  callApi?: <T = unknown>(method: string, path: string) => Promise<T>;
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
}

interface CardConfig {
  type: string;
  title?: string;
  valves?: Valve[];
  planned_entity?: string;
  completed_entity?: string;
  /** Pixels per hour in the day/week grid (default 56). */
  hour_height?: number;
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

function errText(e: unknown): string {
  const o = e as { body?: { message?: string }; message?: string };
  return o?.body?.message ?? o?.message ?? String(e);
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
  @state() private _loading = false;
  @state() private _error: string | null = null;
  private _loadedKey = "";
  private _timer: number | undefined;

  setConfig(config: CardConfig): void {
    this._config = config;
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

  private _valveByRegistry(): Map<string, Valve> {
    const m = new Map<string, Valve>();
    for (const v of this._config?.valves ?? []) m.set(v.registry_entity, v);
    return m;
  }

  private async _load(silent = false): Promise<void> {
    if (!this.hass?.callApi) return;
    const [from, to] = this._window();
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
    return this._config?.hour_height ?? 56;
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

  private _countsText(): string {
    const c = { planned: 0, ran: 0, missed: 0, unplanned: 0, running: 0 };
    for (const e of this._events) c[e.kind]++;
    const parts = [`${c.ran} ran`, `${c.missed} missed`, `${c.planned} ahead`];
    if (c.unplanned) parts.push(`${c.unplanned} unplanned`);
    if (c.running) parts.push(`${c.running} running`);
    return parts.join(" · ");
  }

  render() {
    if (!this._config) return nothing;
    const mode = this._mode;
    const tab = (m: Mode, label: string) =>
      html`<button class="txt tab ${mode === m ? "on" : ""}" @click=${() => this._setMode(m)}>${label}</button>`;
    return html`
      <ha-card>
        <h1 class="card-header">${this._config.title ?? "Irrigation calendar"}</h1>
        <div class="card-subtitle">
          <span class="counts">${this._loading ? "loading…" : this._countsText()}</span>
          <span class="actions">
            ${tab("day", "Day")} ${tab("week", "Week")} ${tab("timeline", "Timeline")}
            ${mode === "timeline"
              ? html`<select class="range" @change=${(e: Event) => this._setRange(Number((e.target as HTMLSelectElement).value) as 1 | 3 | 7)}>
                  ${[1, 3, 7].map((r) => html`<option value=${r} ?selected=${r === this._range}>${r} d</option>`)}
                </select>`
              : nothing}
          </span>
        </div>
        <div class="card-subtitle nav">
          <span class="datenav">
            <button class="txt" @click=${() => this._shift(-1)} aria-label="Previous">‹</button>
            <span class="range-label">${this._rangeLabel()}</span>
            <button class="txt" @click=${() => this._shift(1)} aria-label="Next">›</button>
            <button class="txt" @click=${() => (this._anchor = startOfDay(new Date()))}>Today</button>
          </span>
          <span class="actions">
            ${mode === "timeline"
              ? html`<button class="txt ${this._problemsOnly ? "on" : ""}" @click=${() => (this._problemsOnly = !this._problemsOnly)}>
                  ${this._problemsOnly ? "Showing problems" : "Problems only"}
                </button>`
              : nothing}
            <span class="legend">
              <i class="sw planned"></i>planned <i class="sw ran"></i>ran
              <i class="sw missed"></i>missed <i class="sw unplanned"></i>unplanned
            </span>
          </span>
        </div>
        ${this._error ? html`<div class="err">${this._error}</div>` : nothing}
        ${mode === "timeline" ? this._renderTimeline() : this._renderGrid()}
      </ha-card>
    `;
  }

  // Day / Week: vertical time grid, lanes for overlaps.
  private _renderGrid() {
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
            const inDay = this._events
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
                <div class="lines">
                  ${Array.from({ length: 96 }, (_, q) => html`<div class="q ${q % 4 === 0 ? "h" : ""}"></div>`)}
                </div>
                ${placed.map(({ ev, lane, lanes }) => {
                  const top = ((ev.start - dayStart) / HOUR_MS) * hourPx;
                  const h = Math.max(((ev.end - ev.start) / HOUR_MS) * hourPx, hourPx / 4);
                  const w = 100 / lanes;
                  return html`<div
                    class="ev ${ev.kind} ${ev.path ? "link" : ""}"
                    style="top:${top}px;height:${h}px;left:${lane * w}%;width:calc(${w}% - 2px)"
                    title=${ev.summary}
                    @click=${() => this._open(ev.path)}
                  >
                    <b>${ev.name}</b>
                    <span>${hhmm(ev.start)}–${hhmm(ev.end)}</span>
                  </div>`;
                })}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  // Timeline: one row per valve, grouped by irrigation location.
  private _renderTimeline() {
    const [from, to] = this._window();
    const t0 = from.getTime();
    const span = to.getTime() - t0;
    const pct = (ms: number) => ((ms - t0) / span) * 100;
    const now = Date.now();

    const byKey = new Map<string, GridEvent[]>();
    for (const e of this._events) (byKey.get(e.key) ?? byKey.set(e.key, []).get(e.key)!).push(e);

    // Same home · room grouping and order as the overview matrix.
    const valves = this._config?.valves ?? [];
    const groupOf = (v: Valve) => `${v.home || "Unassigned"} · ${v.room || "—"}`;
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
              <div class="name" title=${v.valve_name}>${v.valve_name}</div>
              <div class="track">
                ${dayLines.map((l) => html`<i class="dayline" style="left:${l}%"></i>`)}
                ${evs.map(
                  (e) => html`<i
                    class="bar ${e.kind}"
                    style="left:${pct(e.start)}%;width:${Math.max(pct(e.end) - pct(e.start), 0.4)}%"
                    title=${e.summary}
                  ></i>`
                )}
                ${nowPct !== null ? html`<i class="now" style="left:${nowPct}%"></i>` : nothing}
              </div>
              <div class="metric ${planMs ? "" : "muted"}">${fmtMin(planMs)}</div>
              <div class="metric ${runMs ? "" : "muted"}">${fmtMin(runMs)}</div>
              <div class="metric ${liters == null ? "muted" : ""}">${fmtL(liters)}</div>
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

  static styles = css`
    :host {
      --cc-text: var(--primary-text-color, #212121);
      --cc-dim: var(--secondary-text-color, #727272);
      --cc-line: var(--divider-color, #e0e0e0);
      --cc-primary: var(--primary-color, #03a9f4);
      --cc-planned: rgba(3, 169, 244, 0.3);
      --cc-water: var(--state-switch-active-color, #f9a825);
      /* unplanned run: still water, but hatched so it reads as "nobody scheduled this" */
      --cc-water-stripes: repeating-linear-gradient(
        135deg,
        var(--cc-water) 0 3px,
        color-mix(in srgb, var(--cc-water) 35%, var(--cc-bg)) 3px 6px
      );
      --cc-missed: var(--error-color, #db4437);
      --cc-bg: var(--card-background-color, #fff);
      --cc-hover: var(--secondary-background-color, #f5f5f5);
    }
    ha-card {
      padding-bottom: 8px;
      color: var(--cc-text);
    }
    .card-header {
      font-size: 1.4rem;
      font-weight: 400;
      padding: 16px 16px 4px;
      margin: 0;
    }
    .card-subtitle {
      padding: 0 16px 10px;
      margin: 0;
      color: var(--cc-dim);
      font-size: 0.95rem;
      font-variant-numeric: tabular-nums;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .card-subtitle.nav {
      padding-bottom: 6px;
    }
    .actions,
    .datenav {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }
    .range-label {
      color: var(--cc-text);
      font-weight: 500;
      padding: 0 4px;
    }
    button.txt {
      border: none;
      background: none;
      color: var(--cc-primary);
      font: inherit;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      white-space: nowrap;
    }
    button.txt:hover {
      background: var(--cc-hover);
    }
    button.txt:focus-visible {
      outline: 2px solid var(--cc-primary);
      outline-offset: 1px;
    }
    button.tab.on {
      color: var(--cc-text);
      box-shadow: inset 0 -2px 0 var(--cc-primary);
      border-radius: 6px 6px 0 0;
    }
    button.txt.on:not(.tab) {
      background: var(--cc-hover);
      color: var(--cc-text);
    }
    select.range {
      border: 1px solid var(--cc-line);
      background: var(--cc-bg);
      color: var(--cc-text);
      font: inherit;
      font-size: 0.85rem;
      padding: 2px 6px;
      border-radius: 6px;
      cursor: pointer;
      margin-left: 6px;
    }
    .legend {
      display: inline-flex;
      align-items: center;
      gap: 4px 6px;
      font-size: 0.8rem;
      margin-left: 8px;
    }
    .sw {
      display: inline-block;
      width: 12px;
      height: 10px;
      border-radius: 2px;
      box-sizing: border-box;
      margin-left: 6px;
    }
    .sw:first-child {
      margin-left: 0;
    }
    .sw.planned {
      background: var(--cc-planned);
      box-shadow: inset 0 0 0 1px var(--cc-primary);
    }
    .sw.ran {
      background: var(--cc-water);
    }
    .sw.missed {
      border: 1px dashed var(--cc-missed);
    }
    .sw.unplanned {
      background: var(--cc-water-stripes);
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
    .lines {
      height: calc(var(--hour) * 24);
    }
    .q {
      height: calc(var(--hour) / 4);
      box-sizing: border-box;
      border-top: 1px dotted var(--cc-line);
    }
    .q.h {
      border-top-style: solid;
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
    .ev b,
    .ev span {
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ev b {
      font-weight: 500;
    }
    .ev span {
      color: var(--cc-dim);
    }
    .ev.planned {
      background: var(--cc-planned);
      box-shadow: inset 0 0 0 1px var(--cc-primary);
    }
    .ev.ran,
    .ev.running {
      background: var(--cc-water);
    }
    .ev.unplanned {
      background: var(--cc-water-stripes);
    }
    .ev.running {
      box-shadow: inset 0 0 0 2px var(--cc-primary);
    }
    .ev.missed {
      border: 1px dashed var(--cc-missed);
    }

    /* ---- timeline ---- */
    .tl {
      display: flex;
      flex-direction: column;
    }
    .row {
      display: grid;
      grid-template-columns: 150px 1fr 74px 70px 68px;
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
      background: var(--cc-planned);
      box-shadow: inset 0 0 0 1px var(--cc-primary);
    }
    .bar.missed {
      border: 1px dashed var(--cc-missed);
    }
    .bar.ran,
    .bar.running {
      background: var(--cc-water);
    }
    .bar.unplanned {
      background: var(--cc-water-stripes);
    }
    .bar.running {
      box-shadow: inset 0 0 0 2px var(--cc-primary);
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
        grid-template-columns: 92px 1fr 40px 40px 40px;
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
      .card-subtitle {
        padding-left: 10px;
        padding-right: 10px;
      }
      .card-header {
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
  `;
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
