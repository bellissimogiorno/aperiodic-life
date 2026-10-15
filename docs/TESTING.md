# Testing

Run commands from the repository root with Node.js 22+ and Python 3.10+. The standard, topology, large, and research profiles need no package-manager dependencies. The browser profile also needs a Chromium-compatible executable.

## Profiles

| Command | Coverage |
| --- | --- |
| `python3 tools/project.py test standard` | Syntax, core semantics, interactions, state import/export, catalogue, research helpers, static content, standalone freshness, and packaging |
| `python3 tools/project.py test topology` | Independent square, hexagonal, hat, and Penrose graph and boundary reconstruction |
| `python3 tools/project.py test large` | Large hat and Penrose patches, including allocation and boundary checks |
| `python3 tools/project.py test research` | Catalogue evidence and research-engine consistency |
| `python3 tools/project.py test browser` | Automated Chromium interaction and rendering checks |
| `python3 tools/project.py test all` | All profiles, avoiding duplicate commands |

The large profile includes 372,100 hats and 143,010 Penrose rhombs and needs substantial memory. `tools/project.py` is the executable source of the profile definitions.

## Core and topology

Core tests compare synchronous updates against a direct per-cell reference model. `test-core-mutations.js` adds 38,400 full-state reference comparisons with 12,960 interleaved rule, graph, border and cell-state changes. They cover rule parsing, multi-digit notation, rejected inputs, refractory states, live counts, hashes, changed-cell counts, graph switching, deterministic randomisation, dead-border masks, and picking.

Independent topology tests reconstruct adjacency and both boundary-distance fields without trusting production graph maps. The hat checks include doubled lattice areas, the split side, disk topology, segment ownership, affine metrics, and sampled picking. Penrose tests reconstruct triangle geometry, rhomb pairing, edge ownership, vertex contacts, and boundary layers.

## Catalogue and structures

```bash
node test-discoveries.js
node research/verify-catalog.js
node test-structures.js
node test-traveller-evidence.js
```

All catalogue entries have explicit replay contracts. Exact periods require the first return of the complete state; population counts and hashes are insufficient. Extinction requires every cell to be zero, including refractory states. Transient-cycle entries must not return before the stated transient and period.

`test-hexagonal-evidence.js` additionally uses an unbounded coordinate-map reference whose update code is independent of the production engine. It checks complete-state periods and translations, rotations, genuine full-period cells, equivalence under lattice symmetries and phase shifts, and production parity with boundary clearance. Gun and puffer checks include exact emission equations and permanently separating projections; wall repair requires equality to the pristine evolving wall, including the empty exterior. Negative controls guard against accepting mutated refractory states or emission contracts. The fixture and source records are in `research/fixtures/hexagonal-*.json`.

Spaceship checks compare exact translated states. Regular hexagonal fixtures use axial coordinates; Penrose traveller checks additionally compare the local contact graph and stay within their declared finite horizons. Catalogue contracts check the declared rule-clause activity during each finite trajectory.

The structure suite uses direct-neighbour stepping to verify the localised Penrose oscillators, hat rotating waves, refractory clock, and directional transient. It also checks the hat waves’ 120-degree phase relations and the clock family for all state counts from 4 through 255. Boundary clearance and full-state periods distinguish local patterns from finite-edge effects or misleading population cycles.

Presentation checks are separate from dynamics. Playback speeds must match each entry's declared values. View metadata is immutable and schema-valid; every fixed trajectory envelope must contain the complete rendered bounding box of every nonzero tile at every generation in its interval.

## Interface and asset consistency

`node test-interface.js` executes the production element collector against the IDs in both `index.html` and the generated standalone. Every required ID must be present and unique, and the source runtime URLs must use the current `VERSION`. Negative checks confirm that missing controls are rejected. It is a dependency-free interface contract check, not a real DOM/WebGL browser test.

## Interaction and state files

Dependency-free interaction tests exercise fresh Randomise/R seeds, deterministic Apply seed/Enter replay, busy-state protection, canvas arrow-key focus and camera ownership, responsive framing, containment, trajectory legibility, post-horizon following, painting and pan overrides, pinch scale and midpoint anchoring, two-finger panning, finger lifting, zoom limits, touch paint deferral, pointer cancellation, rule-dialog keyboard isolation, and synchronised playback controls during play, pause, and rebuilds.

Snapshot tests round-trip exact states across all tilings, both graphs, and both Penrose orientations, then continue the restored experiments. They reject malformed files, unsupported values, invalid cell indices, graph mismatches, and nonzero locked-border cells without replacing the current simulation.

## Research tools

`test-research.js` and `test-search-tools.js` compare sparse research evolution with the dense production automaton, check deterministic search behaviour, and exercise exact-translation retention and verification. The current catalogue fixture lives in `research/fixtures/catalogue-verification.json`; its exact claims are replayed against the source.

