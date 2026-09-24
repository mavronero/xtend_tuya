/** Colour tokens of the farm cards, in one place. Water that flowed is
 * blue (filled); a plan is an outline, never a fill, so the two never
 * mix up. Falls back to HA's theme colours. */

import { css } from "lit";

export const farmTokens = css`
  :host {
    --xt-water: var(--blue-color, #1e88e5);
    --xt-dim: var(--secondary-text-color, #727272);
    --xt-ok: var(--success-color, #4caf50);
    --xt-off: var(--disabled-text-color, #bdbdbd);
    --xt-warn: var(--warning-color, #ffa600);
    --xt-bad: var(--error-color, #db4437);
    --xt-track: var(--divider-color, #e0e0e0);
    /* Cards stand out from the page: HA's default edge (divider colour,
       12 % black) nearly vanishes on the light grey background. */
    --xt-card-edge: color-mix(in srgb, var(--primary-text-color, #212121) 14%, transparent);
    --xt-card-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
    --ha-card-border-color: var(--xt-card-edge);
    --ha-card-box-shadow: var(--xt-card-shadow);
  }
`;
