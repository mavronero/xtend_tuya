/** <xt-week-bars .daily=${number[]} unit="L">: last 7 days as small bars,
 * oldest first; each bar's title names its day and amount. */

import { LitElement, html, css } from "lit";
import { property } from "lit/decorators.js";
import { DAY_MS } from "./format.ts";
import { farmTokens } from "./theme.ts";

export class XtWeekBars extends LitElement {
  @property({ attribute: false }) daily: number[] = [];
  @property() unit = "L";

  render() {
    const max = Math.max(...this.daily, 0);
    const noon = new Date();
    noon.setHours(12, 0, 0, 0);
    const n = this.daily.length;
    const day = (i: number) =>
      new Date(noon.getTime() - (n - 1 - i) * DAY_MS).toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    return this.daily.map(
      (v, i) =>
        html`<span
          title="${day(i)}: ${Math.round(v).toLocaleString()} ${this.unit}"
          style="height:${max > 0 ? Math.max(8, (v / max) * 100) : 8}%"
          class=${v > 0 ? "on" : ""}
        ></span>`
    );
  }

  static styles = [
    farmTokens,
    css`
    :host {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 22px;
      width: 70px;
      flex: none;
    }
    span {
      flex: 1;
      border-radius: 2px;
      background: var(--xt-track);
    }
    span.on {
      background: var(--xt-water);
    }
  `,
  ];
}

if (!customElements.get("xt-week-bars")) customElements.define("xt-week-bars", XtWeekBars);
