/**
 * Custom Lovelace dashboard strategy for FDM5KW irrigation valves.
 *
 * Drop-in replacement for the hand-maintained valve-dashboard.yaml. Picks
 * up every FDM5KW valve currently registered in HA and generates:
 *
 *   - View 0: an "Overview" with one tile per valve (status, battery,
 *     last watering) that navigates to the valve's detail view on tap.
 *   - One hidden "valve" subview: the irrigation-valve-detail card shows
 *     the valve named in the URL (`valve?id=<tuya id>`): control, timers,
 *     history, last watering, battery. One view instead of one per valve
 *     keeps the saved config small and the header to the main sections.
 *
 * Usage in a Lovelace YAML dashboard:
 *
 *     strategy:
 *       type: custom:irrigation-valves
 *
 * That's it — the dashboard is fully auto-generated. New valves added to
 * HA appear after a reload; renamed valves pick up the new SmartLife
 * custom name automatically (the registry sensor exposes `valve_name`).
 *
 * Discovery anchor: every FDM5KW valve has exactly one
 * `sensor.<slug>_irrigation_timer_registry` entity with `device_id` and
 * `valve_name` attributes. We use that as the unique per-valve marker
 * and pull all sibling entities from the entity registry filtered by the
 * same device_id, mapping them by `translation_key` so we don't depend
 * on entity-id naming conventions (the older S 809 valve has legacy ids
 * like `sensor.s_809` / `sensor.s_809_2` that don't fit the descriptive
 * pattern used for newer valves).
 */

import {
  HomeAssistantLike,
  ValveEntities,
  VALVE_VIEW_PATH,
  discoverValves,
  fetchLocations,
} from "./farm/discovery.ts";

interface StrategyConfig {
  type: string;
  /** Optional override for the overview view's title. */
  overview_title?: string;
  /** Hours of history to render in the watering / battery graphs. */
  hours_to_show?: number;
}

interface DashboardView {
  title: string;
  path?: string;
  subview?: boolean;
  icon?: string;
  type?: string;
  max_columns?: number;
  sections?: unknown[];
  cards?: unknown[];
}

interface DashboardConfig {
  title: string;
  views: DashboardView[];
}

class IrrigationValvesStrategy extends HTMLElement {
  static async generate(
    config: StrategyConfig,
    hass: HomeAssistantLike
  ): Promise<DashboardConfig> {
    const locations = await fetchLocations(hass);
    const valves = discoverValves(hass, locations);
    const hours = config.hours_to_show ?? 24;
    const overviewTitle = config.overview_title ?? "Valves";

    if (valves.length === 0) {
      return {
        title: "Solar Valves",
        views: [emptyOverviewView(overviewTitle), locationsView()],
      };
    }

    const views: DashboardView[] = [
      buildOverviewView(overviewTitle, valves, hours),
      locationsView(),
      pumpsView(),
      calendarView(valves),
      valveDetailView(hours),
    ];

    return {
      title: "Solar Valves",
      views,
    };
  }
}

/* ------------------------------------------------------------------ *
 * View builders                                                       *
 * ------------------------------------------------------------------ */

/** Irrigation Locations (permanent irrigated places; valves come and go). */
function locationsView(): DashboardView {
  // Sites as master-detail (Trello Sijuj2Dd "Location" view), full width
  // like the calendar. Metering points are edited in its side panel.
  return {
    title: "Sites",
    path: "locations",
    icon: "mdi:map-marker-radius",
    type: "sections",
    max_columns: 3,
    sections: [
      {
        type: "grid",
        column_span: 3,
        cards: [
          {
            type: "custom:irrigation-sites-card",
            layout_options: { grid_columns: 12, grid_rows: "auto" },
          },
        ],
      },
    ],
  };
}

/** Pumps as master-detail: live figures, water balance with the flow chart,
 * what each pump feeds and the devices connected to it. Pump data is read
 * from HA's statistics of the pump integration's entities, never written. */
function pumpsView(): DashboardView {
  return {
    title: "Pumps",
    path: "pumps",
    icon: "mdi:pump",
    type: "sections",
    max_columns: 3,
    sections: [
      {
        type: "grid",
        column_span: 3,
        cards: [
          {
            type: "custom:irrigation-pumps-card",
            layout_options: { grid_columns: 12, grid_rows: "auto" },
          },
        ],
      },
    ],
  };
}

/** Irrigation calendar: planned + completed runs on a clickable time grid
 * (Trello 9W8FXA4l). Valve list maps calendar events to their detail views. */
function calendarView(valves: ValveEntities[]): DashboardView {
  return {
    title: "Calendar",
    path: "calendar",
    icon: "mdi:calendar-clock",
    type: "sections",
    max_columns: 3, // same width as the overview
    sections: [
      {
        type: "grid",
        column_span: 3,
        cards: [
          {
            type: "custom:irrigation-calendar-card",
            valves: valves.map((v) => ({
              device_id: v.device_id,
              registry_entity: v.registry_entity,
              valve_name: v.valve_name,
              view_path: v.view_path,
              // same home · room grouping as the overview matrix
              home: v.valve_home ?? null,
              room: v.valve_room ?? null,
            })),
            layout_options: { grid_columns: 12, grid_rows: "auto" },
          },
        ],
      },
    ],
  };
}

function emptyOverviewView(title: string): DashboardView {
  return {
    title,
    path: "overview",
    cards: [
      {
        type: "markdown",
        content:
          "# No irrigation valves detected\n\n" +
          "This dashboard auto-discovers FDM5KW valves via the " +
          "`*_irrigation_timer_registry` sensor each device exposes. " +
          "Add a valve in Xtend Tuya and reload the dashboard.",
      },
    ],
  };
}

