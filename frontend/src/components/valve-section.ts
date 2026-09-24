/** <xt-valve-section .section=${Section}>: a titled grid of valve cards,
 * optionally split into site groups. Collapsible by tapping the title. */

import { LitElement, html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import type { Section } from "../farm/valve-filter.ts";
import "./valve-card.ts";

export class XtValveSection extends LitElement {
  @property({ attribute: false }) section?: Section;
  @property({ type: Boolean, reflect: true }) collapsed = false;

  render() {
    const s = this.section;
    if (!s) return nothing;
    return html`
      <button class="title" @click=${() => (this.collapsed = !this.collapsed)} aria-expanded=${!this.collapsed}>
        <span>${s.title}</span><span class="count">${s.count}</span>
        <ha-icon icon=${this.collapsed ? "mdi:chevron-down" : "mdi:chevron-up"}></ha-icon>
      </button>
      ${this.collapsed
        ? nothing
        : s.groups.map(
            (g) => html`
              ${g.title ? html`<div class="group">${g.title} <span class="count">${g.valves.length}</span></div>` : nothing}
              <div class="grid">${g.valves.map((v) => html`<xt-valve-card .summary=${v}></xt-valve-card>`)}</div>
            `
          )}
    `;
  }

  static styles = css`
    :host {
      display: block;
      margin-bottom: 20px;
    }
    .title {
      all: unset;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      cursor: pointer;
      font-size: 1.2rem;
      font-weight: 500;
      padding: 4px 0 10px;
      color: var(--primary-text-color);
    }
    .title ha-icon {
      margin-left: auto;
      color: var(--secondary-text-color);
    }
    .count {
      color: var(--secondary-text-color);
      font-weight: 400;
      font-size: 0.9em;
    }
    .group {
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary-color);
      margin: 12px 0 8px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
      gap: 12px;
    }
  `;
}

if (!customElements.get("xt-valve-section")) customElements.define("xt-valve-section", XtValveSection);
