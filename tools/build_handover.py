#!/usr/bin/env python3
"""Build a complete, verified handover directory and deterministic ZIP.

Run from the source tree (Python standard library and Node.js are required):
    python3 tools/build_handover.py --output-dir ../aperiodic-life-handover

The ZIP defaults to the output directory's path followed by '.zip'. Use --zip
to choose another ZIP path and --date YYYY-MM-DD to reproduce a dated build.
Both outputs must be outside the source tree; existing files are never replaced.
"""
from __future__ import annotations

import argparse
import base64
from datetime import date
import html
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

try:
    from . import package as release
except ImportError:
    import package as release


HANDOVER_DOCUMENTS = (
    ("README.md", "Handover guide"),
    ("DESIGN_BRIEF.md", "Design brief"),
    ("RATIONALE.md", "Rationale"),
    ("DECISION_LOG.md", "Decision log"),
    ("CONTINUATION_GUIDE.md", "Continuation guide"),
    ("VERIFICATION.md", "Verification and limitations"),
)
CATALOGUE_PDF = "source/docs/catalogue/aperiodic-life-catalogue.pdf"
CATALOGUE_MARKDOWN = "source/docs/catalogue/catalogue.md"
CATALOGUE_METADATA = "source/docs/catalogue/catalogue-source.json"

EMBEDDED_LINKS = r'''<script id="embeddedCatalogueLinks">
(function () {
  'use strict';
  const assets = JSON.parse(document.getElementById('embeddedCatalogueAssets').textContent);
  function attach(id, key, download) {
    const anchor = document.getElementById(id);
    let url = null;
    if (download) anchor.download = assets[key].name;
    anchor.addEventListener('click', function () {
      if (!url) {
        const item = assets[key];
        const decoded = atob(item.data);
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
        url = URL.createObjectURL(new Blob([bytes], {type: item.type}));
      }
      anchor.href = url;
    });
  }
  attach('cataloguePdfLink', 'pdf', false);
  attach('catalogueSourceLink', 'source', true);
})();
</script>'''

