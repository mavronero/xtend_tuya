/** custom:irrigation-pumps-card: pumps as master-detail.
 *
 *   type: custom:irrigation-pumps-card
 *
 * Left the pumps (live status) and "No pump". Right the selected pump: live
 * figures from its integration's entities, the water balance with the flow
 * chart over 24 h / 7 d / 30 d, what it feeds (sites, metering points,
 * overrides that leave for another pump) and the devices connected by hand.
 * Pump data is only read: live states from hass, history from HA's
 * long-term statistics (/api/xtend_tuya/pump_stats). Admins get Edit:
 * create a pump from an HA device, set its entities, assign it to sites or
 * metering points, connect devices as consumer or monitor.
 */

import { LitElement, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type { HassState, HomeAssistantLike } from "./farm/discovery.ts";
import type { MeteringPoint, Pump } from "./farm/data.ts";
import { FarmController } from "./farm/controller.ts";
import { summarizeMp, type MpSummary } from "./farm/mp-summary.ts";
import { balance, pumpFeeds, type StatSeries } from "./farm/pump-summary.ts";
import { sitePath, subtree } from "./farm/valve-filter.ts";
import { volume } from "./components/format.ts";
import { navigate } from "./components/navigate.ts";
import { NO_PUMP, type PumpListItem } from "./components/pump-list.ts";
import type { DeviceOption } from "./components/device-picker.ts";
import "./components/mp-card.ts";
import "./components/pump-list.ts";
import "./components/pump-chart.ts";
import "./components/device-picker.ts";
import { farmTokens } from "./components/theme.ts";
import { pageStyles } from "./components/page-styles.ts";
import { css } from "lit";

type Hass = HomeAssistantLike & {
  user?: { is_admin?: boolean };
  callApi?: <T>(method: string, path: string, body?: unknown) => Promise<T>;
  devices: Record<string, { id: string; name: string | null; name_by_user: string | null; area_id?: string | null; model?: string | null }>;
  areas?: Record<string, { name: string }>;
};

type Range = "24h" | "7d" | "30d";
const RANGES: Record<Range, { ms: number; period: "hour" | "day" }> = {
  "24h": { ms: 24 * 3_600_000, period: "hour" },
  "7d": { ms: 7 * 86_400_000, period: "day" },
  "30d": { ms: 30 * 86_400_000, period: "day" },
};
const RANGE_KEY = "xt-pumps-range";
const API = "xtend_tuya/irrigation_locations";
const PUMP_FIELDS = ["meter_entity", "flow_entity", "pressure_entity", "status_entity"] as const;
type PumpField = (typeof PUMP_FIELDS)[number];
const FIELD_LABEL: Record<PumpField, string> = {
  meter_entity: "Water meter (m³ total)",
  flow_entity: "Flow rate",
  pressure_entity: "Pressure",
  status_entity: "Status",
};
// How the DAB Pumps integration names them; used to prefill a new pump.
const FIELD_PATTERN: Record<PumpField, RegExp> = {
  meter_entity: /_fct_total_delivered_flow_mc$/,
  flow_entity: /_vf_flowliter$/,
  pressure_entity: /_vp_pressurebar$/,
  status_entity: /_pumpstatus$/,
};

function pumpFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get("pump");
}

function loadRange(): Range {
  try {
    const r = localStorage.getItem(RANGE_KEY);
    return r && r in RANGES ? (r as Range) : "7d";
  } catch {
    return "7d";
  }
}

