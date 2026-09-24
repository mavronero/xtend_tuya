/** custom:irrigation-valve-settings-card: a valve's device settings in the
 * farm style, each with one line saying what it does.
 *
 *   type: custom:irrigation-valve-settings-card
 *   sleep_mode: switch.<valve>_sleep_mode          # optional
 *   rain_snow_delay: number.<valve>_rain_snow_delay # optional
 */

import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { farmTokens } from "./components/theme.ts";
import { formStyles } from "./components/form-styles.ts";

interface HassEntity {
  state: string;
  attributes: Record<string, unknown>;
}
interface Hass {
  states: Record<string, HassEntity>;
  callService(domain: string, service: string, data: Record<string, unknown>): Promise<unknown>;
}
interface CardConfig {
  type: string;
  sleep_mode?: string;
  rain_snow_delay?: string;
}

export class IrrigationValveSettingsCard extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @state() private _config?: CardConfig;

  setConfig(config: CardConfig): void {
    this._config = config;
  }

  getCardSize(): number {
    return 3;
  }

  private _delay(step: number): void {
    const id = this._config?.rain_snow_delay;
    const s = id ? this.hass?.states[id] : undefined;
    if (!id || !s) return;
    const a = s.attributes;
    const min = Number(a.min ?? 0);
    const max = Number(a.max ?? 7);
    const value = Math.min(max, Math.max(min, Number(s.state) + step * Number(a.step ?? 1)));
    void this.hass!.callService("number", "set_value", { entity_id: id, value });
  }

  render() {
    if (!this._config || !this.hass) return nothing;
    const sleep = this._config.sleep_mode ? this.hass.states[this._config.sleep_mode] : undefined;
    const delay = this._config.rain_snow_delay ? this.hass.states[this._config.rain_snow_delay] : undefined;
    const days = delay ? Number(delay.state) : NaN;
    const dead = (s?: HassEntity) => !s || s.state === "unavailable" || s.state === "unknown";
    return html`<ha-card>
      <div class="titlebar">
        <ha-icon icon="mdi:cog-outline"></ha-icon>
        <div class="title"><b>Settings</b></div>
      </div>
      <div class="body">
        ${sleep
          ? html`<div class="setting">
              <ha-icon icon="mdi:sleep"></ha-icon>
              <div class="text">
                <b>Sleep mode</b>
                <!-- DP work_mode (118): what the firmware does with it is undocumented. -->
                <span class="dim" title="Tuya DP work_mode; the same switch as in SmartLife">${sleep.state === "on" ? "On" : "Off"} · as in SmartLife</span>
              </div>
              <ha-switch
                .checked=${sleep.state === "on"}
                ?disabled=${dead(sleep)}
                @change=${() => this.hass!.callService("switch", "toggle", { entity_id: this._config!.sleep_mode })}
              ></ha-switch>
            </div>`
          : nothing}
        ${delay
          ? html`<div class="setting">
              <ha-icon icon="mdi:weather-pouring"></ha-icon>
              <div class="text">
                <b>Rain delay</b>
                <span class="dim"
                  >${Number.isFinite(days) && days > 0
                    ? `Timers skip the next ${days} day${days === 1 ? "" : "s"}`
                    : "Off: pause the timers for a few days after rain"}</span
                >
              </div>
              <div class="stepper">
                <button class="icon-btn" aria-label="One day less" ?disabled=${dead(delay) || days <= 0} @click=${() => this._delay(-1)}>
                  <ha-icon icon="mdi:minus"></ha-icon>
                </button>
                <b>${Number.isFinite(days) ? days : "–"} d</b>
                <button class="icon-btn" aria-label="One day more" ?disabled=${dead(delay)} @click=${() => this._delay(1)}>
                  <ha-icon icon="mdi:plus"></ha-icon>
                </button>
              </div>
            </div>`
          : nothing}
      </div>
    </ha-card>`;
  }

  static styles = [
    farmTokens,
    formStyles,
    css`
      .setting {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .setting > ha-icon {
        color: var(--xt-dim);
      }
      .text {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .text b {
        font-weight: 500;
      }
      .text span {
        font-size: 0.85em;
      }
      .stepper {
        display: flex;
        align-items: center;
        gap: 4px;
        font-variant-numeric: tabular-nums;
      }
      .stepper b {
        min-width: 2.5em;
        text-align: center;
        font-weight: 500;
      }
    `,
  ];
}

if (!customElements.get("irrigation-valve-settings-card")) {
  customElements.define("irrigation-valve-settings-card", IrrigationValveSettingsCard);
}
