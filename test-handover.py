#!/usr/bin/env python3
"""End-to-end handover reproducibility, versioning and integrity regressions."""
from __future__ import annotations

import base64
import json
from pathlib import Path
import re
import shutil
import stat
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import zipfile

from tools import build_handover as handover
from tools import package as release


# Exercise the exact verifier distributed in every handover, without importing
# the application or depending on its source tree at verification time.
verifier = {"__name__": "handover_verifier_test"}
exec(compile(handover.VERIFIER, "verify_handover.py", "exec"), verifier)


class HandoverTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory(prefix="aperiodic-handover-test-", dir=release.ROOT.parent)
        cls.base = Path(cls.temporary.name)
        cls.source = cls.base / "source"
        cls.source.mkdir()
        names = ["VERSION", "README.md", "LICENSE", "THIRD_PARTY_LICENSES.md", "CONTRIBUTING.md",
                 ".gitignore", ".gitattributes", ".github/workflows/ci.yml", "docs/PUBLISHING.md",
                 "build-standalone.js", "index.html", "styles.css", "core.js", "discoveries.js", "app.js",
                 "tools/project.py", "tools/build_handover.py", "tools/package.py"]
        names.extend("docs/handover/" + name for name, _ in handover.HANDOVER_DOCUMENTS)
        for name in names:
            destination = cls.source / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(release.ROOT / name, destination)
        shutil.copytree(release.ROOT / "docs/catalogue", cls.source / "docs/catalogue",
                        ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
        subprocess.run(["node", "build-standalone.js"], cwd=cls.source, check=True,
                       stdout=subprocess.PIPE, text=True)
        cls.root_patch = patch.object(release, "ROOT", cls.source)
        cls.root_patch.start()
        # The outer directory name is part of the archive contract. Reproduce
        # the same name in separate parent directories for byte equality.
        cls.first = cls.base / "first" / "delivery"
        cls.second = cls.base / "second" / "delivery"
        cls.first_result = handover.build(cls.first, build_date="2026-10-15")
        cls.second_result = handover.build(cls.second, build_date="2026-10-15")

    @classmethod
    def tearDownClass(cls):
        cls.root_patch.stop()
        cls.temporary.cleanup()

    def copy_handover(self, name):
        destination = self.base / name
        shutil.copytree(self.first, destination)
        self.addCleanup(shutil.rmtree, destination)
        return destination

    def rewrite_checksums(self, root):
        names = sorted(path.relative_to(root).as_posix() for path in root.rglob("*")
                       if path.is_file() and path.name != "SHA256SUMS")
        (root / "SHA256SUMS").write_text("".join(
            f"{release.sha256_file(root / name)}  {name}\n" for name in names), encoding="utf-8")

    def rewrite_manifest(self, root, manifest):
        (root / "MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        self.rewrite_checksums(root)

    def refresh_record(self, root, manifest, name):
        record = next(record for record in manifest["files"] if record["path"] == name)
        record["bytes"] = (root / name).stat().st_size
        record["sha256"] = release.sha256_file(root / name)

    def test_build_is_deterministic_and_archive_matches_extracted_files(self):
        self.assertEqual(self.first_result["zipSha256"], self.second_result["zipSha256"])
        self.assertEqual(Path(self.first_result["zip"]).read_bytes(), Path(self.second_result["zip"]).read_bytes())
        files = {path.relative_to(self.first).as_posix(): path.read_bytes()
                 for path in self.first.rglob("*") if path.is_file()}
        with zipfile.ZipFile(self.first_result["zip"]) as archive:
            self.assertIsNone(archive.testzip())
            self.assertEqual(set(archive.namelist()), {"delivery/" + name for name in files})
            for name, contents in files.items():
                info = archive.getinfo("delivery/" + name)
                self.assertEqual(archive.read(info), contents)
                self.assertEqual(info.date_time, release.STAMP)
                self.assertEqual(stat.S_IFMT(info.external_attr >> 16), stat.S_IFREG)
        result = verifier["verify"](self.first)
        self.assertEqual(result["verifiedFiles"], len(files))
        self.assertTrue(result["embeddedCatalogueMatchesSource"])

    def test_patch_release_preserves_reviewed_catalogue_and_its_download_names(self):
        manifest = json.loads((self.first / "MANIFEST.json").read_text())
        self.assertEqual(manifest["version"], "3.7.6")
        self.assertEqual(manifest["catalogueVersion"], "3.7.4")
        self.assertEqual(manifest["catalogueRevision"], 2)
        self.assertEqual(self.first_result["catalogueVersion"], "3.7.4")
        browser = (self.first / manifest["browserApp"]).read_text()
        assets = json.loads(re.search(
            r'<script id="embeddedCatalogueAssets" type="application/json">(.*?)</script>', browser).group(1))
        for key, filename, source in (
                ("pdf", "aperiodic-life-complete-catalogue-3.7.4.pdf", handover.CATALOGUE_PDF),
                ("source", "aperiodic-life-catalogue-3.7.4.md", handover.CATALOGUE_MARKDOWN)):
            self.assertEqual(assets[key]["name"], filename)
            self.assertEqual(base64.b64decode(assets[key]["data"]), (self.first / source).read_bytes())
            self.assertEqual((self.first / source).read_bytes(), (self.source / source.removeprefix("source/")).read_bytes())
        self.assertIn("Application 3.7.6; catalogue 3.7.4, revision 2", (self.first / "README.md").read_text())
        self.assertIn("Catalogue 3.7.4, revision 2", (self.first / "START_HERE.html").read_text())

    def test_versions_allow_only_compatible_nonfuture_catalogues(self):
        for version in ["3.7.0", "3.7.4", "3.7.5", "3.7.6"]:
            handover.require_catalogue_version(version)
        for version in ["3.7.7", "3.6.99", "3.8.0", "4.0.0", "3.07.4", "3.7", "3.7.4-dev", "", None]:
            with self.subTest(version=version), self.assertRaises(ValueError):
                handover.require_catalogue_version(version)

    def test_incompatible_catalogue_leaves_destinations_untouched(self):
        path = self.source / "docs/catalogue/catalogue-source.json"
        original = path.read_bytes()
        metadata = json.loads(original)
        metadata["version"] = "3.8.0"
        destination = self.base / "incompatible"
        try:
            path.write_text(json.dumps(metadata), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "major/minor"):
                handover.build(destination, build_date="2026-10-15")
            self.assertFalse(destination.exists())
            self.assertFalse(Path(str(destination) + ".zip").exists())
        finally:
            path.write_bytes(original)

    def test_verifier_detects_corruption_omission_and_unexpected_files(self):
        root = self.copy_handover("changed-content")
        path = root / "source/README.md"
        original = path.read_bytes()
        path.write_bytes(original + b"tampered\n")
        with self.assertRaisesRegex(ValueError, "content differs"):
            verifier["verify"](root)
        path.unlink()
        with self.assertRaisesRegex(ValueError, "file set differs"):
            verifier["verify"](root)
        path.write_bytes(original)
        unexpected = root / "extra.txt"
        unexpected.write_text("unexpected")
        with self.assertRaisesRegex(ValueError, "file set differs"):
            verifier["verify"](root)
        unexpected.unlink()
        unexpected.symlink_to("README.md")
        with self.assertRaisesRegex(ValueError, "symbolic link"):
            verifier["verify"](root)

    def test_verifier_rejects_malformed_manifest_paths_and_records(self):
        root = self.copy_handover("changed-manifest")
        original = json.loads((root / "MANIFEST.json").read_text())
        for value in [".", "", "../escape", "/absolute", "a//b", "a\\b", "C:/escape", None]:
            manifest = json.loads(json.dumps(original))
            manifest["files"][0]["path"] = value
            self.rewrite_manifest(root, manifest)
            with self.subTest(path=value), self.assertRaisesRegex(ValueError, "manifest path"):
                verifier["verify"](root)
        for change in ["duplicate", "reserved", "mode"]:
            manifest = json.loads(json.dumps(original))
            if change == "duplicate":
                manifest["files"].append(manifest["files"][0])
            elif change == "reserved":
                manifest["files"][0]["path"] = "MANIFEST.json"
            else:
                manifest["files"][0]["mode"] = "0777"
            self.rewrite_manifest(root, manifest)
            with self.subTest(change=change), self.assertRaises(ValueError):
                verifier["verify"](root)

    def test_verifier_checks_versions_and_embedded_assets_beyond_checksums(self):
        root = self.copy_handover("changed-semantics")
        original = json.loads((root / "MANIFEST.json").read_text())
        for key, value in [("version", "3.7.7"), ("catalogueVersion", "3.7.5"), ("catalogueRevision", 99)]:
            manifest = json.loads(json.dumps(original))
            manifest[key] = value
            self.rewrite_manifest(root, manifest)
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, "differ"):
                verifier["verify"](root)
        metadata_path = root / handover.CATALOGUE_METADATA
        metadata_bytes = metadata_path.read_bytes()
        for version in ["3.6.99", "3.7.7", "3.8.0"]:
            manifest = json.loads(json.dumps(original))
            manifest["catalogueVersion"] = version
            metadata = json.loads(metadata_bytes)
            metadata["version"] = version
            metadata_path.write_text(json.dumps(metadata), encoding="utf-8")
            self.refresh_record(root, manifest, handover.CATALOGUE_METADATA)
            self.rewrite_manifest(root, manifest)
            with self.subTest(catalogue_version=version), self.assertRaisesRegex(ValueError, "major/minor"):
                verifier["verify"](root)
        metadata_path.write_bytes(metadata_bytes)
        browser = root / original["browserApp"]
        content = browser.read_text()
        for before, after, expected in [
                ('"name":"aperiodic-life-catalogue-3.7.4.md"', '"name":"wrong.md"', "name or type"),
                ('"type":"application/pdf"', '"type":"text/plain"', "name or type")]:
            manifest = json.loads(json.dumps(original))
            self.assertIn(before, content)
            browser.write_text(content.replace(before, after), encoding="utf-8")
            self.refresh_record(root, manifest, original["browserApp"])
            self.rewrite_manifest(root, manifest)
            with self.subTest(change=after), self.assertRaisesRegex(ValueError, expected):
                verifier["verify"](root)
        manifest = json.loads(json.dumps(original))
        browser.write_text(content, encoding="utf-8")
        path = root / handover.CATALOGUE_MARKDOWN
        path.write_bytes(path.read_bytes() + b"\nchanged catalogue\n")
        self.refresh_record(root, manifest, handover.CATALOGUE_MARKDOWN)
        self.rewrite_manifest(root, manifest)
        with self.assertRaisesRegex(ValueError, "embedded catalogue source differs"):
            verifier["verify"](root)

    def test_existing_outputs_and_unsafe_destinations_are_preserved(self):
        for directory in [self.source, self.source / "output", self.source.parent, self.first]:
            with self.subTest(directory=directory), self.assertRaises(ValueError):
                handover.build(directory, build_date="2026-10-15")
        target = self.base / "keep.zip"
        target.write_bytes(b"preserve me")
        with self.assertRaises(FileExistsError):
            handover.build(self.base / "unused", target, "2026-10-15")
        self.assertEqual(target.read_bytes(), b"preserve me")
        self.assertFalse((self.base / "unused").exists())
        for name in ["not-a-zip.txt", "output/inside.zip"]:
            with self.subTest(name=name), self.assertRaises(ValueError):
                handover.build(self.base / "output", self.base / name, "2026-10-15")
        with self.assertRaises(ValueError):
            handover.build(self.base / "bad-date", build_date="20261015")
        self.assertFalse((self.base / "bad-date").exists())

    def test_archive_publication_failure_restores_empty_or_absent_output(self):
        empty = self.base / "failed-empty"
        empty.mkdir()
        missing = self.base / "failed-new"
        for destination in [empty, missing]:
            with self.subTest(destination=destination), patch.object(handover.os, "link", side_effect=OSError("publication failure")):
                with self.assertRaisesRegex(OSError, "publication failure"):
                    handover.build(destination, build_date="2026-10-15")
            self.assertFalse(Path(str(destination) + ".zip").exists())
        self.assertEqual(list(empty.iterdir()), [])
        self.assertFalse(missing.exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