export class IrrigationPumpsCard extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @state() private _selected: string | null = pumpFromUrl();
  @state() private _range: Range = loadRange();
  @state() private _stats: StatSeries = {};
  @state() private _edit = false;
  @state() private _busy = false;
  @state() private _error: string | null = null;
  /** HA device picked to connect (waits for role and meter). */
  @state() private _connecting: string | null = null;
  private _statsKey = "";
  private _farm = new FarmController(this);
  private _onLocation = (): void => {
    this._selected = pumpFromUrl();
  };

  setConfig(_config: unknown): void {}

  getCardSize(): number {
    return 12;
  }

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("location-changed", this._onLocation);
    window.addEventListener("popstate", this._onLocation);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("location-changed", this._onLocation);
    window.removeEventListener("popstate", this._onLocation);
  }

  protected updated(): void {
    const key = `${this._range}|${this._farm.data.pumps.length}|${this._farm.data.pumpConnections.length}`;
    if (this.hass?.callApi && this._farm.loaded && key !== this._statsKey) {
      this._statsKey = key;
      void this._loadStats();
    }
  }

  // ------------------------------------------------------------ data

  private async _loadStats(): Promise<void> {
    const { ms } = RANGES[this._range];
    const start = new Date(Date.now() - ms).toISOString();
    try {
      // Always hourly: HA writes a day's statistics only once the day is
      // over, so daily rows would miss today. balance() groups into days.
      const r = await this.hass!.callApi!<{ series: StatSeries }>(
        "GET",
        `xtend_tuya/pump_stats?period=hour&start=${encodeURIComponent(start)}`
      );
      this._stats = r.series ?? {};
    } catch (e) {
      this._error = `Could not load pump statistics: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  private _state(entity: string | null | undefined): HassState | undefined {
    return entity ? this.hass?.states[entity] : undefined;
  }

  private _num(entity: string | null | undefined): number | null {
    const s = this._state(entity);
    const n = Number(s?.state);
    return s && s.state !== "" && Number.isFinite(n) ? n : null;
  }

  private _pumpState(p: Pump): PumpListItem["state"] {
    const status = this._state(p.status_entity)?.state;
    const flow = this._num(p.flow_entity);
    const meter = this._state(p.meter_entity)?.state;
    if (!meter || meter === "unknown" || meter === "unavailable") return "unknown";
    if (status === "Go" || (flow !== null && flow > 0)) return "running";
    return "idle";
  }

  private _devices(): DeviceOption[] {
    const areas = this.hass?.areas ?? {};
    return Object.values(this.hass?.devices ?? {}).map((d) => ({
      id: d.id,
      name: d.name_by_user || d.name || d.id,
      area: d.area_id ? areas[d.area_id]?.name ?? null : null,
      model: d.model ?? null,
    }));
  }

  private _deviceName(id: string): string {
    const d = this.hass?.devices[id];
    return d ? d.name_by_user || d.name || id : id;
  }

  /** Sensor entities of an HA device, for the entity selects. */
  private _sensorsOf(deviceId: string | null): string[] {
    if (!deviceId || !this.hass) return [];
    return Object.values(this.hass.entities)
      .filter((e) => e.device_id === deviceId && e.entity_id.startsWith("sensor."))
      .map((e) => e.entity_id)
      .sort();
  }

  private _deviceOf(entity: string | null): string | null {
    return entity ? this.hass?.entities[entity]?.device_id ?? null : null;
  }

  // ------------------------------------------------------------ actions

  private _open(id: string | null): void {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("pump", id);
    else url.searchParams.delete("pump");
    window.history.pushState(null, "", url.pathname + url.search);
    this._selected = id;
    this._error = null;
    this._connecting = null;
  }

  private _setRange(r: Range): void {
    this._range = r;
    try {
      localStorage.setItem(RANGE_KEY, r);
    } catch {
      /* private window */
    }
  }

  private async _post(body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    if (!this.hass?.callApi) return null;
    this._busy = true;
    this._error = null;
    try {
      const r = await this.hass.callApi<Record<string, unknown>>("POST", API, body);
      await this._farm.refresh(true);
      this._statsKey = "";
      return r;
    } catch (e) {
      const err = e as { body?: { error?: string }; message?: string };
      this._error = err.body?.error ?? err.message ?? String(e);
      return null;
    } finally {
      this._busy = false;
    }
  }

  private async _createPump(deviceId: string): Promise<void> {
    const sensors = this._sensorsOf(deviceId);
    const pick = (f: PumpField) => sensors.find((e) => FIELD_PATTERN[f].test(e)) ?? null;
    const meter = pick("meter_entity");
    if (!meter) {
      this._error = `${this._deviceName(deviceId)} has no water meter sensor (…_fct_total_delivered_flow_mc). Create the pump from its meter's device.`;
      return;
    }
    const r = await this._post({
      action: "create_pump",
      name: this._deviceName(deviceId),
      meter_entity: meter,
      flow_entity: pick("flow_entity"),
      pressure_entity: pick("pressure_entity"),
      status_entity: pick("status_entity"),
    });
    const pump = r?.pump as { id: string } | undefined;
    if (pump) this._open(pump.id);
  }

  private _savePump(e: Event, p: Pump): void {
    e.preventDefault();
    const f = e.target as HTMLFormElement;
    const val = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement).value;
    const body: Record<string, unknown> = { action: "update_pump", id: p.id, name: val("name") };
    for (const k of PUMP_FIELDS) body[k] = val(k) || null;
    void this._post(body);
  }

  private _assign(e: Event, p: Pump): void {
    e.preventDefault();
    const sel = (e.target as HTMLFormElement).querySelector("select") as HTMLSelectElement;
    const [kind, id] = sel.value.split(":");
    if (id) void this._post({ action: "assign_pump", pump_id: p.id, target_kind: kind, target_id: id });
  }

  private _connect(e: Event, p: Pump): void {
    e.preventDefault();
    const f = e.target as HTMLFormElement;
    const val = (n: string) => (f.elements.namedItem(n) as HTMLSelectElement).value;
    void this._post({
      action: "connect_device",
      pump_id: p.id,
      device_id: this._connecting,
      role: val("role"),
      meter_entity: val("meter_entity") || null,
    }).then((r) => {
      if (r) this._connecting = null;
    });
  }

  // ------------------------------------------------------------ render

  private _figures(p: Pump, feeds: { mps: number; valves: number }) {
    const flow = this._num(p.flow_entity);
    const pressure = this._num(p.pressure_entity);
    const status = this._state(p.status_entity)?.state;
    const st = this._pumpState(p);
    return html`<div class="figures">
      ${st === "unknown"
        ? html`<span class="warn" title="The pump's meter reports no value">No data from the pump</span>`
        : html`<span title="Pump status"><i class="dot ${st}"></i>${status ?? (st === "running" ? "Running" : "Idle")}</span>`}
      ${flow !== null ? html`<span title="Live flow"><ha-icon icon="mdi:waves-arrow-right"></ha-icon>${flow.toFixed(1)} L/min</span>` : nothing}
      ${pressure !== null ? html`<span title="Pressure"><ha-icon icon="mdi:gauge"></ha-icon>${pressure.toFixed(1)} bar</span>` : nothing}
      <span title="Metering points and valves fed now"
        ><ha-icon icon="mdi:map-marker-multiple-outline"></ha-icon>${feeds.mps} metering points · ${feeds.valves} valves</span
      >
    </div>`;
  }

  private _balance(p: Pump) {
    const { ms, period } = RANGES[this._range];
    const now = Date.now();
    const b = balance(this._farm.data, p, this._stats, now - ms, now, period);
    const pct = (l: number) => (b.pump ? ` · ${Math.round((l / b.pump) * 100)} %` : "");
    return html`<section>
      <div class="section-head">
        <h3>Water balance</h3>
        <div class="chips" role="group" aria-label="Range">
          ${(Object.keys(RANGES) as Range[]).map(
            (r) => html`<button class=${r === this._range ? "on" : ""} @click=${() => this._setRange(r)}>${r}</button>`
          )}
        </div>
      </div>
      <div class="tiles">
        <div title="What the pump's meter counted"><span class="dim">Pump delivered</span><b>${b.pump === null ? "no data" : volume(b.pump)}</b></div>
        <div title="Runs of the valves this pump fed at the time"><span class="dim">Valves</span><b>${volume(b.valves)}</b><span class="dim">${pct(b.valves)}</span></div>
        <div title="Metered devices connected as consumers"><span class="dim">Metered consumers</span><b>${volume(b.consumers)}</b><span class="dim">${pct(b.consumers)}</span></div>
        <div title="Pump minus valves minus consumers: tanks, taps, unmetered valves, leaks">
          <span class="dim">Unaccounted</span><b>${b.unaccounted === null ? "–" : volume(b.unaccounted)}</b
          ><span class="dim">${b.unaccounted === null ? "" : pct(b.unaccounted)}</span>
        </div>
      </div>
      <xt-pump-chart .buckets=${b.buckets} period=${period}></xt-pump-chart>
    </section>`;
  }

  private _feeds(p: Pump, mpSums: Map<string, MpSummary>) {
    const data = this._farm.data;
    const f = pumpFeeds(data, p.id, Date.now());
    const card = (id: string) => html`<xt-mp-card .summary=${mpSums.get(id)}></xt-mp-card>`;
    const inTree = new Set<string>();
    const groups = f.sites
      .map((siteId) => {
        const ids = subtree(data.sites, siteId);
        const mps = f.mps.filter((m) => {
          const loc = data.locations.find((l) => l.id === m);
          return loc?.site_id && ids.has(loc.site_id);
        });
        mps.forEach((m) => inTree.add(m));
        return { siteId, path: sitePath(data.sites, siteId), mps };
      })
      .sort((a, b) => a.path.localeCompare(b.path));
    const direct = f.mps.filter((m) => !inTree.has(m));
    const name = (id: string) => data.locations.find((l) => l.id === id)?.name ?? id;
    const pumpName = (id: string) => data.pumps.find((x) => x.id === id)?.name ?? id;
    return html`<section>
      <h3>Feeds <span class="count">${f.mps.length}</span></h3>
      ${this._edit ? this._assignForm(p) : nothing}
      ${!f.mps.length && !groups.length ? html`<div class="msg">This pump is not assigned to a site or metering point yet.</div>` : nothing}
      ${groups.map(
        (g) => html`<div class="group">
            <span>${g.path}</span><span class="dim">assigned here · ${g.mps.length}</span>
            ${this._edit
              ? html`<button class="link danger" ?disabled=${this._busy}
                  @click=${() => this._post({ action: "end_pump_assignment", target_kind: "site", target_id: g.siteId })}>Unassign</button>`
              : nothing}
          </div>
          <div class="grid">${g.mps.map(card)}</div>`
      )}
      ${direct.length
        ? html`<div class="group"><span>Assigned directly</span><span class="dim">${direct.length}</span></div>
            <div class="grid">${direct.map(card)}</div>`
        : nothing}
      ${f.overridden.length
        ? html`<div class="group"><span>Overridden</span><span class="dim">in these sites, fed by another pump</span></div>
            <ul class="plain">
              ${f.overridden.map(
                (o) => html`<li>
                  ${name(o.mp)} →
                  <a href="#" @click=${(e: Event) => (e.preventDefault(), this._open(o.pump))}>${pumpName(o.pump)}</a>
                </li>`
              )}
            </ul>`
        : nothing}
    </section>`;
  }

  private _assignForm(p: Pump) {
    const data = this._farm.data;
    const sites = data.sites.map((s) => ({ v: `site:${s.id}`, l: sitePath(data.sites, s.id) })).sort((a, b) => a.l.localeCompare(b.l));
    const mps = data.locations.map((m) => ({ v: `location:${m.id}`, l: m.name })).sort((a, b) => a.l.localeCompare(b.l));
    return html`<form class="editor" @submit=${(e: Event) => this._assign(e, p)}>
      <label
        >Assign this pump to
        <select>
          <optgroup label="Sites (with everything below)">${sites.map((o) => html`<option value=${o.v}>${o.l}</option>`)}</optgroup>
          <optgroup label="Metering points (override)">${mps.map((o) => html`<option value=${o.v}>${o.l}</option>`)}</optgroup>
        </select>
      </label>
      <button type="submit" ?disabled=${this._busy}>Assign</button>
    </form>`;
  }

  private _connections(p: Pump, valveCount: number) {
    const open = this._farm.data.pumpConnections.filter((c) => c.pump_id === p.id && c.end === null);
    return html`<section>
      <h3>Connected devices <span class="count">${open.length + valveCount}</span></h3>
      <ul class="rows">
        <li>
          <ha-icon icon="mdi:valve"></ha-icon><span>${valveCount} valves</span>
          <span class="chip">consumer</span><span class="dim">through the metering points it feeds</span>
        </li>
        ${open.map((c) => {
          const meter = this._state(c.meter_entity);
          return html`<li>
            <ha-icon icon=${c.role === "consumer" ? "mdi:water-outline" : "mdi:eye-outline"}></ha-icon>
            <span>${this._deviceName(c.device_id)}</span>
            <span class="chip ${c.role}">${c.role}</span>
            ${meter
              ? html`<span class="dim" title=${c.meter_entity ?? ""}>${meter.state} ${meter.attributes.unit_of_measurement ?? ""}</span>`
              : html`<span class="dim">${c.role === "consumer" ? "not metered" : ""}</span>`}
            ${this._edit
              ? html`<button class="link danger" ?disabled=${this._busy}
                  @click=${() => this._post({ action: "disconnect_device", pump_id: p.id, device_id: c.device_id })}>Disconnect</button>`
              : nothing}
          </li>`;
        })}
      </ul>
      ${this._edit ? this._connectForm(p, open.map((c) => c.device_id)) : nothing}
    </section>`;
  }

  private _connectForm(p: Pump, connected: string[]) {
    if (!this._connecting) {
      return html`<div class="editor">
        <label>Connect a device
          <xt-device-picker
            .devices=${this._devices()}
            .exclude=${[...connected, ...this._valveDevices()]}
            @xt-device-picked=${(e: CustomEvent<string>) => (this._connecting = e.detail)}
          ></xt-device-picker>
        </label>
      </div>`;
    }
    const meters = this._sensorsOf(this._connecting).filter((e) => {
      const u = this.hass?.states[e]?.attributes.unit_of_measurement;
      return u === "m³" || u === "L";
    });
    return html`<form class="editor" @submit=${(e: Event) => this._connect(e, p)}>
      <label>Device <input .value=${this._deviceName(this._connecting)} disabled /></label>
      <label
        >Role
        <select name="role">
          <option value="consumer">Consumer: uses this pump's water</option>
          <option value="monitor">Monitor: pressure, tank level …</option>
        </select>
      </label>
      <label
        >Meter (counts in the balance)
        <select name="meter_entity">
          <option value="">— none —</option>
          ${meters.map((m) => html`<option value=${m}>${m}</option>`)}
        </select>
      </label>
      <button type="submit" ?disabled=${this._busy}>Connect</button>
      <button type="button" @click=${() => (this._connecting = null)}>Cancel</button>
    </form>`;
  }

  /** HA devices of the valves: they reach a pump through metering points only. */
  private _valveDevices(): string[] {
    return this._farm.valves.map((v) => this.hass?.entities[v.registry_entity]?.device_id).filter((d): d is string => !!d);
  }

  private _pumpForm(p: Pump) {
    const device = this._deviceOf(p.meter_entity);
    const options = [...new Set([...this._sensorsOf(device), ...PUMP_FIELDS.map((f) => p[f]).filter((x): x is string => !!x)])].sort();
    return html`<form class="editor" @submit=${(e: Event) => this._savePump(e, p)}>
      <label>Name <input name="name" .value=${p.name} required /></label>
      ${PUMP_FIELDS.map(
        (f) => html`<label
          >${FIELD_LABEL[f]}
          <select name=${f}>
            ${f === "meter_entity" ? nothing : html`<option value="" ?selected=${!p[f]}>— none —</option>`}
            ${options.map((o) => html`<option value=${o} ?selected=${o === p[f]}>${o}</option>`)}
          </select>
        </label>`
      )}
      <button type="submit" ?disabled=${this._busy}>Save</button>
    </form>`;
  }

  render() {
    if (!this.hass) return nothing;
    if (!this._farm.loaded) return html`<ha-card><div class="msg">Loading pumps…</div></ha-card>`;
    const data = this._farm.data;
    const now = Date.now();
    const valves = this._farm.summaries();
    const mpSums = new Map(data.locations.map((m) => [m.id, summarizeMp(m, data, valves, now)]));
    const noPump = data.locations.filter((m: MeteringPoint) => !m.pump);
    const items: PumpListItem[] = [...data.pumps]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => ({ id: p.id, name: p.name, state: this._pumpState(p), count: pumpFeeds(data, p.id, now).mps.length }));
    if (noPump.length) items.push({ id: NO_PUMP, name: "No pump", state: "unknown", count: noPump.length });
    const sel = this._selected && items.some((i) => i.id === this._selected) ? this._selected : items[0]?.id ?? null;
    const pump = sel && sel !== NO_PUMP ? data.pumps.find((p) => p.id === sel) ?? null : null;
    const isAdmin = !!this.hass.user?.is_admin;
    const fed = pump ? pumpFeeds(data, pump.id, now).mps : [];
    const valveCount = fed.reduce((t, m) => t + (mpSums.get(m)?.valves.length ?? 0), 0);

    return html`<div
      class="layout"
      @xt-pump-open=${(e: CustomEvent<string>) => this._open(e.detail)}
      @xt-valve-open=${(e: CustomEvent<string>) => navigate(e.detail)}
    >
      <aside>
        <xt-pump-list .items=${items} .selected=${sel}></xt-pump-list>
        ${this._edit
          ? html`<div class="editor">
              <label>New pump from an HA device
                <xt-device-picker
                  placeholder="Search the pump's device (e.g. Big Farm 2)"
                  .devices=${this._devices()}
                  @xt-device-picked=${(e: CustomEvent<string>) => this._createPump(e.detail)}
                ></xt-device-picker>
              </label>
            </div>`
          : nothing}
      </aside>
      <main>
        <div class="title-row">
          <h2>${pump ? pump.name : sel === NO_PUMP ? "No pump" : "Pumps"}</h2>
          ${isAdmin
            ? html`<button class="edit ${this._edit ? "on" : ""}" @click=${() => ((this._edit = !this._edit), (this._connecting = null))}>
                <ha-icon icon=${this._edit ? "mdi:check" : "mdi:pencil-outline"}></ha-icon>${this._edit ? "Done" : "Edit"}
              </button>`
            : nothing}
        </div>
        ${this._error ? html`<div class="msg err">${this._error}</div>` : nothing}
        ${this._farm.error ? html`<div class="msg err">Could not load farm data: ${this._farm.error}</div>` : nothing}
        ${!items.length
          ? html`<div class="msg">No pumps yet. ${isAdmin ? "Use Edit to create one from its HA device." : ""}</div>`
          : nothing}
        ${pump
          ? html`${this._figures(pump, { mps: fed.length, valves: valveCount })}
              ${this._edit ? this._pumpForm(pump) : nothing} ${this._balance(pump)} ${this._feeds(pump, mpSums)}
              ${this._connections(pump, valveCount)}`
          : nothing}
        ${sel === NO_PUMP
          ? html`<p class="dim">Metering points no pump feeds: set a pump on their site or on them.</p>
              <div class="grid">${noPump.map((m) => html`<xt-mp-card .summary=${mpSums.get(m.id)}></xt-mp-card>`)}</div>`
          : nothing}
      </main>
    </div>`;
  }

  static styles = [
    farmTokens,
    pageStyles,
    css`
      section {
        margin-top: 24px;
      }
      .section-head {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .section-head h3 {
        margin: 0;
        flex: 1;
      }
      .chips {
        display: flex;
        gap: 4px;
      }
      .chips button {
        border-radius: 18px;
        padding: 4px 12px;
        min-height: 30px;
      }
      .chips button.on {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: var(--text-primary-color, #fff);
      }
      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin: 12px 0 16px;
      }
      .tiles div {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid var(--xt-track);
      }
      .tiles b {
        font-size: 1.3rem;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
      }
      .dim {
        color: var(--xt-dim);
      }
      .dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--xt-ok);
      }
      .dot.running {
        background: var(--xt-water);
      }
      .group {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin: 16px 0 8px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--primary-color);
      }
      .group .dim {
        text-transform: none;
        letter-spacing: 0;
        font-weight: 400;
      }
      .link {
        border: none;
        background: none;
        min-height: 0;
        padding: 2px 6px;
        text-transform: none;
        font-weight: 400;
        letter-spacing: 0;
      }
      .link.danger {
        color: var(--xt-bad);
        margin-left: auto;
      }
      ul.rows,
      ul.plain {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      ul.rows li {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border: 1px solid var(--xt-track);
        border-radius: 10px;
      }
      .chip {
        font-size: 0.75rem;
        padding: 1px 8px;
        border-radius: 10px;
        background: color-mix(in srgb, var(--xt-water) 14%, transparent);
      }
      .chip.monitor {
        background: color-mix(in srgb, var(--xt-dim) 14%, transparent);
      }
      main xt-device-picker {
        min-width: 280px;
      }
      aside .editor {
        margin-top: 12px;
        padding: 10px;
      }
      aside .editor label {
        width: 100%;
      }
    `,
  ];
}

if (!customElements.get("irrigation-pumps-card")) customElements.define("irrigation-pumps-card", IrrigationPumpsCard);
