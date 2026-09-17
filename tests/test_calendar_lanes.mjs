// Lane packing + missed detection for the irrigation calendar card.
// Run: node --experimental-strip-types tests/test_calendar_lanes.mjs
import assert from "node:assert/strict";
import { packLanes, isMissed } from "../frontend/src/calendar-lanes.ts";

const M = 60_000;
const ev = (start, end, kind, name) => ({ start: start * M, end: end * M, kind, name });

// Overlapping trio takes 3 lanes; a later lone event gets its own cluster.
let placed = packLanes([
  ev(0, 10, "completed", "b"),
  ev(0, 10, "planned", "b"),
  ev(5, 15, "planned", "a"),
  ev(30, 40, "planned", "z"),
]);
assert.deepEqual(
  placed.map((p) => [p.ev.name, p.ev.kind, p.lane, p.lanes]),
  [
    ["b", "planned", 0, 3], // planned before completed at the same start
    ["b", "completed", 1, 3],
    ["a", "planned", 2, 3],
    ["z", "planned", 0, 1],
  ]
);

// Back-to-back events reuse the lane (end <= start).
placed = packLanes([ev(0, 10, "planned", "a"), ev(10, 20, "planned", "b")]);
assert.deepEqual(placed.map((p) => p.lane), [0, 0]);

// Missed: planned in the past with no run within 15 min.
const now = 100 * M;
const runs = [{ start: 12 * M, key: "v1" }];
assert.equal(isMissed({ start: 10 * M, end: 20 * M, key: "v1" }, runs, now), false);
assert.equal(isMissed({ start: 40 * M, end: 50 * M, key: "v1" }, runs, now), true);
assert.equal(isMissed({ start: 10 * M, end: 20 * M, key: "v2" }, runs, now), true);
assert.equal(isMissed({ start: 95 * M, end: 105 * M, key: "v2" }, runs, now), false); // still ahead

console.log("ok calendar lanes");
