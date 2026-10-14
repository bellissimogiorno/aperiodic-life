#!/usr/bin/env python3
"""Stage the application, notices and catalogue for a static host."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

try:
    from . import package as release
except ImportError:
    import package as release


def build_site(output: Path) -> Path:
    output = output.expanduser().resolve()
    root = release.ROOT.resolve()
    if output == root or root in output.parents or output in root.parents:
        raise ValueError("site directory must be outside the source tree")
    # A fresh or empty destination avoids deleting unrelated files and stale assets.
    if output.exists() and (not output.is_dir() or any(output.iterdir())):
        raise ValueError("site output directory must be new or empty")
    release.require_release_version()
    release.require_current_standalone()
    release.require_catalogue()
    catalogue_files = [(name, path, mode) for name, path, mode in release.source_files()
                       if name.startswith(release.CATALOGUE_ROOT)]
    output.mkdir(parents=True, exist_ok=True)
    for source, target in [
        ("aperiodic-life-standalone.html", "index.html"),
        ("LICENSE", "LICENSE"),
        ("THIRD_PARTY_LICENSES.md", "THIRD_PARTY_LICENSES.md"),
    ]:
        release.copy_file(root / source, output / target)
    for name, path, mode in catalogue_files:
        release.copy_file(path, output / name, mode)
    release.write_text(output / ".nojekyll", "")
    print(json.dumps({"directory": str(output), "version": release.VERSION,
                      "files": sorted(p.relative_to(output).as_posix()
                                      for p in output.rglob("*") if p.is_file())}, indent=2))
    return output


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", required=True, type=Path)
    args = parser.parse_args()
    try:
        build_site(args.output_dir)
    except (ValueError, RuntimeError) as error:
        print(str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
