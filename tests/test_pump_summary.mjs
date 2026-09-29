// Pump feeds (inheritance, overrides, dated) and the water balance.
// Run: node --experimental-strip-types tests/test_pump_summary.mjs
import assert from "node:assert/strict";
import { balance, flowLines, niceTicks, pumpFeeds, pumpOfMpAt, periodStart } from "../frontend/src/farm/pump-summary.ts";

const H = 3_600_000;
const now = new Date(2026, 8, 24, 12, 0).getTime();
const iso = (ms) => new Date(ms).toISOString();

const mp = (id, site_id, device) => ({
  id,
  name: id,
  site_id,
  valves: device ? [device] : [],
  assignments: device ? [{ device_id: device, begin: null, end: null }] : [],
  expected_lpm: null,
  description: "",
  pump: null,
});
const pump = (id) => ({ id, name: id, meter_entity: `sensor.${id}_m3`, flow_entity: null, pressure_entity: null, status_entity: null });
const run = (device, startMs, liters) => ({
  device_id: device,
  start: iso(startMs),
  end: iso(startMs + 10 * 60_000),
  duration_seconds: 600,
  liters,
});

const data = {
  runs: [
    run("v1", now - 3 * H, 100), // FF East 01, pump p1 (inherited from Big Farm)
    run("v2", now - 3 * H, 50), // FF East 07: overridden to p2
    run("v3", now - 30 * H, 80), // Honeymoon: p1 until 20 h ago, then p2
    run("v3", now - 2 * H, 40),
  ],
  planned: [],
  sites: [
    { id: "farm", name: "Big Farm", parent_id: null },
    { id: "east", name: "FF East", parent_id: "farm" },
    { id: "hm", name: "Honeymoon", parent_id: null },
  ],
  locations: [mp("mp1", "east", "v1"), mp("mp7", "east", "v2"), mp("mp3", "hm", "v3"), mp("mp9", null, null)],
  locationOf: {},
  pumps: [pump("p1"), pump("p2")],
  pumpAssignments: [
    { pump_id: "p1", target_kind: "site", target_id: "farm", begin: null, end: null },
    { pump_id: "p2", target_kind: "location", target_id: "mp7", begin: null, end: null },
    { pump_id: "p1", target_kind: "site", target_id: "hm", begin: null, end: now - 20 * H },
    { pump_id: "p2", target_kind: "site", target_id: "hm", begin: now - 20 * H, end: null },
  ],
  pumpConnections: [
    { pump_id: "p1", device_id: "tank", role: "consumer", meter_entity: "sensor.tank_m3", begin: now - 5 * H, end: null },
    { pump_id: "p1", device_id: "pressure", role: "monitor", meter_entity: null, begin: null, end: null },
  ],
};
const [mp1, mp7, mp3, mp9] = data.locations;

// Inheritance, override, dated reassignment, no pump.
assert.equal(pumpOfMpAt(data, mp1, now), "p1");
assert.equal(pumpOfMpAt(data, mp7, now), "p2");
assert.equal(pumpOfMpAt(data, mp3, now - 30 * H), "p1");
assert.equal(pumpOfMpAt(data, mp3, now), "p2");
assert.equal(pumpOfMpAt(data, mp9, now), null);

assert.deepEqual(pumpFeeds(data, "p1", now), { sites: ["farm"], mps: ["mp1"], overridden: [{ mp: "mp7", pump: "p2" }] });
assert.deepEqual(pumpFeeds(data, "p2", now), { sites: ["hm"], mps: ["mp7", "mp3"], overridden: [] });

// Balance of p1 over the last 36 h, hourly.
const hourRow = (hoursAgo, m3) => ({ start: periodStart(now - hoursAgo * H, "hour"), change: m3 });
const stats = {
  "sensor.p1_m3": [hourRow(3, 0.3), hourRow(30, 0.1), hourRow(1, 0.05)],
  "sensor.tank_m3": [hourRow(4, 0.02), hourRow(10, 0.5)], // 10 h ago: before the tank was connected
};
const b = balance(data, data.pumps[0], stats, now - 36 * H, now, "hour");
assert.ok(Math.abs(b.pump - 450) < 1e-9);
assert.equal(b.valves, 180); // v1 100 + v3's run 30 h ago (then on p1) 80; not v2, not v3's recent run
assert.ok(Math.abs(b.consumers - 20) < 1e-9);
assert.ok(Math.abs(b.unaccounted - 250) < 1e-9);
assert.equal(b.buckets.length, 36);
const at = (hoursAgo) => b.buckets.find((x) => x.start === periodStart(now - hoursAgo * H, "hour"));
assert.ok(Math.abs(at(3).pump - 300) < 1e-9);
assert.equal(at(3).valves, 100);
assert.equal(at(2).pump, null); // no meter row: unknown, not zero

// A negative change (meter reset, broken statistics) is skipped, not subtracted.
const reset = balance(data, data.pumps[0], { "sensor.p1_m3": [hourRow(3, 0.3), hourRow(2, -1900)] }, now - 36 * H, now, "hour");
assert.ok(Math.abs(reset.pump - 300) < 1e-9);

// Site filter: only FF East's valves count; the pump total stays whole.
const east = balance(data, data.pumps[0], stats, now - 36 * H, now, "hour", (m) => m.site_id === "east");
assert.equal(east.valves, 100); // v1 only; v3 (Honeymoon) is left out
assert.ok(Math.abs(east.pump - 450) < 1e-9);

// No meter data at all: no pump total, no unaccounted.
const empty = balance(data, data.pumps[1], {}, now - 24 * H, now, "day");
assert.equal(empty.pump, null);
assert.equal(empty.unaccounted, null);
assert.equal(empty.valves, 90); // v2 50 + v3 40

// Chart y-axis ticks (m³).
assert.deepEqual(niceTicks(1.1), [0, 0.5, 1, 1.5]);
assert.deepEqual(niceTicks(1), [0, 0.5, 1]);
assert.deepEqual(niceTicks(9.6), [0, 5, 10]);
assert.deepEqual(niceTicks(0.1), [0, 0.05, 0.1]);

// Flow line: raw states hold until the next change; unavailable breaks it.
const raw = flowLines(
  [
    { start: 0, mean: 0, max: null },
    { start: 10, mean: 40, max: null },
    { start: 20, mean: null, max: null },
    { start: 30, mean: 35, max: null },
  ],
  true,
  50
);
assert.deepEqual(raw.mean, [
  [[0, 0], [10, 0], [10, 40], [20, 40]],
  [[30, 35], [50, 35]],
]);
assert.deepEqual(raw.max, []);
assert.equal(raw.peak, 40);
// Statistics: point to point, max as its own line.
const agg = flowLines([{ start: 0, mean: 10, max: 30 }, { start: 5, mean: 12, max: 45 }], false, 10);
assert.deepEqual(agg.mean, [[[0, 10], [5, 12]]]);
assert.deepEqual(agg.max, [[[0, 30], [5, 45]]]);
assert.equal(agg.peak, 45);
assert.equal(flowLines([], true, 10).peak, 0);

console.log("ok");
