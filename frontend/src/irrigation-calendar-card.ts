import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { packLanes, isMissed, LaneEvent } from "./calendar-lanes";

/* Irrigation calendar as a clickable time grid (Trello 9W8FXA4l: "grid
 * view", 15-min grid, planned always before completed, link to the valve).
 * Simon's reference is Planyway's day view: hour rows, coloured blocks,
 * tap = open. Data comes from the two merged calendar entities through
 * HA's calendar REST API, so the grid, the HA Calendar panel and the ICS
 * feed keep one truth. */

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
}

interface CardConfig {
  type: string;
  title?: string;
  valves?: Valve[];
  planned_entity?: string;
  completed_entity?: string;
  /** Pixels per hour in the grid (default 56). */
  hour_height?: number;
}

interface GridEvent extends LaneEvent {
  key: string; // registry entity id = valve identity in both calendars
  summary: string;
  path?: string;
}

type Mode = "day" | "week";

const DAY_MS = 86_400_000;
const PLANNED = "calendar.irrigation_planned";
const COMPLETED = "calendar.irrigation_completed";

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

function errText(e: unknown): string {
  const o = e as { body?: { message?: string }; message?: string };
  return o?.body?.message ?? o?.message ?? String(e);
}

export class IrrigationCalendarCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config: CardConfig | null = null;
  @state() private _mode: Mode = "day";
  @state() private _anchor: Date = startOfDay(new Date());
  @state() private _events: GridEvent[] = [];
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
    // the calendar view is not a live monitor.
    this._timer = window.setInterval(() => this._load(true), 5 * 60_000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._timer) window.clearInterval(this._timer);
  }

  updated(): void {
    const key = `${this._mode}|${this._anchor.getTime()}`;
    if (key !== this._loadedKey && this.hass?.callApi) {
      this._loadedKey = key;
      this._load();
    }
  }

  private _window(): [Date, Date] {
    const from = this._mode === "day" ? startOfDay(this._anchor) : startOfWeek(this._anchor);
    return [from, addDays(from, this._mode === "day" ? 1 : 7)];
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
          path: v?.view_path,
        };
      };
      const runs = (c ?? [])
        .map((e) =>
          toEvent(e, /Type: In progress/.test(e.description ?? "") ? "running" : "completed")
        )
        .filter((e): e is GridEvent => !!e);
      const now = Date.now();
      const plans = (p ?? [])
        .map((e) => toEvent(e, "planned"))
        .filter((e): e is GridEvent => !!e)
        .map((e) => (isMissed(e, runs, now) ? { ...e, kind: "missed" as const } : e));
      this._events = [...plans, ...runs];
    } catch (e) {
      this._error = errText(e);
    } finally {
      this._loading = false;
      if (!silent) this.updateComplete.then(() => this._scrollToFirst());
    }
  }

  private _scrollToFirst(): void {
    // Earliest time-of-day with an event in the window (week view: any day).
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
    const hourPx = this._hourPx();
    scroller.scrollTop = Math.max(0, (firstHour - 1) * hourPx);
  }

  private _hourPx(): number {
    return this._config?.hour_height ?? 56;
  }

  private _shift(n: number): void {
    this._anchor = addDays(this._anchor, this._mode === "day" ? n : 7 * n);
  }

  private _open(ev: GridEvent): void {
    if (!ev.path) return;
    const base = window.location.pathname.split("/")[1] || "lovelace";
    window.history.pushState(null, "", `/${base}/${ev.path}`);
    this.dispatchEvent(new Event("location-changed", { bubbles: true, composed: true }));
  }

  private _title(): string {
    const [from, to] = this._window();
    const opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
    if (this._mode === "day") return from.toLocaleDateString(undefined, opts);
    return `${from.toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${addDays(
      to,
      -1
    ).toLocaleDateString(undefined, opts)}`;
  }

  render() {
    if (!this._config) return nothing;
    const [from] = this._window();
    const days = this._mode === "day" ? 1 : 7;
    const hourPx = this._hourPx();
    const today = startOfDay(new Date()).getTime();
    const counts = { planned: 0, completed: 0, running: 0, missed: 0 };
    for (const e of this._events) counts[e.kind]++;

    return html`
      <ha-card>
        <div class="card-header">
          <ha-icon icon="mdi:calendar-clock"></ha-icon>
          <span class="title">${this._config.title ?? "Irrigation calendar"}</span>
          <div class="seg">
            <button class=${this._mode === "day" ? "on" : ""} @click=${() => (this._mode = "day")}>Day</button>
            <button class=${this._mode === "week" ? "on" : ""} @click=${() => (this._mode = "week")}>Week</button>
          </div>
        </div>
        <div class="nav">
          <button @click=${() => this._shift(-1)} aria-label="Previous">‹</button>
          <button @click=${() => (this._anchor = startOfDay(new Date()))}>Today</button>
          <button @click=${() => this._shift(1)} aria-label="Next">›</button>
          <span class="range">${this._title()}</span>
          ${this._loading ? html`<span class="dim">loading…</span>` : nothing}
        </div>
        <div class="legend">
          <span><i class="sw planned"></i>planned ${counts.planned}</span>
          <span><i class="sw completed"></i>completed ${counts.completed}</span>
          ${counts.running ? html`<span><i class="sw running"></i>running ${counts.running}</span>` : nothing}
          ${counts.missed ? html`<span><i class="sw missed"></i>missed ${counts.missed}</span>` : nothing}
        </div>
        ${this._error ? html`<div class="err">${this._error}</div>` : nothing}
        <div class="scroll">
          <div class="grid" style="--hour:${hourPx}px;--days:${days}">
            <div class="hours">
              ${Array.from({ length: 24 }, (_, h) => html`<div class="hour">${pad(h)}:00</div>`)}
            </div>
            ${Array.from({ length: days }, (_, i) => {
              const dayStart = addDays(from, i).getTime();
              const dayEnd = dayStart + DAY_MS;
              const inDay = this._events
                .filter((e) => e.start < dayEnd && e.end > dayStart)
                .map((e) => ({ ...e, start: Math.max(e.start, dayStart), end: Math.min(e.end, dayEnd) }));
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
                    const top = ((ev.start - dayStart) / 3_600_000) * hourPx;
                    const h = Math.max(((ev.end - ev.start) / 3_600_000) * hourPx, hourPx / 4);
                    const w = 100 / lanes;
                    return html`<div
                      class="ev ${ev.kind} ${ev.path ? "link" : ""}"
                      style="top:${top}px;height:${h}px;left:${lane * w}%;width:calc(${w}% - 2px)"
                      title=${ev.summary}
                      @click=${() => this._open(ev)}
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
      </ha-card>
    `;
  }

  static styles = css`
    :host {
      --cc-text: var(--primary-text-color, #212121);
      --cc-dim: var(--secondary-text-color, #727272);
      --cc-line: var(--divider-color, #e0e0e0);
      --cc-planned: var(--info-color, #2196f3);
      --cc-completed: var(--success-color, #4caf50);
      --cc-running: var(--warning-color, #ff9800);
      --cc-missed: var(--error-color, #db4437);
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 16px 4px;
      font-size: 1.1em;
      font-weight: 500;
      color: var(--cc-text);
    }
    .card-header ha-icon {
      color: var(--cc-dim);
    }
    .title {
      flex: 1;
      min-width: 0;
    }
    button {
      font: inherit;
      color: var(--cc-text);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--cc-line);
      border-radius: 6px;
      padding: 4px 10px;
      cursor: pointer;
    }
    .seg button.on,
    button:active {
      background: var(--cc-planned);
      color: #fff;
      border-color: var(--cc-planned);
    }
    .nav,
    .legend {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 16px;
      flex-wrap: wrap;
      color: var(--cc-text);
    }
    .legend {
      font-size: 0.8em;
      color: var(--cc-dim);
      padding-bottom: 8px;
    }
    .legend span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .sw {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 2px;
      border: 1px solid transparent;
    }
    .range {
      font-weight: 500;
    }
    .dim {
      color: var(--cc-dim);
    }
    .err {
      color: var(--cc-missed);
      padding: 0 16px 8px;
      font-size: 0.85em;
    }
    .scroll {
      max-height: 72vh;
      overflow: auto;
      border-top: 1px solid var(--cc-line);
    }
    .grid {
      display: grid;
      /* auto min so a column's inline min-width (lanes × width) grows its track */
      grid-template-columns: 48px repeat(var(--days), auto);
      min-width: max-content;
      position: relative;
    }
    .hours {
      position: sticky;
      left: 0;
      background: var(--card-background-color, #fff);
      z-index: 2;
    }
    .hour {
      height: var(--hour);
      font-size: 0.72em;
      color: var(--cc-dim);
      text-align: right;
      padding-right: 6px;
      box-sizing: border-box;
      transform: translateY(-0.6em);
    }
    .colhead {
      position: sticky;
      top: 0;
      z-index: 3;
      background: var(--card-background-color, #fff);
      font-size: 0.8em;
      padding: 2px 0;
      border-bottom: 1px solid var(--cc-line);
      color: var(--cc-dim);
    }
    /* stays readable when a wide (many-lane) column scrolls sideways */
    .colhead span {
      position: sticky;
      left: 54px;
      padding: 0 6px;
    }
    .col {
      position: relative;
      border-left: 1px solid var(--cc-line);
    }
    .col.today .colhead {
      color: var(--cc-planned);
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
      border-radius: 4px;
      padding: 1px 4px;
      font-size: 0.72em;
      line-height: 1.2;
      color: var(--cc-text);
      border: 1px solid;
      background: var(--card-background-color, #fff);
      z-index: 1;
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
    .ev span {
      color: var(--cc-dim);
    }
    .planned {
      border-color: var(--cc-planned);
      background: color-mix(in srgb, var(--cc-planned) 12%, var(--card-background-color, #fff));
    }
    .completed {
      border-color: var(--cc-completed);
      background: color-mix(in srgb, var(--cc-completed) 35%, var(--card-background-color, #fff));
    }
    .running {
      border-color: var(--cc-running);
      background: color-mix(in srgb, var(--cc-running) 35%, var(--card-background-color, #fff));
    }
    .missed {
      border-color: var(--cc-missed);
      border-style: dashed;
      background: color-mix(in srgb, var(--cc-missed) 12%, var(--card-background-color, #fff));
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
      description: "Planned and completed irrigation runs on a clickable 15-minute time grid.",
    });
  }
}
