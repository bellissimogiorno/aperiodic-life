#!/usr/bin/env python3
"""Stage the standalone and licence notices for a static host such as GitHub Pages."""
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
    output.mkdir(parents=True, exist_ok=True)
    for source, target in [
        ("aperiodic-life-standalone.html", "index.html"),
        ("LICENSE", "LICENSE"),
        ("THIRD_PARTY_LICENSES.md", "THIRD_PARTY_LICENSES.md"),
    ]:
        release.copy_file(root / source, output / target)
    release.write_text(output / ".nojekyll", "")
    print(json.dumps({"directory": str(output), "version": release.VERSION,
                      "files": sorted(p.name for p in output.iterdir())}, indent=2))
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
