# Running, verifying and packaging Aperiodic Life

## Requirements

The application needs a WebGL2-capable browser. Development tools require Node.js 22 or 24 and Python 3.10 or later. Automated browser checks additionally need Chromium or Google Chrome. No npm or Python package installation is required.

## Run locally

Open `aperiodic-life-standalone.html` directly, or start the local server:

```bash
python3 tools/project.py serve --open
```

The server binds to `127.0.0.1`. It serves the standalone application and allows the modular `index.html` to be opened for development.

## Build and check the standalone

```bash
node build-standalone.js
node build-standalone.js --check
```

The builder embeds `styles.css`, `core.js`, `discoveries.js` and `app.js` into `index.html`, and writes `aperiodic-life-standalone.html`. Commit the generated file with any runtime changes. Packaging and CI reject a missing or stale standalone.

## Verify the application

```bash
python3 tools/project.py test standard
python3 tools/project.py test topology
python3 tools/project.py test large
python3 tools/project.py test browser
python3 tools/project.py test research
```

`python3 tools/project.py test all` runs every profile and avoids duplicate commands. The large profile checks patches of up to 372,100 hats and 143,010 Penrose rhombs. Allow several gigabytes of available memory; its Node processes have explicit heap limits.

The browser harness tests application interactions over local HTTP and opens the standalone through `file://`. Set `CHROMIUM` to a browser executable when it is not on `PATH`. Under restrictive navigation policies, the local harness can use document injection; that result checks application behaviour but does not establish that HTTP and file navigation work. CI requires both actual navigation modes. See [TESTING.md](TESTING.md) and [CI.md](CI.md).

## Build release files

Keep `VERSION` and `tools/package.py` aligned at `3.7.1`. Run the tests above, then:

```bash
python3 tools/package.py --output-dir ../aperiodic-life-release
```

The output directory must be new or empty and outside the source tree. Existing files are not replaced. The packager prepares and checks the files in a temporary directory before moving the completed release into place.

| File | Contents |
|---|---|
| `aperiodic-life-3.7.1.html` | The complete offline application, including licence notices |
| `aperiodic-life-source-3.7.1.zip` | Source, tests, documentation, current research fixtures and GitHub configuration, under one `aperiodic-life/` directory |
| `aperiodic-life-source-3.7.1.manifest.json` | Every archived source path, SHA-256 digest, byte size and file mode |
| `aperiodic-life-3.7.1.sha256` | SHA-256 checksums for the other three release files |

The ZIP has sorted paths, fixed timestamps and explicit file modes. Two builds from unchanged source produce identical files with the same Python compression implementation. The packager checks ZIP paths, file types, CRCs and the complete manifest before publishing its local output. It excludes VCS internals, dependency environments, local configuration, caches and common build directories. Ordinary source symlinks are rejected.

Verify downloaded files from their containing directory with:

```bash
sha256sum --check aperiodic-life-3.7.1.sha256
```

For a release check, extract the source ZIP into a new directory, run the standard and topology profiles there, and test the standalone in the target browser. Keep the source ZIP, manifest and checksum file alongside the standalone when distributing it.

## Export source for GitHub

To produce only the source archive:

```bash
python3 tools/export_repository.py --output ../aperiodic-life-source-3.7.1.zip
```

The exporter checks required repository files and standalone freshness. Its archive contents match the source ZIP from the release packager. The destination must be outside the source tree and must not already exist. A different `.zip` filename may be supplied when needed.

Extract the archive before creating the repository; its top-level `aperiodic-life/` directory is the repository root. See [PUBLISHING.md](PUBLISHING.md) for repository and release setup.

## Stage a static site

```bash
python3 tools/build_site.py --output-dir ../aperiodic-life-site
```

This creates only `index.html` containing the standalone, `LICENSE`, `THIRD_PARTY_LICENSES.md` and `.nojekyll`. The destination must be new or empty and outside the checkout. This command stages files locally. The optional manual Pages workflow performs publication when explicitly run; commits and pull requests do not publish the site.
