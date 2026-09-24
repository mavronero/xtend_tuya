// Valve summary (status, last/next, week, badges) + filter/sections.
// Run: node --experimental-strip-types tests/test_valve_summary.mjs
import assert from "node:assert/strict";
import { summarize } from "../frontend/src/farm/valve-summary.ts";
import { applyFilter, sectionize, subtree, sitePath, NO_FILTER } from "../frontend/src/farm/valve-filter.ts";

const H = 3_600_000;
const now = new Date(2026, 8, 24, 12, 0).getTime(); // local noon
const iso = (ms) => new Date(ms).toISOString();

const valve = (id, name, extra = {}) => ({
  device_id: id,
  registry_entity: `sensor.${id}_irrigation_timer_registry`,
  valve_name: name,
  factory_name: name,
  valve_home: null,
  valve_room: null,
  view_path: `valve?id=${id}`,
  switch: `switch.${id}_valve`,
  battery_level: `sensor.${id}_battery`,
  volume_sensor: `sensor.${id}_volume`,
  flow_rate_sensor: `sensor.${id}_flow`,
  last_report: `sensor.${id}_last_report`,
  ...extra,
});
const st = (state, last_changed) => ({ state: String(state), attributes: {}, last_changed });
const run = (id, startMs, min, liters) => ({
  device_id: id,
  start: iso(startMs),
  end: iso(startMs + min * 60_000),
  duration_seconds: min * 60,
  liters,
});

const sites = [
  { id: "farm", name: "Big Farm", parent_id: null },
  { id: "east", name: "FF East", parent_id: "farm" },
  { id: "hm", name: "Honeymoon", parent_id: null },
];
const data = {
  runs: [
    run("a", now - 30 * H, 8, 96), // yesterday
    run("a", now - 6 * H, 8, 90), // today 06:00
    run("b", now - 5 * H, 10, 0), // ran, no water
    run("a", now - 9 * 24 * H, 8, 50), // outside the week
  ],
  planned: [
    { key: "sensor.a_irrigation_timer_registry", start: now - 6 * H, end: now - 6 * H + 8 * 60_000 }, // answered
    { key: "sensor.a_irrigation_timer_registry", start: now + 18 * H, end: now + 18 * H + 8 * 60_000 }, // next
    { key: "sensor.b_irrigation_timer_registry", start: now - 3 * H, end: now - 3 * H + 5 * 60_000 }, // missed
  ],
  sites,
  locationOf: {
    a: { id: "mp1", name: "FF East 07", site_id: "east" },
    b: { id: "mp2", name: "HM Olive", site_id: "hm" },
    c: { id: "mp3", name: "Old bed", site_id: "hm" },
  },
};
const states = {
  "sensor.a_irrigation_timer_registry": st("1"),
  "switch.a_valve": st("on", iso(now - 3 * 60_000)),
  "sensor.a_battery": st(95),
  "sensor.a_flow": st(12.5),
  "sensor.a_last_report": st(iso(now - H)),
  "sensor.b_irrigation_timer_registry": st("1"),
  "switch.b_valve": st("off"),
  "sensor.b_battery": st(15),
  "sensor.b_last_report": st(iso(now - 40 * H)),
  "sensor.c_irrigation_timer_registry": st("unavailable", iso(now - 48 * H)),
  "switch.c_valve": st("unavailable"),
  "sensor.c_battery": st(80),
  "sensor.d_irrigation_timer_registry": st("1"),
  "switch.d_valve": st("off"),
};

const a = summarize(valve("a", "FF East 07 (907)"), states, data, now);
assert.equal(a.number, "907");
assert.equal(a.status, "watering");
assert.equal(a.since, now - 3 * 60_000);
assert.equal(a.flow_lpm, 12.5);
assert.deepEqual(a.last, { start: now - 6 * H, minutes: 8, liters: 90 });
assert.equal(a.next.start, now + 18 * H);
assert.equal(a.next.minutes, 8);
assert.equal(a.week.runs, 2);
assert.equal(a.week.liters, 186);
assert.deepEqual(a.week.daily, [0, 0, 0, 0, 0, 96, 90]);
assert.equal(a.week.unit, "L");
assert.equal(a.missed, 0);
assert.deepEqual(a.badges, []);
assert.deepEqual(a.site, { id: "east", name: "FF East" });

const b = summarize(valve("b", "HM Olive (703)"), states, data, now);
assert.equal(b.status, "idle");
assert.equal(b.flow_lpm, null);
assert.equal(b.missed, 1);
assert.deepEqual(b.badges, ["low_battery", "stale", "missed", "no_flow"]);

const c = summarize(valve("c", "Old bed (801)"), states, data, now);
assert.equal(c.status, "offline");
assert.equal(c.since, now - 48 * H);
assert.equal(c.battery, null); // not reported while offline
assert.deepEqual(c.badges, []); // offline is its own section, not a badge

// A T3-like valve: no flow meter -> week in minutes, no no_flow badge.
const d = summarize(valve("d", "965", { volume_sensor: undefined }), states, data, now);
assert.equal(d.number, null);
assert.equal(d.week.unit, "min");
assert.equal(d.location, null);

// --- filter + sections ------------------------------------------------
assert.deepEqual([...subtree(sites, "farm")].sort(), ["east", "farm"]);
assert.equal(sitePath(sites, "east"), "Big Farm › FF East");

const all = [a, b, c, d];
const names = (list) => list.map((v) => v.number ?? v.name);
assert.deepEqual(names(applyFilter(all, { ...NO_FILTER, site: "farm" }, sites)), ["907"]);
assert.deepEqual(names(applyFilter(all, { ...NO_FILTER, status: "attention" }, sites)), ["703"]);
assert.deepEqual(names(applyFilter(all, { ...NO_FILTER, status: "offline" }, sites)), ["801"]);
assert.deepEqual(names(applyFilter(all, { ...NO_FILTER, search: "olive" }, sites)), ["703"]);

const sections = sectionize(all, sites);
assert.deepEqual(
  sections.map((s) => [s.key, s.count]),
  [["watering", 1], ["attention", 1], ["sites", 2], ["offline", 1], ["unassigned", 1]]
);
assert.deepEqual(
  sections[2].groups.map((g) => [g.title, names(g.valves)]),
  [["Big Farm › FF East", ["907"]], ["Honeymoon", ["703"]]]
);
assert.deepEqual(sectionize([c], sites).map((s) => s.key), ["offline"]); // empty sections dropped

console.log("ok");
