/** custom:irrigation-run-history-card: a valve's watering history as a list.
 *
 *   type: custom:irrigation-run-history-card
 *   device_id: <tuya id>
 *   metered: true        # the valve has a flow meter (liters column)
 *
 * Reads the shared farm data (runs store, last 30 days). A valve at a
 * metering point lists the point's runs, whichever valve made them (like the
 * Timeline), with a Valve column; otherwise its own runs.
 */

import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type { HomeAssistantLike } from "./farm/discovery.ts";
import { FarmController } from "./farm/controller.ts";
import { logRuns } from "./farm/run-log.ts";
import "./components/run-history.ts";

interface CardConfig {
  type: string;
  device_id: string;
  metered?: boolean;
  title?: string;
}

const NUMBER_RE = /\((\d+)\)\s*$/;

export class IrrigationRunHistoryCard extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistantLike & {
    connection?: {
      subscribeEvents: (cb: (ev: { data: { device_id?: string } }) => void, type: string) => Promise<() => void>;
    };
  };
  @state() private _config?: CardConfig;
  private _farm = new FarmController(this);

  setConfig(config: CardConfig): void {
    if (!config.device_id) throw new Error("device_id is required");
    this._config = config;
  }

  getCardSize(): number {
    return 6;
  }

  private _unsub?: Promise<() => void>;

  protected updated(): void {
    // Reload when the backend records a run of this valve or of another at
    // its metering point (runs_store event). Non-admin users may not
    // subscribe: the log then refreshes with the controller, once a minute.
    if (this.hass?.connection && !this._unsub) {
      this._unsub = this.hass.connection.subscribeEvents((ev) => {
        const id = this._config?.device_id;
        const data = this._farm.data;
        const mp = id ? data.locationOf[id] : undefined;
        if (ev.data.device_id !== id && !(mp && ev.data.device_id && data.locationOf[ev.data.device_id]?.id === mp.id)) return;
        void this._farm.refresh(true);
      }, "xtend_tuya_run_recorded");
      this._unsub.catch(() => undefined);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsub?.then((unsub) => unsub(), () => undefined);
    this._unsub = undefined;
  }

  private _valveOf = (device: string): string => {
    const name = this._farm.valves.find((v) => v.device_id === device)?.valve_name;
    if (!name) return "removed";
    const n = NUMBER_RE.exec(name)?.[1];
    return n ? `#${n}` : name;
  };

  render() {
    if (!this._config) return nothing;
    const { mp, runs } = logRuns(this._farm.data, this._config.device_id);
    // Title in the style of the control and timer cards beside it.
    return html`<ha-card>
      <div class="title">
        <ha-icon icon="mdi:format-list-bulleted"></ha-icon>${this._config.title ??
        (mp ? `Watering log · ${mp.name}` : "Watering log")}
      </div>
      <div class="content">
        <xt-run-history
          .runs=${runs}
          .valveOf=${mp ? this._valveOf : undefined}
          ?metered=${this._config.metered !== false}
        ></xt-run-history>
      </div>
    </ha-card>`;
  }

  static styles = css`
    .title {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 16px 8px;
      font-size: 1.1em;
      font-weight: 500;
    }
    .title ha-icon {
      color: var(--secondary-text-color);
    }
    .content {
      padding: 0 16px 12px;
    }
  `;
}

if (!customElements.get("irrigation-run-history-card")) {
  customElements.define("irrigation-run-history-card", IrrigationRunHistoryCard);
}
