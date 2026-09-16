// Browser-console twin of scripts/prod_smoke.py (steps 1-4, no token needed).
// Open the prod HA tab, paste into the console (or run via chrome-devtools
// evaluate_script). Prints one line per check, throws on the first failure.
// Kept in sync with prod_smoke.py by hand — same thresholds, same meaning.
(async () => {
  const hass = document.querySelector('home-assistant').hass;
  const tok = hass.auth.data.access_token;
  const MIN_FN = 20, T3 = ['time_task_0', 'cyc_control_0'];
  const out = [];
  const ok = (m) => out.push('  ok   ' + m);
  const fail = (m) => { out.push('  FAIL ' + m); throw new Error(out.join('\n')); };

  out.push('1 entries');
  let entries;
  for (let i = 0; i < 30; i++) {
    entries = await hass.callWS({ type: 'config_entries/get', domain: 'xtend_tuya' });
    if (entries.length && entries.every((e) => e.state === 'loaded')) break;
    await new Promise((r) => setTimeout(r, 10000));
  }
  if (!entries.every((e) => e.state === 'loaded')) fail('entries not loaded: ' + entries.map((e) => e.title + '=' + e.state).join(', '));
  // "loaded" is set before the background device load (4.4.249); wait for devices.
  for (let i = 0; i < 24; i++) {
    const rs = await Promise.all(entries.map((e) => fetch('/api/diagnostics/config_entry/' + e.entry_id, { headers: { Authorization: 'Bearer ' + tok } }).then((r) => r.json())));
    if (rs.every((j) => (j.data.devices || []).length > 0)) break;
    await new Promise((r) => setTimeout(r, 10000));
  }
  ok(entries.map((e) => e.title.split('@')[0] + '=loaded').join(', '));

  out.push('2 version');
  const manifest = await hass.callWS({ type: 'manifest/get', integration: 'xtend_tuya' });
  ok('xtend_tuya ' + manifest.version + ', HA ' + hass.config.version);

  out.push('3 device maps');
  for (const en of entries) {
    const r = await fetch('/api/diagnostics/config_entry/' + en.entry_id, { headers: { Authorization: 'Bearer ' + tok } });
    if (!r.ok) fail(en.title + ': diagnostics http ' + r.status);
    const devices = (await r.json()).data.devices || [];
    const thin = [], t3bad = []; let qt = 0, t3 = 0;
    for (const d of devices) {
      const fn = Object.keys(d.function || {}), st = Object.keys(d.status || {});
      if (d.product_name === 'Valve Controller') { qt++; if (fn.length < MIN_FN) thin.push(d.name + '(' + fn.length + ')'); }
      else if (d.product_name === 'QT-08W-T3') { t3++; if (!T3.every((c) => fn.includes(c) || st.includes(c))) t3bad.push(d.name); }
    }
    const title = en.title.split('@')[0];
    if (thin.length) fail(title + ': ' + thin.length + '/' + qt + ' QT-08W with < ' + MIN_FN + ' functions (DP collapse): ' + thin.slice(0, 8).join(', '));
    if (t3bad.length) fail(title + ': ' + t3bad.length + '/' + t3 + ' T3 missing ' + T3.join('+') + ': ' + t3bad.slice(0, 8).join(', '));
    ok(title + ': ' + devices.length + ' devices, ' + qt + ' QT-08W full, ' + t3 + ' T3 with ' + T3.join('+'));
  }

  out.push('4 valve entities');
  const regs = Object.values(hass.entities).filter((e) => e.platform === 'xtend_tuya' && e.entity_id.endsWith('_irrigation_timer_registry'));
  const avail = regs.filter((e) => !['unavailable', 'unknown', undefined].includes(hass.states[e.entity_id]?.state));
  if (!avail.length) fail('0 of ' + regs.length + ' valve registries available');
  ok(avail.length + ' of ' + regs.length + ' valve registries available');

  const log = await hass.callWS({ type: 'system_log/list' });
  const traces = log.filter((l) => /DP-collapse/.test((l.message || []).join('')));
  if (traces.length) fail('DP-collapse traces in the log: ' + traces.map((l) => l.count + 'x ' + (l.message || [])[0].slice(0, 100)).join(' | '));
  ok('no DP-collapse traces in the recent log');
  out.push('5 canary watering: use prod_smoke.py --water, or start 10 s on OF Verbs (824) from its card and watch the switch');
  out.push('SMOKE OK');
  return out.join('\n');
})();
