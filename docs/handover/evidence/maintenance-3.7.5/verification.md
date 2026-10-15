# Verification record

**Handover date:** 15 October 2026. **Application:** 3.7.5. **Catalogue:** retained 3.7.4, revision 2 (14 October 2026).

## Changes and review scope

Repeated Randomise actions were reproduced with the original code: each passed the unchanged `aperiodic` seed to the deterministic automaton and returned the same initial state. Randomise/R now generates and displays a fresh seed. Apply seed/Enter repeats a specified seed. Startup, geometry rebuilds and curated random examples retain their deterministic inputs.

The canvas is focusable by click or Tab. Arrow keys pan the viewed area in the named direction by 40 CSS pixels, or 120 with Shift. Only a focused canvas consumes these keys. Manual keyboard navigation disables automatic discovery framing without changing simulation states or generation. Form controls, modal dialogs and browser modifier shortcuts retain their keyboard behaviour.

The broader review covered synchronous evolution, topology, borders, rule changes, state counts, snapshots, discovery loading, pointer/keyboard input, source packaging and handover verification. It found no additional simulation defect. Version checks in both the handover and catalogue builders prevented retaining a reviewed catalogue across an application patch release; these now record/check the catalogue version separately while retaining exact scientific source hashes and geometry-version checks. Malformed manifest path `.` now receives a validation error instead of an indexing exception.

## Checks run for this release

Runtime: Node.js v24.19.0 and Python 3.12.14. The machine-readable record and complete command output are retained in [maintenance-3.7.5.json](evidence/maintenance-3.7.5.json) and its linked logs.

| Check | Coverage |
|---|---|
| `python3 tools/project.py test standard` | All JavaScript syntax; core rules; interactions including fresh/replayed seeds and focused arrow panning; snapshots; discovery and research evidence; static runtime assets; standalone freshness; source, site and handover packaging |
| `python3 tools/project.py test topology` | Independent reconstruction of adjacency and boundaries for square, hexagonal, Hat and Penrose patches |
| `python3 tools/project.py test large` | 372,100-cell Hat patches, long traveller replays including 1,129 generations, 143,010-cell Penrose patches in both orientations, and boundary/allocation checks |
| `node test-core-mutations.js` | 38,400 full-state comparisons against independent transitions, with 12,960 interleaved graph, rule, state-count, border, randomisation and painting changes across four tilings; included in standard profile |
| `node research/verify-catalog.js` | All 89 curated configurations replayed against their declared verification contracts |
| `python3 docs/catalogue/build_catalogue.py --check` | 89 presets, 56 complete rules, 12 templates, prose coverage, source hashes and exact geometry/catalogue version |
| `python3 test-catalogue.py` | Four optional regressions: retained-catalogue compatibility, incompatible/future versions, geometry-version agreement and stale source-hash rejection |
| Packaging tests in standard profile | Eleven release-package, four repository/site and nine handover tests, including deterministic archives, catalogue embedding, tamper detection, safe paths and publication rollback |

Interaction regressions use the production automaton on all four tilings and both neighbourhoods. They check actual complete cell states, seed replay after evolution, buttons and keyboard events, repeated fallback entropy, density endpoints, locked borders and busy-state protection. Focused arrow tests exercise actual camera transforms, direction and step size, unchanged zoom/cells/generation, focus gating and manual camera ownership. These are dependency-free interaction tests; they do not substitute for a real browser rendering pass.

`core.js`, `discoveries.js` and all 15 catalogue assets other than its builder and README remain byte-for-byte equal to the attachment. This includes the PDF, Markdown prose, structured data, geometry, fonts and retained scientific evidence. The PDF SHA-256 remains:

```text
8f9aa2796ab173ae2253a9578a1c967ac20dd8d654d490169839557b1fb16f20
```

## Browser limitation

`node test-browser.js` was attempted and could not launch because Chromium is absent. The browser suite now includes Randomise/replay and canvas-arrow regressions for HTTP and local standalone navigation, and passes syntax validation, but those browser tests were not executed here. No real-phone, GPU rendering, hosted GitHub Actions/Pages or deployed-site acceptance is claimed. Run the suite with Chromium installed (or set `CHROMIUM` to its executable) before target-browser acceptance; see [TESTING.md](../TESTING.md).

## Historical evidence

The earlier [catalogue-revision-2-review.json](evidence/catalogue-revision-2-review.json), [handover-checks.json](evidence/handover-checks.json) and [handover-builder-smoke.json](evidence/handover-builder-smoke.json) retain their original dates and scope. They describe the earlier catalogue/handover work, including its PDF visual review. The unchanged PDF has not been regenerated or newly visually reviewed for this application patch. No new discovery campaign, originality search or proof of indefinite aperiodic travel is claimed.

## Verify and reproduce the delivery

Before modifying an extracted handover, run from its outer directory:

```bash
python3 tools/verify_handover.py
```

The builder runs this same integrity verifier before publishing each handover, and the delivered ZIP is checked again after fresh extraction. It checks complete file membership, sizes, SHA-256 hashes, required contents, version records and exact equality of the embedded catalogue assets. Checksums establish internal consistency, not authorship.

Development commands run from `source/`. Rebuild the application with `node build-standalone.js`, then use `python3 tools/build_handover.py --output-dir ../aperiodic-life-handover-3.7.5-2026-10-15 --date 2026-10-15` with a new or empty destination. Preserve historical evidence; update the current record with actual outcomes after future changes.