function buildOverviewView(
  title: string,
  valves: ValveEntities[],
  hours: number
): DashboardView {
  const batteryEntities = valves
    .filter((v) => v.battery_level)
    .map((v) => ({
      entity: v.battery_level,
      name: v.valve_name,
      // Tap a valve's battery row to jump straight into its detail view
      // (Simon 2026-06-04 — every section should reach the detail board).
      tap_action: { action: "navigate", navigation_path: v.view_path },
    }));

  // Combined flow-rate history across every valve — the > arrow on the
  // card opens HA's built-in range/date selector so the overview gets
  // the same range filter as the per-valve detail view.
  const flowEntities = valves
    .filter((v) => v.flow_rate_sensor)
    .map((v) => ({ entity: v.flow_rate_sensor as string, name: v.valve_name }));

  // Single combined card: one fixed-height row per valve — name |
  // watering on/off timeline | battery % — so the watering-history and
  // battery columns line up exactly (Simon 2026-06-04). Two separate stock
  // cards (history-graph + entities) never align row-for-row because of
  // differing row heights, headers and axis offsets. The custom
  // irrigation-valve-matrix card draws both per row instead. Every valve
  // is included (switchless ones show an empty bar); rows navigate to the
  // valve's detail view on click.
  const matrixValves = valves.map((v) => ({
    name: v.valve_name,
    // Tuya device id — the key the runs store records runs under, and the
    // only source of truth the T3 valves have for "was it watering?".
    device_id: v.device_id,
    switch: v.switch,
    battery: v.battery_level,
    volume: v.volume_sensor,
    last_report: v.last_report,
    path: v.view_path,
    home: v.valve_home ?? null,
    room: v.valve_room ?? null,
  }));

  return {
    title,
    path: "overview",
    // Icon-only tab like Locations and Calendar (Trello Sijuj2Dd).
    icon: "mdi:valve",
    type: "sections",
    max_columns: 3,
    sections: [
      // Valve cards with filter and sections come first (Uli 2026-09-24,
      // Trello Sijuj2Dd): watering now, needs attention, by site, offline,
      // without location.
      {
        type: "grid",
        column_span: 3,
        cards: [
          {
            type: "custom:irrigation-valves-card",
            layout_options: { grid_columns: 12, grid_rows: "auto" },
          },
        ],
      },
      // New valves without a location go on top of the valve list so they
      // get assigned (Simon 2026-09-16); the card renders empty when there
      // are none.
      {
        type: "grid",
        column_span: 3,
        cards: [
          {
            type: "custom:irrigation-locations-card",
            unassigned: true,
            layout_options: { grid_columns: 12, grid_rows: "auto" },
          },
        ],
      },
      // The Re-sync button lives in the valve-matrix count row (Simon
      // 2026-06-06: "integrate the resync button there") — no standalone
      // refresh-button card on the overview anymore. The element stays
      // registered for dashboards still on a pre-4.4.203 saved config.
      // Cards inside a `column_span: 3` section default to grid_columns=4
      // (≈1/3 width), so each card declares grid_columns=12 to fill the
      // full row. Without this every card on the overview renders
      // squeezed into the left third of the screen.
      //
      // The valve list with the timeline follows the valve cards and the
      // unassigned valves.
      {
        type: "grid",
        column_span: 3,
        cards: [
          {
            type: "custom:irrigation-valve-matrix",
            title: "Watering history & battery (all valves)",
            hours,
            valves: matrixValves,
            layout_options: { grid_columns: 12, grid_rows: "auto" },
          },
        ],
      },
      ...(flowEntities.length > 0
        ? [
            {
              type: "grid",
              column_span: 3,
              cards: [
                {
                  type: "history-graph",
                  title: "Flow rate (all valves)",
                  hours_to_show: hours,
                  entities: flowEntities,
                  layout_options: { grid_columns: 12, grid_rows: "auto" },
                },
              ],
            },
          ]
        : []),
      ...(batteryEntities.length > 0
        ? [
            {
              type: "grid",
              column_span: 3,
              cards: [
                {
                  // Trend view — spot declining batteries before they die.
                  type: "history-graph",
                  title: "Battery trend (all valves)",
                  hours_to_show: hours,
                  entities: batteryEntities.map((b) => ({
                    entity: b.entity,
                    name: b.name,
                  })),
                  layout_options: { grid_columns: 12, grid_rows: "auto" },
                },
              ],
            },
          ]
        : []),
    ],
  };
}

/** The one detail view; hidden from the header, reached by tapping a valve. */
function valveDetailView(hours: number): DashboardView {
  return {
    title: "Valve",
    path: VALVE_VIEW_PATH,
    subview: true,
    type: "panel",
    cards: [{ type: "custom:irrigation-valve-detail-card", hours }],
  };
}

function buildValveView(v: ValveEntities, hours: number): DashboardView {
  // 3 fixed columns organised by domain (Simon 2026-06-04):
  //   LEFT   = Watering control & timers (switch + timer)
  //   MIDDLE = Watering history — Last Watering pinned to the TOP, then the
  //            flow-rate history graph below it
  //   RIGHT  = Battery monitoring (tile + history) + Other settings
  //            (sleep / rain-snow delay) at the bottom
  // Lifetime/Hourly water cards dropped — duplicate the Watering History
  // flow curve + footer totals.
  const leftCards: unknown[] = [];
  const middleCards: unknown[] = [];
  const rightCards: unknown[] = [];

  const control = buildControlCard(v);
  if (control) leftCards.push(control);
  leftCards.push(buildTimerCard(v));
  // Where the valve is installed + assign/move, under the timers (Trello
  // Sijuj2Dd).
  leftCards.push({ type: "custom:irrigation-locations-card", device_id: v.device_id });

  // The header card (irrigation-valve-header-card) shows the last run and
  // the battery, so the Last Watering card and the battery tile are gone.
  // Every run as a text list, like SmartLife's history (Trello Sijuj2Dd).
  middleCards.push({
    type: "custom:irrigation-run-history-card",
    device_id: v.device_id,
    metered: !!v.volume_sensor,
  });
  const watering = buildWateringHistoryCard(v, hours);
  if (watering) middleCards.push(watering);

  if (v.battery_level) rightCards.push(buildBatteryHistoryCard(v, hours));
  // Other settings (sleep / rain-snow delay) stays in the right column,
  // below battery, where it lived before — Simon 2026-06-04.
  const other = buildOtherSettingsCard(v);
  if (other) rightCards.push(other);

  const sections: unknown[] = [];
  if (leftCards.length) sections.push({ type: "grid", cards: leftCards });
  if (middleCards.length) sections.push({ type: "grid", cards: middleCards });
  if (rightCards.length) sections.push({ type: "grid", cards: rightCards });

  return {
    title: v.valve_name,
    path: v.view_path,
    type: "sections",
    max_columns: 3,
    sections,
  };
}

