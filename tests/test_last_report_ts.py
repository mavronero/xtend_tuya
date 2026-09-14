"""Self-check for device report-recency stamping (audit C23).

Standalone (no Home Assistant import). Mirrors the gate in
XTIOTDeviceManager._update_device / XTSharingDeviceManager.__update_device,
and asserts the source invariants the attribute depends on: it is set on
every XTDevice, it is not excluded from the cross-map mirror, and
XTDevice.__deepcopy__ carries it (it lives in __dict__).

Entity availability is otherwise a pure function of the cloud `online` flag
(1:1 over 7226 prod entity rows), so a valve that stops reporting keeps
serving frozen values and still reads healthy — the mechanism behind "HA
disagrees with the SmartLife app".

Run: `python tests/test_last_report_ts.py`
"""

import pathlib
import re

SRC = pathlib.Path(__file__).resolve().parents[1] / "custom_components" / "xtend_tuya"


def stamp(device, updated_status_properties, now):
    """Mirror of the _update_device / __update_device gate."""
    if updated_status_properties:
        device["last_report_ts"] = now
    return device


def demo():
    # An MQ report that changed something stamps the device.
    d = {"last_report_ts": 0.0}
    stamp(d, ["cur_cap"], 1000.0)
    assert d["last_report_ts"] == 1000.0
    # An online/offline notice or an empty report does not.
    stamp(d, None, 2000.0)
    stamp(d, [], 3000.0)
    assert d["last_report_ts"] == 1000.0

    shared_classes = (SRC / "multi_manager" / "shared" / "shared_classes.py").read_text()
    # Present on every XTDevice, defaulting to "never seen".
    assert re.search(r"self\.last_report_ts:\s*float\s*=\s*0\.0", shared_classes)
    # Must mirror across the source maps so the master object carries it.
    excluded = shared_classes.split("FIELDS_TO_EXCLUDE_FROM_SYNC", 1)[1].split("]", 1)[0]
    assert "last_report_ts" not in excluded
    # __deepcopy__ copies everything in __dict__ but these two links.
    assert 'if key in ("device_map", "original_device")' in shared_classes

    # Both report paths stamp it.
    iot = (SRC / "multi_manager" / "managers" / "tuya_iot" / "xt_tuya_iot_manager.py").read_text()
    sharing = (SRC / "multi_manager" / "managers" / "tuya_sharing" / "xt_tuya_sharing_manager.py").read_text()
    for src in (iot, sharing):
        assert "device.last_report_ts = time.time()" in src
    # And the device-list fetch seeds it at load.
    mm = (SRC / "multi_manager" / "multi_manager.py").read_text()
    assert "device.last_report_ts = fetch_ts" in mm
    print("ok")


if __name__ == "__main__":
    demo()
