# HA-harness tests

Loads the real integration inside a real Home Assistant (same version as prod,
pinned by `pytest-homeassistant-custom-component`) with the two hubs' device
lists captured from prod diagnostics on 2026-09-16 (`tests/fixtures/*.json.gz`,
secrets stripped). The Tuya clouds are replaced by `FakeAccount` objects that
serve those devices; everything from `MultiManager` down to entity creation is
the real code.

```
python3.14 -m venv .venv-test
.venv-test/bin/pip install pytest-homeassistant-custom-component \
    tuya-device-handlers==0.0.27 tuya-device-sharing-sdk==0.2.15 \
    tuya-iot-py-sdk==0.6.6 yappi==1.7.3 "icalendar>=5.0.0"
.venv-test/bin/pytest
```

Refresh a fixture: in the prod HA tab, fetch `/api/diagnostics/config_entry/<id>`,
keep `data.devices`, drop `local_key`/`ip`/`uuid`/`home_assistant`/`multi_manager`,
gzip as JSON list.
