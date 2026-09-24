"""DP byte formats of the sfkzq valves (docs/architecture.md §4.4).

Pure functions over bytes: no Home Assistant, no network, stdlib only. Every
layout here was captured from real devices (see the decode notes referenced
in each module) and is tested against those captures in tests/unit/test_codecs.py.
"""
