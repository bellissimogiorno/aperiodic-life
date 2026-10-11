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

Core tests compare synchronous updates against a direct per-cell reference model. They cover rule parsing, multi-digit notation, rejected inputs, refractory states, live counts, hashes, changed-cell counts, graph switching, deterministic randomisation, dead-border masks, and picking.

Independent topology tests reconstruct adjacency and both boundary-distance fields without trusting production graph maps. The hat checks include doubled lattice areas, the split side, disk topology, segment ownership, affine metrics, and sampled picking. Penrose tests reconstruct triangle geometry, rhomb pairing, edge ownership, vertex contacts, and boundary layers.

## Catalogue and structures

```bash
node test-discoveries.js
node research/verify-catalog.js
node test-structures.js
node test-traveller-evidence.js
```

All 48 catalogue entries have explicit replay contracts. Exact periods require the first return of the complete state; population counts and hashes are insufficient. Extinction requires every cell to be zero, including refractory states. Transient-cycle entries must not return before the stated transient and period.

Spaceship checks compare exact translated states. Regular hexagonal fixtures use axial coordinates; Penrose traveller checks additionally compare the local contact graph and stay within their declared finite horizons. Catalogue contracts check the declared rule-clause activity during each finite trajectory.

The structure suite uses direct-neighbour stepping to verify the localised Penrose oscillators, hat rotating waves, refractory clock, and directional transient. It also checks the hat waves’ 120-degree phase relations and the clock family for all state counts from 4 through 255. Boundary clearance and full-state periods distinguish local patterns from finite-edge effects or misleading population cycles.

Presentation checks are separate from dynamics. Playback speeds must match each entry's declared values. View metadata is immutable and schema-valid; every fixed trajectory envelope must contain the complete rendered bounding box of every nonzero tile at every generation in its interval.

## Interaction and state files

Dependency-free interaction tests exercise camera ownership, responsive framing, containment, trajectory legibility, post-horizon following, painting and pan overrides, pointer cancellation, rule-dialog keyboard isolation, and synchronised playback controls during play, pause, and rebuilds.

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
and that both playback buttons agree after loading an example.

The result records whether the application ran through HTTP and direct `file://` navigation or through document injection. GitHub CI requires the HTTP-and-file result. A missing browser or failed navigation is not a browser pass.

Direct acceptance remains necessary for target browser/GPU combinations. Check touch/stylus input, wheel zoom, high-DPI coordinates, narrow layouts, PNG downloads, clipboard export, and standalone opening. Screenshot capture is not a test of the application's PNG-download path.

## Source and release checks

Static checks require the four tilings, all 48 entries, discovery and help controls, complete MIT and BSD notices, and absence of external runtime scripts or styles. `node build-standalone.js --check` requires the checked-in standalone to match the expanded source.

`test-package.py` and `test-repository.py` cover deterministic archives, source completeness, safe paths, file exclusions, integrity metadata, standalone freshness, output-path rejection, and the static-site payload. Both run in the standard profile. See [release operations](OPERATIONS.md) for packaging and [CI](CI.md) for hosted workflows.

Record the commands, runtimes, and outcomes for a release. Report unavailable prerequisites separately from passing checks; automated local checks do not imply a successful hosted workflow or browser run.
