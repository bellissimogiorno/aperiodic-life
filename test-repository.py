#!/usr/bin/env python3
"""Repository archive and static-site regression checks; no network required."""
from __future__ import annotations

import contextlib
import io
from pathlib import Path, PurePosixPath
import tempfile
import unittest
from unittest.mock import patch
import zipfile

from tools import package as release
from tools.build_site import build_site
from tools.export_repository import export_repository


class RepositoryExportTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory(prefix="aperiodic-repo-test-", dir=release.ROOT.parent)
        cls.base = Path(cls.temporary.name)
        with contextlib.redirect_stdout(io.StringIO()):
            cls.first = export_repository(cls.base / "first.zip")
            cls.second = export_repository(cls.base / "second.zip")
            cls.site = build_site(cls.base / "site")

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def test_archive_is_deterministic_and_complete(self):
        self.assertEqual(self.first.read_bytes(), self.second.read_bytes())
        expected = {f"aperiodic-life/{name}": source.read_bytes()
                    for name, source, _ in release.source_files()}
        with zipfile.ZipFile(self.first) as archive:
            self.assertIsNone(archive.testzip())
            self.assertEqual(set(archive.namelist()), set(expected))
            self.assertEqual(len(archive.namelist()), len(expected))
            for name, content in expected.items():
                self.assertEqual(archive.read(name), content, name)
                parts = PurePosixPath(name).parts
                self.assertNotIn("..", parts)
                self.assertNotIn(".git", parts)
                self.assertFalse(PurePosixPath(name).is_absolute())
        for name in [".github/workflows/ci.yml", ".github/workflows/pages.yml",
                     ".gitignore", "LICENSE", "THIRD_PARTY_LICENSES.md",
                     "docs/PUBLISHING.md", "research/fixtures/catalogue-verification.json"]:
            self.assertIn("aperiodic-life/" + name, expected)

    def test_site_is_only_the_offline_application_and_notices(self):
        self.assertEqual({p.name for p in self.site.iterdir()},
                         {"index.html", "LICENSE", "THIRD_PARTY_LICENSES.md", ".nojekyll"})
        self.assertEqual((self.site / "index.html").read_bytes(),
                         (release.ROOT / "aperiodic-life-standalone.html").read_bytes())
        for name in ["LICENSE", "THIRD_PARTY_LICENSES.md"]:
            self.assertEqual((self.site / name).read_bytes(), (release.ROOT / name).read_bytes())

    def test_outputs_cannot_overlap_the_checkout_or_replace_existing_files(self):
        for directory in [release.ROOT, release.ROOT / "new-site", release.ROOT.parent]:
            with self.assertRaises(ValueError):
                build_site(directory)
        with self.assertRaises(ValueError):
            export_repository(release.ROOT / "new-export.zip")
        before = self.first.read_bytes()
        with self.assertRaises(FileExistsError):
            export_repository(self.first)
        self.assertEqual(self.first.read_bytes(), before)
        with self.assertRaises(ValueError):
            build_site(self.site)

    def test_local_files_are_excluded_but_research_data_and_github_files_survive(self):
        tree = self.base / "fixture"
        keep = ["app.js", ".github/workflows/ci.yml", ".gitignore",
                "research/fixtures/verification.json", "research/README.md"]
        skip = [".git", ".env", ".env.local", "nested/.env", "nested/.env.local",
                "nested/.git", "node_modules/link/index.js", ".venv/file.py",
                "dist/file.zip", "site/index.html", "logs/test.log", "__pycache__/a.pyc",
                "nested/.env.secrets/token"]
        for name in keep + skip:
            target = tree / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text("fixture\n")
        with patch.object(release, "ROOT", tree):
            self.assertEqual([name for name, _, _ in release.source_files()], sorted(keep))
        # Ordinary source symlinks are rejected, rather than dereferenced into an archive.
        try:
            (tree / "source-link").symlink_to(tree / "app.js")
        except OSError:
            return
        with patch.object(release, "ROOT", tree), self.assertRaises(ValueError):
            release.source_files()


if __name__ == "__main__":
    unittest.main(verbosity=2)
