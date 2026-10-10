#!/usr/bin/env python3
"""Export a deterministic GitHub-ready source ZIP; do not create or publish a repo."""
from __future__ import annotations

import argparse
from pathlib import Path
import sys

try:
    from . import package as release
except ImportError:
    import package as release


def export_repository(output: Path) -> Path:
    output = output.expanduser().resolve()
    root = release.ROOT.resolve()
    if output == root or root in output.parents or output in root.parents:
        raise ValueError("repository ZIP must be outside the source tree")
    if output.suffix.lower() != ".zip":
        raise ValueError("repository output must have a .zip suffix")
    if output.exists():
        raise FileExistsError(f"output already exists: {output}")
    release.require_release_version()
    release.require_current_standalone()
    files = release.source_files()
    required = {
        "README.md", "LICENSE", "THIRD_PARTY_LICENSES.md", "CONTRIBUTING.md",
        ".gitignore", ".gitattributes", ".github/workflows/ci.yml",
        "docs/PUBLISHING.md", "aperiodic-life-standalone.html",
    }
    missing = required - {name for name, _, _ in files}
    if missing:
        raise ValueError(f"missing repository files: {sorted(missing)}")
    release.write_source_zip(output, [(name, path.read_bytes(), mode) for name, path, mode in files])
    print(f"Exported {len(files)} files to {output}")
    print(f"SHA-256: {release.sha256_file(output)}")
    return output


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=release.ROOT.parent / release.SOURCE_ZIP_NAME)
    args = parser.parse_args()
    try:
        export_repository(args.output)
    except (ValueError, RuntimeError, OSError) as error:
        print(str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