# This independent verifier is distributed in the handover and needs no imports
# from the application. It checks the entire extracted bundle, not just the ZIP.
VERIFIER = r'''#!/usr/bin/env python3
"""Verify an extracted Aperiodic Life handover using Python's standard library."""
from __future__ import annotations

import argparse
import base64
import hashlib
from html.parser import HTMLParser
import json
import os
from pathlib import Path, PurePosixPath
import re
import sys
from urllib.parse import unquote, urlsplit


def safe_path(value):
    if not isinstance(value, str):
        raise ValueError("manifest paths must be strings")
    path = PurePosixPath(value)
    if (not value or not path.parts or "\\" in value or "\x00" in value or path.is_absolute()
            or ".." in path.parts or ":" in path.parts[0]
            or path.as_posix() != value):
        raise ValueError(f"unsafe manifest path: {value!r}")
    return value


def digest(path):
    result = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            result.update(block)
    return result.hexdigest()


def actual_files(root):
    found = set()
    for directory, dirs, files in os.walk(root, followlinks=False):
        base = Path(directory)
        for name in dirs + files:
            path = base / name
            if path.is_symlink():
                raise ValueError(f"symbolic link in handover: {path.relative_to(root)}")
        for name in files:
            path = base / name
            if not path.is_file():
                raise ValueError(f"non-regular file in handover: {path.relative_to(root)}")
            found.add(safe_path(path.relative_to(root).as_posix()))
    return found


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.links.extend(value for key, value in attrs if key == "href" and value)


def verify(root):
    root = root.resolve()
    manifest = json.loads((root / "MANIFEST.json").read_text(encoding="utf-8"))
    if manifest.get("schema") != 1 or manifest.get("project") != "Aperiodic Life":
        raise ValueError("unrecognised handover manifest")
    records = manifest.get("files")
    if not isinstance(records, list):
        raise ValueError("manifest requires a file list")
    expected = {}
    for record in records:
        name = safe_path(record["path"])
        if name in expected or name in {"MANIFEST.json", "SHA256SUMS"}:
            raise ValueError(f"duplicate or reserved manifest path: {name}")
        expected[name] = record
    actual = actual_files(root)
    expected_all = set(expected) | {"MANIFEST.json", "SHA256SUMS"}
    if actual != expected_all:
        raise ValueError(f"file set differs; missing={sorted(expected_all - actual)}, "
                         f"unexpected={sorted(actual - expected_all)}")
    hashes = {}
    for name, record in expected.items():
        path = root / name
        hashes[name] = digest(path)
        if path.stat().st_size != record["bytes"] or hashes[name] != record["sha256"]:
            raise ValueError(f"content differs from manifest: {name}")
        if record.get("mode") not in {"0644", "0755"}:
            raise ValueError(f"unsupported manifest file mode: {name}")
    hashes["MANIFEST.json"] = digest(root / "MANIFEST.json")
    sums = {}
    for line in (root / "SHA256SUMS").read_text(encoding="utf-8").splitlines():
        match = re.fullmatch(r"([0-9a-f]{64})  (.+)", line)
        if not match:
            raise ValueError("malformed SHA256SUMS line")
        name = safe_path(match.group(2))
        if name in sums:
            raise ValueError(f"duplicate checksum path: {name}")
        sums[name] = match.group(1)
    if sums != hashes:
        raise ValueError("SHA256SUMS does not exactly cover the payload and manifest")

    required = {
        "README.md", "START_HERE.html", "tools/verify_handover.py",
        "source/README.md", "source/VERSION", "source/LICENSE",
        "source/THIRD_PARTY_LICENSES.md", "source/CONTRIBUTING.md",
        "source/.gitignore", "source/.gitattributes", "source/.github/workflows/ci.yml",
        "source/docs/PUBLISHING.md", "source/aperiodic-life-standalone.html",
        "source/tools/build_handover.py", "source/docs/catalogue/aperiodic-life-catalogue.pdf",
        "source/docs/catalogue/catalogue.md", "source/docs/catalogue/catalogue-source.json",
        "source/docs/catalogue/build_catalogue.py", "source/docs/catalogue/README.md",
        "source/docs/catalogue/requirements.txt", "source/docs/catalogue/geometry/diagrams.json",
        "source/docs/catalogue/fonts/LICENCE.txt",
    }
    required.update("source/docs/handover/" + name for name in (
        "README.md", "DESIGN_BRIEF.md", "RATIONALE.md", "DECISION_LOG.md",
        "CONTINUATION_GUIDE.md", "VERIFICATION.md"))
    required.update("source/docs/catalogue/fonts/" + name for name in (
        "DejaVuSans.ttf", "DejaVuSans-Bold.ttf", "DejaVuSansMono.ttf",
        "DejaVuSerif.ttf", "DejaVuSerif-Bold.ttf"))
    browser = safe_path(manifest["browserApp"])
    required.add(browser)
    if not required <= set(expected):
        raise ValueError(f"required files missing: {sorted(required - set(expected))}")
    if (root / "source/VERSION").read_text(encoding="utf-8").strip() != manifest["version"]:
        raise ValueError("source VERSION and manifest differ")
    metadata = json.loads((root / "source/docs/catalogue/catalogue-source.json").read_text(encoding="utf-8"))
    if (metadata["version"] != manifest["catalogueVersion"]
            or metadata["documentationRevision"] != manifest["catalogueRevision"]
            or metadata["documentationRevisionDate"] != manifest["catalogueRevisionDate"]):
        raise ValueError("catalogue version or revision differs from manifest")
    versions = [manifest["version"], manifest["catalogueVersion"]]
    if any(not isinstance(value, str) or not re.fullmatch(r"(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)", value)
           for value in versions):
        raise ValueError("application and catalogue versions must be major.minor.patch")
    app_version, catalogue_version = [tuple(map(int, value.split("."))) for value in versions]
    if catalogue_version[:2] != app_version[:2] or catalogue_version > app_version:
        raise ValueError("catalogue must match the application major/minor and not have a newer patch")
    counts = manifest["counts"]
    actual_counts = {
        "patterns": len(metadata["entries"]), "completeRules": len(metadata["ruleRegister"]),
        "ruleTemplates": len(metadata["rulePresets"]),
        "sourceFiles": sum(name.startswith("source/") for name in expected),
        "payloadFiles": len(expected),
    }
    if counts != actual_counts:
        raise ValueError("manifest counts differ from source data")
    pdf = (root / "source/docs/catalogue/aperiodic-life-catalogue.pdf").read_bytes()
    if not pdf.startswith(b"%PDF-"):
        raise ValueError("catalogue is not a PDF")
    content = (root / browser).read_text(encoding="utf-8")
    matches = re.findall(r'<script id="embeddedCatalogueAssets" type="application/json">(.*?)</script>',
                         content, flags=re.DOTALL)
    if len(matches) != 1:
        raise ValueError("browser app must contain exactly one embedded catalogue record")
    embedded = json.loads(matches[0])
    for key, path in (("pdf", "source/docs/catalogue/aperiodic-life-catalogue.pdf"),
                      ("source", "source/docs/catalogue/catalogue.md")):
        if base64.b64decode(embedded[key]["data"], validate=True) != (root / path).read_bytes():
            raise ValueError(f"embedded catalogue {key} differs from canonical source")
    catalogue_version = manifest["catalogueVersion"]
    for key, name, mime in (
            ("pdf", f"aperiodic-life-complete-catalogue-{catalogue_version}.pdf", "application/pdf"),
            ("source", f"aperiodic-life-catalogue-{catalogue_version}.md", "text/markdown;charset=utf-8")):
        if embedded[key].get("name") != name or embedded[key].get("type") != mime:
            raise ValueError(f"embedded catalogue {key} name or type differs from the catalogue version")
    for anchor in ("cataloguePdfLink", "catalogueSourceLink", "embeddedCatalogueLinks"):
        if f'id="{anchor}"' not in content:
            raise ValueError(f"browser catalogue link missing: {anchor}")

    parser = Links()
    parser.feed((root / "START_HERE.html").read_text(encoding="utf-8"))
    for href in parser.links:
        parts = urlsplit(href)
        if parts.scheme or parts.netloc or not parts.path:
            continue
        relative = safe_path(unquote(parts.path))
        if relative not in actual:
            raise ValueError(f"broken START_HERE.html link: {href}")
    return {"version": manifest["version"], "catalogueVersion": manifest["catalogueVersion"],
            "catalogueRevision": manifest["catalogueRevision"],
            "verifiedFiles": len(actual), "patterns": counts["patterns"],
            "embeddedCatalogueMatchesSource": True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent,
                        help="extracted handover root (default: parent of this tools directory)")
    args = parser.parse_args()
    try:
        print(json.dumps(verify(args.root), indent=2))
    except (ValueError, OSError, KeyError, TypeError) as error:
        print(f"Handover verification failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
'''


