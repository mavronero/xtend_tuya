/** custom:irrigation-run-history-card: a valve's watering history as a list.
 *
 *   type: custom:irrigation-run-history-card
 *   device_id: <tuya id>
 *   metered: true        # the valve has a flow meter (liters column)
 *
 * Reads the shared farm data (runs store, last 30 days).
 */

import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { EMPTY_FARM_DATA, loadFarmData, type FarmData } from "./farm/data.ts";
import "./components/run-history.ts";

interface CardConfig {
  type: string;
  device_id: string;
  metered?: boolean;
  title?: string;
}

export class IrrigationRunHistoryCard extends LitElement {
  @property({ attribute: false }) hass?: { callApi?: <T>(method: string, path: string) => Promise<T> };
  @state() private _config?: CardConfig;
  @state() private _data: FarmData = EMPTY_FARM_DATA;
  @state() private _loaded = false;

  setConfig(config: CardConfig): void {
    if (!config.device_id) throw new Error("device_id is required");
    this._config = config;
  }

  getCardSize(): number {
    return 6;
  }

  protected updated(): void {
    if (this.hass && !this._loaded) {
      this._loaded = true;
      loadFarmData(this.hass).then(
        (d) => (this._data = d),
        () => undefined
      );
    }
  }

  render() {
    if (!this._config) return nothing;
    const runs = this._data.runs.filter((r) => r.device_id === this._config!.device_id);
    // Title in the style of the control and timer cards beside it.
    return html`<ha-card>
      <div class="title"><ha-icon icon="mdi:format-list-bulleted"></ha-icon>${this._config.title ?? "Watering log"}</div>
      <div class="content">
        <xt-run-history .runs=${runs} ?metered=${this._config.metered !== false}></xt-run-history>
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
