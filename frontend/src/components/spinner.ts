/** <xt-spinner>: small loading indicator in the water colour. */

import { LitElement, css } from "lit";
import { farmTokens } from "./theme.ts";

export class XtSpinner extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "progressbar");
    this.setAttribute("aria-label", "Loading");
  }

  static styles = [
    farmTokens,
    css`
      :host {
        display: inline-block;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 3px solid color-mix(in srgb, var(--xt-water) 25%, transparent);
        border-top-color: var(--xt-water);
        box-sizing: border-box;
        animation: spin 0.9s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ];
}

if (!customElements.get("xt-spinner")) customElements.define("xt-spinner", XtSpinner);