function buildControlCard(v: ValveEntities): unknown | null {
  if (!v.switch) return null;
  return {
    type: "custom:irrigation-control-card",
    valve: v.switch,
    duration: v.duration,
    volume_sensor: v.volume_sensor,
    start_time_sensor: v.start_time_sensor,
    end_time_sensor: v.end_time_sensor,
    mode_sensor: v.mode_sensor,
    value_sensor: v.value_sensor,
    registry_entity: v.registry_entity,
    device_id: v.device_id,
    layout_options: { grid_columns: 4, grid_rows: "auto" },
  };
}

function buildOtherSettingsCard(v: ValveEntities): unknown | null {
  const cards: unknown[] = [];
  if (v.sleep_mode)
    cards.push({
      type: "entities",
      title: "Other settings",
      show_header_toggle: false,
      entities: [{ entity: v.sleep_mode, name: "Sleep Mode" }],
    });
  // Rain/Snow delay as a tile with −/+ buttons instead of an entities row —
  // more responsive to tap, esp. on the companion app (Trello ExgyBKSb).
  if (v.rain_snow_delay)
    cards.push({
      type: "tile",
      entity: v.rain_snow_delay,
      name: "Rain/Snow Delay",
      features: [{ type: "numeric-input", style: "buttons" }],
    });
  if (cards.length === 0) return null;
  return {
    type: "vertical-stack",
    cards,
    layout_options: { grid_columns: 4, grid_rows: "auto" },
  };
}

function buildTimerCard(v: ValveEntities): unknown {
  return {
    type: "custom:irrigation-timer-card",
    entity: v.registry_entity,
    device_id: v.device_id,
    layout_options: { grid_columns: 4, grid_rows: "auto" },
  };
}

function buildWateringHistoryCard(v: ValveEntities, hours: number): unknown | null {
  // Per-Simon spec (2026-05-12): graph should show flow rate while the
  // valve is open so the area under the curve equals total liters.
  // FDM5KW has no flow meter; the integration derives l/min from
  // cur_cap and elapsed-since-start, publishing fresh state every 10 s
  // while a run is active. Fall back to the volume sensor for legacy
  // installs that lack the derived flow entity.
  //
  // grid_columns=12: span the full row. The 10 s sample spacing is
  // narrow, and at 1/3-width on a 24h window the on-pulse rectangle
  // collapses to a single hairline; full-width gives Simon's team a
  // legible flow curve.
  // Footer (the history-graph legend) shows each entity's current value.
  // Per Simon/Uli 2026-06-03 it should carry BOTH the live flow rate and
  // the volume watered so far in the current cycle. `volume_sensor`
  // (cur_cap) resets to 0 between runs, so it reads as the running total
  // for the active cycle; on the graph it ramps up during a run,
  // complementing the flow curve.
  const entities: unknown[] = [];
  if (v.switch) entities.push({ entity: v.switch, name: "Valve" });
  if (v.flow_rate_sensor)
    entities.push({ entity: v.flow_rate_sensor, name: "Flow rate" });
  if (v.volume_sensor)
    entities.push({ entity: v.volume_sensor, name: "Watered (cycle)" });
  if (entities.length === 0) return null;
  return {
    type: "history-graph",
    title: "Watering History",
    hours_to_show: hours,
    entities,
    layout_options: { grid_columns: 4, grid_rows: "auto" },
  };
}

function buildBatteryHistoryCard(v: ValveEntities, hours: number): unknown {
  return {
    type: "history-graph",
    title: "Battery History",
    entities: [{ entity: v.battery_level, name: "Battery" }],
    layout_options: { grid_columns: 4, grid_rows: "auto" },
    max_y_axis: 100,
    hours_to_show: hours,
  };
}

/* ------------------------------------------------------------------ *
 * Refresh button                                                      *
 * ------------------------------------------------------------------ */

// Minimal Lovelace custom card: a "Re-sync valves" button.
//
// The prod dashboard is saved as STATIC config (running the strategy live
// reliably hit HA's ~5 s "Timeout waiting for strategy element" over the
// Nabu Casa relay). Static means it does NOT auto-pick-up valve renames,
// additions or removals. This button re-runs the strategy on demand,
// saves the fresh output back over the dashboard config, then reloads —
// so Simon gets up-to-date valves (names included; valve_name is read
// fresh from each registry sensor) without ever loading the strategy in
// the dashboard's timeout-bound load path.
//
// Self-contained in this bundle (no Lit dep) so it ships and registers
// alongside the strategy IIFE.
// Regenerate the strategy against the live registry, persist over the
// current dashboard's config, then reload. Shared by the (legacy)
// standalone refresh-button card and the valve-matrix count-row button.
async function resyncCurrentDashboard(hass: HomeAssistantLike): Promise<void> {
  const config = await IrrigationValvesStrategy.generate({ type: "" }, hass);
  const urlPath = window.location.pathname.split("/").filter(Boolean)[0];
  await (
    hass as unknown as {
      callWS: (msg: Record<string, unknown>) => Promise<unknown>;
    }
  ).callWS({
    type: "lovelace/config/save",
    url_path: urlPath,
    config,
  });
  window.location.reload();
}

class IrrigationRefreshButton extends HTMLElement {
  private _hass: HomeAssistantLike | null = null;
  private _btn: HTMLButtonElement | null = null;

  // Lovelace sets `.hass` on every card whenever state changes; keep the
  // latest so the click handler can regenerate against current entities.
  set hass(value: HomeAssistantLike) {
    this._hass = value;
  }

  setConfig(_config: unknown): void {
    if (this.childElementCount) return;
    const card = document.createElement("ha-card");
    const btn = document.createElement("button");
    this._btn = btn;
    btn.textContent = "↻ Re-sync valves";
    btn.style.cssText =
      "width:100%;padding:12px 16px;border:none;background:none;" +
      "color:var(--primary-color);font-size:1rem;font-weight:500;" +
      "cursor:pointer;border-radius:var(--ha-card-border-radius,12px);";
    btn.addEventListener("click", () => void this._resync());
    card.appendChild(btn);
    this.appendChild(card);
  }

  private async _resync(): Promise<void> {
    const hass = this._hass;
    const btn = this._btn;
    // No hass yet (card not bound) — fall back to a plain reload.
    if (!hass) {
      window.location.reload();
      return;
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Syncing…";
    }
    try {
      await resyncCurrentDashboard(hass);
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "↻ Re-sync failed — retry";
      }
      // eslint-disable-next-line no-console
      console.error("xtend_tuya: valve re-sync failed", err);
    }
  }

  getCardSize(): number {
    return 1;
  }
}