def require_catalogue_version(catalogue_version: str) -> None:
    """Allow a patch release to retain its reviewed, explicitly versioned catalogue."""
    versions = [release.VERSION, catalogue_version]
    if any(not isinstance(value, str) or not re.fullmatch(r"(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)", value)
           for value in versions):
        raise ValueError("application and catalogue versions must be major.minor.patch")
    app, catalogue = [tuple(map(int, value.split("."))) for value in versions]
    if catalogue[:2] != app[:2] or catalogue > app:
        raise ValueError("catalogue must match the application major/minor and not have a newer patch")


def embedded_browser(standalone: str, pdf: bytes, markdown: bytes, catalogue_version: str) -> str:
    """Preserve the app and give its About links self-contained catalogue assets."""
    if 'id="embeddedCatalogueAssets"' in standalone:
        raise ValueError("canonical standalone already contains embedded catalogue assets")
    for anchor in ("cataloguePdfLink", "catalogueSourceLink"):
        if standalone.count(f'id="{anchor}"') != 1:
            raise ValueError(f"expected one About catalogue anchor: {anchor}")
    note = ('<p class="catalogue-offline-note">This HTML includes the full PDF catalogue '
            'and its editable Markdown prose, available offline. The complete build source '
            'and data are included in the handover’s <code>source/docs/catalogue</code> '
            'directory.</p>')
    standalone, count = re.subn(r'<p class="catalogue-offline-note">.*?</p>', note,
                                standalone, flags=re.DOTALL)
    if count != 1:
        raise ValueError("expected one About catalogue offline note")
    assets = {
        "pdf": {"type": "application/pdf",
                "name": f"aperiodic-life-complete-catalogue-{catalogue_version}.pdf",
                "data": base64.b64encode(pdf).decode("ascii")},
        "source": {"type": "text/markdown;charset=utf-8",
                   "name": f"aperiodic-life-catalogue-{catalogue_version}.md",
                   "data": base64.b64encode(markdown).decode("ascii")},
    }
    block = ('<script id="embeddedCatalogueAssets" type="application/json">'
             + json.dumps(assets, separators=(",", ":")) + "</script>\n" + EMBEDDED_LINKS)
    if standalone.count("</body>") != 1:
        raise ValueError("expected one closing body element in standalone")
    return standalone.replace("</body>", block + "\n</body>")


