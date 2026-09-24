import { LitElement, html, css, nothing, PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { IrrigationControlCardConfig } from "./models";
import { farmTokens } from "./components/theme.ts";
import { formStyles } from "./components/form-styles.ts";

// HA types (minimal — same shape used in irrigation-timer-card)
interface HomeAssistant {
  states: Record<string, HassEntity>;
  callService(
    domain: string,
    service: string,
    data: Record<string, unknown>
  ): Promise<void>;
}

interface HassEntity {
  state: string;
  attributes: Record<string, unknown>;
}

type Mode = "duration" | "volume";

const MODE_DURATION_DEFAULT = 300; // seconds
const MODE_VOLUME_DEFAULT = 50; // liters
// One tap for the usual amounts (the input stays for anything else).
const DURATION_PRESETS = [300, 600, 900, 1800]; // seconds
const VOLUME_PRESETS = [50, 100, 200]; // liters

export class IrrigationControlCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config!: IrrigationControlCardConfig;

  /** User-selected mode for the next Start (separate from device's last-used mode). */
  @state() private _mode: Mode = "duration";

  /** Target value the user typed for the next Start (sec or L). */
  @state() private _target: number = MODE_DURATION_DEFAULT;

  /** True only when the active cycle was started via this card's Single
   * watering button. Manual ON also opens the valve (and the device may
   * report a fresh start_time), but we don't want the progress/timer view
   * in that case. Reset on Stop / Manual OFF / page reload. */
  @state() private _initiatedHere = false;

  /** Tick state for live progress refresh while a cycle is running. */
  @state() private _tick = 0;
  private _tickHandle: number | null = null;

  setConfig(config: IrrigationControlCardConfig): void {
    if (!config.valve) {
      throw new Error("Please define a valve switch entity");
    }
    if (!config.device_id) {
      throw new Error("Please define a device_id");
    }
    this._config = config;
  }

  getCardSize(): number {
    return 3;
  }

  connectedCallback(): void {
    super.connectedCallback();
    // Tick once a second so the duration countdown stays fresh without
    // waiting for HA state updates. The truth is still server-side.
    this._tickHandle = window.setInterval(() => (this._tick = Date.now()), 1000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._tickHandle !== null) {
      window.clearInterval(this._tickHandle);
      this._tickHandle = null;
    }
  }

  protected updated(changedProps: PropertyValues): void {
    if (changedProps.has("hass") && this.hass && this._config) {
      // Keep the user's target field in sync with HA's number entity once
      // we've seen state. After that, edits are local until Start.
      if (changedProps.get("hass") === undefined) {
        this._initTargetFromState();
      }
    }
  }

  private _initTargetFromState(): void {
    if (!this._config.duration) return;
    const e = this.hass.states[this._config.duration];
    if (!e) return;
    const n = parseFloat(e.state);
    if (Number.isFinite(n) && n > 0) {
      this._target = n;
    }
  }

  // ----- State derivations -----

  private _isOn(): boolean {
    const v = this.hass.states[this._config.valve];
    return v?.state === "on";
  }

  private _activeMode(): Mode | null {
    if (!this._config.mode_sensor) return null;
    const e = this.hass.states[this._config.mode_sensor];
    if (!e) return null;
    if (e.state === "duration") return "duration";
    if (e.state === "volume") return "volume";
    return null;
  }

  private _targetValue(): number | null {
    if (!this._config.value_sensor) return null;
    const e = this.hass.states[this._config.value_sensor];
    if (!e) return null;
    const n = parseFloat(e.state);
    return Number.isFinite(n) ? n : null;
  }

  private _startTime(): Date | null {
    if (!this._config.start_time_sensor) return null;
    const e = this.hass.states[this._config.start_time_sensor];
    if (!e || !e.state) return null;
    const d = new Date(e.state.replace(" ", "T"));
    return Number.isFinite(d.getTime()) ? d : null;
  }

  private _endTime(): Date | null {
    if (!this._config.end_time_sensor) return null;
    const e = this.hass.states[this._config.end_time_sensor];
    if (!e || !e.state) return null;
    const d = new Date(e.state.replace(" ", "T"));
    return Number.isFinite(d.getTime()) ? d : null;
  }

  // Timezone-proof timing for an active timed run, or null when no run is in
  // flight (idle, Manual ON, or a completed cycle).
  //
  // The device's start_time / close_time strings carry no timezone, so parsing
  // them as wall-clock is only safe for their DIFFERENCE — that gives the run's
  // total duration (e.g. close 16:40:41 − start 16:40:26 = 15 s) regardless of
  // the tz gap between the device/HA and the viewing browser. Comparing a
  // tz-less device string to `now` was off by a full hour in testing, so for
  // elapsed/remaining we anchor instead to the start_time SENSOR's
  // `last_changed` — the real HA UTC timestamp of when this watering window was
  // reported, i.e. when the run actually started. This is correct on first
  // paint and after a reload mid-run, and it self-excludes:
  //   - idle / completed runs: elapsed ≥ total → null (no countdown)
  //   - Manual ON: the window is stale (no fresh start_time push), so its
  //     last_changed is old → elapsed ≫ total → null → controls, not a countdown
  private _runTiming(): { total: number; elapsed: number; remaining: number } | null {
    const start = this._startTime();
    const end = this._endTime();
    if (!start || !end || !this._config.start_time_sensor) return null;
    const total = (end.getTime() - start.getTime()) / 1000;
    if (!(total > 0) || total >= 86400) return null;
    const startEnt = this.hass.states[this._config.start_time_sensor] as
      | { last_changed?: string }
      | undefined;
    if (!startEnt?.last_changed) return null;
    const elapsed = (Date.now() - new Date(startEnt.last_changed).getTime()) / 1000;
    if (elapsed < 0 || elapsed >= total) return null;
    return { total, elapsed, remaining: Math.max(0, total - elapsed) };
  }

  private _currentVolume(): number | null {
    if (!this._config.volume_sensor) return null;
    const e = this.hass.states[this._config.volume_sensor];
    if (!e) return null;
    const n = parseFloat(e.state);
    return Number.isFinite(n) ? n : null;
  }

  private _valveName(): string | null {
    if (!this._config.registry_entity) return null;
    const e = this.hass.states[this._config.registry_entity];
    return (e?.attributes?.valve_name as string) ?? null;
  }

  // "Home · Room" to help locate the valve in the SmartLife app. Both come
  // from the registry sensor's attributes (filled by the backend location
  // service); render nothing until at least one is known.
  private _valveLocation(): string | null {
    if (!this._config.registry_entity) return null;
    const e = this.hass.states[this._config.registry_entity];
    const home = e?.attributes?.valve_home as string | undefined;
    const room = e?.attributes?.valve_room as string | undefined;
    const parts = [home, room].filter((p) => p && String(p).trim());
    return parts.length ? parts.join(" · ") : null;
  }

  // ----- Actions -----

  private async _toggleManual(): Promise<void> {
    if (!this.hass) return;
    // Manual ON / OFF is a switch toggle. Always clear _initiatedHere so
    // the progress view does NOT take over — the device may start a cycle
    // anyway (using its stored countdown), but the user's intent here was
    // ad-hoc open/close, not a tracked Single watering.
    this._initiatedHere = false;
    const turn = this._isOn() ? "turn_off" : "turn_on";
    await this.hass.callService("switch", turn, {
      entity_id: this._config.valve,
    });
  }

  private async _startSingleWatering(): Promise<void> {
    if (!this.hass) return;
    // Mark this cycle as initiated by the card so the progress view
    // renders. The service writes one_control + switch=on atomically so
    // the device actually starts the cycle (one_control alone has been
    // observed to silently no-op on some firmware revisions).
    this._initiatedHere = true;
    try {
      await this.hass.callService("xtend_tuya", "fdm5kw_start_watering", {
        device_id: this._config.device_id,
        mode: this._mode,
        value: Math.max(1, Math.round(this._target)),
      });
    } catch (err) {
      this._initiatedHere = false;
      throw err;
    }
  }

  private async _stop(): Promise<void> {
    if (!this.hass) return;
    this._initiatedHere = false;
    // Write one_control idle (mode=0). Falls back to switch turn_off if
    // the user is on an integration version without the new service.
    try {
      await this.hass.callService("xtend_tuya", "fdm5kw_stop_watering", {
        device_id: this._config.device_id,
      });
    } catch {
      await this.hass.callService("switch", "turn_off", {
        entity_id: this._config.valve,
      });
    }
  }

  // ----- Rendering -----

  protected render() {
    if (!this._config || !this.hass) return nothing;

    // Offline valves have no live registry, so _valveName() is null. The
    // last-resort fallback is the valve *switch* entity's friendly name, which
    // HA composes as "<device name> Valve" (the switch's translation_key is
    // "valve"). Strip that trailing " Valve" so an offline valve reads as its
    // device name (e.g. "985 (Dry view middle)") instead of "... Valve" —
    // which is what Simon kept seeing on offline valves.
    const switchName = this.hass.states[this._config.valve]?.attributes
      ?.friendly_name as string | undefined;
    const name =
      this._config.name ??
      this._valveName() ??
      switchName?.replace(/\s+Valve$/i, "") ??
      "Watering";

    const location = this._valveLocation();
    const running = this._isOn();
    const start = this._startTime();
    // A run is "in progress" when the valve is open AND the device reports a
    // sane watering window (close_time > start_time) that we're still inside,
    // measured from the real open moment (see _runTiming — timezone-proof and
    // reload-proof). This is device-reported, so it survives reloads and covers
    // single watering AND scheduled runs alike. It replaces the old
    // value_sensor gate, which never fired on the frozen prod dashboard (its
    // card config predates the value_sensor wiring) — the reason the countdown
    // stayed dead after every reload.
    //   - _initiatedHere gives instant feedback the moment Single watering is
    //     pressed, before the device echoes its new window back.
    // A plain "Manual ON" sets no fresh window, so once the last run's window
    // has elapsed it shows the controls, not a countdown.
    const timing = this._runTiming();
    const inProgress = running && (timing !== null || this._initiatedHere);

    return html`
      <ha-card>
        <div class="titlebar">
          <ha-icon icon="mdi:water-pump"></ha-icon>
          <div class="title">
            <b>Water now</b>
            <span title=${location ?? ""}>${name}${location ? ` · ${location}` : ""}</span>
          </div>
          ${this._renderStatus(running, inProgress)}
        </div>
        <div class="body">${inProgress ? this._renderProgress(start) : this._renderControls()}</div>
      </ha-card>
    `;
  }

  private _renderStatus(running: boolean, inProgress: boolean) {
    if (inProgress) return html`<span class="status watering" title="A watering cycle is running"><i></i>Watering</span>`;
    if (running)
      return html`<span class="status manual" title="Opened by hand: it will not stop by itself"><i></i>Open, no auto-stop</span>`;
    return html`<span class="status" title="Closed"><i></i>Idle</span>`;
  }

  private _renderProgress(start: Date | null) {
    void this._tick; // re-render trigger
    const activeMode = this._activeMode() ?? this._mode;
    const target = this._targetValue() ?? this._target;

    if (activeMode === "volume") {
      const cur = this._currentVolume() ?? 0;
      const pct = target > 0 ? Math.min(100, (cur / target) * 100) : 0;
      const remaining = Math.max(0, target - cur);
      return html`
        <div class="progress">
          <div class="progress-text"><span class="big">${remaining.toFixed(0)} L</span><span class="dim">to go of ${target} L</span></div>
          <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
          <div class="dim">${cur.toFixed(1)} L delivered</div>
        </div>
        <button class="btn wide" @click=${this._stop}><ha-icon icon="mdi:stop"></ha-icon>Stop watering</button>
      `;
    }

    // Duration mode. Prefer the timezone-proof device window (see _runTiming):
    // total = close − start, elapsed anchored to the valve's real open time.
    // Correct even with no value_sensor wired (the frozen prod dashboard) and
    // for cycles started by a schedule or the app. Fall back to the one_control
    // target only in the brief instant after pressing Start, before the device
    // has echoed its window back.
    const timing = this._runTiming();
    let total: number;
    let elapsed: number;
    let remaining: number;
    if (timing !== null) {
      ({ total, elapsed, remaining } = timing);
    } else {
      total = target;
      const elapsedRaw = start ? (Date.now() - start.getTime()) / 1000 : 0;
      elapsed = Math.max(0, Math.min(total, elapsedRaw));
      remaining = Math.max(0, total - elapsed);
    }
    const pct = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;
    return html`
      <div class="progress">
        <div class="progress-text"><span class="big">${formatDuration(remaining)}</span><span class="dim">left of ${formatDuration(total)}</span></div>
        <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
        <div class="dim">${formatDuration(elapsed)} elapsed</div>
      </div>
      <button class="btn wide" @click=${this._stop}><ha-icon icon="mdi:stop"></ha-icon>Stop watering</button>
    `;
  }

  private _renderControls() {
    const duration = this._mode === "duration";
    const presets = duration ? DURATION_PRESETS : VOLUME_PRESETS;
    // Duration is edited in minutes; the device takes seconds.
    const shown = duration ? Math.max(1, Math.round(this._target / 60)) : this._target;
    return html`
      <div class="chips" role="group" aria-label="Water by">
        <button class="chip ${duration ? "on" : ""}" aria-pressed=${duration} @click=${() => this._setMode("duration")}>
          <ha-icon icon="mdi:timer-outline"></ha-icon>Time
        </button>
        <button class="chip ${duration ? "" : "on"}" aria-pressed=${!duration} @click=${() => this._setMode("volume")}>
          <ha-icon icon="mdi:water"></ha-icon>Amount
        </button>
      </div>
      <div class="chips" role="group" aria-label="Quick amounts">
        ${presets.map(
          (v) => html`<button class="chip ${this._target === v ? "on" : ""}" @click=${() => (this._target = v)}>
            ${duration ? `${v / 60} min` : `${v} L`}
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
            const raw = parseFloat((e.target as HTMLInputElement).value);
            if (Number.isFinite(raw) && raw > 0) this._target = duration ? Math.round(raw * 60) : raw;
          }}
        />
        <span class="unit">${duration ? "min" : "L"}</span>
      </div>
      <button class="btn primary wide" @click=${this._startSingleWatering}>
        <ha-icon icon="mdi:play"></ha-icon>Start watering · ${duration ? `${shown} min` : `${shown} L`}
      </button>
      <button
        class="btn wide ${this._isOn() ? "warn" : ""}"
        @click=${this._toggleManual}
        title=${this._isOn() ? "Close the valve" : "Open the valve by hand: it will not stop by itself"}
      >
        <ha-icon icon=${this._isOn() ? "mdi:valve-closed" : "mdi:valve-open"}></ha-icon>
        ${this._isOn() ? "Close valve" : "Open valve (no auto-stop)"}
      </button>
    `;
  }

  private _setMode(m: Mode): void {
    if (this._mode === m) return;
    // Carry over a sensible default when switching modes the first time.
    if (m === "duration" && this._target < 5) this._target = MODE_DURATION_DEFAULT;
    if (m === "volume" && this._target > 1000) this._target = MODE_VOLUME_DEFAULT;
    this._mode = m;
  }

  static styles = [
    farmTokens,
    formStyles,
    css`
      .progress {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .progress-text {
        display: flex;
        align-items: baseline;
        gap: 8px;
        font-variant-numeric: tabular-nums;
      }
      .progress-text .big {
        font-size: 2em;
        font-weight: 500;
      }
      .bar {
        height: 8px;
        background: var(--xt-track);
        border-radius: 4px;
        overflow: hidden;
      }
      .fill {
        height: 100%;
        background: var(--xt-water);
        transition: width 0.5s linear;
      }
    `,
  ];
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Idempotent registration — guards against double-load.
if (!customElements.get("irrigation-control-card")) {
  customElements.define("irrigation-control-card", IrrigationControlCard);
  const w = window as unknown as { customCards?: unknown[] };
  w.customCards = w.customCards || [];
  if (
    !w.customCards.some(
      (c) => (c as { type?: string }).type === "irrigation-control-card"
    )
  ) {
    w.customCards.push({
      type: "irrigation-control-card",
      name: "Irrigation Control",
      description:
        "Toggle a valve, start a single watering cycle by duration or volume, and watch progress live.",
    });
  }
}
