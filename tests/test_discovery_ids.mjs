// Offline valves keep their Tuya id (metering point link) via the device registry.
// Run: node --experimental-strip-types tests/test_discovery_ids.mjs
import assert from "node:assert/strict";
import { tuyaIdOf } from "../frontend/src/farm/discovery.ts";

const dev = { id: "ha1", name: "810", name_by_user: null, identifiers: [["tuya", "bfTUYA"], ["xtend_tuya", "bfXT"]] };
assert.equal(tuyaIdOf("bfATTR", dev, "ha1"), "bfATTR"); // online: attribute
assert.equal(tuyaIdOf(undefined, dev, "ha1"), "bfXT"); // offline: identifier
assert.equal(tuyaIdOf(undefined, { ...dev, identifiers: [["tuya", "bfTUYA"]] }, "ha1"), "bfTUYA");
assert.equal(tuyaIdOf(undefined, undefined, "ha1"), "ha1"); // nothing known
console.log("ok discovery ids");
