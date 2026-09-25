import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { farmDate } from "./components/farm-time.ts";

interface HomeAssistant {
  callApi?: <T = unknown>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ) => Promise<T>;
}

interface Device {
  device_id: string;
  ha_device_id: string | null;
  valve_name: string | null;
  number: string | null;
  online: boolean | null;
  begin: string | null;
  end: string | null;
  source: "auto" | "manual";
}
interface Stats {
  last_run_end: string | null;
  last_run_liters: number | null;
  runs_7d: number;
  liters_7d: number;
  runs_30d: number;
  liters_30d: number;
  avg_lpm_30d: number | null;
}
interface Location {
  id: string;
  name: string;
  description: string;
  expected_lpm: number | null;
  lat: number | null;
  lon: number | null;
  devices: Device[];
  stats: Stats;
}
interface Unassigned {
  device_id: string;
  ha_device_id: string | null;
  valve_name: string | null;
  online: boolean | null;
}
interface Payload {
  generated: string;
  locations: Location[];
  unassigned: Unassigned[];
}

type EditFields = Record<"name" | "description" | "expected_lpm" | "lat" | "lon", string>;
interface CardConfig {
  type: string;
  title?: string;
  unassigned?: boolean;
  device_id?: string;
}

const API = "xtend_tuya/irrigation_locations";

// HA's callApi rejects with {status_code, body} where body is the parsed JSON.
function errText(e: unknown): string {
  const o = e as { body?: { error?: string; message?: string }; error?: string; message?: string };
  return o?.body?.error ?? o?.body?.message ?? o?.error ?? o?.message ?? String(e);
}

function relDate(iso: string | null): string {
  if (!iso) return "never";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 60) return `${days} days ago`;
  return farmDate(new Date(iso).getTime());
}

const day = (iso: string) => farmDate(new Date(iso).getTime());
const liters = (n: number | null | undefined) => (n == null ? "–" : `${Math.round(n)} L`);
const numOrNull = (s: string) => (s.trim() === "" || isNaN(Number(s)) ? null : Number(s));

