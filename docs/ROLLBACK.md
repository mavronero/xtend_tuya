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
| 2026-09-25 | 4.4.271 | 4.4.270 | ok (SMOKE OK over Tailscale; backfill v2 "620 runs from 101 valves", store 3710 -> 4292 rows = dry run; 30 d runs 2144, liters 210,047; dup starts 0. Rollback: HACS 4.4.270; the added rows are real runs, keep them) |
| 2026-09-25 | 4.4.272 | 4.4.271 | ok (SMOKE OK; backfill v3 "1032 runs added or corrected"; vs Tuya cloud 3 d: 178 exact, 18 within 5 %, 1 off (was 98/22/37); 30 d unknown liters 632 -> 5, 207,227 L; 63 valves per_cycle. Rollback: HACS 4.4.271; the repaired liters stay and are the correct ones) |
| 2026-09-25 | 4.4.273 | 4.4.272 | ok (SMOKE OK; farm cards in farm time — 908 log shows 05:00/17:00 from a Berlin browser after a reload (HA service worker serves the old bundle until then). Frontend only; rollback: HACS 4.4.272) |
| 2026-09-28 | 4.4.275 | 4.4.273 (4.4.274 released, not deployed alone: timeline 0 L flag, frontend only) | ok (SMOKE OK over Tailscale; 755 timer run 09:00 switch on, 15 L, off at its counter_custom close. But 719 read "on" from a stale startup frame: hotfix 4.4.276) |
| 2026-09-28 | 4.4.276 | 4.4.275 (or 4.4.273 to drop the T3 switch entirely) | ok (SMOKE OK; 719 reads off, no T3 falsely on) |
| 2026-09-28 | 4.4.277 | 4.4.276 | ok (SMOKE OK; Uli tested 711: Watering shown, Stop works, 5 L logged; countdown froze -> 4.4.278) |
| 2026-09-28 | 4.4.278 | 4.4.277 | ok (SMOKE OK; Uli tested 711 after a browser reload: countdown ticks, stop works. Browsers keep the old card until the HA service worker lets go) |
| 2026-09-28 | 4.4.279 | 4.4.278 | ok (SMOKE OK; Uli: log row appears after stop without reload) |
| 2026-09-28 | 4.4.280 | 4.4.279 | ok (SMOKE OK; irrigation_locations 4.6-5.0 s -> 0.57 s, valve_locations 5.3-5.5 s -> 0.40 s, payloads byte-identical) |
| 2026-09-28 | 4.4.281 | 4.4.280 | ok (SMOKE OK on the second run; the first hit a 500 while devices were still loading) |
| 2026-09-28 | 4.4.284 (incl. 282, 283) | 4.4.281 | ok (SMOKE OK; tested first on dev in the browser: metering-point Timeline rows incl. a removed valve, delete refused with history / allowed for FG North Fence. Rollback: HACS 4.4.283/4.4.282/4.4.281; a deleted metering point stays deleted) |
| 2026-09-28 | 4.4.285 | 4.4.284 | ok (SMOKE OK; per-run cap 50 -> 250 L/min, backfill v4 filled 811's 4 blanked runs but also shifted 10 correct runs; all 18 changed runs then set to the valves' own counter_custom liters with core stopped (patch18). Backups: .storage/xtend_tuya.irrigation_runs.pre-4.4.285 and .pre-patch18. Rollback: HACS 4.4.284; the store keeps backfill_version 4, so the repair does not re-run) |
| 2026-09-28 | 4.4.286 | 4.4.285 | ok (SMOKE OK; weekend feedback batch, frontend + 2 small backend changes: late close liters fire run_recorded, 30-day flow mean skips 0 L runs. Restart via homeassistant.restart service (`ssh farm-ha ha core restart` said unauthorized). Rollback: HACS 4.4.285 + restart, no store changes) |
| 2026-09-29 | 4.4.287 | 4.4.286 | ok (SMOKE OK; valve log per metering point + header move, Timeline ?site=, Online chip, pump Flow chart via new /api/xtend_tuya/pump_flow: 24h 0.8 s, 7d 4.8 s, 30d 0.6 s cold on the Green, 60 s cache. Browser needed SW unregister to pick up the new bundle. Rollback: HACS 4.4.286 + restart, no store changes) |
| 2026-09-29 | 4.4.288 | 4.4.287 | ok (SMOKE OK; hot-added devices prepared like setup + Find new devices button/service/6 h check; prod service run: both hubs "find new devices: none", no errors. Rollback: HACS 4.4.287 + restart) |
| 2026-09-29 | 4.4.289 | 4.4.288 | ok (SMOKE OK; bootstrap heals a stale SW cache: 1-byte ranged GET vs loaded ?v=, purge + one reload per version; HEAD is 405 behind nabu.casa. Verified on dev with a simulated release. Rollback: HACS 4.4.288 + restart) |
| 2026-09-29 | 4.4.290 | 4.4.289 | ok (SMOKE OK; timer registry: live DP wins over restored slot (815 now Tue/Thu/Sat, was daily), schedule_changed_at attribute (3 of 162 stamped at boot), missed marks ignore plans before it; shared valve_locations request. Rollback: HACS 4.4.289 + restart; the attribute is harmless on 289) |
| 2026-09-29 | 4.4.291 | 4.4.290 | ok (SMOKE OK; searchable pickers, bare valve numbers, daily cloud /timers overlay (first sweep 15 min after load), Silent badge from last_valve_report (35 seeded; 706 485 h, 707 457 h, 712 68 h). No errors in core log. Rollback: HACS 4.4.290 + restart; new attributes are ignored by 290) |
| 2026-09-30 | 4.4.292 | 4.4.291 | ok (SMOKE OK; offline valves keep their metering point (Tuya id from device identifiers). Data repair via API + stopped-core store edit: 810 back on FG Verbs North Fence, 968 split to FG Verbs Fig Trees since 02.07 (backup .pre-backdate968). Rollback: HACS 4.4.291) |
| 2026-09-30 | 4.4.293 | 4.4.292 | ok (SMOKE OK; unplanned runs not counted as problems, live L/min in Water now. Frontend only. Rollback: HACS 4.4.292) |
| 2026-10-01 | 4.4.294 | 4.4.293 | ok (SMOKE OK over Tailscale, no canary; a run whose start the valve never reported is logged from the counter's first rise. 961's lost run of 01.10 11:30:25-11:43:15, 770 s / 112 L from counter_custom, added to the runs store with core stopped; backup .storage/xtend_tuya.irrigation_runs.pre-961-1001. Rollback: HACS 4.4.293 + restart; the added row is a real run, keep it) |

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
