# User and developer guide

Aperiodic Life uses one synchronous automaton engine on four kinds of board. Each tile is a cell; the selected contact graph determines its neighbours. The application runs offline and shares the same source between its expanded and standalone forms.

For installation-free use, open [aperiodic-life-standalone.html](../aperiodic-life-standalone.html). For development, run the following from the repository root:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [http://127.0.0.1:8000/index.html](http://127.0.0.1:8000/index.html). A WebGL2-capable browser is required.

## Discoveries

The catalogue contains **69 configurations** covering classic square patterns, hexagonal benchmarks, aperiodic oscillators, compact travelling dynamics, long transients, and collective fields. Search by name, tiling, graph, rule, or description.

- **Load** prepares the exact initial configuration and remains paused.
- **Load & run** prepares the same configuration and immediately starts the simulation.

Each entry supplies a playback speed and view policy. On narrow layouts, a successful load closes the controls drawer to expose the canvas. An unsuccessful load keeps the controls available with an error message.

The [rule survey](RULE_SURVEY.md) explains the catalogue's scientific claims. The [oscillator atlas](../research/figures/oscillator-atlas.svg) shows selected exact phases.

## View and playback

**Pan view** is the default pointer tool. Drag with the primary button to move the viewport; use the wheel to zoom around the pointer. **Paint / erase cells** edits the board. Shift-drag, Alt-drag, or a non-primary button temporarily pans even when Paint is selected.

A Paint drag chooses its action at the first cell it reaches: a live cell starts erasing, and another cell starts painting state 1. A drag may begin in an empty margin. Cancellation, capture loss, window blur, and buttonless mouse/pen re-entry clear the gesture.

Discovery presentation has three policies:

| Policy | Behaviour |
| --- | --- |
| `initial` | Fit the initial nonzero support with the entry's declared padding. |
| `trajectory` | Fit a verified envelope for a stated interval, then follow the continuing support. Use close tracking immediately if the full envelope would be too small to read. |
| `contain` | Start close to the seed, then pan or zoom out only when necessary to keep the evolving support visible. |

Containment never zooms in. The trajectory legibility threshold is 3 CSS pixels per world unit. R-pentomino and Acorn use containment; other examples use their declared initial or trajectory views.

Manual pan, wheel zoom, or **Fit view** cancels automatic framing. Resizing the viewport recomputes a managed view, including while paused, but preserves a manually chosen camera. This makes the same example usable in landscape and portrait layouts.

## Boards

| Tiling | Browser choices | Shared-edge graph | Edge-or-corner graph |
| --- | --- | --- | --- |
| Square | 25×25 to 301×301 | Four-neighbour von Neumann | Eight-neighbour Moore |
| Hexagonal | Radius 8 to 128 | Six neighbours | The same six neighbours |
| Einstein hat | 25 to 54,289 hats | Canonical lattice segments | All canonical lattice contacts |
| Penrose P3 | 20 to 54,560 rhombs | Exact shared rhomb edges | All exact vertex contacts |

The core also supports 372,100 hats and 143,010 Penrose rhombs for large-patch tests. These sizes need substantial memory. Penrose sun and mirrored-sun views are congruent copies of the same undecorated graph-totalistic substrate with different tile ordering.

## Rules and boundaries

Rules use totalistic `B…/S…` notation:

```text
B3/S23          birth on 3; survive on 2 or 3
B2,4/S1,2,3     delimited form
B[10]/S[9,10]   bracket form for multi-digit counts
```

Compact digits denote separate counts: `B12/S` means birth on one or two neighbours. An empty list never matches.

Every cell reads the same generation before all cells update. State 1 is live and is the only state counted by neighbours. With two states, a live cell that fails the survival rule becomes zero. With `C > 2` states it instead advances through refractory states `2…C−1` before returning to zero. For example, `B2/S` with four states gives birth at exactly two live neighbours and then follows `1 → 2 → 3 → 0` unconditionally.

Cells beyond a finite patch are absent and never counted. Dead-border rings lock successive graph-distance layers at state zero. Distances use the selected contact graph, not Euclidean distance. The **?** buttons beside Tiling and Rule explain these semantics in the application.

## Saving experiments

**Save state** downloads the complete experiment, including nonzero states, refractory cells, generation, graph, rule, border, camera, and presentation controls. **Load state** validates the file and restores it paused. Settings-only exports from **Copy settings** omit the evolved cell array and cannot be imported as exact states.

State files include graph fingerprints to detect accidental geometry or tile-ordering mismatches. They are not authenticity signatures. See the [configuration reference](CONFIGURATION.md) for the schemas and limits.

## Source layout

| File or directory | Purpose |
| --- | --- |
| `index.html`, `styles.css` | Controls, semantic markup, and layout |
| `core.js` | Geometry, graphs, rules, automaton, and picking |
| `discoveries.js` | Immutable catalogue states and presentation metadata |
| `app.js` | WebGL2 rendering, input, playback, and state exchange |
| `build-standalone.js` | Reproducible standalone builder |
| `research/` | Search tools, replay fixtures, and generated figures |
| `tools/` | Development, release, repository-export, and site helpers |
| `.github/` | Contribution templates and workflows |

Node.js 22+ and Python 3.10+ run development tools without package-manager installation. Chromium is an additional prerequisite for browser tests.

```bash
node build-standalone.js
node build-standalone.js --check
python3 tools/project.py test standard
python3 tools/project.py test topology
```

All commands above run from the repository root. For details see [architecture](ARCHITECTURE.md), [core API](CORE_API.md), [testing](TESTING.md), [research tools](../research/README.md), and [contributing](../CONTRIBUTING.md).
