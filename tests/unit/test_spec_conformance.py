"""Every DP code the valve codecs read or write exists in the product's real Tuya spec.

The specs come from the prod fixtures (OpenAPI `status_range` / `function`).
Catches typos in DP codes (the T3 itself spells DP 113 `sta_3`) and writes to a
DP the product does not accept, before anything reaches a device. In step 6
this table becomes the profiles' DpMap.
"""

from __future__ import annotations

import gzip
import json
from pathlib import Path

import pytest

from custom_components.xtend_tuya.entity_parser.fdm5kw.codecs import (
    counter_custom,
    run_times,
    single_run,
    t3_status,
)
from custom_components.xtend_tuya.entity_parser.fdm5kw.codecs import time_task as tt

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures"

USES = {
    "o6dagifntoafakst": {  # QT-08W
        "read": {tt.QT08W_CODE, single_run.ONE_CONTROL_CODE, run_times.START_CODE, run_times.CLOSE_CODE, "cur_cap", "run_task_sta"},
        "write": {tt.QT08W_CODE, single_run.ONE_CONTROL_CODE, "switch"},
    },
    "rjnqkjk1pct15ku2": {  # QT-08W-T3
        "read": {tt.T3_CODE, t3_status.SAT_CODE, t3_status.FLOW_STA_CODE, counter_custom.CODE},
        "write": {tt.T3_CODE, single_run.CYC_CONTROL_CODE},
    },
}


def _specs() -> dict[str, dict]:
    specs: dict[str, dict] = {}
    for name in ("solar", "simon"):
        data = json.load(gzip.open(FIXTURES / f"{name}_devices.json.gz"))
        devices = data if isinstance(data, list) else data.get("devices", data)
        for device in devices.values() if isinstance(devices, dict) else devices:
            if device.get("product_id") in USES:
                specs.setdefault(device["product_id"], device)
    return specs


@pytest.mark.parametrize("product_id", sorted(USES))
def test_codec_dp_codes_exist_in_the_product_spec(product_id):
    device = _specs()[product_id]
    readable = set(device["status_range"])
    writable = {code for code, spec in device["function"].items() if spec.get("accessMode", "rw") != "ro"}
    assert USES[product_id]["read"] <= readable, USES[product_id]["read"] - readable
    assert USES[product_id]["write"] <= writable, USES[product_id]["write"] - writable


def _all_valves():
    for name in ("solar", "simon"):
        data = json.load(gzip.open(FIXTURES / f"{name}_devices.json.gz"))
        devices = data if isinstance(data, list) else data.get("devices", data)
        yield from (d for d in (devices.values() if isinstance(devices, dict) else devices) if d.get("product_id") in USES)


def test_every_real_status_value_decodes():
    """The live DP values of every prod valve go through the codecs cleanly."""
    import base64

    decoders = {
        tt.QT08W_CODE: tt.decode_qt08w,
        tt.T3_CODE: tt.decode_t3,
        single_run.ONE_CONTROL_CODE: single_run.decode_one_control,
        t3_status.SAT_CODE: t3_status.battery_percent,
        t3_status.FLOW_STA_CODE: t3_status.flow_volume_liters,
    }
    checked = 0
    for device in _all_valves():
        for code, decode in decoders.items():
            raw = device["status"].get(code) if isinstance(device["status"], dict) else None
            if raw:
                assert decode(base64.b64decode(raw)) is not None, (device["name"], code, raw)
                checked += 1
    assert checked >= 200, checked
