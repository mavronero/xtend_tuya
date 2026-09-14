"""Self-check for the swap-on-success IOT device-map refresh (audit C2).

Standalone (no Home Assistant import) — mirrors
XTIOTHomeManager.fetch_is_usable / async_update_device_cache in
multi_manager/managers/tuya_iot/xt_tuya_iot_home_manager.py.

The map used to be cleared BEFORE the fetch and a failed fetch was swallowed
upstream, so one denied device-list call (1106, expired token, hung socket)
left the whole fleet on the 2-DP sharing descriptors until someone reloaded
the entry. That is the Aug 2026 "DP collapse" incident series. Now the fetch
fills a fresh map and the live map is only replaced when the result is
usable; otherwise the old map stays and the load fails (and retries in 120 s).

Run: `python tests/test_device_map_swap.py`
"""

MIN_KEPT_FRACTION = 0.5


def fetch_is_usable(previous_count, fetched_count):
    """Mirror of XTIOTHomeManager.fetch_is_usable."""
    if fetched_count == 0:
        return False
    return fetched_count >= previous_count * MIN_KEPT_FRACTION


class ConfigEntryNotReady(Exception):
    pass


def update_cache(live: dict, fetch) -> dict:
    """Mirror of the swap in XTIOTHomeManager.async_update_device_cache."""
    fresh: dict = {}
    try:
        fetch(fresh)
    finally:
        pass  # the real code restores manager.device_map here
    if not fetch_is_usable(len(live), len(fresh)):
        raise ConfigEntryNotReady(f"{len(fresh)} devices (had {len(live)})")
    live.clear()
    live.update(fresh)
    return live


def demo():
    # first load: nothing to compare against, any non-empty list is usable
    assert fetch_is_usable(0, 108)
    # a load that returns nothing is never usable, even on a cold start
    assert not fetch_is_usable(0, 0)
    # steady state
    assert fetch_is_usable(108, 108)
    # a handful of devices genuinely removed in SmartLife: still usable
    assert fetch_is_usable(108, 100)
    # exactly at the threshold is still accepted
    assert fetch_is_usable(108, 54)
    # a lost paging page (C17 belt-and-braces) is not
    assert not fetch_is_usable(256, 100)

    # the live map survives a failed fetch
    live = {f"d{i}": i for i in range(108)}
    try:
        update_cache(live, lambda fresh: None)  # cloud returned nothing
    except ConfigEntryNotReady:
        pass
    else:
        raise AssertionError("an empty fetch must fail the load")
    assert len(live) == 108, "previous device map must be kept on failure"

    # a good fetch swaps in place (same object: the master map holds a ref)
    same = live
    update_cache(live, lambda fresh: fresh.update({f"d{i}": i for i in range(110)}))
    assert len(live) == 110 and live is same
    print("ok")


if __name__ == "__main__":
    demo()
