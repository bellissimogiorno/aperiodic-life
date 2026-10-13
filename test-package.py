#!/usr/bin/env python3
"""Determinism, integrity and non-destructive release packaging checks."""
from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import zipfile

from tools import package as release


class PackageTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory(prefix="aperiodic-package-test-", dir=release.ROOT.parent)
        cls.base = Path(cls.temporary.name)
        cls.source = cls.base / "source"
        cls.source.mkdir()
        # Use the real standalone builder and runtime files in an isolated source
        # tree, so stale-bundle tests never change the developer's checkout.
        for name in ["VERSION", "README.md", "LICENSE", "THIRD_PARTY_LICENSES.md",
                     "build-standalone.js", "index.html", "styles.css", "core.js",
                     "discoveries.js", "app.js", "tools/project.py"]:
            destination = cls.source / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(release.ROOT / name, destination)
        subprocess.run(["node", "build-standalone.js"], cwd=cls.source, check=True,
                       stdout=subprocess.PIPE, text=True)
        cls.root_patch = patch.object(release, "ROOT", cls.source)
        cls.root_patch.start()
        cls.first = cls.base / "first"
        cls.second = cls.base / "second"
        cls.first_result = release.build(cls.first)
        cls.second_result = release.build(cls.second)

    @classmethod
    def tearDownClass(cls):
        cls.root_patch.stop()
        cls.temporary.cleanup()

    def test_versioned_output_contract_and_determinism(self):
        self.assertEqual(release.VERSION, "3.7.1")
        expected = {"aperiodic-life-3.7.1.html", "aperiodic-life-source-3.7.1.zip",
                    "aperiodic-life-source-3.7.1.manifest.json", "aperiodic-life-3.7.1.sha256"}
        self.assertEqual(set(self.first_result), expected)
        self.assertEqual({path.name for path in self.first.iterdir()}, expected)
        self.assertEqual(self.first_result, self.second_result)
        for name in expected:
            self.assertEqual((self.first / name).read_bytes(), (self.second / name).read_bytes())
        self.assertEqual((self.first / release.STANDALONE_NAME).read_bytes(),
                         (self.source / "aperiodic-life-standalone.html").read_bytes())

    def test_manifest_covers_every_source_member_and_permissions(self):
        manifest = json.loads((self.first / release.MANIFEST_NAME).read_text())
        archive_path = self.first / release.SOURCE_ZIP_NAME
        release.verify_source_manifest(archive_path, manifest)
        expected = {name: (source.read_bytes(), mode) for name, source, mode in release.source_files()}
        self.assertEqual({entry['path'] for entry in manifest['files']}, set(expected))
        self.assertEqual(len(manifest['files']), len(expected))
        with zipfile.ZipFile(archive_path) as archive:
            self.assertIsNone(archive.testzip())
            self.assertEqual(archive.namelist(), [f"aperiodic-life/{name}" for name in sorted(expected)])
            for name, (data, mode) in expected.items():
                info = archive.getinfo(f"aperiodic-life/{name}")
                self.assertEqual(archive.read(info), data)
                self.assertEqual(info.date_time, release.STAMP)
                self.assertEqual(stat.S_IMODE(info.external_attr >> 16), mode)
                self.assertEqual(stat.S_IFMT(info.external_attr >> 16), stat.S_IFREG)

    def test_checksums_cover_all_other_deliverables(self):
        rows = (self.first / release.CHECKSUM_NAME).read_text().splitlines()
        checksums = dict(line.split("  ", 1)[::-1] for line in rows)
        self.assertEqual(set(checksums), set(self.first_result) - {release.CHECKSUM_NAME})
        for name, digest in checksums.items():
            self.assertEqual(release.sha256_file(self.first / name), digest)

    def test_manifest_detects_tampering_omissions_and_duplicates(self):
        original = json.loads((self.first / release.MANIFEST_NAME).read_text())
        for change in ["hash", "size", "mode", "missing", "duplicate"]:
            manifest = json.loads(json.dumps(original))
            if change == "hash":
                manifest['files'][0]['sha256'] = '0' * 64
            elif change == "size":
                manifest['files'][0]['bytes'] += 1
            elif change == "mode":
                manifest['files'][0]['mode'] = '0000'
            elif change == "missing":
                manifest['files'].pop()
            else:
                manifest['files'].append(manifest['files'][0])
            with self.subTest(change=change), self.assertRaises(ValueError):
                release.verify_source_manifest(self.first / release.SOURCE_ZIP_NAME, manifest)

    def test_stale_standalone_and_wrong_version_fail_before_output(self):
        for name, addition in [("styles.css", "\n/* stale test */\n"), ("VERSION", "-unexpected")]:
            path = self.source / name
            before = path.read_bytes()
            destination = self.base / f"invalid-{name}"
            try:
                path.write_bytes(before + addition.encode())
                with self.assertRaises(RuntimeError):
                    release.build(destination)
                self.assertFalse(destination.exists())
            finally:
                path.write_bytes(before)

    def test_no_output_overlaps_or_replaces_existing_data(self):
        for directory in [self.source, self.source / "output", self.source.parent, self.first]:
            with self.subTest(directory=directory), self.assertRaises(ValueError):
                release.build(directory)
        self.assertEqual(self.first_result,
                         {p.name: release.sha256_file(p) for p in self.first.iterdir()})
        existing = self.base / "unrelated"
        existing.mkdir()
        (existing / "keep.txt").write_text("preserve me")
        with self.assertRaises(ValueError):
            release.build(existing)
        self.assertEqual((existing / "keep.txt").read_text(), "preserve me")
        empty = self.base / "empty"
        empty.mkdir()
        self.assertEqual(release.build(empty), self.first_result)

    def test_failed_preparation_leaves_destination_unchanged(self):
        empty = self.base / "failed-empty"
        empty.mkdir()
        missing = self.base / "failed-new"
        for target in [empty, missing]:
            with patch.object(release, "verify_source_manifest", side_effect=ValueError("test failure")):
                with self.assertRaises(ValueError):
                    release.build(target)
        self.assertEqual(list(empty.iterdir()), [])
        self.assertFalse(missing.exists())

    def test_source_mtimes_and_permissions_do_not_change_output(self):
        source = self.source / "core.js"
        before = source.stat()
        try:
            source.chmod(0o755)
            os.utime(source, (1_700_000_000, 1_700_000_000))
            self.assertEqual(release.build(self.base / "different-filesystem"), self.first_result)
        finally:
            source.chmod(stat.S_IMODE(before.st_mode))
            os.utime(source, ns=(before.st_atime_ns, before.st_mtime_ns))

    def test_archive_paths_and_writes_are_safe(self):
        for index, name in enumerate(["../escape", "/absolute", "a/../b", "a\\b", "a//b", "C:/escape"]):
            target = self.base / f"unsafe-{index}.zip"
            with self.assertRaises(ValueError):
                release.write_zip(target, [(name, b"data", 0o644)])
            self.assertFalse(target.exists())
        with self.assertRaises(ValueError):
            release.write_zip(self.base / "duplicate.zip", [("same", b"a", 0o644), ("same", b"b", 0o644)])
        self.assertFalse((self.base / "duplicate.zip").exists())
        target = self.base / "existing.zip"
        target.write_bytes(b"preserve")
        with self.assertRaises(FileExistsError):
            release.write_zip(target, [("data", b"new", 0o644)])
        self.assertEqual(target.read_bytes(), b"preserve")
        with self.assertRaises(FileExistsError):
            release.copy_file(self.source / "VERSION", target)
        self.assertEqual(target.read_bytes(), b"preserve")

    def test_zip_verifier_rejects_symlinks(self):
        target = self.base / "symlink.zip"
        with zipfile.ZipFile(target, "w") as archive:
            info = zipfile.ZipInfo("link", release.STAMP)
            info.create_system = 3
            info.external_attr = (stat.S_IFLNK | 0o777) << 16
            archive.writestr(info, "target")
        with self.assertRaises(ValueError):
            release.verify_zip(target)


if __name__ == "__main__":
    unittest.main(verbosity=2)