if (!customElements.get("irrigation-refresh-button")) {
  customElements.define("irrigation-refresh-button", IrrigationRefreshButton);
}

/* ------------------------------------------------------------------ *
 * Valve matrix card                                                   *
 * ------------------------------------------------------------------ */

// One fixed-height row per valve — name | watering on/off timeline |
// battery % — so the watering-history and battery columns line up exactly
// (two separate stock cards never align row-for-row). Lives INSIDE the
// strategy bundle (vanilla, no Lit) rather than its own file: HACS does
// not reliably deploy a newly-added bundle file, but this existing bundle
// always updates, and add_extra_js_url already loads it.

interface MatrixRow {
  name: string;
  /** Tuya device id, used to look this valve's runs up in the runs store.
   * Absent in dashboard configs saved before 4.4.251 — those rows fall back
   * to the switch-history timing until the board is re-synced. */
  device_id?: string;
  switch?: string;
  battery?: string;
  volume?: string;
  /** Diagnostic "last report" sensor, for the stale marker (audit C23). */
  last_report?: string;
  path?: string;
  /** SmartLife home / room for list grouping (4.4.207). */
  home?: string | null;
  room?: string | null;
}
interface MatrixConfig {
  type: string;
  title?: string;
  hours?: number;
  valves: MatrixRow[];
}
interface MatrixSegment {
  left: number;
  width: number;
  // "on" = watering, "off" = reporting-but-closed. Unavailable / unknown
  // periods produce NO segment — the bare track shows through as a gap, so
  // a non-reporting valve reads as an empty lane (real-state signal Simon
  // relied on; a solid track for every valve hid offline valves).
  kind: "on" | "off";
  startMs: number;
  endMs: number;
}

/** One row of GET /api/xtend_tuya/runs (frozen export contract). */
interface StoredRun {
  device_id: string;
  start: string;
  end: string;
  duration_seconds: number;
  liters?: number | null;
}
interface HistoryPoint {
  s: string;
  lu: number;
}

const MATRIX_REFRESH_MS = 60_000;
// A valve that has not reported for this long while still flagged online is
// showing frozen values, not healthy ones (audit C23). ponytail: one figure
// for the whole fleet — split it per product if the T3's cadence differs.
const STALE_AFTER_HOURS = 36;

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) =>
      (({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }) as Record<
        string,
        string
      >)[c]
  );
}

// Hover tooltip for a timeline segment (Simon 2026-08-12): state + date +
// time range, e.g. "Watering 12.08. 06:15 – 06:30". Native title attr —
// no tooltip lib, works on desktop where Simon reads the dashboard.
function segmentTooltip(s: MatrixSegment): string {
  const day = (ms: number) =>
    new Date(ms).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
    });
  const time = (ms: number) =>
    new Date(ms).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  const sameDay = day(s.startMs) === day(s.endMs);
  const range = sameDay
    ? `${day(s.startMs)} ${time(s.startMs)} – ${time(s.endMs)}`
    : `${day(s.startMs)} ${time(s.startMs)} – ${day(s.endMs)} ${time(s.endMs)}`;
  return `${s.kind === "on" ? "Watering" : "Online"} ${range}`;
}

