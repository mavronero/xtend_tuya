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