export class IrrigationLocationsCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  // Modes: full list (default); `unassigned: true` = only the valves without
  // a location, for the top of the valve list; `device_id` = one valve's
  // location + assign/move select, for its detail view.
  @state() private _config: CardConfig | null = null;
  @state() private _data: Payload | null = null;
  @state() private _loading = false;
  @state() private _error: string | null = null;
  @state() private _query = "";
  @state() private _open: string | null = null; // expanded location id
  @state() private _edit: EditFields | null = null; // edit buffer for _open
  @state() private _confirmEnd: string | null = null; // device_id awaiting confirm
  @state() private _busy = false;
  // Inline POST error, keyed by where it belongs (location id, "new", "unassigned").
  @state() private _postError: { key: string; msg: string } | null = null;
  @state() private _newName: string | null = null; // null = create form hidden
  @state() private _showUnassigned = false;
  private _fetched = false;

  setConfig(config: CardConfig): void {
    this._config = config;
  }

  getCardSize(): number {
    return this._config?.device_id ? 1 : this._config?.unassigned ? 3 : 8;
  }

  private async _load(): Promise<void> {
    if (!this.hass?.callApi) return;
    this._fetched = true;
    this._loading = true;
    this._error = null;
    try {
      this._data = await this.hass.callApi<Payload>("GET", API);
    } catch (e) {
      this._error = errText(e);
    } finally {
      this._loading = false;
    }
  }

  private async _post(key: string, body: Record<string, unknown>): Promise<boolean> {
    if (!this.hass?.callApi) return false;
    this._busy = true;
    this._postError = null;
    try {
      await this.hass.callApi("POST", API, body);
      await this._load();
      return true;
    } catch (e) {
      this._postError = { key, msg: errText(e) };
      return false;
    } finally {
      this._busy = false;
    }
  }

  private _toggle(id: string): void {
    this._open = this._open === id ? null : id;
    this._edit = null;
    this._confirmEnd = null;
    this._postError = null;
  }

  private _startEdit(l: Location): void {
    const s = (v: number | null) => (v == null ? "" : String(v));
    this._edit = {
      name: l.name,
      description: l.description ?? "",
      expected_lpm: s(l.expected_lpm),
      lat: s(l.lat),
      lon: s(l.lon),
    };
  }

  private async _save(l: Location): Promise<void> {
    const e = this._edit!;
    const ok = await this._post(l.id, {
      action: "update_location",
      id: l.id,
      name: e.name.trim(),
      description: e.description,
      expected_lpm: numOrNull(e.expected_lpm),
      lat: numOrNull(e.lat),
      lon: numOrNull(e.lon),
    });
    if (ok) this._edit = null;
  }

  private async _create(): Promise<void> {
    const name = (this._newName ?? "").trim();
    if (!name) return;
    if (await this._post("new", { action: "create_location", name })) this._newName = null;
  }

  private _matches(l: Location, q: string): boolean {
    if (!q) return true;
    const hay = [l.name, ...l.devices.flatMap((d) => [d.number ?? "", d.valve_name ?? ""])];
    return hay.some((s) => s.toLowerCase().includes(q));
  }

  private _chip(d: { number?: string | null; valve_name: string | null; device_id: string; online: boolean | null }) {
    return html`<span class="chip" title=${d.valve_name ?? d.device_id}
      ><span class="dot ${d.online ? "on" : ""}"></span>${d.number ?? d.valve_name ?? d.device_id}</span
    >`;
  }

  // Select of assignable devices: unassigned first, then devices open at other locations.
  private _assignSelect(locationId: string | null, deviceId: string | null) {
    const data = this._data!;
    const others = data.locations
      .filter((l) => l.id !== locationId)
      .flatMap((l) => l.devices.filter((d) => !d.end).map((d) => ({ d, l })));
    const onChange = (e: Event) => {
      const sel = e.target as HTMLSelectElement;
      const v = sel.value;
      sel.value = "";
      if (!v) return;
      const body = deviceId
        ? { action: "assign_device", device_id: deviceId, location_id: v }
        : { action: "assign_device", device_id: v, location_id: locationId };
      void this._post(locationId ?? "unassigned", body);
    };
    if (deviceId) {
      // Picking a location for an unassigned valve.
      return html`<select ?disabled=${this._busy} @change=${onChange}>
        <option value="">Assign to…</option>
        ${data.locations.map((l) => html`<option value=${l.id}>${l.name}</option>`)}
      </select>`;
    }
    return html`<select ?disabled=${this._busy} @change=${onChange}>
      <option value="">Assign device…</option>
      ${data.unassigned.length
        ? html`<optgroup label="Unassigned">
            ${data.unassigned.map(
              (u) => html`<option value=${u.device_id}>${u.valve_name ?? u.device_id}</option>`
            )}
          </optgroup>`
        : nothing}
      ${others.length
        ? html`<optgroup label="Move from another location">
            ${others.map(
              ({ d, l }) =>
                html`<option value=${d.device_id}>${d.number ?? d.valve_name ?? d.device_id} (${l.name})</option>`
            )}
          </optgroup>`
        : nothing}
    </select>`;
  }

  private _errFor(key: string) {
    return this._postError?.key === key ? html`<div class="err">${this._postError.msg}</div>` : nothing;
  }

  private _details(l: Location) {
    const e = this._edit;
    const field = (k: keyof EditFields, label: string, type = "text") => html`<label
      >${label}<input
        type=${type}
        step="any"
        .value=${e![k]}
        @input=${(ev: Event) => (this._edit = { ...e!, [k]: (ev.target as HTMLInputElement).value })}
    /></label>`;
    return html`<div class="details">
      ${e
        ? html`<div class="form">
            ${field("name", "Name")} ${field("description", "Description")}
            ${field("expected_lpm", "Expected L/min", "number")} ${field("lat", "Latitude", "number")}
            ${field("lon", "Longitude", "number")}
            <div class="actions">
              <button ?disabled=${this._busy || !e.name.trim()} @click=${() => this._save(l)}>Save</button>
              <button class="flat" @click=${() => (this._edit = null)}>Cancel</button>
            </div>
          </div>`
        : html`<dl>
              <dt>Description</dt>
              <dd>${l.description || "–"}</dd>
              <dt>Expected L/min</dt>
              <dd>${l.expected_lpm ?? "–"}</dd>
              <dt>GPS</dt>
              <dd>
                ${l.lat != null && l.lon != null
                  ? html`${l.lat}, ${l.lon}
                      <a
                        href="https://www.openstreetmap.org/?mlat=${l.lat}&mlon=${l.lon}#map=18/${l.lat}/${l.lon}"
                        target="_blank"
                        rel="noopener"
                        >open map</a
                      >`
                  : "–"}
              </dd>
              <dt>Last run</dt>
              <dd>${relDate(l.stats.last_run_end)}${l.stats.last_run_liters != null ? ` · ${liters(l.stats.last_run_liters)}` : ""}</dd>
              <dt>Runs</dt>
              <dd>${l.stats.runs_7d} in 7 days · ${l.stats.runs_30d} in 30 days</dd>
            </dl>
            <button class="flat" @click=${() => this._startEdit(l)}>Edit</button>`}
      <div class="sub">Devices</div>
      ${l.devices.length === 0 ? html`<div class="dim">No devices yet.</div>` : nothing}
      ${l.devices.map(
        (d) => html`<div class="hist">
          <div class="hist-main">
            ${this._chip(d)}
            <span class="dim">${d.valve_name ?? ""}</span>
          </div>
          <div class="hist-meta">
            ${d.begin ? day(d.begin) : "before records"} – ${d.end ? day(d.end) : html`<b>installed</b>`}
            · ${d.source}
            ${d.end
              ? nothing
              : this._confirmEnd === d.device_id
                ? html`<span class="confirm"
                    >End here?
                    <button
                      ?disabled=${this._busy}
                      @click=${async () => {
                        if (await this._post(l.id, { action: "end_assignment", device_id: d.device_id, location_id: l.id }))
                          this._confirmEnd = null;
                      }}
                    >
                      Yes, end</button
                    ><button class="flat" @click=${() => (this._confirmEnd = null)}>No</button></span
                  >`
                : html`<button class="flat" @click=${() => (this._confirmEnd = d.device_id)}>End</button>`}
          </div>
        </div>`
      )}
      <div class="actions">${this._assignSelect(l.id, null)}</div>
      ${this._errFor(l.id)}
    </div>`;
  }

  private _row(l: Location) {
    const s = l.stats;
    const current = l.devices.filter((d) => !d.end);
    const open = this._open === l.id;
    return html`<div class="loc ${open ? "open" : ""}">
      <div class="row" @click=${() => this._toggle(l.id)}>
        <div class="row-top">
          <span class="name">${l.name}</span>
          <span class="chips">${current.map((d) => this._chip(d))}</span>
        </div>
        <div class="row-meta">
          <span>Last run ${relDate(s.last_run_end)}</span>
          <span>${liters(s.liters_7d)} 7d · ${liters(s.liters_30d)} 30d</span>
          ${l.expected_lpm != null && s.avg_lpm_30d != null
            ? html`<span>${s.avg_lpm_30d.toFixed(1)} of ${l.expected_lpm} L/min expected</span>`
            : nothing}
        </div>
      </div>
      ${open ? this._details(l) : nothing}
    </div>`;
  }

  private _unassignedRows(d: Payload) {
    return html`${d.unassigned.map(
        (u) => html`<div class="hist">
          <div class="hist-main">${this._chip(u)}</div>
          ${this._assignSelect(null, u.device_id)}
        </div>`
      )}
      ${this._errFor("unassigned")}`;
  }

  /** Valve list header: new valves that still need a location. */
  private _renderUnassigned() {
    const d = this._data;
    if (!d || d.unassigned.length === 0) return nothing;
    return html`<ha-card>
      <div class="card-header">
        <ha-icon icon="mdi:map-marker-question"></ha-icon>
        <span class="title">${this._config!.title ?? "Valves without location"} (${d.unassigned.length})</span>
      </div>
      <div class="card-content">${this._unassignedRows(d)}</div>
    </ha-card>`;
  }

  /** Valve detail view: where this valve is installed, and a way to change it. */
  private _renderDevice(deviceId: string) {
    const d = this._data;
    // The strategy passes the Tuya id, but falls back to the HA device UUID
    // when the registry sensor is unavailable (its attributes are stripped),
    // so match on either.
    const isMe = (x: {device_id: string; ha_device_id: string | null}) => x.device_id === deviceId || x.ha_device_id === deviceId;
    const here = d?.locations.find((l) => l.devices.some((x) => isMe(x) && !x.end)) ?? null;
    const tuyaId = here?.devices.find((x) => isMe(x))?.device_id ?? d?.unassigned.find((u) => isMe(u))?.device_id ?? deviceId;
    const select = d
      ? html`<select ?disabled=${this._busy} @change=${(e: Event) => {
          const sel = e.target as HTMLSelectElement;
          const v = sel.value;
          sel.value = "";
          if (v) void this._post("device", { action: "assign_device", device_id: tuyaId, location_id: v });
        }}>
          <option value="">${here ? "Move to…" : "Assign to…"}</option>
          ${d.locations.filter((l) => l.id !== here?.id).map((l) => html`<option value=${l.id}>${l.name}</option>`)}
        </select>`
      : nothing;
    return html`<ha-card>
      <div class="card-header">
        <ha-icon icon="mdi:map-marker-radius"></ha-icon>
        <span class="title">${this._config!.title ?? "Location"}</span>
      </div>
      <div class="card-content">
        ${this._error ? html`<div class="err">${this._error}</div>` : nothing}
        <div class="hist">
          <div class="hist-main">${here ? html`<b>${here.name}</b>` : html`<span class="dim">Not assigned</span>`}</div>
          ${select}
        </div>
        ${this._errFor("device")}
      </div>
    </ha-card>`;
  }

  protected render() {
    if (!this._config || !this.hass) return nothing;
    if (!this._fetched) void this._load();
    if (this._config.device_id) return this._renderDevice(this._config.device_id);
    if (this._config.unassigned) return this._renderUnassigned();
    const d = this._data;
    const q = this._query.trim().toLowerCase();
    const list = d ? d.locations.filter((l) => this._matches(l, q)) : [];
    return html`<ha-card>
      <div class="card-header">
        <ha-icon icon="mdi:map-marker-radius"></ha-icon>
        <span class="title">${this._config.title ?? "Irrigation locations"}</span>
        <button class="flat" title="Add location" @click=${() => (this._newName = this._newName == null ? "" : null)}>
          + Location
        </button>
        <button class="flat" title="Refresh" ?disabled=${this._loading} @click=${() => this._load()}>↻</button>
      </div>
      <div class="card-content">
        ${this._newName != null
          ? html`<div class="actions">
                <input
                  placeholder="New location name"
                  .value=${this._newName}
                  @input=${(e: Event) => (this._newName = (e.target as HTMLInputElement).value)}
                  @keydown=${(e: KeyboardEvent) => e.key === "Enter" && this._create()}
                />
                <button ?disabled=${this._busy || !this._newName.trim()} @click=${() => this._create()}>Create</button>
              </div>
              ${this._errFor("new")}`
          : nothing}
        <input
          class="search"
          type="search"
          placeholder="Search location or valve number"
          .value=${this._query}
          @input=${(e: Event) => (this._query = (e.target as HTMLInputElement).value)}
        />
        ${this._error ? html`<div class="err">Could not load locations: ${this._error}</div>` : nothing}
        ${!d && this._loading ? html`<div class="dim">Loading…</div>` : nothing}
        ${d && list.length === 0 ? html`<div class="dim">No locations match.</div>` : nothing}
        ${list.map((l) => this._row(l))}
        ${d
          ? html`<div class="unassigned">
              <div class="sub toggle" @click=${() => (this._showUnassigned = !this._showUnassigned)}>
                ${this._showUnassigned ? "▾" : "▸"} Unassigned valves (${d.unassigned.length})
              </div>
              ${this._showUnassigned ? this._unassignedRows(d) : nothing}
            </div>`
          : nothing}
      </div>
    </ha-card>`;
  }

  static styles = css`
    :host {
      --lc-text: var(--primary-text-color, #212121);
      --lc-dim: var(--secondary-text-color, #727272);
      --lc-divider: var(--divider-color, #e0e0e0);
      --lc-on: var(--success-color, #4caf50);
      --lc-off: var(--disabled-text-color, #bdbdbd);
      --lc-accent: var(--primary-color, #03a9f4);
      --lc-err: var(--error-color, #db4437);
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 16px 4px;
      font-size: 1.1em;
      font-weight: 500;
      color: var(--lc-text);
    }
    .card-header ha-icon {
      color: var(--lc-dim);
    }
    .title {
      flex: 1;
      min-width: 0;
    }
    .card-content {
      padding: 8px 16px 16px;
      color: var(--lc-text);
    }
    input,
    select {
      font: inherit;
      color: var(--lc-text);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--lc-divider);
      border-radius: 6px;
      padding: 6px 8px;
      box-sizing: border-box;
      max-width: 100%;
    }
    .search {
      width: 100%;
      margin-bottom: 8px;
    }
    button {
      font: inherit;
      font-size: 0.85em;
      border: 1px solid var(--lc-accent);
      background: var(--lc-accent);
      color: var(--text-primary-color, #fff);
      border-radius: 6px;
      padding: 4px 10px;
      cursor: pointer;
    }
    button.flat {
      background: transparent;
      color: var(--lc-accent);
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .loc {
      border-bottom: 1px solid var(--lc-divider);
    }
    .row {
      padding: 8px 0;
      cursor: pointer;
    }
    .row-top {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }
    .name {
      font-weight: 500;
      margin-right: auto;
    }
    .row-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 2px 12px;
      font-size: 0.8em;
      color: var(--lc-dim);
      margin-top: 2px;
      font-variant-numeric: tabular-nums;
    }
    .chips {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 1px 8px;
      border: 1px solid var(--lc-divider);
      border-radius: 12px;
      font-size: 0.8em;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--lc-off);
    }
    .dot.on {
      background: var(--lc-on);
    }
    .details {
      padding: 0 0 12px 8px;
      font-size: 0.9em;
    }
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 2px 12px;
      margin: 0 0 6px;
    }
    dt {
      color: var(--lc-dim);
    }
    dd {
      margin: 0;
      overflow-wrap: anywhere;
    }
    a {
      color: var(--lc-accent);
      margin-left: 6px;
    }
    .form label {
      display: flex;
      flex-direction: column;
      font-size: 0.85em;
      color: var(--lc-dim);
      margin-bottom: 6px;
    }
    .sub {
      font-weight: 500;
      margin: 10px 0 4px;
    }
    .toggle {
      cursor: pointer;
      color: var(--lc-dim);
    }
    .hist {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 4px 8px;
      padding: 4px 0;
      border-top: 1px dashed var(--lc-divider);
    }
    .hist-main {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }
    .hist-meta {
      font-size: 0.85em;
      color: var(--lc-dim);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
    }
    .confirm {
      display: inline-flex;
      gap: 4px;
      align-items: center;
      color: var(--lc-text);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 6px 0;
    }
    .actions input {
      flex: 1;
      min-width: 0;
    }
    .dim {
      color: var(--lc-dim);
    }
    .err {
      color: var(--lc-err);
      font-size: 0.85em;
      margin: 4px 0;
    }
  `;
}

if (!customElements.get("irrigation-locations-card")) {
  customElements.define("irrigation-locations-card", IrrigationLocationsCard);
  const w = window as unknown as { customCards?: unknown[] };
  w.customCards = w.customCards || [];
  if (!w.customCards.some((c) => (c as { type?: string }).type === "irrigation-locations-card")) {
    w.customCards.push({
      type: "irrigation-locations-card",
      name: "Irrigation Locations",
      description: "Irrigation locations with their installed valves, watering history and device assignments.",
    });
  }
}
