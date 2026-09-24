/** <xt-device-picker .devices .exclude>: search HA's device registry by
 * name, area or model and pick one. Fires `xt-device-picked` (detail: HA
 * device id). Own list on purpose: HA's ha-device-picker is loaded lazily
 * and changes between releases. */

import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { farmTokens } from "./theme.ts";

export interface DeviceOption {
  id: string;
  name: string;
  area: string | null;
  model: string | null;
}

const LIMIT = 30;

export class XtDevicePicker extends LitElement {
  @property({ attribute: false }) devices: DeviceOption[] = [];
  @property({ attribute: false }) exclude: string[] = [];
  @property() placeholder = "Search devices by name, area or model";
  @state() private _q = "";

  render() {
    const q = this._q.trim().toLowerCase();
    const hits = q
      ? this.devices
          .filter((d) => !this.exclude.includes(d.id))
          .filter((d) => [d.name, d.area, d.model].some((x) => x?.toLowerCase().includes(q)))
          .slice(0, LIMIT)
      : [];
    return html`
      <input type="search" placeholder=${this.placeholder} .value=${this._q} @input=${(e: Event) => (this._q = (e.target as HTMLInputElement).value)} />
      ${q
        ? html`<ul role="listbox">
            ${hits.length
              ? hits.map(
                  (d) => html`<li
                    role="option"
                    tabindex="0"
                    @click=${() => this._pick(d.id)}
                    @keydown=${(e: KeyboardEvent) => e.key === "Enter" && this._pick(d.id)}
                  >
                    <span>${d.name}</span><span class="dim">${[d.area, d.model].filter(Boolean).join(" · ")}</span>
                  </li>`
                )
              : html`<li class="dim">No device matches.</li>`}
          </ul>`
        : nothing}
    `;
  }

  private _pick(id: string): void {
    this._q = "";
    this.dispatchEvent(new CustomEvent("xt-device-picked", { detail: id, bubbles: true, composed: true }));
  }

  static styles = [
    farmTokens,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      input {
        font: inherit;
        color: var(--primary-text-color);
        background: var(--card-background-color, #fff);
        border: 1px solid var(--xt-track);
        border-radius: 8px;
        padding: 6px 10px;
        min-height: 34px;
      }
      ul {
        margin: 0;
        padding: 4px;
        list-style: none;
        border: 1px solid var(--xt-track);
        border-radius: 8px;
        max-height: 240px;
        overflow: auto;
      }
      li {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 6px 8px;
        border-radius: 6px;
        cursor: pointer;
      }
      li:hover,
      li:focus-visible {
        background: color-mix(in srgb, var(--primary-color) 10%, transparent);
        outline: none;
      }
      .dim {
        color: var(--xt-dim);
        font-size: 0.85rem;
      }
    `,
  ];
}

if (!customElements.get("xt-device-picker")) customElements.define("xt-device-picker", XtDevicePicker);