class IrrigationValveMatrix extends HTMLElement {
  private _hass: HomeAssistantLike | null = null;
  private _config: MatrixConfig | null = null;
  private _segments: Record<string, MatrixSegment[]> = {};
  // Liters per TUYA DEVICE ID within the window, summed from the runs store
  // (same source as the bars and the TIME column).
  private _waterL: Record<string, number> = {};
  // Recorded runs from the runs store, keyed by TUYA DEVICE ID. These are
  // the amber bars and the TIME column; the switch history only supplies
  // the light-blue "reporting" lane underneath them (audit R2/R3).
  private _runSegments: Record<string, MatrixSegment[]> = {};
  private _runMin: Record<string, number> = {};
  private _root: ShadowRoot;
  private _refreshHandle: number | null = null;
  private _fetching = false;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
  }

  setConfig(config: MatrixConfig): void {
    if (!config.valves || !Array.isArray(config.valves)) {
      throw new Error("irrigation-valve-matrix: `valves` list is required");
    }
    this._config = config;
    this._segments = {};
    this._render();
  }

  set hass(value: HomeAssistantLike) {
    this._hass = value;
    if (Object.keys(this._segments).length === 0) {
      void this._fetchHistory();
    } else {
      this._updateBattery();
    }
    this._updateCounts();
  }

  getCardSize(): number {
    return Math.max(3, Math.ceil((this._config?.valves?.length ?? 0) / 2));
  }

  connectedCallback(): void {
    this._refreshHandle = window.setInterval(
      () => void this._fetchHistory(),
      MATRIX_REFRESH_MS
    );
  }

  disconnectedCallback(): void {
    if (this._refreshHandle !== null) {
      window.clearInterval(this._refreshHandle);
      this._refreshHandle = null;
    }
  }

  // Window the user picked in the range dropdown this session. Runtime-only
  // on purpose: persisting it would need a dashboard-config save round-trip
  // (and everyone shares the saved config); a fresh load starts at the
  // configured default again.
  private _runtimeHours: number | null = null;

  private _hours(): number {
    return this._runtimeHours ?? this._config?.hours ?? 24;
  }

  private _hoursLabel(): string {
    const h = this._hours();
    return h % 24 === 0 && h >= 48 ? `${h / 24} d` : `${h} h`;
  }

  private async _fetchHistory(): Promise<void> {
    if (!this._hass || !this._config || this._fetching) return;
    const switches = this._config.valves
      .map((v) => v.switch)
      .filter((e): e is string => !!e);
    if (switches.length === 0 && !this._config.valves.some((v) => v.device_id)) return;
    this._fetching = true;
    const now = Date.now();
    const start = now - this._hours() * 3_600_000;
    try {
      const raw = await (
        this._hass as unknown as {
          callWS: (msg: Record<string, unknown>) => Promise<
            Record<string, HistoryPoint[]>
          >;
        }
      ).callWS({
        type: "history/history_during_period",
        start_time: new Date(start).toISOString(),
        end_time: new Date(now).toISOString(),
        entity_ids: switches,
        minimal_response: true,
        no_attributes: true,
      });
      const nextSegs: Record<string, MatrixSegment[]> = {};
      for (const entity of switches) {
        nextSegs[entity] = this._buildSegments(raw[entity] ?? [], start, now);
      }
      this._segments = nextSegs;
      await this._fetchRuns(start, now);
      this._render();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("irrigation-valve-matrix: history fetch failed", err);
    } finally {
      this._fetching = false;
    }
  }

  // Recorded runs, straight from the materialized runs store. This is the
  // ONLY honest source of "was this valve watering?" on the whole fleet:
  // the QT-08W-T3 never turns its switch entity on during a scheduled run
  // (recorder-verified on 752 and 708), so a switch-history timeline shows
  // liters with 0 min and no bars (audit R2/R3). Old-gen runs live in the
  // same store, so pointing every row at it finally gives the dashboard,
  // the calendars and the CSV export one shared truth.
  //
  // The view serves from memory and never touches the recorder, so this is
  // cheap; it is deliberately fetched after the history call so a runs
  // failure still leaves the reporting lane and the WATER column rendered.
  private async _fetchRuns(startMs: number, endMs: number): Promise<void> {
    const hass = this._hass;
    if (!hass?.callApi) return;
    const wanted = new Set(
      (this._config?.valves ?? [])
        .map((v) => v.device_id)
        .filter((d): d is string => !!d)
    );
    if (wanted.size === 0) return;
    const span = endMs - startMs;
    const segs: Record<string, MatrixSegment[]> = {};
    const mins: Record<string, number> = {};
    const liters: Record<string, number> = {};
    try {
      const r = await hass.callApi<{ runs?: StoredRun[] }>(
        "GET",
        `xtend_tuya/runs?since=${encodeURIComponent(
          new Date(startMs).toISOString()
        )}`
      );
      for (const run of r?.runs ?? []) {
        if (!wanted.has(run.device_id)) continue;
        const s = Date.parse(run.start);
        const e = Date.parse(run.end);
        if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) continue;
        if (e < startMs || s > endMs) continue;
        mins[run.device_id] =
          (mins[run.device_id] ?? 0) + (run.duration_seconds ?? 0) / 60;
        // Liters come from the runs store, not from the recorder: summing
        // counter deltas over sparse recorder rows let lifetime-odometer
        // jumps through (907: 141,186 L instead of ~1,900 L over 30 days,
        // 2026-09-24). A run's liters were fixed when it ended.
        if (typeof run.liters === "number") {
          liters[run.device_id] = (liters[run.device_id] ?? 0) + run.liters;
        }
        const left = Math.max(s, startMs);
        const right = Math.min(e, endMs);
        (segs[run.device_id] ??= []).push({
          left: (left - startMs) / span,
          // ponytail: 0.3% floor so a 3-minute run on a 30-day window is
          // still a visible mark rather than a sub-pixel sliver.
          width: Math.max((right - left) / span, 0.003),
          kind: "on",
          startMs: left,
          endMs: right,
        });
      }
      this._runSegments = segs;
      this._runMin = mins;
      this._waterL = liters;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("irrigation-valve-matrix: runs fetch failed", err);
    }
  }

  private _buildSegments(
    points: HistoryPoint[],
    startMs: number,
    endMs: number
  ): MatrixSegment[] {
    const span = endMs - startMs;
    if (span <= 0 || points.length === 0) return [];
    const segs: MatrixSegment[] = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const tStart = Math.max(p.lu * 1000, startMs);
      const tEnd =
        i + 1 < points.length ? Math.min(points[i + 1].lu * 1000, endMs) : endMs;
      if (tEnd <= tStart) continue;
      // Three visual states (Simon 2026-06-04):
      //   on  = watering        → amber (prominent)
      //   off = idle + reachable→ light blue (calm "online" tint)
      //   unavailable/unknown/no-data → NO segment → empty lane = gap
      // Idle is a LIGHT colour on purpose: a valve closed all day is a
      // light lane, not a heavy gray block, so amber watering marks pop and
      // an empty gap (offline) stays clearly distinct.
      const kind = p.s === "on" ? "on" : p.s === "off" ? "off" : null;
      if (!kind) continue;
      segs.push({
        left: (tStart - startMs) / span,
        width: (tEnd - tStart) / span,
        kind,
        startMs: tStart,
        endMs: tEnd,
      });
    }
    return segs;
  }

  // Light-blue "reporting and closed" lane from the switch history, with
  // the recorded runs painted over it in amber.
  // Amber = union of the switch's "on" history and the recorded runs.
  // Old-gen valves report their switch honestly, and that is the ONLY
  // signal for a valve that is open right now or stuck open (824 sat open
  // 16.8 h on 2026-09-14; the runs store, which records only completed
  // cycles, showed 10 min). T3 valves never flip the switch, so their amber
  // comes from the runs store alone. Overlaps are merged so a run recorded
  // by both sources is not drawn or counted twice.
  private _onSegments(v: MatrixRow): MatrixSegment[] {
    const fromSwitch = (v.switch ? this._segments[v.switch] ?? [] : []).filter(
      (s) => s.kind === "on"
    );
    const fromRuns = v.device_id ? this._runSegments[v.device_id] ?? [] : [];
    const all = [...fromSwitch, ...fromRuns].sort((a, b) => a.startMs - b.startMs);
    const merged: MatrixSegment[] = [];
    for (const seg of all) {
      const last = merged[merged.length - 1];
      if (last && seg.startMs <= last.endMs) {
        if (seg.endMs > last.endMs) {
          last.endMs = seg.endMs;
          last.width = last.width + (seg.left + seg.width - (last.left + last.width));
        }
        continue;
      }
      merged.push({ ...seg });
    }
    return merged;
  }

  private _rowSegments(v: MatrixRow): MatrixSegment[] {
    const reporting = (v.switch ? this._segments[v.switch] ?? [] : []).filter(
      (s) => s.kind === "off"
    );
    return [...reporting, ...this._onSegments(v)];
  }

  // "min / liter" columns (Simon 2026-06-06): how long each valve ran and
  // how much water flowed through within the visible history window. "–"
  // means no data source (no switch / no flow meter on that valve).
  private _runText(v: MatrixRow): string {
    // Recorded runs first — see _fetchRuns.
    const reporting = (v.switch ? this._segments[v.switch] ?? [] : []).length > 0;
    const on = this._onSegments(v);
    // Only claim "0 min" when the valve is actually reporting; a silent
    // valve keeps the "–" that marks it as having no data at all.
    const min =
      on.length > 0
        ? on.reduce((acc, s) => acc + (s.endMs - s.startMs), 0) / 60_000
        : reporting || (v.device_id && v.device_id in this._runMin)
          ? 0
          : undefined;
    if (min === undefined) return "–";
    if (min <= 0) return "0 min";
    if (min < 1) return "<1 min";
    if (min >= 90) return `${(min / 60).toFixed(1)} h`;
    return `${Math.round(min)} min`;
  }

  private _waterText(v: MatrixRow): string {
    // "–" = no flow meter on this valve; a metered valve with no run in the
    // window watered 0 L.
    const liters = v.device_id ? this._waterL[v.device_id] : undefined;
    if (liters === undefined) return v.volume ? "0 L" : "–";
    if (liters <= 0) return "0 L";
    if (liters < 10) return `${liters.toFixed(1)} L`;
    return `${Math.round(liters)} L`;
  }

  private _metricClass(text: string): string {
    return text === "–" || text === "0 min" || text === "0 L" ? "muted" : "";
  }

  private _batteryText(entity?: string): string {
    if (!entity || !this._hass) return "—";
    const e = this._hass.states[entity];
    if (!e || e.state === "unavailable" || e.state === "unknown") {
      return "Unavailable";
    }
    const n = parseFloat(e.state);
    if (!Number.isFinite(n)) return e.state;
    const unit = (e.attributes?.unit_of_measurement as string) ?? "%";
    return `${Math.round(n)}${unit}`;
  }

  // "Online" is the cloud flag and nothing else, so a valve that stopped
  // reporting keeps its last values and looks healthy — the mechanism
  // behind "HA disagrees with the app" (audit C23). Flag a row whose
  // diagnostic last-report stamp has gone quiet while the valve still
  // claims to be online.
  private _staleMarker(v: MatrixRow): string {
    if (!v.last_report || !this._hass) return "";
    const sw = v.switch ? this._hass.states[v.switch] : undefined;
    if (!sw || sw.state === "unavailable" || sw.state === "unknown") return "";
    const s = this._hass.states[v.last_report];
    if (!s || s.state === "unavailable" || s.state === "unknown") return "";
    const last = Date.parse(s.state);
    if (!Number.isFinite(last)) return "";
    const hours = (Date.now() - last) / 3_600_000;
    if (hours < STALE_AFTER_HOURS) return "";
    return `<span class="stale" title="Online, but last reported ${Math.round(
      hours
    )} h ago">⚠</span>`;
  }

  private _batteryClass(entity?: string): string {
    if (!entity || !this._hass) return "muted";
    const e = this._hass.states[entity];
    if (!e || e.state === "unavailable" || e.state === "unknown") return "muted";
    const n = parseFloat(e.state);
    if (Number.isFinite(n) && n <= 20) return "low";
    return "";
  }

  // Home/room grouping (4.4.207): when any valve carries home/room the
  // list renders sorted by "home • room" with group headers. Rendering
  // AND incremental updates must iterate this same order — updating in
  // config order while rendering in grouped order writes battery values
  // into the wrong rows (same failure class as the 4.4.204 header-row
  // offset bug).
  private _groupKey(v: MatrixRow): string {
    return `${v.home || "Unassigned"}•${v.room || "—"}`;
  }

  // GUI flag to switch room grouping on/off (ticket c802BqOn). Per-browser
  // preference; default on.
  private _groupPref(): boolean {
    try {
      return localStorage.getItem("xt-valve-matrix-grouped") !== "0";
    } catch {
      return true;
    }
  }

  private _groupable(): boolean {
    return (this._config?.valves ?? []).some((v) => v.room || v.home);
  }

  private _grouped(): boolean {
    return this._groupPref() && this._groupable();
  }

  private _orderedRows(): MatrixRow[] {
    const valves = this._config?.valves ?? [];
    if (!this._grouped()) return valves;
    return [...valves].sort(
      (a, b) =>
        this._groupKey(a).localeCompare(this._groupKey(b)) ||
        String(a.name).localeCompare(String(b.name))
    );
  }

  private _updateBattery(): void {
    if (!this._config) return;
    // Scope to data rows — the header row has a .battery cell too, and an
    // unscoped query shifts every battery value up by one row.
    const cells = this._root.querySelectorAll<HTMLElement>(
      ".row:not(.header) .battery"
    );
    this._orderedRows().forEach((v, i) => {
      const cell = cells[i];
      if (!cell) return;
      cell.textContent = this._batteryText(v.battery);
      cell.className = `battery ${this._batteryClass(v.battery)}`;
    });
  }

  // A valve is "online" when its switch reports a real state (on/off);
  // unavailable/unknown/missing = offline. Read-only against hass.states,
  // so this can never affect device behaviour (Simon 2026-06-06: show the
  // online/offline count so the user always sees how many valves they have).
  private _counts(): { online: number; offline: number; total: number } {
    const valves = this._config?.valves ?? [];
    let online = 0;
    for (const v of valves) {
      const e = v.switch && this._hass ? this._hass.states[v.switch] : undefined;
      if (e && e.state !== "unavailable" && e.state !== "unknown") online++;
    }
    return { online, offline: valves.length - online, total: valves.length };
  }

  private _countsText(): string {
    const c = this._counts();
    return `${c.online} online · ${c.offline} offline · ${c.total} total`;
  }

  private _updateCounts(): void {
    const el = this._root.querySelector<HTMLElement>("#valve-counts");
    if (el) el.textContent = this._countsText();
  }

  private _navigate(path?: string): void {
    if (!path) return;
    const base = window.location.pathname.split("/")[1] || "lovelace";
    const url = path.startsWith("/") ? path : `/${base}/${path}`;
    window.history.pushState(null, "", url);
    this.dispatchEvent(
      new Event("location-changed", { bubbles: true, composed: true })
    );
  }

  private async _resync(): Promise<void> {
    const btn = this._root.querySelector<HTMLButtonElement>("#matrix-resync");
    if (!this._hass) {
      window.location.reload();
      return;
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Syncing…";
    }
    try {
      await resyncCurrentDashboard(this._hass);
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "↻ Re-sync failed — retry";
      }
      // eslint-disable-next-line no-console
      console.error("xtend_tuya: valve re-sync failed", err);
    }
  }

  private _render(): void {
    if (!this._config) return;
    const c = this._config;
    const rowOf = (v: MatrixRow): string => {
      const segs = this._rowSegments(v);
      const bars = segs
        .map(
          (s) =>
            `<span class="seg ${s.kind}" title="${escapeHtml(
              segmentTooltip(s)
            )}" style="left:${(s.left * 100).toFixed(
              3
            )}%;width:${(s.width * 100).toFixed(3)}%"></span>`
        )
        .join("");
      const run = this._runText(v);
      const water = this._waterText(v);
      return `<div class="row ${
        v.path ? "clickable" : ""
      }" data-path="${escapeHtml(v.path || "")}">
          <div class="name" title="${escapeHtml(v.name)}">${escapeHtml(
            v.name
          )}${this._staleMarker(v)}</div>
          <div class="bar">${bars}</div>
          <div class="metric ${this._metricClass(run)}">${escapeHtml(run)}</div>
          <div class="metric ${this._metricClass(water)}">${escapeHtml(
            water
          )}</div>
          <div class="battery ${this._batteryClass(
            v.battery
          )}">${escapeHtml(this._batteryText(v.battery))}</div>
        </div>`;
    };
    // Grouped: sorted by home • room with a header div per group (headers
    // carry no .battery cell, so _updateBattery's row indexing is safe).
    const grouped = this._grouped();
    let rows = "";
    let lastKey: string | null = null;
    for (const v of this._orderedRows()) {
      if (grouped) {
        const k = this._groupKey(v);
        if (k !== lastKey) {
          lastKey = k;
          const [h, r] = k.split("•");
          rows += `<div class="grouphdr">${escapeHtml(h)} · ${escapeHtml(r)}</div>`;
        }
      }
      rows += rowOf(v);
    }
    const hoursLabel = this._hoursLabel();
    // Range options for the timeline / totals window. 30 d is the ceiling —
    // verified the recorder keeps ≥30 days; beyond retention the fetch just
    // returns what exists. ponytail: full-history (season+) needs the
    // PostgreSQL export track, not the recorder.
    const RANGE_OPTIONS: Array<[number, string]> = [
      [24, "24 h"],
      [48, "48 h"],
      [168, "7 d"],
      [336, "14 d"],
      [720, "30 d"],
    ];
    const rangeSelect = `<select id="matrix-range" title="Timeline window — bars and time/water totals cover this range">${RANGE_OPTIONS.map(
      ([h, label]) =>
        `<option value="${h}"${h === this._hours() ? " selected" : ""}>${label}</option>`
    ).join("")}</select>`;
    this._root.innerHTML = `
      <style>
        ha-card { padding-bottom: 8px; }
        .card-header { font-size: 1.4rem; font-weight: 400; padding: 16px 16px 4px; margin: 0; }
        .card-subtitle { padding: 0 16px 10px; margin: 0; color: var(--secondary-text-color); font-size: 0.95rem; font-variant-numeric: tabular-nums; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        #matrix-resync, #matrix-group { border: none; background: none; color: var(--primary-color); font: inherit; font-weight: 500; cursor: pointer; padding: 4px 8px; border-radius: 6px; white-space: nowrap; }
        #matrix-resync:hover, #matrix-group:hover { background: var(--secondary-background-color); }
        #matrix-resync:disabled { color: var(--secondary-text-color); cursor: default; }
        .subtitle-actions { display: flex; align-items: center; gap: 8px; }
        #matrix-range { border: 1px solid var(--divider-color, #e0e0e0); background: var(--card-background-color, #fff); color: var(--primary-text-color); font: inherit; font-size: 0.85rem; padding: 2px 6px; border-radius: 6px; cursor: pointer; }
        .grid { display: flex; flex-direction: column; }
        .row { display: grid; grid-template-columns: 150px 1fr 74px 70px 68px; align-items: center; gap: 12px; height: 32px; padding: 0 16px; }
        .row.header { height: 22px; color: var(--secondary-text-color); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
        .row.clickable { cursor: pointer; }
        .row.clickable:hover { background: var(--secondary-background-color); }
        .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.9rem; }
        .stale { color: var(--warning-color, #ffa600); margin-left: 5px; cursor: help; }
        /* Track is EMPTY (no fill) — a no-data / unreachable period renders
           as bare background, so a gap is unmistakable. Reported states draw
           colour: idle = light blue ("online, closed"), watering = amber.
           A faint outline keeps the lane locatable when a row is all-gap. */
        .bar { position: relative; height: 18px; border-radius: 3px; background: transparent; box-shadow: inset 0 0 0 1px var(--divider-color, #e0e0e0); overflow: hidden; }
        .seg { position: absolute; top: 0; bottom: 0; }
        .seg.off { background: rgba(3, 169, 244, 0.30); }
        .seg.on { background: var(--state-switch-active-color, #f9a825); }
        .metric { text-align: right; font-variant-numeric: tabular-nums; font-size: 0.9rem; white-space: nowrap; }
        .metric.muted { color: var(--secondary-text-color); }
        .battery { text-align: right; font-variant-numeric: tabular-nums; font-size: 0.9rem; }
        .battery.muted { color: var(--secondary-text-color); }
        .battery.low { color: var(--error-color, #db4437); font-weight: 600; }
        .grouphdr { padding: 10px 16px 3px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--primary-color); border-top: 1px solid var(--divider-color, #e0e0e0); }
        .grouphdr:first-child { border-top: none; }
        .lbl-short { display: none; }
        /* Companion app / phones: the 150px + 3 wide metric columns don't
           fit a ~400px viewport — the bar collapses to nothing. Compact
           grid + short header labels keep every column readable. */
        @media (max-width: 620px) {
          .row { grid-template-columns: 92px 1fr 44px 48px 44px; gap: 6px; padding: 0 10px; }
          .name { font-size: 0.8rem; }
          .metric, .battery { font-size: 0.78rem; }
          .battery { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .lbl-long { display: none; }
          .lbl-short { display: inline; }
          .card-subtitle { flex-wrap: wrap; }
          .grouphdr { padding: 10px 10px 3px; }
        }
      </style>
      <ha-card>
        ${c.title ? `<h1 class="card-header">${escapeHtml(c.title)}</h1>` : ""}
        <div class="card-subtitle">
          <span id="valve-counts">${escapeHtml(this._countsText())}</span>
          <span class="subtitle-actions">
            ${
              this._groupable()
                ? `<button id="matrix-group" title="Toggle grouping by home / room">${
                    this._grouped() ? "▤ Grouped" : "▦ Flat"
                  }</button>`
                : ""
            }
            ${rangeSelect}
            <button id="matrix-resync" title="Re-read all valves from Tuya and rebuild this dashboard">↻ Re-sync valves</button>
          </span>
        </div>
        <div class="grid header-row">
          <div class="row header" title="time / water = totals over the last ${hoursLabel} (the timeline window)">
            <div></div>
            <div></div>
            <div class="metric"><span class="lbl-long">time (min)</span><span class="lbl-short">min</span></div>
            <div class="metric"><span class="lbl-long">water (L)</span><span class="lbl-short">L</span></div>
            <div class="battery"><span class="lbl-long">battery</span><span class="lbl-short">batt</span></div>
          </div>
        </div>
        <div class="grid">${rows}</div>
      </ha-card>`;
    this._root.querySelectorAll<HTMLElement>(".row.clickable").forEach((el) => {
      el.addEventListener("click", () => this._navigate(el.dataset.path));
    });
    this._root
      .querySelector<HTMLButtonElement>("#matrix-resync")
      ?.addEventListener("click", () => void this._resync());
    this._root
      .querySelector<HTMLButtonElement>("#matrix-group")
      ?.addEventListener("click", () => {
        try {
          localStorage.setItem(
            "xt-valve-matrix-grouped",
            this._groupPref() ? "0" : "1"
          );
        } catch {
          /* private mode — toggle just won't persist */
        }
        this._render();
        this._updateBattery();
      });
    this._root
      .querySelector<HTMLSelectElement>("#matrix-range")
      ?.addEventListener("change", (ev) => {
        this._runtimeHours = parseInt(
          (ev.target as HTMLSelectElement).value,
          10
        );
        // Old-window data would render mislabeled while the fetch runs —
        // clear it so lanes go empty, then refill for the new window.
        this._segments = {};
        this._waterL = {};
        this._render();
        void this._fetchHistory();
      });
  }
}

