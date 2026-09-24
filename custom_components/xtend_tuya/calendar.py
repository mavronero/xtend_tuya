"""Calendar platform entry point. HA loads platforms from the integration
root; the implementation lives in farm/calendar.py (docs/architecture.md §5)."""

from .farm.calendar import async_setup_entry

__all__ = ["async_setup_entry"]
