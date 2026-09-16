#!/usr/bin/env python3
"""Post-deploy smoke check for the xtend_tuya fork on prod HA.

Run after EVERY HACS update + restart, before telling anyone it is done:

    HA_TOKEN=... python3 scripts/prod_smoke.py --expect 4.4.255
    HA_TOKEN=... python3 scripts/prod_smoke.py --expect 4.4.255 --water   # + 10 s canary run

Token: HA long-lived access token (profile → security), env HA_TOKEN, or
macOS keychain item `ha-prod-token` (security add-generic-password -s ha-prod-token -a ha -w <token>).

Checks, in order (exit 1 on the first failure):
  1. core answers, both xtend_tuya entries reach `loaded` (waits up to 5 min)
  2. integration_manifest.version == --expect
  3. per hub, from config-entry diagnostics (= the live multi_manager map):
       QT-08W ("Valve Controller"): >= 20 functions each
       QT-08W-T3: time_task_0 + cyc_control_0 in status or function
     (2026-09-16: 2 functions / none = DP collapse, services write into the void)
  4. valve registry sensors: available count printed, fails if 0
  5. --water: 10 s single watering on the canary, expects switch on then off

Stdlib only. ponytail: sequential, no retries beyond the load wait.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

PROD = "https://b87j9r3hebly1blehckrgzzipxkzifyd.ui.nabu.casa"
CANARY_SWITCH = "switch.s_824_olive_filed_herbs_valve"  # OF Verbs (824), QT-08W
CANARY_REGISTRY = "sensor.s_824_olive_filed_herbs_irrigation_timer_registry"
MIN_QT08W_FUNCTIONS = 20
T3_CODES = ("time_task_0", "cyc_control_0")


def token() -> str:
    if t := os.environ.get("HA_TOKEN"):
        return t
    try:
        return subprocess.check_output(
            ["security", "find-generic-password", "-s", "ha-prod-token", "-w"], text=True
        ).strip()
    except Exception:
        sys.exit("no HA_TOKEN and no keychain item ha-prod-token")


class HA:
    def __init__(self, url: str, tok: str) -> None:
        self.url, self.tok = url.rstrip("/"), tok

    def call(self, method: str, path: str, body: dict | None = None):
        req = urllib.request.Request(
            f"{self.url}{path}",
            method=method,
            data=json.dumps(body).encode() if body is not None else None,
            headers={"Authorization": f"Bearer {self.tok}", "Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
            return json.loads(raw) if raw else None

    def get(self, path: str):
        return self.call("GET", path)

    def state(self, entity_id: str) -> dict | None:
        try:
            return self.get(f"/api/states/{entity_id}")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            raise


def ok(msg: str) -> None:
    print(f"  ok   {msg}")


def fail(msg: str) -> None:
    print(f"  FAIL {msg}")
    sys.exit(1)


def wait_loaded(ha: HA, timeout: int = 300) -> list[dict]:
    t0 = time.time()
    while True:
        try:
            entries = [e for e in ha.get("/api/config/config_entries/entry") if e["domain"] == "xtend_tuya"]
        except (urllib.error.URLError, OSError) as e:
            entries, err = [], e
        else:
            err = None
        if entries and all(e["state"] == "loaded" for e in entries):
            return entries
        if time.time() - t0 > timeout:
            fail(f"entries not loaded after {timeout}s: " + (str(err) if err else ", ".join(f"{e['title']}={e['state']}" for e in entries)))
        print(f"  ...  waiting: " + (str(err) if err else ", ".join(f"{e['title'].split('@')[0]}={e['state']}" for e in entries)))
        time.sleep(10)


def check_hub(ha: HA, entry: dict) -> None:
    diag = ha.get(f"/api/diagnostics/config_entry/{entry['entry_id']}")
    devices = diag.get("data", {}).get("devices", [])
    title = entry["title"].split("@")[0]
    thin, t3_bad, qt, t3 = [], [], 0, 0
    for d in devices:
        product = d.get("product_name") or ""
        fn = set((d.get("function") or {}).keys())
        st = set((d.get("status") or {}).keys())
        if product == "Valve Controller":
            qt += 1
            if len(fn) < MIN_QT08W_FUNCTIONS:
                thin.append(f"{d.get('name')}({len(fn)})")
        elif product == "QT-08W-T3":
            t3 += 1
            if not all(c in fn or c in st for c in T3_CODES):
                t3_bad.append(str(d.get("name")))
    if thin:
        fail(f"{title}: {len(thin)}/{qt} QT-08W with < {MIN_QT08W_FUNCTIONS} functions (DP collapse): {', '.join(thin[:8])}")
    if t3_bad:
        fail(f"{title}: {len(t3_bad)}/{t3} T3 missing {T3_CODES}: {', '.join(t3_bad[:8])}")
    ok(f"{title}: {len(devices)} devices, {qt} QT-08W full, {t3} T3 with {'+'.join(T3_CODES)}")
    return diag


def canary(ha: HA) -> None:
    reg = ha.state(CANARY_REGISTRY)
    if not reg or reg["state"] in ("unavailable", "unknown"):
        fail(f"canary {CANARY_REGISTRY} not available, pick another with --canary")
    device_id = reg["attributes"]["device_id"]
    before = ha.state(CANARY_SWITCH)["state"]
    if before == "on":
        fail("canary valve already on, not touching it")
    ha.call("POST", "/api/services/xtend_tuya/fdm5kw_start_watering", {"device_id": device_id, "mode": "duration", "value": 10})
    print("  ...  watering 10 s, waiting for the device report (lags ~30-60 s)")
    t0, seen_on = time.time(), False
    while time.time() - t0 < 180:
        s = ha.state(CANARY_SWITCH)["state"]
        if s == "on":
            seen_on = True
        if seen_on and s == "off":
            vol = (ha.state(CANARY_SWITCH.replace("_valve", "_watering_volume")) or {}).get("state")
            ok(f"canary {CANARY_SWITCH}: on -> off after {int(time.time() - t0)} s, volume now {vol}")
            return
        time.sleep(5)
    fail(f"canary {CANARY_SWITCH}: " + ("never closed" if seen_on else "never reported on") + " within 180 s")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=PROD)
    ap.add_argument("--expect", help="integration version expected after the deploy")
    ap.add_argument("--water", action="store_true", help="10 s single watering on the canary valve (burns a control unit)")
    ap.add_argument("--canary", help="override canary switch entity_id")
    a = ap.parse_args()
    if a.canary:
        global CANARY_SWITCH, CANARY_REGISTRY
        CANARY_SWITCH = a.canary
        CANARY_REGISTRY = a.canary.replace("switch.", "sensor.").replace("_valve", "_irrigation_timer_registry")
    ha = HA(a.url, token())

    print("1 entries")
    entries = wait_loaded(ha)
    ok(", ".join(f"{e['title'].split('@')[0]}=loaded" for e in entries))

    print("2 version")
    diag0 = ha.get(f"/api/diagnostics/config_entry/{entries[0]['entry_id']}")
    version = (diag0.get("integration_manifest") or {}).get("version")
    if a.expect and version != a.expect:
        fail(f"loaded version {version}, expected {a.expect} (HACS desync or soft restart, see deploy_hacs_not_shell)")
    ok(f"xtend_tuya {version}, HA {diag0.get('home_assistant', {}).get('version')}")

    print("3 device maps")
    for e in entries:
        check_hub(ha, e)

    print("4 valve entities")
    states = ha.get("/api/states")
    regs = [s for s in states if s["entity_id"].endswith("_irrigation_timer_registry")]
    avail = [s for s in regs if s["state"] not in ("unavailable", "unknown")]
    if not avail:
        fail(f"0 of {len(regs)} valve registries available")
    ok(f"{len(avail)} of {len(regs)} valve registries available")

    if a.water:
        print("5 canary watering")
        canary(ha)
    else:
        print("5 canary watering skipped (--water)")
    print("SMOKE OK")


if __name__ == "__main__":
    main()
