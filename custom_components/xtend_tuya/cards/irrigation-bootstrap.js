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
  "irrigation-calendar-card": "irrigation-farm-cards.js",
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
  "xt-pump-flow-chart": "irrigation-farm-cards.js",
  "xt-device-picker": "irrigation-farm-cards.js",
  "irrigation-run-history-card": "irrigation-farm-cards.js",
  "xt-run-history": "irrigation-farm-cards.js",
  "irrigation-valve-header-card": "irrigation-farm-cards.js",
  "xt-spinner": "irrigation-farm-cards.js",
  "irrigation-valve-settings-card": "irrigation-farm-cards.js",
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

// Stale-release self-heal. HA's workbox SW (frontend 20260826) serves `/`
// with ignoreSearch and every `/.*` GET (our bundles included) stale-while-
// revalidate from its runtime cache. After a HACS release + restart a browser
// can keep the pre-release index (old ?v=) and old bundles; re-reading the
// index through the SW just returns the same stale copy (the old discover()
// never helped). So compare the ?v=<mtime> this page actually loaded with the
// server file's Last-Modified (1-byte ranged GET on a unique URL) and, if the
// server is newer, purge the SW runtime caches for our files + app-shell
// pages and reload once. Runs on every load, independent of allDefined().
const FARM = "irrigation-farm-cards.js";

// ?v= of the farm bundle this page evaluated (max if several), else the
// bootstrap's own ?v= (same release extract, mtimes within a second or so).
export function loadedVersion(entries, selfUrl) {
  let v = 0;
  for (const e of entries || []) {
    const m = /irrigation-farm-cards\.js\?v=(\d+)/.exec((e && e.name) || "");
    if (m) v = Math.max(v, Number(m[1]));
  }
  if (v) return v;
  const m = /[?&]v=(\d+)/.exec(selfUrl || "");
  return m ? Number(m[1]) : 0;
}

// farm/frontend.py builds ?v= as int(st_mtime) (floor); aiohttp writes
// Last-Modified from math.ceil(st_mtime). Same file -> server - loaded is 0
// or 1, so only a gap of >= 2 s means a newer file on the server.
export function shouldHeal(loaded, server) {
  return loaded > 0 && server > 0 && server - loaded >= 2;
}

// SW runtime-cache entries to drop: our static files, and extension-less
// paths (cached index / dashboard pages).
export function isStaleEntry(url) {
  try {
    const path = new URL(url, "http://x").pathname;
    return path.includes("/xtend_tuya_static/") || !/\.[a-z0-9]+$/i.test(path.split("/").pop());
  } catch (e) {
    return false;
  }
}

async function probe() {
  try {
    const loaded = loadedVersion(performance.getEntriesByType("resource"), import.meta.url);
    // 1-byte ranged GET: HEAD is 405 on prod (nabu.casa). The unique ?probe=
    // URL is never served from / stored in the SW cache (verified on prod).
    const res = await fetch(`${PREFIX}${FARM}?probe=${Date.now()}`, {
      cache: "no-store",
      headers: { Range: "bytes=0-0" },
    });
    const lm = res.ok && res.headers.get("Last-Modified"); // ok = 200 or 206
    try {
      res.body && res.body.cancel();
    } catch (e) {
      // body already consumed/locked: ignore
    }
    if (!lm) return;
    const server = Math.floor(Date.parse(lm) / 1000);
    if (!shouldHeal(loaded, server)) return;
    // prod: "workbox-runtime-<origin>/" + "file-cache" purged,
    // "workbox-precache-v2-<origin>/" kept
    for (const name of await caches.keys()) {
      if (/-precache-|brands|map-tiles/.test(name)) continue;
      const cache = await caches.open(name);
      for (const req of await cache.keys()) {
        if (isStaleEntry(req.url)) await cache.delete(req);
      }
    }
    const key = `xt-reloaded-${server}`;
    try {
      if (sessionStorage.getItem(key)) return; // already reloaded for this release
      sessionStorage.setItem(key, "1");
    } catch (e) {
      return; // no storage -> can't guard against a reload loop; purge only
    }
    location.reload();
  } catch (e) {
    // offline / relay hiccup / no Cache API: no-op
  }
}

// once per page load, after page start has settled
setTimeout(probe, 5000);

async function heal() {
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
