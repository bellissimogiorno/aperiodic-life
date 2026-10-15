#!/usr/bin/env python3
"""Optional catalogue validation tests; install docs/catalogue/requirements.txt."""
from __future__ import annotations

import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch


path = Path(__file__).resolve().parent / "docs/catalogue/build_catalogue.py"
spec = importlib.util.spec_from_file_location("catalogue_builder", path)
catalogue = importlib.util.module_from_spec(spec)
spec.loader.exec_module(catalogue)


class CatalogueTest(unittest.TestCase):
    def test_reviewed_catalogue_validates_against_current_application(self):
        self.assertEqual(catalogue.VERSION, "3.7.4")
        self.assertEqual((catalogue.ROOT / "VERSION").read_text().strip(), "3.7.5")
        self.assertEqual(catalogue.SOURCE["documentationRevision"], 2)
        catalogue.validate()

    def test_version_compatibility_is_limited_to_later_application_patches(self):
        for application in ["3.7.4", "3.7.5", "3.7.10"]:
            catalogue.validate_catalogue_version("3.7.4", application)
        for application in ["3.7.3", "3.6.99", "3.8.0", "4.0.0", "3.07.5", "3.7", None]:
            with self.subTest(application=application), self.assertRaises(ValueError):
                catalogue.validate_catalogue_version("3.7.4", application)
        for version in ["3.7.6", "3.6.4", "3.8.0", "4.0.0", "3.07.4", "3.7.4-dev", None]:
            with self.subTest(catalogue=version), self.assertRaises(ValueError):
                catalogue.validate_catalogue_version(version, "3.7.5")

    def test_geometry_still_requires_the_exact_catalogue_version(self):
        with patch.dict(catalogue.GEOM, {"packageVersion": "3.7.5"}):
            with self.assertRaisesRegex(AssertionError, "Geometry release version differs"):
                catalogue.validate()

    def test_current_source_and_both_recorded_hashes_must_match(self):
        for name in ["core.js", "discoveries.js"]:
            for target in [catalogue.SOURCE["sourceHashes"], catalogue.GEOM["sourceSHA256"]]:
                with self.subTest(file=name, target=target is catalogue.SOURCE["sourceHashes"]):
                    with patch.dict(target, {name: "0" * 64}):
                        with self.assertRaisesRegex(AssertionError, "Stale engine/preset source"):
                            catalogue.validate()
            # Matching metadata alone is insufficient if the actual source has
            # changed: neither recorded hash may replace the filesystem check.
            with patch.dict(catalogue.SOURCE["sourceHashes"], {name: "0" * 64}), \
                    patch.dict(catalogue.GEOM["sourceSHA256"], {name: "0" * 64}):
                with self.assertRaisesRegex(AssertionError, "Stale engine/preset source"):
                    catalogue.validate()


if __name__ == "__main__":
    unittest.main(verbosity=2)
