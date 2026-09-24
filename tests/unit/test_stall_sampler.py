"""The stall sampler captures the main thread's stack while it burns CPU.

Replaces tests/test_stall_sampler.py (same check, now collected by pytest).
Runs the real _run on a short interval against a tmp file; no HA needed.
"""

from __future__ import annotations

import threading
import time

from custom_components.xtend_tuya.multi_manager.shared.debug import stall_sampler


def burn_marker_function() -> int:
    end = time.time() + 1.0
    x = 0
    while time.time() < end:
        x += 1
    return x


def test_sampler_captures_burning_stack(tmp_path, monkeypatch):
    monkeypatch.setattr(stall_sampler, "SAMPLE_INTERVAL", 0.05)
    monkeypatch.setattr(stall_sampler, "MAX_RUNTIME", 2.0)
    path = tmp_path / "samples.log"

    t = threading.Thread(target=stall_sampler._run, args=(str(path), threading.get_ident()), daemon=True)
    t.start()
    burn_marker_function()
    t.join(timeout=5)

    text = path.read_text()
    assert "sampler start" in text, text[:200]
    assert "burn_marker_function" in text, "burn stack not captured:\n" + text[:2000]
    assert "sampler done" in text
