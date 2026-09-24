import { LitElement, html, css, nothing, PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import {
  TimerSlot,
  TimerMode,
  DAYS,
  NUM_SLOTS,
  IrrigationTimerCardConfig,
} from "./models";
import { farmTokens } from "./components/theme.ts";
import { formStyles } from "./components/form-styles.ts";

/** "Every day", "Mon–Fri", "Sat, Sun", else the short names. Bit 0 = Mon. */
function daysText(mask: number): string {
  if ((mask & 127) === 127) return "Every day";
  if ((mask & 127) === 31) return "Mon–Fri";
  if ((mask & 127) === 96) return "Sat, Sun";
  const picked = DAYS.filter((_, i) => mask & (1 << i));
  return picked.length ? picked.join(", ") : "No days";
}

function countDays(mask: number): number {
  let n = 0;
  for (let i = 0; i < 7; i++) if (mask & (1 << i)) n++;
  return n;
}

function amountText(t: TimerSlot): string {
  if (t.mode !== TimerMode.Duration) return `${t.value} L`;
  if (t.value < 60) return `${t.value} s`;
  return t.value % 60 === 0 ? `${t.value / 60} min` : `${Math.floor(t.value / 60)} min ${t.value % 60} s`;
}

const DURATION_PRESETS = [5, 10, 15, 30]; // minutes
const VOLUME_PRESETS = [50, 100, 200]; // liters

// HA types (minimal)
interface HomeAssistant {
  states: Record<string, HassEntity>;
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: unknown,
    notifyOnError?: boolean,
    returnResponse?: boolean
  ): Promise<{ response?: ResyncResponse }>;
}

/** Return payload of xtend_tuya.fdm5kw_resync_timers. */
interface ResyncResponse {
  success?: boolean;
  error?: string;
  checked?: number;
  orphans_cleared?: number;
  orphans_deferred?: number;
}

interface HassEntity {
  state: string;
  attributes: Record<string, unknown>;
}

/** Shape of each entry in the registry sensor's `slots` attribute. */
interface SlotAttribute {
  slot: number;
  hour: number;
  minute: number;
  mode: "duration" | "volume";
  value: number;
  value_unit: "s" | "L";
  days: string[];
  days_mask: number;
  enabled: boolean;
  cloud_timer_id?: string;
}