def start_readme(build_date: str, metadata: dict, browser: str) -> str:
    links = "\n".join(f"- [{label}](source/docs/handover/{name})" for name, label in HANDOVER_DOCUMENTS)
    return f'''# Aperiodic Life {release.VERSION} — handover

Prepared {build_date}. Application {release.VERSION}; catalogue {metadata['version']}, revision {metadata['documentationRevision']} ({metadata['documentationRevisionDate']}).

Extract the ZIP, then open [START_HERE.html](START_HERE.html). To run immediately,
open [the self-contained app]({browser}) in a WebGL2-capable browser. Its About
button opens the embedded PDF catalogue and downloads the editable Markdown prose.

## Design, rationale and decisions

{links}

## Catalogue and source

- [Complete catalogue (PDF)]({CATALOGUE_PDF}) — {len(metadata['entries'])} presets and {len(metadata['ruleRegister'])} complete rule specifications.
- [Catalogue build instructions](source/docs/catalogue/README.md) and [editable prose]({CATALOGUE_MARKDOWN}).
- [Repository README](source/README.md) — the complete current GitHub-ready project is in `source/`.
- [Publishing instructions](source/docs/PUBLISHING.md).

Copy the **contents of `source/`**, including `.github/`, to the repository root.
The outer handover directory is a delivery wrapper, not the repository root.
The design brief records the agreed requirements; the decision log distinguishes
adopted decisions from open questions. Consult the verification report before
interpreting a scientific claim or choosing the next research experiment.

Catalogue authorship: **{metadata['authorshipStatement']}**.
Package credit, licences and disclaimer are retained in `source/README.md`,
`source/LICENSE` and `source/THIRD_PARTY_LICENSES.md`.

## Verify the extracted handover

Before modifying any files, run this from the extracted handover directory:

```sh
python3 tools/verify_handover.py
```

This uses only Python's standard library. It checks the complete file set, sizes,
SHA-256 hashes, required source files and byte-for-byte equality of the app's
embedded catalogue with the canonical PDF and Markdown. `MANIFEST.json` describes
every payload file; `SHA256SUMS` also covers the manifest. Checksums establish
internal consistency, not authorship or scientific validity.

To reproduce the handover from the source tree, see `source/tools/build_handover.py`
and the continuation guide. Building additionally requires Node.js to check that
the application's existing standalone file is current.
'''


