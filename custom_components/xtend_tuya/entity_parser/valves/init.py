"""Entity parser plugin for the sfkzq irrigation valves (QT-08W, QT-08W-T3, water timers)."""

from __future__ import annotations
from typing import Any
from homeassistant.const import (
    Platform,
)
from ..entity_parser import (
    XTCustomEntityParser,
    XTPluginService,
)
from .sensor import Fdm5kwSensor
from .services import SERVICES


def get_plugin_instance() -> XTCustomEntityParser | None:
    return Fdm5kwEntityParser()


class Fdm5kwEntityParser(XTCustomEntityParser):
    def __init__(self) -> None:
        super().__init__()
        Fdm5kwSensor.initialize_sensor()

    def get_descriptors_to_merge(self, platform: Platform) -> Any:
        match platform:
            case Platform.SENSOR:
                return Fdm5kwSensor.get_descriptors_to_merge()
        return None

    def get_services(self) -> list[XTPluginService]:
        return list(SERVICES)
