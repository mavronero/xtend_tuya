"""Every custom element a card bundle defines must be in the bootstrap's map.

cards/irrigation-bootstrap.js re-imports a bundle whenever its element is not
defined (HA's scoped custom-element registry polyfill drops defines that ran
before it installed; the HA workbox service worker serves stale bodies after
a HACS update). A bundle missing from BUNDLES never heals: its card shows
"Configuration error" for the whole page session. 4.4.257 shipped
irrigation-locations-card without the entry.

Run: `python3 tests/test_bootstrap_bundles.py`
"""

import pathlib
import re

CARDS = pathlib.Path(__file__).resolve().parent.parent / "custom_components" / "xtend_tuya" / "cards"


def demo():
    bootstrap = (CARDS / "irrigation-bootstrap.js").read_text()
    block = re.search(r"const BUNDLES = \{(.*?)\};", bootstrap, re.S).group(1)
    mapped = dict(re.findall(r'"([a-z0-9-]+)":\s*"([a-z0-9-]+\.js)"', block))
    missing = []
    for js in sorted(CARDS.glob("*.js")):
        if js.name == "irrigation-bootstrap.js":
            continue
        for name in re.findall(r'customElements\.define\("([a-z0-9-]+)"', js.read_text()):
            if mapped.get(name) != js.name:
                missing.append(f"{name} -> {js.name}")
    assert not missing, "add to BUNDLES in cards/irrigation-bootstrap.js: " + ", ".join(missing)
    assert mapped, "BUNDLES map not found"
    print("ok", len(mapped), "elements mapped")


if __name__ == "__main__":
    demo()
