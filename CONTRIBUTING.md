# Contributing to Aperiodic Life

Contributions can improve the simulator, accessibility, performance, documentation, search methods, or the evidence for a new pattern. A small, reproducible change is a useful starting point.

## Getting started

Use Node.js 22 or later and Python 3.10 or later. There are no npm or Python packages to install for the application and standard test runner. Automated browser tests use a separately installed Chromium-compatible executable. The [research guide](research/README.md) describes the dependency-free search tools.

Fork or clone the repository and make a branch for your change. Run commands from the repository root. To inspect the source application:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [http://127.0.0.1:8000/index.html](http://127.0.0.1:8000/index.html). The [architecture](docs/ARCHITECTURE.md), [core API](docs/CORE_API.md), and [developer guide](docs/DEVELOPMENT.md) explain the main files.

## Code and interface changes

Keep the application usable offline and preserve its dependency-free runtime. Use the shared automaton and graph interfaces when adding behaviour. Preserve exact topology and deterministic cell ordering: discovery fixtures and saved state files depend on them.

Edit the source files, then regenerate the standalone when `index.html`, `styles.css`, `core.js`, `discoveries.js`, or `app.js` changes:

```bash
node build-standalone.js
node build-standalone.js --check
python3 tools/project.py test standard
```

Include the regenerated `aperiodic-life-standalone.html` with the source change. Add a focused regression test for a fixed bug or new behaviour where it can verify a meaningful outcome.

Choose further checks to match the change:

| Change | Additional checks |
| --- | --- |
| Geometry, adjacency, or finite boundaries | `python3 tools/project.py test topology` |
| Large-patch allocation, indexing, or construction | `python3 tools/project.py test large` |
| Controls, rendering, or interaction | `python3 tools/project.py test browser`, plus relevant direct browser checks |
| Search tools or retained evidence | `python3 tools/project.py test research`, plus the relevant fixture replay |

The large profile has substantial memory requirements. Browser tests discover Chromium on `PATH`, or use the executable named by the `CHROMIUM` environment variable. If a required environment is unavailable, say which check you could not run; do not report it as passed. For UI changes, include the browser, viewport, reproduction steps, and a screenshot when it helps show the result. Test keyboard access and mobile layout when those interactions change.

For performance changes, retain the benchmark command, environment, input sizes, and before/after measurements. Verify equivalent results independently before claiming a speed improvement. See [testing](docs/TESTING.md) for the existing comparison tests and manual acceptance boundaries.

## Patterns and research contributions

A promising animation is a candidate. A catalogue entry needs reproducible evidence. Include:

- The exact tiling, depth, Penrose orientation where relevant, contact graph, rule, total cell-state count, dead-border setting, and complete initial configuration.
- The deterministic seed and full command line for searches, their stopping conditions and horizons, and the unedited result records.
- A replay through the production engine and an independent check of the stated behaviour. Preserve refractory states and all other nonzero cells.
- The specific claim being made: first-return period, extinction generation, transient length, exact translated return, or activity over a stated finite interval.
- A provenance record in `research/fixtures/catalogue-provenance.json`: check earlier papers, pattern collections and author posts; distinguish authorship of the rule, pattern and selected seed. Record known sources and any uncertainty. Independent rediscovery does not establish historical priority.

For oscillators, establish the first return of the complete state; matching population or hashes is insufficient. Check boundary clearance and, for a localised pattern, show that its behaviour is not sustained by the finite border. For travellers, record compactness, displacement, connectivity, boundary distance, and the exact generations compared. Aperiodic translated returns require checking the surrounding contact graph and remain finite observations unless a separate argument establishes indefinite propagation. Distinguish a localised rotating wave from translation.

When proposing a different rule, identify the clauses actually used during launch and recurring behaviour. Do not count dormant rule clauses as new mechanisms. State the search space and any overlap between campaigns; failed searches do not prove nonexistence.

Write new results to a separate directory first. Keep the complete result records and reproduce a candidate before changing its declared contract. A promoted entry should include suitable catalogue tests, playback speed, framing, and a summary whose claims match the evidence. Run the relevant tests and catalogue verifier:

```bash
node research/verify-catalog.js
node test-discoveries.js
node tools/build_catalogue_credits.js
node build-standalone.js
```

The credits generator updates both the offline catalogue and [readable provenance records](docs/CATALOGUE_CREDITS.md). `node tools/build_catalogue_credits.js --check` rejects missing, duplicate or stale records. The [research guide](research/README.md) and [rule survey](docs/RULE_SURVEY.md) describe the retained methods and limitations.

## Submitting a change

Explain the problem, resulting behaviour, and tests in the pull request. Link an issue when one exists, and identify any remaining limitations. For a bug report, include minimal reproduction steps, version, browser or runtime, and a saved state if it is needed to reproduce the issue.

Keep unrelated formatting and generated research output out of the change. Preserve the [MIT licence](LICENSE) and [third-party notices](THIRD_PARTY_LICENSES.md); identify the source and licence of any imported code or patterns.