def start_html(build_date: str, metadata: dict, browser: str) -> str:
    document_links = "\n".join(
        f'<li><a href="source/docs/handover/{name}">{html.escape(label)}</a></li>'
        for name, label in HANDOVER_DOCUMENTS)
    return f'''<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Aperiodic Life {release.VERSION} — handover</title>
<style>
:root{{color-scheme:light dark;font-family:system-ui,sans-serif;line-height:1.6}}
body{{max-width:920px;margin:0 auto;padding:2rem 1.25rem 4rem}}
h1{{line-height:1.2;font-size:clamp(2rem,5vw,3rem)}}h2{{margin-top:2rem;line-height:1.3}}
a{{color:#176c87;text-underline-offset:.16em}}li{{margin:.35rem 0}}
.meta{{color:#52616c}}.actions{{display:flex;gap:.8rem;flex-wrap:wrap;margin:1.5rem 0}}
.button{{display:inline-block;padding:.7rem 1rem;border:1px solid #176c87;border-radius:.4rem}}
.primary{{background:#155d72;color:#fff}}code{{font-size:.95em}}pre{{padding:1rem;border:1px solid #aaa;border-radius:.4rem;overflow-x:auto}}
.note{{border-left:4px solid #42869a;padding-left:1rem}}
@media(prefers-color-scheme:dark){{a{{color:#90d8ed}}.meta{{color:#b7c3ca}}.primary{{color:#fff}}}}
</style>
</head>
<body>
<main>
<p class="meta">Handover · {build_date} · Catalogue {metadata['version']}, revision {metadata['documentationRevision']}</p>
<h1>Aperiodic Life {release.VERSION}</h1>
<p>The current application, complete catalogue, reproducible source and the requirements and decisions needed to continue the project.</p>
<div class="actions"><a class="button primary" href="{browser}">Open the app</a><a class="button" href="{CATALOGUE_PDF}">Open the complete catalogue (PDF)</a></div>
<p>Extract the ZIP before opening these links. The app runs locally in a WebGL2-capable browser. Its About button also opens the embedded PDF catalogue and downloads the editable Markdown prose.</p>
<h2>Design brief, rationale and decision log</h2>
<ul>{document_links}</ul>
<p>The design brief preserves the agreed requirements and preferences. The rationale explains their purpose; the decision log records adopted decisions and open questions. The continuation guide gives practical next steps, and the verification report states what has and has not been checked.</p>
<h2>Catalogue and source</h2>
<ul>
<li><a href="source/docs/catalogue/README.md">Catalogue build instructions</a> and <a href="{CATALOGUE_MARKDOWN}">editable catalogue prose</a>.</li>
<li><a href="source/README.md">Repository README</a> and <a href="source/docs/PUBLISHING.md">publishing instructions</a>.</li>
<li><a href="source/LICENSE">Project licence</a> and <a href="source/THIRD_PARTY_LICENSES.md">third-party notices</a>.</li>
</ul>
<p class="note">The GitHub-ready project is in <code>source/</code>. Copy its contents, including <code>.github/</code>, to the repository root. The outer handover directory is a delivery wrapper.</p>
<p>The catalogue contains {len(metadata['entries'])} presets and {len(metadata['ruleRegister'])} complete rule specifications. Authorship: <strong>{html.escape(metadata['authorshipStatement'])}</strong>.</p>
<h2>Verify before making changes</h2>
<p>From the extracted handover directory, run:</p>
<pre><code>python3 tools/verify_handover.py</code></pre>
<p>The verifier needs only Python's standard library and checks every file against <a href="MANIFEST.json">MANIFEST.json</a> and <a href="SHA256SUMS">SHA256SUMS</a>, including the embedded catalogue. Checksums establish internal consistency, not scientific validity. See the <a href="source/docs/handover/VERIFICATION.md">verification report</a> for the evidence and limitations.</p>
<p><a href="README.md">Read this handover guide as Markdown</a>.</p>
</main>
</body>
</html>
'''


def validate_zip_path(path: Path, output: Path) -> Path:
    if path.is_symlink():
        raise ValueError("ZIP output must not be a symbolic link")
    path = path.expanduser().resolve()
    root = release.ROOT.resolve()
    if path.suffix.lower() != ".zip":
        raise ValueError("ZIP output must have a .zip suffix")
    if (path == root or root in path.parents or path in root.parents
            or path == output or output in path.parents or path in output.parents):
        raise ValueError("ZIP output must be outside the source tree and handover directory")
    if path.exists():
        raise FileExistsError(f"ZIP output already exists: {path}")
    return path