export class IrrigationTimerCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config!: IrrigationTimerCardConfig;

  /** Cached timer slots from state updates */
  @state() private _timers: Map<number, TimerSlot> = new Map();

  /** Currently editing timer (null = list view) */
  @state() private _editing: TimerSlot | null = null;

  /** Are we creating a new timer? */
  @state() private _isNew = false;

  /** Cloud-resync in flight + last-result banner (auto-clears). */
  @state() private _resyncing = false;
  @state() private _resyncStatus: string | null = null;

  setConfig(config: IrrigationTimerCardConfig): void {
    if (!config.entity) {
      throw new Error("Please define an entity (timer registry sensor)");
    }
    if (!config.device_id) {
      throw new Error("Please define a device_id");
    }
    this._config = config;
  }

  getCardSize(): number {
    return 4;
  }

  protected updated(changedProps: PropertyValues): void {
    if (changedProps.has("hass") && this.hass) {
      this._updateTimersFromState();
    }
  }

  private _updateTimersFromState(): void {
    const entity = this.hass.states[this._config.entity];
    if (!entity) return;

    const slots = entity.attributes?.slots as
      | Record<string, SlotAttribute | null>
      | undefined;
    if (!slots) return;

    const next = new Map<number, TimerSlot>();
    for (let i = 0; i < NUM_SLOTS; i++) {
      const raw = slots[String(i)];
      if (!raw) continue;
      next.set(i, {
        slot: i,
        mode: raw.mode === "volume" ? TimerMode.Volume : TimerMode.Duration,
        value: raw.value,
        hour: raw.hour,
        minute: raw.minute,
        daysMask: raw.days_mask,
        enabled: raw.enabled,
      });
    }
    this._timers = next;
  }

  private _newTimer(): TimerSlot {
    for (let i = 0; i < NUM_SLOTS; i++) {
      if (!this._timers.has(i)) {
        return {
          slot: i,
          mode: TimerMode.Duration,
          value: 900, // 15 min default
          hour: 6,
          minute: 0,
          daysMask: 0b1111111,
          enabled: true,
        };
      }
    }
    return {
      slot: 0,
      mode: TimerMode.Duration,
      value: 900,
      hour: 6,
      minute: 0,
      daysMask: 0b1111111,
      enabled: true,
    };
  }

  private async _sendSetTimer(timer: TimerSlot): Promise<void> {
    await this.hass.callService("xtend_tuya", "fdm5kw_set_timer", {
      device_id: this._config.device_id,
      slot: timer.slot,
      hour: timer.hour,
      minute: timer.minute,
      mode: timer.mode === TimerMode.Volume ? "volume" : "duration",
      value: timer.value,
      days: timer.daysMask,
      enabled: timer.enabled,
    });
  }

  private async _sendDeleteTimer(slot: number): Promise<void> {
    await this.hass.callService("xtend_tuya", "fdm5kw_delete_timer", {
      device_id: this._config.device_id,
      slot,
    });
  }

  private async _saveTimer(): Promise<void> {
    if (!this._editing) return;
    await this._sendSetTimer(this._editing);

    this._timers = new Map(this._timers);
    this._timers.set(this._editing.slot, { ...this._editing });
    this._editing = null;
    this._isNew = false;
  }

  private async _deleteTimer(slot: number): Promise<void> {
    await this._sendDeleteTimer(slot);

    this._timers = new Map(this._timers);
    this._timers.delete(slot);
  }

  /** Reconcile this valve's timers against the Tuya cloud, dropping ghosts.
   * Read-first server-side: only a live orphan (would water offline) costs a
   * device write. The registry entity refreshes itself, so the ghost rows
   * just vanish; the banner covers the "nothing changed / all clean" case. */
  private async _resync(): Promise<void> {
    if (this._resyncing) return;
    this._resyncing = true;
    this._resyncStatus = null;
    try {
      const res = await this.hass.callService(
        "xtend_tuya",
        "fdm5kw_resync_timers",
        { device_id: this._config.device_id },
        undefined,
        undefined,
        true
      );
      const r = res?.response ?? {};
      if (r.success === false) {
        this._resyncStatus = `Resync failed: ${r.error ?? "unknown"}`;
      } else {
        const cleared = r.orphans_cleared ?? 0;
        const parts: string[] = [];
        if (cleared === 0) parts.push("All in sync");
        else parts.push(`Cleared ${cleared} zombie${cleared === 1 ? "" : "s"}`);
        if (r.orphans_deferred) parts.push(`${r.orphans_deferred} deferred (quota)`);
        this._resyncStatus = parts.join(" · ");
      }
    } catch (err) {
      this._resyncStatus = `Resync failed: ${err}`;
    } finally {
      this._resyncing = false;
      window.setTimeout(() => {
        this._resyncStatus = null;
      }, 5000);
    }
  }

  private _startEdit(timer: TimerSlot): void {
    this._editing = { ...timer };
    this._isNew = false;
  }

  private _startNew(): void {
    this._editing = this._newTimer();
    this._isNew = true;
  }

  private _cancelEdit(): void {
    this._editing = null;
    this._isNew = false;
  }

  // --- Rendering ---

  protected render() {
    if (!this._config || !this.hass) return nothing;

    const stateAttrs = this.hass.states[this._config.entity]?.attributes;
    const valveName = stateAttrs?.valve_name as string | undefined;
    const name =
      this._config.name ??
      valveName ??
      (stateAttrs?.friendly_name as string | undefined) ??
      "Irrigation Timer";

    // "Home · Room" sub-line, same source/registry attributes as the control
    // card, so the timer card on the detail view also helps locate the valve
    // in the SmartLife app (Simon's request). Renders nothing until known.
    const home = stateAttrs?.valve_home as string | undefined;
    const room = stateAttrs?.valve_room as string | undefined;
    const location = [home, room]
      .filter((p) => p && String(p).trim())
      .join(" · ");

    return html`
      <ha-card>
        <div class="titlebar">
          <ha-icon icon="mdi:calendar-clock"></ha-icon>
          <div class="title">
            <b>Schedule</b>
            <span title=${location}>${name}${location ? ` · ${location}` : ""}</span>
          </div>
          <button
            class="icon-btn ${this._resyncing ? "spinning" : ""}"
            title="Check the timers against the Tuya cloud (clears ghost timers)"
            aria-label="Resync timers"
            ?disabled=${this._resyncing}
            @click=${this._resync}
          >
            <ha-icon icon="mdi:cloud-sync-outline"></ha-icon>
          </button>
        </div>
        ${this._resyncStatus ? html`<div class="resync-status">${this._resyncStatus}</div>` : nothing}
        <div class="body">${this._editing ? this._renderEditor() : this._renderList()}</div>
      </ha-card>
    `;
  }

  private _renderList() {
    // Sort by time of day, not slot index — slot numbers are an internal
    // device detail and read as random ordering (Trello ExgyBKSb).
    const timers = Array.from(this._timers.values()).sort(
      (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)
    );
    const on = timers.filter((t) => t.enabled);
    const minutes = on.filter((t) => t.mode === TimerMode.Duration).reduce((s, t) => s + (t.value / 60) * countDays(t.daysMask), 0);
    const liters = on.filter((t) => t.mode !== TimerMode.Duration).reduce((s, t) => s + t.value * countDays(t.daysMask), 0);
    const week = [minutes ? `${Math.round(minutes)} min` : "", liters ? `${Math.round(liters)} L` : ""].filter(Boolean).join(" + ");

    return html`
      ${timers.length === 0
        ? html`<div class="empty">No timers yet. This valve only waters when started by hand.</div>`
        : html`<div class="rows">${timers.map((t) => this._renderTimerRow(t))}</div>`}
      ${timers.length
        ? html`<div class="summary dim" title="What the enabled timers water in a week">
            ${on.length} of ${timers.length} on${week ? html` · <b>${week}</b> per week` : ""}
          </div>`
        : nothing}
      <button class="btn wide" @click=${this._startNew}><ha-icon icon="mdi:plus"></ha-icon>Add timer</button>
    `;
  }

  private _renderTimerRow(timer: TimerSlot) {
    const timeStr = `${timer.hour.toString().padStart(2, "0")}:${timer.minute.toString().padStart(2, "0")}`;
    return html`
      <div class="row ${timer.enabled ? "" : "disabled"}">
        <button class="info" @click=${() => this._startEdit(timer)} title="Edit this timer">
          <span class="when">
            <span class="time">${timeStr}</span>
            <span class="amount" title=${timer.mode === TimerMode.Duration ? "Duration" : "Volume"}>${amountText(timer)}</span>
          </span>
          <span class="days">
            <span class="dots" aria-hidden="true">
              ${DAYS.map((d, i) => html`<i class=${timer.daysMask & (1 << i) ? "on" : ""} title=${d}>${d.charAt(0)}</i>`)}
            </span>
            <span class="dim">${daysText(timer.daysMask)}</span>
          </span>
        </button>
        <ha-switch
          .checked=${timer.enabled}
          title=${timer.enabled ? "On: turn off to pause this timer" : "Off: turn on to use this timer"}
          @change=${(e: Event) => this._toggleEnabled(timer, e)}
        ></ha-switch>
      </div>
    `;
  }

  private async _toggleEnabled(
    timer: TimerSlot,
    e: Event
  ): Promise<void> {
    const checked = (e.target as HTMLInputElement).checked;
    const updated = { ...timer, enabled: checked };
    await this._sendSetTimer(updated);

    this._timers = new Map(this._timers);
    this._timers.set(timer.slot, updated);
  }

  private _renderEditor() {
    const t = this._editing!;
    const duration = t.mode === TimerMode.Duration;
    const shown = duration ? Math.max(1, Math.round(t.value / 60)) : t.value;
    const set = (patch: Partial<TimerSlot>) => (this._editing = { ...t, ...patch });
    return html`
      <div class="editor">
        <div class="label">Start</div>
        <div class="field">
          <input
            type="time"
            aria-label="Start time"
            .value=${`${t.hour.toString().padStart(2, "0")}:${t.minute.toString().padStart(2, "0")}`}
            @change=${(e: Event) => {
              const [h, m] = (e.target as HTMLInputElement).value.split(":");
              set({ hour: parseInt(h, 10), minute: parseInt(m, 10) });
            }}
          />
        </div>

        <div class="label">Water by</div>
        <div class="chips" role="group" aria-label="Water by">
          <button class="chip ${duration ? "on" : ""}" aria-pressed=${duration}
            @click=${() => set({ mode: TimerMode.Duration, value: duration ? t.value : 900 })}>
            <ha-icon icon="mdi:timer-outline"></ha-icon>Time
          </button>
          <button class="chip ${duration ? "" : "on"}" aria-pressed=${!duration}
            @click=${() => set({ mode: TimerMode.Volume, value: duration ? 50 : t.value })}>
            <ha-icon icon="mdi:water"></ha-icon>Amount
          </button>
        </div>
        <div class="chips" role="group" aria-label="Quick amounts">
          ${(duration ? DURATION_PRESETS : VOLUME_PRESETS).map(
            (v) => html`<button class="chip ${shown === v ? "on" : ""}" @click=${() => set({ value: duration ? v * 60 : v })}>
              ${v} ${duration ? "min" : "L"}
            </button>`
          )}
        </div>
        <div class="field">
          <input
            type="number"
            min="1"
            max=${duration ? 1440 : 9999}
            aria-label=${duration ? "Minutes" : "Liters"}
            .value=${String(shown)}
            @change=${(e: Event) => {
              const raw = parseInt((e.target as HTMLInputElement).value, 10);
              if (Number.isFinite(raw) && raw > 0) set({ value: duration ? raw * 60 : raw });
            }}
          />
          <span class="unit">${duration ? "min" : "L"}</span>
        </div>

        <div class="label">Days · ${daysText(t.daysMask)}</div>
        <div class="day-picker" role="group" aria-label="Days">
          ${DAYS.map(
            (day, i) => html`<button
              class="day ${t.daysMask & (1 << i) ? "on" : ""}"
              aria-pressed=${!!(t.daysMask & (1 << i))}
              title=${day}
              @click=${() => set({ daysMask: t.daysMask ^ (1 << i) })}
            >
              ${day.slice(0, 2)}
            </button>`
          )}
        </div>
        <div class="chips">
          <button class="chip" @click=${() => set({ daysMask: 127 })}>Every day</button>
          <button class="chip" @click=${() => set({ daysMask: 31 })}>Mon–Fri</button>
          <button class="chip" @click=${() => set({ daysMask: 96 })}>Weekend</button>
        </div>

        <div class="actions">
          ${!this._isNew
            ? html`<button
                class="btn danger"
                @click=${() => {
                  this._deleteTimer(t.slot);
                  this._editing = null;
                  this._isNew = false;
                }}
              >
                <ha-icon icon="mdi:delete-outline"></ha-icon>Delete
              </button>`
            : nothing}
          <span class="spacer"></span>
          <button class="btn" @click=${this._cancelEdit}>Cancel</button>
          <button class="btn primary" @click=${this._saveTimer} ?disabled=${!t.daysMask}>Save</button>
        </div>
      </div>
    `;
  }

  static styles = [
    farmTokens,
    formStyles,
    css`
      .resync-status {
        margin: 0 16px;
        font-size: 0.8em;
        color: var(--xt-dim);
        text-align: right;
      }
      .icon-btn.spinning ha-icon {
        animation: resync-spin 1s linear infinite;
      }
      @keyframes resync-spin {
        to {
          transform: rotate(360deg);
        }
      }
      .empty {
        color: var(--xt-dim);
        padding: 8px 0;
      }
      .rows {
        display: flex;
        flex-direction: column;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid var(--xt-track);
      }
      .row:last-child {
        border-bottom: none;
      }
      .row.disabled .info {
        opacity: 0.45;
      }
      .info {
        all: unset;
        flex: 1;
        min-width: 0;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 4px;
        border-radius: 8px;
      }
      .info:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
      .when {
        display: flex;
        align-items: baseline;
        gap: 10px;
      }
      .time {
        font-size: 1.4em;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
      }
      .amount {
        color: var(--xt-water);
        font-weight: 500;
      }
      .days {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.85em;
      }
      .dots {
        display: inline-flex;
        gap: 3px;
      }
      .dots i {
        font-style: normal;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        font-size: 0.7em;
        display: inline-grid;
        place-items: center;
        color: var(--xt-dim);
        background: color-mix(in srgb, var(--xt-track) 60%, transparent);
      }
      .dots i.on {
        background: var(--xt-water);
        color: #fff;
      }
      .summary b {
        color: var(--primary-text-color);
        font-weight: 500;
      }
      .editor {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .editor .label {
        margin-top: 4px;
      }
      .field input[type="time"] {
        width: 8em;
      }
      .day-picker {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .day {
        font: inherit;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 1px solid var(--xt-track);
        background: var(--card-background-color, #fff);
        color: var(--primary-text-color);
        cursor: pointer;
      }
      .day.on {
        background: var(--xt-water);
        border-color: var(--xt-water);
        color: #fff;
      }
      .actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
        flex-wrap: wrap;
      }
      .spacer {
        flex: 1;
      }
    `,
  ];
}

// Idempotent registration — guards against double-load (e.g. an old
// /local/ resource still hanging around). Without this, the second
// load throws DOMException("name already used") which aborts the whole
// module and leaves any later cards unregistered too.
if (!customElements.get("irrigation-timer-card")) {
  customElements.define("irrigation-timer-card", IrrigationTimerCard);
  // Card picker entry — only add once per page load.
  const w = window as unknown as { customCards?: unknown[] };
  w.customCards = w.customCards || [];
  if (
    !w.customCards.some(
      (c) => (c as { type?: string }).type === "irrigation-timer-card"
    )
  ) {
    w.customCards.push({
      type: "irrigation-timer-card",
      name: "Irrigation Timer",
      description: "Manage Tuya irrigation valve timer schedules",
    });
  }
}
