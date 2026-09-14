"""Guard: the fork must not re-override the sharing MQ reconnect (audit C1).

Standalone (no Home Assistant import). Source-level check on
multi_manager/managers/tuya_sharing/xt_tuya_sharing_mq.py.

The fork used to override SharingMQ._start (dropping the SDK's
reconnect_on_failure=False) and _on_disconnect (calling manager.refresh_mq()
synchronously from the paho network thread). Three reconnectors then raced:
paho's auto-reconnect re-authenticating with a now-stale fixed client_id, the
SDK's run() loop with its 1->60 s backoff, and the fork's un-throttled
refresh. Tuya evicts duplicate client_ids, which produces another disconnect
— a self-feeding loop costing one POST /v1.0/m/life/ha/access/config a turn,
with reports stopping while `online` stays true.

This is the kind of override an upstream merge reintroduces, hence the guard.

Run: `python tests/test_sharing_mq_overrides.py`
"""

import pathlib
import re

SRC = (
    pathlib.Path(__file__).resolve().parents[1]
    / "custom_components" / "xtend_tuya" / "multi_manager" / "managers"
    / "tuya_sharing" / "xt_tuya_sharing_mq.py"
)


def defined_methods(source: str) -> set[str]:
    return set(re.findall(r"^    def (\w+)\(", source, re.MULTILINE))


def demo():
    methods = defined_methods(SRC.read_text())
    for banned in ("_start", "_on_disconnect"):
        assert banned not in methods, (
            f"{banned} is the SDK's reconnect design; overriding it revives C1"
        )
    # The overrides the fork genuinely needs: both-topic subscription, its own
    # message routing, and the XTMQConfig that keeps the raw response.
    for kept in ("_on_connect", "_on_message", "subscribe_to_mqtt_topics",
                 "subscribe_device", "un_subscribe_device", "_get_mqtt_config"):
        assert kept in methods, f"{kept} disappeared from the fork's MQ"
    print("ok")


if __name__ == "__main__":
    demo()