if (!customElements.get("irrigation-valve-matrix")) {
  customElements.define("irrigation-valve-matrix", IrrigationValveMatrix);
}

/* ------------------------------------------------------------------ *
 * Registration                                                        *
 * ------------------------------------------------------------------ */

// HA looks up dashboard strategies as `ll-strategy-dashboard-<type>`
// (and the older `ll-strategy-<type>` for back-compat). Define both so
// the same bundle works regardless of HA frontend version.
const elementName = "ll-strategy-dashboard-irrigation-valves";
if (!customElements.get(elementName)) {
  customElements.define(elementName, IrrigationValvesStrategy);
}
const legacyElementName = "ll-strategy-irrigation-valves";
if (!customElements.get(legacyElementName)) {
  customElements.define(
    legacyElementName,
    class extends IrrigationValvesStrategy {}
  );
}

/* ------------------------------------------------------------------ *
 * Valve detail card                                                   *
 * ------------------------------------------------------------------ */

// Renders the valve named by `?id=<tuya id>` with the same columns the
// per-valve views had (buildValveView). Vanilla and in this bundle for the
// same reason as the matrix: HACS reliably updates an existing bundle.
interface CardHelpers {
  createCardElement(config: unknown): HTMLElement & { hass?: unknown };
}

class IrrigationValveDetailCard extends HTMLElement {
  private _hass: HomeAssistantLike | null = null;
  private _hours = 24;
  private _shownId: string | null = null;
  private _children: (HTMLElement & { hass?: unknown })[] = [];
  private _onLocation = (): void => void this._render();

