"""Self-check for the resync empty-cloud-registry guard (audit C7).

Standalone (no Home Assistant import) — mirrors the orphan decision in
entity_parser/valves/timer_service.resync_from_cloud.

resync treated ANY successful cloud GET as authoritative. A
success-but-empty response (device offline, project moved, registry not yet
consistent) made every enabled HA slot look like a live orphan, so the resync
cleared every timer on the valve — one control write per slot, and not
recoverable from HA: the DP is overwritten.

Run: `python tests/test_resync_guard.py`
"""


def mask_to_loops(mask):
    return format(mask, "07b")


def key_of(slot):
    return (
        f"{int(slot['hour']):02d}:{int(slot['minute']):02d}",
        mask_to_loops(int(slot["days_mask"])),
    )


def resync(slots, cloud_keys):
    """Mirror of resync_from_cloud's decision; returns (result, cleared)."""
    if cloud_keys is None:
        return {"success": False, "error": "cloud_get_failed"}, []
    enabled = [i for i, s in slots.items() if s and s.get("enabled")]
    if not cloud_keys and enabled:
        return {"success": False, "error": "cloud_registry_empty"}, []
    cleared = [i for i in enabled if key_of(slots[i]) not in cloud_keys]
    return {"success": True, "orphans_cleared": len(cleared)}, cleared


def slot(hour, minute, mask=0x7F, enabled=True):
    return {"hour": hour, "minute": minute, "days_mask": mask, "enabled": enabled}


def demo():
    live = {0: slot(4, 20), 1: slot(6, 30), 2: None}

    # The incident shape: cloud says "no timers at all" on a valve that has
    # two enabled ones. Nothing may be cleared.
    result, cleared = resync(live, set())
    assert result["error"] == "cloud_registry_empty" and cleared == []

    # A transport/API failure is still a failure, as before.
    assert resync(live, None)[0]["error"] == "cloud_get_failed"

    # A genuine single orphan is still cleared: the cloud knows about 06:30
    # but not about the 04:20 slot that will water offline.
    result, cleared = resync(live, {key_of(live[1])})
    assert result["success"] and cleared == [0]

    # Cloud and HA agree: nothing to do.
    result, cleared = resync(live, {key_of(live[0]), key_of(live[1])})
    assert result["success"] and cleared == []

    # Empty cloud + no enabled slots is a legitimate "nothing to reconcile".
    disabled = {0: slot(4, 20, enabled=False)}
    result, cleared = resync(disabled, set())
    assert result["success"] and cleared == []
    print("ok")


if __name__ == "__main__":
    demo()
