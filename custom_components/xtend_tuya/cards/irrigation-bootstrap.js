// Self-healing card loader for the xtend_tuya irrigation dashboard.
//
// Home Assistant injects every bundled card as a fire-and-forget inline
//   <script>import("/xtend_tuya_static/cards/<name>.js?v=<mtime>")</script>
// The promises are never awaited and their rejections are swallowed, so a
// single dropped import has no retry. Combined with the bundles' guarded
// registration (`customElements.get(x) || customElements.define(x, …)`),
// that means: if one boot import is served a stale or partial body from the
// HA workbox service worker (common right after a HACS update, where the SW
// still holds the 31-day-cached previous bundle), the element never
// registers for the whole page session and its card renders a permanent
// "Configuration error" until the user manually clears the service worker.
//
// This watchdog closes that gap. It polls for any custom element that should
// be defined but isn't, and re-imports its bundle with a unique cache-busting
// query (`?heal=<ts>`). The unique query bypasses BOTH the service worker and
// the browser's errored-module record, forcing a fresh, correct evaluation.
// Re-evaluation is safe because every bundle's define is idempotent. Once all
// elements are registered (HA's hui-card re-renders automatically when an
// element becomes defined), the poll stops.

const PREFIX = "/xtend_tuya_static/cards/";

// element name -> bundle file that defines it
// tests/test_bootstrap_bundles.py checks every customElements.define() in
// cards/*.js is listed here: a card missing from this map never heals and
// renders "Configuration error" (irrigation-locations-card, 4.4.257).
const BUNDLES = {
  "irrigation-locations-card": "irrigation-locations-card.js",
  "irrigation-calendar-card": "irrigation-calendar-card.js",
  "irrigation-valves-card": "irrigation-farm-cards.js",
  "xt-valve-card": "irrigation-farm-cards.js",
  "xt-valve-section": "irrigation-farm-cards.js",
  "xt-valve-filter-bar": "irrigation-farm-cards.js",
  "xt-week-bars": "irrigation-farm-cards.js",
  "irrigation-sites-card": "irrigation-farm-cards.js",
  "xt-site-card": "irrigation-farm-cards.js",
  "xt-mp-card": "irrigation-farm-cards.js",
  "xt-mp-editor": "irrigation-farm-cards.js",
  "irrigation-pumps-card": "irrigation-farm-cards.js",
  "xt-pump-list": "irrigation-farm-cards.js",
  "xt-pump-chart": "irrigation-farm-cards.js",
  "xt-device-picker": "irrigation-farm-cards.js",
  "xt-site-tree": "irrigation-farm-cards.js",
  "irrigation-quota-card": "irrigation-quota-card.js",
  "irrigation-room-groups": "irrigation-room-groups.js",
  "irrigation-control-card": "irrigation-control-card.js",
  "irrigation-timer-card": "irrigation-timer-card.js",
  "irrigation-valve-matrix": "irrigation-valves-strategy.js",
  "irrigation-valve-detail-card": "irrigation-valves-strategy.js",
  "irrigation-refresh-button": "irrigation-valves-strategy.js",
  "ll-strategy-irrigation-valves": "irrigation-valves-strategy.js",
  "ll-strategy-dashboard-irrigation-valves": "irrigation-valves-strategy.js",
};

const allDefined = () =>
  Object.keys(BUNDLES).every((el) => customElements.get(el));

// HA's workbox service worker serves the app-shell index network-first with
// a timeout; over nabu.casa it often loses and a stale index is used. That
// index carries the OLD bootstrap and the OLD bundle list, so a card added
// in a release is never imported and never healed (irrigation-locations-card,
// 4.4.257/258). Read the live index with a unique query (bypasses the SW
// runtime cache) and import every card bundle it lists that this page has
// not evaluated yet. Imports are idempotent; unknown new cards define
// themselves against the live registry on that import.
const DISCOVERED = new Set();
async function discover() {
  try {
    const html = await (
      await fetch(`/?xt=${Date.now()}`, { cache: "no-store", headers: { Accept: "text/html" } })
    ).text();
    for (const m of html.matchAll(/xtend_tuya_static\/cards\/([a-z0-9-]+\.js)\?v=(\d+)/g)) {
      const [, file, v] = m;
      if (file === "irrigation-bootstrap.js" || DISCOVERED.has(file)) continue;
      DISCOVERED.add(file);
      try {
        await import(`${PREFIX}${file}?v=${v}&d=${Date.now()}`);
      } catch (e) {
        // next heal() re-imports anything still undefined
      }
    }
  } catch (e) {
    // offline / relay hiccup: BUNDLES-based heal below still runs
  }
}

async function heal() {
  if (!DISCOVERED.size) await discover();
  // unique set of bundle files that own at least one missing element
  const files = [
    ...new Set(
      Object.entries(BUNDLES)
        .filter(([el]) => !customElements.get(el))
        .map(([, file]) => file),
    ),
  ];
  for (const file of files) {
    try {
      await import(`${PREFIX}${file}?heal=${Date.now()}`);
    } catch (e) {
      // transient (SW miss / relay hiccup); the next poll retries
    }
  }
}

if (!allDefined()) {
  let attempts = 0;
  const timer = setInterval(async () => {
    await heal();
    // give up after ~12 s — by then any real failure is a server-side issue
    // the watchdog can't fix, and we stop polling to avoid a busy loop.
    if (allDefined() || ++attempts > 24) clearInterval(timer);
  }, 500);
  // kick one immediate attempt so a fast heal doesn't wait for the first tick
  heal();
}
