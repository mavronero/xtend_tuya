"""Layer boundaries (docs/architecture.md §1, principle 1), as a ratchet.

Imports may only point down: farm (L3) -> contract names; valve drivers (L2)
-> TuyaPort; transport (L1) knows neither. The code does not follow this yet,
so KNOWN_VIOLATIONS lists every current violation explicitly. The test fails
when a NEW violation appears, and also when a listed one disappears (delete it
from the list), so the list always matches the code and only ever shrinks.
"""

from __future__ import annotations

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "custom_components" / "xtend_tuya"

# Layer membership by module path. transport/ and entity_parser/valves/ take
# over as the refactor steps land. `calendar` is the farm's platform shim.
FARM_PREFIX = "farm"
FARM_SHIMS = {"calendar"}
L2_PREFIX = "entity_parser.fdm5kw"

FARM_MAY_IMPORT = {FARM_PREFIX, "const"}
L2_FORBIDDEN_PREFIXES = ("multi_manager", "util", "lib")
L2_PORT = "transport.port"  # the only transport module L2 may use

KNOWN_VIOLATIONS = {
    # L1 -> farm / L2 (farm wires itself up once it is its own integration; step 6: services move to the L2 driver)
    ("__init__", "farm.frontend"),
    ("__init__", "entity_parser.fdm5kw.location_service"),
    ("multi_manager.shared.services.services", "entity_parser.fdm5kw.control_service"),
    ("multi_manager.shared.services.services", "entity_parser.fdm5kw.timer_service"),
    # L2 -> L1 internals (steps 5-6: entities read DeviceSnapshot via TuyaPort)
    ("entity_parser.fdm5kw.sensor", "multi_manager.multi_manager"),
    # L2 -> farm (step 5: the L2 codec gets its own counter math)
    ("entity_parser.fdm5kw.sensor", "farm.water_math"),
}


def _module_name(path: Path) -> str:
    parts = path.relative_to(ROOT).with_suffix("").parts
    return ".".join(parts[:-1] if parts[-1] == "__init__" else parts) or "__init__"


def _is_module(dotted: str) -> bool:
    base = ROOT.joinpath(*dotted.split("."))
    return base.with_suffix(".py").is_file() or (base / "__init__.py").is_file()


def _imports(path: Path) -> set[str]:
    """Intra-package modules imported by `path`, resolved to real module files."""
    own = _module_name(path)
    package = own.split(".") if path.name == "__init__.py" else own.split(".")[:-1]
    if own == "__init__":
        package = []
    found: set[str] = set()
    for node in ast.walk(ast.parse(path.read_text())):
        if isinstance(node, ast.ImportFrom):
            if node.level:
                base = package[: len(package) - (node.level - 1)] if node.level > 1 else package
                module = ".".join(base + ([node.module] if node.module else []))
            elif node.module and node.module.startswith("custom_components.xtend_tuya"):
                module = node.module.removeprefix("custom_components.xtend_tuya").lstrip(".")
            else:
                continue
            for alias in node.names:
                sub = f"{module}.{alias.name}" if module else alias.name
                found.add(sub if _is_module(sub) else module)
        elif isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name.startswith("custom_components.xtend_tuya."):
                    found.add(alias.name.removeprefix("custom_components.xtend_tuya."))
    return {m for m in found if m}


def _in_farm(module: str) -> bool:
    return module in FARM_SHIMS or module == FARM_PREFIX or module.startswith(FARM_PREFIX + ".")


def _layer(module: str) -> str:
    if _in_farm(module):
        return "L3"
    if module.startswith(L2_PREFIX):
        return "L2"
    return "L1"


def _violates(importer: str, imported: str) -> bool:
    layer = _layer(importer)
    if layer == "L3":
        return imported.split(".")[0] not in FARM_MAY_IMPORT
    if layer == "L2":
        return (
            _in_farm(imported)
            or imported.startswith(L2_FORBIDDEN_PREFIXES)
            or (imported.startswith("transport") and imported != L2_PORT)
        )
    return _layer(imported) != "L1"


def current_violations() -> set[tuple[str, str]]:
    return {
        (_module_name(path), imported)
        for path in ROOT.rglob("*.py")
        for imported in _imports(path)
        if _violates(_module_name(path), imported)
    }


def test_no_new_layer_violations():
    new = current_violations() - KNOWN_VIOLATIONS
    assert not new, f"new layer violations (imports must point down): {sorted(new)}"


def test_known_violations_list_is_current():
    fixed = KNOWN_VIOLATIONS - current_violations()
    assert not fixed, f"fixed, remove from KNOWN_VIOLATIONS: {sorted(fixed)}"


def test_codecs_are_pure():
    """codecs/ (principle 2): stdlib only, nothing from HA, Tuya libs or the integration."""
    import sys

    codecs = ROOT / "entity_parser" / "fdm5kw" / "codecs"
    impure = []
    for path in codecs.glob("*.py"):
        for node in ast.walk(ast.parse(path.read_text())):
            if isinstance(node, ast.ImportFrom) and node.level:
                if node.level > 1 or (node.module or "").split(".")[0] not in {p.stem for p in codecs.glob("*.py")} | {""}:
                    impure.append((path.name, "." * node.level + (node.module or "")))
                continue
            names = [a.name for a in node.names] if isinstance(node, ast.Import) else [node.module] if isinstance(node, ast.ImportFrom) else []
            impure += [(path.name, n) for n in names if n.split(".")[0] not in sys.stdlib_module_names | {"__future__"}]
    assert not impure, impure