  setConfig(config: { hours?: number }): void {
    this._hours = config.hours ?? 24;
  }

  set hass(value: HomeAssistantLike) {
    const first = !this._hass;
    this._hass = value;
    for (const c of this._children) c.hass = value;
    if (first) void this._render();
  }

  connectedCallback(): void {
    window.addEventListener("location-changed", this._onLocation);
    window.addEventListener("popstate", this._onLocation);
    void this._render();
  }

  disconnectedCallback(): void {
    window.removeEventListener("location-changed", this._onLocation);
    window.removeEventListener("popstate", this._onLocation);
  }

  private async _render(): Promise<void> {
    const hass = this._hass;
    if (!hass || !window.location.pathname.endsWith(`/${VALVE_VIEW_PATH}`)) return;
    const id = new URLSearchParams(window.location.search).get("id");
    if (id === this._shownId) return;
    this._shownId = id;

    const valve = id ? discoverValves(hass, await fetchLocations(hass)).find((v) => v.device_id === id) : undefined;
    if (id !== this._shownId) return; // navigated on while loading
    this._children = [];
    if (!valve) {
      this.innerHTML = `<ha-card><div style="padding:16px">Valve ${escapeHtml(id ?? "")} not found.</div></ha-card>`;
      return;
    }
    const helpers = await (window as unknown as { loadCardHelpers(): Promise<CardHelpers> }).loadCardHelpers();
    const view = buildValveView(valve, this._hours);
    const root = document.createElement("div");
    root.innerHTML =
      `<div class="head" style="margin-bottom:16px"></div>` +
      `<div class="cols" style="display:grid;gap:16px;align-items:start;` +
      `grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))"></div>`;
    const header = helpers.createCardElement({ type: "custom:irrigation-valve-header-card", device_id: valve.device_id });
    header.hass = hass;
    this._children.push(header);
    (root.querySelector(".head") as HTMLElement).appendChild(header);
    const cols = root.querySelector(".cols") as HTMLElement;
    for (const section of (view.sections ?? []) as { cards: unknown[] }[]) {
      const col = document.createElement("div");
      col.style.cssText = "display:flex;flex-direction:column;gap:16px;min-width:0";
      for (const cfg of section.cards) {
        const el = helpers.createCardElement(cfg);
        el.hass = hass;
        this._children.push(el);
        col.appendChild(el);
      }
      cols.appendChild(col);
    }
    this.style.cssText = "display:block;padding:16px;max-width:1400px;margin:0 auto";
    this.replaceChildren(root);
  }

  getCardSize(): number {
    return 12;
  }
}

if (!customElements.get("irrigation-valve-detail-card")) {
  customElements.define("irrigation-valve-detail-card", IrrigationValveDetailCard);
}
