from __future__ import annotations
from homeassistant.exceptions import ConfigEntryNotReady
from ....lib.tuya_iot import (
    TuyaHomeManager,
    TuyaOpenAPI,
)
from ....lib.tuya_iot.asset import TuyaAssetManager
from ....lib.tuya_iot.tuya_enums import AuthType
from ...multi_manager import (
    MultiManager,
)
from ...shared.shared_classes import (
    XTDeviceMap,
)
from ...shared.threading import (
    XTConcurrencyManager,
    XTEventLoopProtector,
)
import custom_components.xtend_tuya.multi_manager.managers.tuya_iot.xt_tuya_iot_manager as man

# A refetch that comes back with less than half of what the hub had before is
# a cloud/paging failure, not devices genuinely disappearing (Tuya removals
# are one-offs, and BIZCODE_DELETE handles those live).
MIN_KEPT_FRACTION = 0.5


class XTIOTHomeManager(TuyaHomeManager):
    def __init__(
        self,
        api: TuyaOpenAPI,
        device_manager: man.XTIOTDeviceManager,
        multi_manager: MultiManager,
    ):
        super().__init__(api, device_manager.mq, device_manager)
        self.multi_manager = multi_manager
        self.device_manager = device_manager

    async def async_query_device_ids(
        self, asset_manager: TuyaAssetManager, asset_id: str, device_ids: list
    ) -> list:
        if asset_id != "-1":
            device_ids += (
                await XTEventLoopProtector.execute_out_of_event_loop_and_return(
                    asset_manager.get_device_list, asset_id
                )
            )
        assets = await XTEventLoopProtector.execute_out_of_event_loop_and_return(
            asset_manager.get_asset_list, asset_id
        )
        concurrency_manager = XTConcurrencyManager(max_concurrency=9)
        for asset in assets:
            concurrency_manager.add_coroutine(
                self.async_query_device_ids(
                    asset_manager, asset["asset_id"], device_ids
                )
            )
        await concurrency_manager.gather()
        return device_ids

    @staticmethod
    def fetch_is_usable(previous_count: int, fetched_count: int) -> bool:
        """Tested in tests/unit/test_device_map_swap.py."""
        if fetched_count == 0:
            return False
        return fetched_count >= previous_count * MIN_KEPT_FRACTION

    async def async_update_device_cache(self):
        """Fetch the device list into a fresh map, swap it in only on success.

        The map used to be cleared *before* the fetch, and a failed fetch was
        swallowed upstream: the whole fleet then ran on the 2-DP sharing
        descriptors until someone reloaded the entry (the Aug 2026 "DP
        collapse" incidents). Now a bad fetch leaves the previous map in place
        and raises, so the entry's background load logs it and retries.
        """
        manager = self.device_manager
        live = manager.device_map
        fresh = XTDeviceMap({}, live.device_source_priority)
        manager.device_map = fresh  # everything below writes into `fresh`
        try:
            if self.api.auth_type == AuthType.CUSTOM:
                device_ids = []
                asset_manager = TuyaAssetManager(self.api)

                await self.async_query_device_ids(asset_manager, "-1", device_ids)

                if device_ids:
                    await manager.async_update_device_caches(device_ids)
            elif self.api.auth_type == AuthType.SMART_HOME:
                await manager.async_update_device_list_in_smart_home()
        finally:
            manager.device_map = live
        if not self.fetch_is_usable(len(live), len(fresh)):
            raise ConfigEntryNotReady(
                f"IOT device list fetch unusable: {len(fresh)} devices "
                f"(had {len(live)}) — keeping the previous device map"
            )
        live.data = fresh.data

    def update_device_cache(self):
        super().update_device_cache()
        # self.multi_manager.convert_tuya_devices_to_xt(self.device_manager)
