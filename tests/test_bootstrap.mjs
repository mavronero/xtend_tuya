// Stale-release self-heal in cards/irrigation-bootstrap.js.
// Run: node tests/test_bootstrap.mjs
import assert from "node:assert/strict";

// browser stubs so the module's top level runs under node
let probe;
globalThis.customElements = { get: () => true };
globalThis.setTimeout = (fn) => { probe = fn; };
const deleted = [];
const URLS = ["/", "/lovelace/valves", "/xtend_tuya_static/cards/irrigation-farm-cards.js?v=100", "/static/x.js"];
const cacheFor = (name) => ({
  keys: async () => URLS.map((url) => ({ url })),
  delete: async (req) => deleted.push(`${name} ${req.url}`),
});
// prod cache names (2026-09-29)
const NAMES = ["workbox-runtime-https://h/", "workbox-precache-v2-https://h/", "file-cache"];
globalThis.caches = { keys: async () => NAMES, open: async (n) => cacheFor(n) };
globalThis.performance = { getEntriesByType: () => [{ name: "https://h/xtend_tuya_static/cards/irrigation-farm-cards.js?v=100" }] };
let lm = new Date(110_000).toUTCString();
let cancelled = 0;
globalThis.fetch = async (url, opts) => {
  assert.equal(opts.method, undefined); // HEAD is 405 on prod
  assert.equal(opts.headers.Range, "bytes=0-0");
  assert.equal(opts.cache, "no-store");
  return { ok: true, status: 206, headers: { get: (h) => (h === "Last-Modified" ? lm : null) }, body: { cancel: () => cancelled++ } };
};
const store = {};
globalThis.sessionStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
let reloads = 0;
globalThis.location = { reload: () => reloads++ };

const { loadedVersion, shouldHeal, isStaleEntry } = await import(
  "../custom_components/xtend_tuya/cards/irrigation-bootstrap.js"
);

assert.equal(loadedVersion([{ name: "https://h/xtend_tuya_static/cards/irrigation-farm-cards.js?v=5" }, { name: "https://h/xtend_tuya_static/cards/irrigation-farm-cards.js?v=7" }], ""), 7);
assert.equal(loadedVersion([{ name: "https://h/other.js?v=9" }], "https://h/xtend_tuya_static/cards/irrigation-bootstrap.js?v=3"), 3);
assert.equal(loadedVersion([], "https://h/x.js"), 0);

assert.equal(shouldHeal(100, 100), false);
assert.equal(shouldHeal(100, 101), false); // floor vs ceil of the same mtime
assert.equal(shouldHeal(100, 102), true);
assert.equal(shouldHeal(0, 200), false); // unknown loaded version -> no-op

assert.equal(isStaleEntry("https://h/"), true);
assert.equal(isStaleEntry("https://h/lovelace/valves?x=1"), true);
assert.equal(isStaleEntry("https://h/xtend_tuya_static/cards/a.js?v=1"), true);
assert.equal(isStaleEntry("https://h/frontend_latest/app.js"), false);

// stale page: purge our entries in runtime + file-cache (not precache), reload once
await probe();
const ours = ["/", "/lovelace/valves", "/xtend_tuya_static/cards/irrigation-farm-cards.js?v=100"];
assert.deepEqual(deleted, [...ours.map((u) => `${NAMES[0]} ${u}`), ...ours.map((u) => `file-cache ${u}`)]);
assert.equal(cancelled, 1);
assert.equal(reloads, 1);
await probe(); // after the reload the guard key is set: no second reload
assert.equal(reloads, 1);

// server not newer: nothing happens (prod: Last-Modified 1790667720 vs ?v=1790667719)
deleted.length = 0;
lm = new Date(101_000).toUTCString();
await probe();
assert.deepEqual(deleted, []);

console.log("ok bootstrap");
