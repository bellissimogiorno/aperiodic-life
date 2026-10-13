#!/usr/bin/env python3
"""Build deterministic standalone and source releases for Aperiodic Life."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import subprocess
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent.parent
VERSION = "3.7.1"
ARCHIVE_ROOT = "aperiodic-life"
STANDALONE_NAME = f"aperiodic-life-{VERSION}.html"
SOURCE_ZIP_NAME = f"aperiodic-life-source-{VERSION}.zip"
MANIFEST_NAME = f"aperiodic-life-source-{VERSION}.manifest.json"
CHECKSUM_NAME = f"aperiodic-life-{VERSION}.sha256"
# ZIP's earliest timestamp avoids dependence on source mtimes or build dates.
STAMP = (1980, 1, 1, 0, 0, 0)
EXECUTABLE_SOURCE_PATHS = {
    "tools/project.py", "tools/package.py", "tools/export_repository.py", "tools/build_site.py",
}


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def safe_rel(name: str) -> str:
    path = PurePosixPath(name)
    if ("\\" in name or "\x00" in name or path.is_absolute() or not path.parts
            or ".." in path.parts or ":" in path.parts[0] or path.as_posix() != name):
        raise ValueError(f"unsafe archive path: {name!r}")
    return name


def source_mode(name: str) -> int:
    return 0o755 if name in EXECUTABLE_SOURCE_PATHS else 0o644


def source_files() -> list[tuple[str, Path, int]]:
    """Collect source without local environments, VCS internals or build outputs."""
    excluded_dirs = {".git", "__pycache__", "node_modules", ".venv", "venv"}
    excluded_root_dirs = {"evidence", "dist", "build", "site", "logs", "coverage", ".vscode", ".idea"}
    items: list[tuple[str, Path, int]] = []
    for directory, dirs, names in os.walk(ROOT, followlinks=False):
        base = Path(directory)
        dirs[:] = sorted(name for name in dirs if name not in excluded_dirs
                         and name != ".env" and not name.startswith(".env.")
                         and not (base == ROOT and name in excluded_root_dirs))
        for name in dirs:
            if (base / name).is_symlink():
                raise ValueError(f"symbolic link in source tree: {(base / name).relative_to(ROOT)}")
        for name in sorted(names):
            path = base / name
            if (name in {".git", ".DS_Store", "Thumbs.db"}
                    or path.suffix in {".pyc", ".pyo", ".swp", ".swo"}
                    or name == ".env" or name.startswith(".env.")):
                continue
            if path.is_symlink():
                raise ValueError(f"symbolic link in source tree: {path.relative_to(ROOT)}")
            if path.is_file():
                relative = safe_rel(path.relative_to(ROOT).as_posix())
                items.append((relative, path, source_mode(relative)))
    return sorted(items)


def source_snapshot() -> list[tuple[str, bytes, int]]:
    return [(name, path.read_bytes(), mode) for name, path, mode in source_files()]


def zip_info(name: str, mode: int) -> zipfile.ZipInfo:
    info = zipfile.ZipInfo(safe_rel(name), STAMP)
    info.create_system = 3
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = (stat.S_IFREG | mode) << 16
    return info


def write_zip(path: Path, entries: list[tuple[str, bytes, int]]) -> None:
    # Check the entire member list before creating any output file.
    names = [safe_rel(name) for name, _, _ in entries]
    if len(set(names)) != len(names):
        raise ValueError("duplicate archive path")
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data, mode in sorted(entries):
            archive.writestr(zip_info(name, mode), data,
                             compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)


def verify_zip(path: Path) -> dict[str, int]:
    with zipfile.ZipFile(path) as archive:
        infos = archive.infolist()
        names: set[str] = set()
        for info in infos:
            name = safe_rel(info.filename)
            if name in names:
                raise ValueError(f"duplicate ZIP member: {name}")
            names.add(name)
            if stat.S_IFMT(info.external_attr >> 16) != stat.S_IFREG:
                raise ValueError(f"non-regular file in ZIP: {name}")
        bad = archive.testzip()
        if bad is not None:
            raise ValueError(f"ZIP CRC failure: {bad}")
    return {"members": len(infos), "bytes": path.stat().st_size}


def write_source_zip(path: Path, entries: list[tuple[str, bytes, int]]) -> None:
    write_zip(path, [(f"{ARCHIVE_ROOT}/{name}", data, mode) for name, data, mode in entries])
    verify_zip(path)


def source_manifest(entries: list[tuple[str, bytes, int]]) -> dict:
    return {
        "schema": 1,
        "project": "Aperiodic Life",
        "version": VERSION,
        "archive": SOURCE_ZIP_NAME,
        "root": ARCHIVE_ROOT,
        "files": [{"path": name, "sha256": sha256_bytes(data), "bytes": len(data),
                   "mode": f"{mode:04o}"} for name, data, mode in sorted(entries)],
    }


def verify_source_manifest(archive_path: Path, manifest: dict) -> None:
    """Check the complete archive against its per-file integrity manifest."""
    if (manifest.get("schema") != 1 or manifest.get("version") != VERSION
            or manifest.get("root") != ARCHIVE_ROOT):
        raise ValueError("unexpected source manifest format")
    listed = manifest.get("files")
    if not isinstance(listed, list):
        raise ValueError("source manifest requires a file list")
    expected: dict[str, dict] = {}
    for record in listed:
        name = f"{ARCHIVE_ROOT}/{safe_rel(record['path'])}"
        if name in expected:
            raise ValueError(f"duplicate manifest member: {name}")
        expected[name] = record
    verify_zip(archive_path)
    with zipfile.ZipFile(archive_path) as archive:
        if set(archive.namelist()) != set(expected):
            raise ValueError("source manifest and archive members differ")
        for name, record in expected.items():
            data = archive.read(name)
            mode = archive.getinfo(name).external_attr >> 16 & 0o777
            if (len(data) != record["bytes"] or sha256_bytes(data) != record["sha256"]
                    or f"{mode:04o}" != record["mode"]):
                raise ValueError(f"source manifest mismatch: {name}")


def copy_file(source: Path, target: Path, mode: int = 0o644) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with source.open("rb") as incoming, target.open("xb") as outgoing:
        shutil.copyfileobj(incoming, outgoing)
    target.chmod(mode)


def write_text(path: Path, text: str, mode: int = 0o644) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("x", encoding="utf-8", newline="\n") as stream:
        stream.write(text)
    path.chmod(mode)


def validate_output_directory(output: Path) -> Path:
    output = output.expanduser().resolve()
    root = ROOT.resolve()
    if output == root or root in output.parents or output in root.parents:
        raise ValueError("output directory must be outside the source tree")
    if output.exists() and (not output.is_dir() or any(output.iterdir())):
        raise ValueError("output directory must be new or empty")
    return output


def require_release_version() -> None:
    marker = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    if marker != VERSION:
        raise RuntimeError(f"VERSION contains {marker!r}; expected {VERSION!r}")


def require_current_standalone() -> None:
    node = shutil.which("node")
    if node is None:
        raise RuntimeError("Node.js is required to verify the standalone bundle")
    result = subprocess.run([node, "build-standalone.js", "--check"], cwd=ROOT, text=True,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if result.returncode:
        detail = (result.stderr or result.stdout).strip()
        raise RuntimeError(f"standalone bundle is missing or out of date: {detail}")


def build(output_dir: Path) -> dict[str, str]:
    output = validate_output_directory(output_dir)
    require_release_version()
    require_current_standalone()
    entries = source_snapshot()
    standalone = next(data for name, data, _ in entries if name == "aperiodic-life-standalone.html")
    manifest = source_manifest(entries)
    output.parent.mkdir(parents=True, exist_ok=True)
    # Build and verify privately; failed preparation leaves the destination alone.
    with tempfile.TemporaryDirectory(prefix="aperiodic-life-package-", dir=output.parent) as temporary:
        staged = Path(temporary) / "release"
        staged.mkdir()
        (staged / STANDALONE_NAME).write_bytes(standalone)
        (staged / STANDALONE_NAME).chmod(0o644)
        write_source_zip(staged / SOURCE_ZIP_NAME, entries)
        write_text(staged / MANIFEST_NAME, json.dumps(manifest, indent=2) + "\n")
        verify_source_manifest(staged / SOURCE_ZIP_NAME, manifest)
        checksums = "".join(f"{sha256_file(staged / name)}  {name}\n"
                            for name in sorted([STANDALONE_NAME, SOURCE_ZIP_NAME, MANIFEST_NAME]))
        write_text(staged / CHECKSUM_NAME, checksums)
        result = {path.name: sha256_file(path) for path in sorted(staged.iterdir())}
        validate_output_directory(output)
        was_empty_directory = output.exists()
        if was_empty_directory:
            output.rmdir()  # Refuses if another process has added any contents.
        try:
            staged.rename(output)
        except OSError:
            if was_empty_directory and not output.exists():
                output.mkdir()
            raise
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", required=True, type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(build(args.output_dir), indent=2))
    except (ValueError, RuntimeError, OSError) as error:
        print(str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
