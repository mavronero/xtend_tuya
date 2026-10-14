// Checks view: which valve lands in which list, and why.
// Run: node --experimental-strip-types tests/test_checks.mjs
import assert from "node:assert/strict";
import { computeChecks, missedSinceLast, timerChecks } from "../frontend/src/farm/checks.ts";

const H = 3_600_000;
const now = new Date(2026, 9, 14, 12, 0).getTime();
const fresh = new Date(now - 5 * H).toISOString();
const old = new Date(now - 5 * 24 * H).toISOString();

const slot = (hour, enabled = true, days_mask = 127) => ({ hour, minute: 0, days_mask, enabled });
const reg = (slots, cloud) => ({ state: "1", attributes: { slots, cloud } });

// --- timer findings ---------------------------------------------------------
let t = timerChecks(
  reg({ 0: slot(6), 1: slot(18, false), 2: slot(3, true, 1), 3: null }, { checked_at: fresh, slots: { 0: "off", 1: "on", 2: "missing" } }),
  now
);
assert.deepEqual(t.timer, [
  "06:00 daily: off in SmartLife, on in the valve",
  "18:00 daily: on in SmartLife, off in the valve",
  "03:00 Mon: in the valve, not in SmartLife",
]);
assert.equal(t.allOff, true); // the calendar plans none of them

// agreement says nothing; an old overlay says nothing
assert.deepEqual(timerChecks(reg({ 0: slot(6) }, { checked_at: fresh, slots: { 0: "on" } }), now).timer, []);
assert.deepEqual(timerChecks(reg({ 0: slot(6, false) }, { checked_at: old, slots: { 0: "on" } }), now).timer, []);

// a collision shows even without a usable read
t = timerChecks(reg({ 0: slot(0) }, { checked_at: null, slots: {}, cloud_only: [], collision: ["00:00", "02:00"] }), now);
assert.deepEqual(t.timer, ["two SmartLife timers share one slot (00:00 + 02:00)"]);

// all off: slots held, none on; an app-only timer still waters; no slots = nothing to say
assert.equal(timerChecks(reg({ 0: slot(6, false) }, null), now).allOff, true);
assert.equal(timerChecks(reg({ 0: slot(6) }, { checked_at: fresh, slots: { 0: "off" } }), now).allOff, true);
assert.equal(timerChecks(reg({ 0: slot(6, false) }, { checked_at: fresh, slots: {}, cloud_only: [slot(7)] }), now).allOff, false);
assert.equal(timerChecks(reg({}, null), now).allOff, false);
assert.equal(timerChecks(undefined, now).allOff, false);

// --- stopped: planned runs since the last one -------------------------------
const plans = [now - 40 * H, now - 16 * H, now - 3 * H, now - H].map((start) => ({ start }));
assert.equal(missedSinceLast(plans, now - 42 * H, now), 3); // the run 1 h ago is not due yet
assert.equal(missedSinceLast(plans, now - 40 * H - 30 * 60_000, now), 2); // 40 h plan is within the 1 h grace
assert.equal(missedSinceLast(plans, null, now), 3);

// --- sections ---------------------------------------------------------------
const summary = (id, extra = {}) => ({
  device_id: id,
  name: id,
  number: null,
  view_path: `valve?id=${id}`,
  status: "idle",
  since: null,
  flow_lpm: null,
  battery: 100,
  has_flow_meter: true,
  last: { start: now - 30 * H, minutes: 5, liters: 0 },
  next: null,
  week: { runs: 0, liters: 0, minutes: 0, daily: [], unit: "L" },
  missed: 0,
  badges: [],
  location: null,
  site: null,
  home: null,
  room: null,
  ...extra,
});
const valves = ["a", "b", "c", "d"].map((id) => ({ device_id: id, registry_entity: `sensor.${id}_reg` }));
const data = { planned: [now - 20 * H, now - 10 * H].map((start) => ({ key: "sensor.a_reg", start, end: start + 300_000 })), runs: [], locations: [], sites: [] };
const states = {
  "sensor.a_reg": reg({ 0: slot(6, false) }, null),
  // offline: its timers are not judged
  "sensor.d_reg": reg({ 0: slot(6, false) }, null),
};
const sections = computeChecks(
  [
    summary("a", { battery: 39, missed: 1, badges: ["missed", "no_flow"] }),
    summary("b", { battery: 12, badges: ["stale", "low_battery"] }),
    summary("c"),
    summary("d", { status: "offline", since: now - 50 * H, battery: null }),
  ],
  valves,
  states,
  data,
  now
);
const by = Object.fromEntries(sections.map((s) => [s.kind, s.checks.map((c) => c.summary.device_id)]));
assert.deepEqual(by, { stopped: ["a", "b"], no_flow: ["a"], all_off: ["a"], battery: ["b", "a"], offline: ["d"] });
const stopped = sections.find((s) => s.kind === "stopped").checks;
assert.match(stopped[0].detail, /^last run .*, planned runs missed since$/);
assert.match(stopped[1].detail, /^no report for over 24 h although runs were due/);
assert.equal(sections.find((s) => s.kind === "offline").checks[0].detail, "offline for 2 d");
assert.deepEqual(computeChecks([summary("c")], valves, {}, data, now), []);

console.log("checks ok");