Search tools are experiments, not proof tests. Save their complete configurations, deterministic seeds, horizons, and output when reporting a candidate. See the [research guide](../research/README.md).

## Browser checks

```bash
node test-browser.js
```

The harness discovers Chromium on `PATH` or uses the executable named by `CHROMIUM`. It exercises WebGL2, tiling and graph controls, discovery loading, playback and cycle display, native mouse interaction, rule-help focus, state-file import, catalogue filtering, rapid rebuilds, and absence of external runtime requests.

Playback checks also use native touch events in portrait and landscape phone
viewports. They verify that the canvas Play/Pause button remains reachable with
the controls drawer closed, open, or scrolled, that pausing stops generations,
and that both playback buttons agree after loading an example. Native two-finger
checks cover pinch scale, midpoint anchoring, panning, cancellation and resumed
painting in both tools and both orientations, for HTTP and standalone pages.
Selective finger lifting and third-finger transitions are covered by the
dependency-free interaction tests.

The result records whether the application ran through HTTP and direct `file://` navigation or through document injection. GitHub CI requires the HTTP-and-file result. A missing browser or failed navigation is not a browser pass.

Direct acceptance remains necessary for target browser/GPU combinations. Check touch/stylus input, pinch and wheel zoom, high-DPI coordinates, narrow layouts, PNG downloads, clipboard export, and standalone opening. Screenshot capture is not a test of the application's PNG-download path.

## Source and release checks

`node tools/build_catalogue_credits.js --check` requires exactly one valid provenance record per example, existing local evidence paths, HTTP(S) source links, and matching generated documentation and offline data. Interaction tests check safe credit rendering, author searching and removal of stale source links when the selection changes. These checks establish consistency of attribution metadata, not historical originality.

`node research/verify-hex-published-provenance.js` independently compares all eleven published hexagonal examples with retained source RLEs, allowing the recorded phase shifts, lattice symmetries and translations. The period-48 source contains two independent oscillators; the verifier checks the extracted component. These identity checks also cover known patterns independently recovered by the search.

Static checks require the four tilings, the complete catalogue, discovery and help controls, complete MIT and BSD notices, and absence of external runtime scripts or styles. `node build-standalone.js --check` requires the checked-in standalone to match the expanded source.

`test-package.py` and `test-repository.py` cover deterministic archives, source completeness, safe paths, file exclusions, integrity metadata, standalone freshness, output-path rejection, and the static-site payload, including the PDF catalogue and its source files. They require those catalogue assets to be present and preserve them byte-for-byte in archives and the staged site. Both run in the standard profile. See [release operations](OPERATIONS.md) for packaging and [CI](CI.md) for hosted workflows.

Record the commands, runtimes, and outcomes for a release. Report unavailable prerequisites separately from passing checks; automated local checks do not imply a successful hosted workflow or browser run.

## Priority tables and intensive-search results

`node test-priority-rules.js` checks every neighbour-count histogram through degree 10, independent state transitions, the original seven Hat/Penrose trajectory fixtures, emitted-body independence and complete labelled polygon/dead-halo returns. `node test-hex-exhaustive-evidence.js` independently checks the five small hexagonal seeds and their complete translated cycles. Both run in the standard and research profiles.

`node research/verify-aperiodic.js --long` additionally reconstructs the 372,100-cell depth-6 Hat patch and repeats the 1,129-generation B and three-state flights; it is included in the large profile. The [search report](GLIDER_SEARCH.md) distinguishes exhaustive finite parameter spaces from sampled campaigns and empirical evidence from proofs.

## Continued-search evidence

The [continued-search report](CONTINUED_SEARCH.md) links the additional rule, launch and emission checks. Portable replay scripts and their recorded limits live under [`research/continued-search`](../research/continued-search/README.md). These include the wake-rule reduction and state-map comparison, the credited Spectre relay adaptation, and finite Hat launcher/emitter records. A finite source cycle is not accepted as an indefinite aperiodic-gun proof.

`node research/continued-search/penrose/verify-twelve.js` compares 131 complete production/sparse states for the reduced three-cell seed and 41 complete states against the disjoint union of twelve isolated bodies. It records translated states and polygon matches for all twelve, but radius-three neighbourhood returns for only five within the displayed horizon. Proper-subset checks and boundary clearance are recorded separately.

`node research/continued-search/hex/verify-selected.js` checks the period-6 puffer, twin launch and period-48 ship against independent axial evolution, including exact head/deposit equations, all-phase separation certificates and complete translated returns. Those regular-lattice certificates supply the additional argument for unbounded emission; finite browser replay alone does not.

## Optional catalogue checks

With the dependencies in `docs/catalogue/requirements.txt` installed, run:

```bash
python3 docs/catalogue/build_catalogue.py --check
python3 test-catalogue.py
```

These checks validate the retained catalogue against the current engine and preset hashes, exact geometry version, and application patch compatibility. They do not rebuild or alter the reviewed PDF. The optional dependencies are not required by the standard test profile.
