/** <xt-pump-list .items .selected>: pumps as navigation, each with a live
 * status dot. Fires `xt-pump-open` (detail: pump id or NO_PUMP). */

import { LitElement, html, css } from "lit";
import { property } from "lit/decorators.js";
import { farmTokens } from "./theme.ts";

export const NO_PUMP = "__no_pump__";

export interface PumpListItem {
  id: string;
  name: string;
  /** "running" | "idle" | "unknown": the dot colour. */
  state: "running" | "idle" | "unknown";
  /** Number shown after the name (metering points fed). */
  count: number;
}

export class XtPumpList extends LitElement {
  @property({ attribute: false }) items: PumpListItem[] = [];
  @property({ attribute: false }) selected: string | null = null;

  render() {
    return this.items.map(
      (p) => html`<button
        class="node ${p.id === this.selected ? "on" : ""}"
        aria-current=${p.id === this.selected ? "page" : "false"}
        @click=${() => this.dispatchEvent(new CustomEvent("xt-pump-open", { detail: p.id, bubbles: true, composed: true }))}
      >
        ${p.id === NO_PUMP
          ? html`<span class="dot none"></span>`
          : html`<span class="dot ${p.state}" title=${p.state === "unknown" ? "No data from the pump" : p.state}></span>`}
        <span class="label ${p.id === NO_PUMP ? "dim" : ""}">${p.name}</span>
        <span class="count">${p.count}</span>
      </button>`
    );
  }

  static styles = [
    farmTokens,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      .node {
        all: unset;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 8px;
        cursor: pointer;
        color: var(--primary-text-color);
        font-size: 0.95rem;
      }
      .node:hover {
        background: color-mix(in srgb, var(--primary-color) 8%, transparent);
      }
      .node.on {
        background: color-mix(in srgb, var(--primary-color) 16%, transparent);
        font-weight: 500;
      }
      .node:focus-visible {
        outline: 2px solid var(--primary-color);
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex: none;
        background: var(--xt-ok);
      }
      .dot.running {
        background: var(--xt-water);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--xt-water) 30%, transparent);
      }
      .dot.unknown {
        background: var(--xt-off);
      }
      .dot.none {
        background: transparent;
        border: 1px dashed var(--xt-off);
        box-sizing: border-box;
      }
      .label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dim {
        color: var(--xt-dim);
      }
      .count {
        color: var(--xt-dim);
        font-size: 0.8rem;
        font-variant-numeric: tabular-nums;
      }
    `,
  ];
}

if (!customElements.get("xt-pump-list")) customElements.define("xt-pump-list", XtPumpList);
