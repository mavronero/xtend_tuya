"""Tuya transport (L1): the only way the device drivers (L2) reach Tuya.

`TuyaPort` gives L2 device snapshots, DP writes and OpenAPI calls, and owns
the per-hub quota circuit breaker. L2 never touches `MultiManager`,
`device_map` or account objects. See docs/architecture.md §3.
"""