def build(output_dir: Path, zip_path: Path | None = None, build_date: str | None = None) -> dict:
    if output_dir.is_symlink():
        raise ValueError("handover output must not be a symbolic link")
    output = release.validate_output_directory(output_dir)
    archive = validate_zip_path(zip_path or Path(str(output) + ".zip"), output)
    build_date = build_date or date.today().isoformat()
    if date.fromisoformat(build_date).isoformat() != build_date:
        raise ValueError("build date must be in YYYY-MM-DD format")
    release.require_release_version()
    release.require_current_standalone()
    release.require_catalogue()
    files = release.source_files()
    by_name = {name: (path, mode) for name, path, mode in files}
    required = {"docs/handover/" + name for name, _ in HANDOVER_DOCUMENTS}
    required.update({"README.md", "LICENSE", "THIRD_PARTY_LICENSES.md", "CONTRIBUTING.md",
                     ".gitignore", ".gitattributes", ".github/workflows/ci.yml", "docs/PUBLISHING.md",
                     "aperiodic-life-standalone.html", "tools/build_handover.py"})
    missing = required - set(by_name)
    if missing:
        raise ValueError(f"missing required handover source files: {sorted(missing)}")
    output.parent.mkdir(parents=True, exist_ok=True)
    archive.parent.mkdir(parents=True, exist_ok=True)
    browser = f"browser/aperiodic-life-{release.VERSION}.html"
    with tempfile.TemporaryDirectory(prefix="aperiodic-handover-", dir=output.parent) as temporary:
        staged = Path(temporary) / "handover"
        staged.mkdir()
        # Read each source file once, preserving its exact bytes in the snapshot.
        modes = {}
        for name, source, mode in files:
            relative = "source/" + name
            release.copy_file(source, staged / relative, mode)
            modes[relative] = mode
        metadata = json.loads((staged / CATALOGUE_METADATA).read_text(encoding="utf-8"))
        require_catalogue_version(metadata["version"])
        standalone = (staged / "source/aperiodic-life-standalone.html").read_text(encoding="utf-8")
        app = embedded_browser(standalone, (staged / CATALOGUE_PDF).read_bytes(),
                               (staged / CATALOGUE_MARKDOWN).read_bytes(), metadata["version"])
        generated = {
            browser: (app, 0o644),
            "README.md": (start_readme(build_date, metadata, browser), 0o644),
            "START_HERE.html": (start_html(build_date, metadata, browser), 0o644),
            "tools/verify_handover.py": (VERIFIER, 0o755),
        }
        for name, (text, mode) in generated.items():
            release.write_text(staged / name, text, mode)
            modes[name] = mode
        manifest = {
            "schema": 1, "project": "Aperiodic Life", "version": release.VERSION,
            "catalogueVersion": metadata["version"],
            "buildDate": build_date, "catalogueRevision": metadata["documentationRevision"],
            "catalogueRevisionDate": metadata["documentationRevisionDate"],
            "catalogueAuthorship": metadata["authorshipStatement"], "browserApp": browser,
            "sourceRoot": "source", "archiveRoot": output.name,
            "counts": {"patterns": len(metadata["entries"]),
                       "completeRules": len(metadata["ruleRegister"]),
                       "ruleTemplates": len(metadata["rulePresets"]),
                       "sourceFiles": len(files), "payloadFiles": len(modes)},
            "files": [{"path": name, "bytes": (staged / name).stat().st_size,
                       "sha256": release.sha256_file(staged / name), "mode": f"{mode:04o}"}
                      for name, mode in sorted(modes.items())],
        }
        release.write_text(staged / "MANIFEST.json", json.dumps(manifest, indent=2) + "\n")
        modes["MANIFEST.json"] = 0o644
        checksums = "".join(f"{release.sha256_file(staged / name)}  {name}\n" for name in sorted(modes))
        release.write_text(staged / "SHA256SUMS", checksums)
        modes["SHA256SUMS"] = 0o644
        checked = subprocess.run([sys.executable, str(staged / "tools/verify_handover.py")],
                                 capture_output=True, text=True, check=False)
        if checked.returncode:
            raise ValueError("staged handover failed verification: " + checked.stderr.strip())
        verification = json.loads(checked.stdout)
        entries = [(output.name + "/" + name, (staged / name).read_bytes(), mode)
                   for name, mode in sorted(modes.items())]
        with tempfile.TemporaryDirectory(prefix="aperiodic-handover-zip-", dir=archive.parent) as zip_temp:
            staged_zip = Path(zip_temp) / "handover.zip"
            release.write_zip(staged_zip, entries)
            release.verify_zip(staged_zip)
            # All preparation is complete. Recheck destinations before publishing.
            release.validate_output_directory(output)
            validate_zip_path(archive, output)
            was_empty_directory = output.exists()
            if was_empty_directory:
                output.rmdir()
            try:
                staged.rename(output)
            except OSError:
                if was_empty_directory and not output.exists():
                    output.mkdir()
                raise
            try:
                # Hard-link publication is atomic and refuses to overwrite an
                # archive created between validation and this final operation.
                os.link(staged_zip, archive)
            except OSError:
                shutil.rmtree(output)
                if was_empty_directory:
                    output.mkdir()
                raise
    return {"outputDirectory": str(output), "zip": str(archive),
            "zipSha256": release.sha256_file(archive), "zipBytes": archive.stat().st_size,
            **verification}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--zip", type=Path, dest="zip_path", help="default: OUTPUT_DIR.zip")
    parser.add_argument("--date", dest="build_date", help="ISO build date; default: local date")
    args = parser.parse_args()
    try:
        print(json.dumps(build(args.output_dir, args.zip_path, args.build_date), indent=2))
    except (ValueError, RuntimeError, OSError, KeyError, TypeError) as error:
        print(str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
