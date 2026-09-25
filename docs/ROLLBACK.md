# Prod rollback and deploy discipline (mavronero/xtend_tuya)

Rule since 2026-09-16: **symptoms after an update → roll back first, debug second.**
Rollback is 5 minutes. Debugging while manual watering is dead cost 3 hours.

## Last known good
Whoever deploys writes the previous version here before updating.

| date | deployed | previous (rollback target) | smoke |
|---|---|---|---|
| 2026-09-16 | 4.4.255 | 4.4.250 (251–254 collapse the device map) | ok, canary 824 watered |
| 2026-09-16 | 4.4.257 | 4.4.255 (256 never deployed: its unload bug) | backend ok; Locations card "Configuration error" (bootstrap map) |
| 2026-09-16 | 4.4.258 | 4.4.255 | ok; browsers with a stale SW index still show the error card until refreshed |
| 2026-09-16 | 4.4.259 | – | released, NOT deployed (bootstrap live-index discovery) |
| 2026-09-16 | 4.4.260 | 4.4.258 | ok; log "simon…: left 216 tuya_sharing device(s), 108 tuya_iot device(s) to the entries that own them" |
| 2026-09-17 | 4.4.261 | 4.4.260 | ok (deployed via the Chrome extension; diagnostics check too heavy for that link, other signals green) |
| 2026-09-17 | 4.4.263 | 4.4.261 | ok (SMOKE OK via chrome-devtools; 4.4.262 was released but never deployed) |
| 2026-09-17 | 4.4.264 | 4.4.263 | ok (SMOKE OK; first smoke run died on a dropped diagnostics fetch over nabu.casa, re-run with retries passed) |
| 2026-09-17 | 4.4.265 | 4.4.264 | ok (device maps full; the smoke's entity check fired before valves were back, live recheck 81/112 available) |
| 2026-09-24 | 4.4.266 | 4.4.265 | ok (SMOKE OK; layered architecture, no behaviour change. Snapshot diff vs baseline: only live changes — FG Nursery 811 back after the restart, 3 dead Tuya devices cleaned by the existing registry cleanup, offline/online flips; valve_home 77/112 = all available. Box rebooted and the nabu.casa link needed a remote-connection toggle) |
| 2026-09-24 | 4.4.267 | 4.4.266 | ok (SMOKE OK 16:2x; snapshot vs 4.4.266: 0 events lost, +13 completed runs and +7 planned slots of offline valves. Afterwards prod unreachable from 16:31: the new automation 'Refresh Nabu Casa remote after restart' (cloud.remote_disconnect + remote_connect 10 min after start) left the tunnel down; Simon toggles Remote tonight and disables it; delete it) |
| 2026-09-25 | 4.4.268 | 4.4.267 | ok (SMOKE OK over Tailscale; served strategy bundle md5 == tag; runs 30 d = 206,256 L, the matrix WATER total now; snapshot vs 4.4.267: only live changes — 962 and 923 offline after the restart lost their planned slots; nabu.casa came back by itself) |
| 2026-09-25 | 4.4.269 | 4.4.268 | ok (UI rework. SMOKE OK over Tailscale; store xtend_tuya.irrigation_locations migrated v1->v2, 76 locations, 10 sites seeded; new dashboard-valves config (1.8 KB) saved. ROLLBACK needs three things: HACS 4.4.268, `sudo cp .storage/xtend_tuya.irrigation_locations.pre-4.4.269 .storage/xtend_tuya.irrigation_locations` via `ssh farm-ha` before the restart, and the old dashboard config (scratchpad prod_backup_pre_4.4.269/dashboard-valves.json, 425 KB) via lovelace/config/save) |
| 2026-09-25 | 4.4.270 | 4.4.269 | ok (SMOKE OK over Tailscale; runs_store merged 197 duplicate rows at load, 3907 -> 3710; duplicate starts 0; runs 30 d = 205,505 L. Rollback leaves the merged store as is: the removed rows were copies) |

## Rollback (HACS, ~5 min)
1. HA → HACS → Xtend Tuya → ⋮ → **Redownload** → pick the rollback version → Download.
   From a console instead: `hass.callWS({type:'hacs/repository/download', repository:'1206944093', version:'v4.4.250'})`.
2. Settings → System → **Restart Home Assistant** (a real restart; a "quick reload" does not re-import).
3. Wait for both hubs to load (~2 min), then run the smoke check (below). Version on the
   integration page must show the rollback version — if not, it was a soft restart, restart again.
4. Tell Simon. Then debug on the branch, not on prod.

## Deploy checklist
- Before tagging: `.venv-test/bin/pytest` (real-HA harness, `tests/ha/README.md`) and the
  standalone checks `for t in tests/test_*.py; do python3 $t; done`. All green or no release.
- One change per release. 4.4.251 was 45 files from four audit streams; nobody could bisect it.
- Deploy only when you can watch the next 15 minutes. Not last thing in the evening, not right
  before Simon's 06:00 round.
- After restart: `HA_TOKEN=… python3 scripts/prod_smoke.py --expect <version> [--water]`
  (or paste `scripts/prod_smoke.js` into the prod tab's console). Must print `SMOKE OK`.
- Card bundle changes additionally need "Re-sync valves" on the dashboard, done from a tab that
  loaded AFTER the restart.
  The reload that Re-sync triggers can itself pull a stale app-shell index (seen 2026-09-17 on
  4.4.263: every card "Configuration error", zero irrigation scripts in the page). Cure in that tab:
  `(await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister())`, then a hard
  reload. Tell Simon to force-refresh once if his cards show the error after an update. HA's service worker serves the app-shell index network-first with a
  timeout; over nabu.casa it often falls back to the cached index, which still references the old
  bundle stamps. Symptom: "Configuration error" card. Cure for a browser: unregister the SW
  (DevTools → Application) or wait for a refresh; 4.4.259's bootstrap self-discovers new bundles
  from the live index so this only affects the bootstrap itself from now on.
- Update the table above.

## What the smoke check guards against (all real incidents)
- entry never reaches `loaded` (4.4.249 proxy cancel, 4.4.251 NamedTuple crash)
- version on disk ≠ loaded (HACS desync / soft restart)
- device map DP-collapsed: QT-08W < 20 functions, T3 without `time_task_0`/`cyc_control_0`
  (4.4.251–254 cross-hub mirror, the Aug 2026 relapses)
- valves all unavailable (token / MQ outage)
- `--water`: a real 10 s run on OF Verbs (824), switch must go on then off
