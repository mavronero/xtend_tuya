/** <xt-site-tree .sites .selected .counts>: the site hierarchy as
 * navigation. Fires `xt-site-open` (detail: site id, or null for all). */

import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type { Site } from "../farm/data.ts";
import { childSites, NO_SITE } from "../farm/site-summary.ts";

export class XtSiteTree extends LitElement {
  @property({ attribute: false }) sites: Site[] = [];
  @property({ attribute: false }) selected: string | null = null;
  /** Site id -> number shown after the name (metering points). */
  @property({ attribute: false }) counts: Record<string, number> = {};
  @property({ type: Boolean }) noSite = false;
  @state() private _closed = new Set<string>();

  private _open(id: string | null): void {
    this.dispatchEvent(new CustomEvent("xt-site-open", { detail: id, bubbles: true, composed: true }));
  }

  private _toggle(e: Event, id: string): void {
    e.stopPropagation();
    const closed = new Set(this._closed);
    if (closed.has(id)) closed.delete(id);
    else closed.add(id);
    this._closed = closed;
  }

  private _node(site: Site, depth: number): unknown {
    const kids = childSites(this.sites, site.id);
    const closed = this._closed.has(site.id);
    return html`
      <button
        class="node ${site.id === this.selected ? "on" : ""}"
        style="padding-left:${8 + depth * 16}px"
        @click=${() => this._open(site.id)}
        aria-current=${site.id === this.selected ? "page" : "false"}
      >
        ${kids.length
          ? html`<ha-icon
              class="chev"
              icon=${closed ? "mdi:chevron-right" : "mdi:chevron-down"}
              @click=${(e: Event) => this._toggle(e, site.id)}
            ></ha-icon>`
          : html`<span class="chev"></span>`}
        <span class="label">${site.name}</span>
        <span class="count">${this.counts[site.id] ?? ""}</span>
      </button>
      ${closed ? nothing : kids.map((k) => this._node(k, depth + 1))}
    `;
  }

  render() {
    return html`
      <button class="node all ${this.selected === null ? "on" : ""}" @click=${() => this._open(null)}>
        <ha-icon class="chev" icon="mdi:sprout-outline"></ha-icon><span class="label">All sites</span>
      </button>
      ${childSites(this.sites, null).map((s) => this._node(s, 0))}
      ${this.noSite
        ? html`<button class="node ${this.selected === NO_SITE ? "on" : ""}" @click=${() => this._open(NO_SITE)}>
            <span class="chev"></span><span class="label dim">No site</span>
            <span class="count">${this.counts[NO_SITE] ?? ""}</span>
          </button>`
        : nothing}
    `;
  }

  static styles = css`
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
      gap: 4px;
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
    .all {
      margin-bottom: 4px;
    }
    .chev {
      --mdc-icon-size: 18px;
      width: 18px;
      flex: none;
      color: var(--secondary-text-color);
    }
    .label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dim {
      color: var(--secondary-text-color);
    }
    .count {
      color: var(--secondary-text-color);
      font-size: 0.8rem;
      font-variant-numeric: tabular-nums;
    }
  `;
}

if (!customElements.get("xt-site-tree")) customElements.define("xt-site-tree", XtSiteTree);
