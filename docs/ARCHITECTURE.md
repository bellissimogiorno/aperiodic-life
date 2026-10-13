# Architecture

## Release shape

`build-standalone.js` embeds `index.html`, `styles.css`, `core.js`,
`discoveries.js`, and `app.js` in `aperiodic-life-standalone.html`.

There is one application and one standalone filename. The expanded and standalone forms execute the same JavaScript sources. The browser namespace is only `window.AperiodicLifeCore`.

## Layers

### Geometry and graph core (`core.js`)

Four builders implement a common patch contract:

- `buildSquarePatch(size)`
- `buildHexPatch(radius)`
- `buildEinsteinPatch(depth)`
- `buildPenrosePatch(depth, options)`

`buildPatch(tiling, depth, options)` dispatches to them. Every patch supplies display geometry, exact or integer coordinate identity, two CSR contact graphs, graph-specific boundary definitions, boundary-distance arrays, bounds, and picking data.

### Automaton core (`core.js`)

`Automaton` owns preallocated typed arrays for state, next state, neighbour counts, and live-cell indexing. `step()` performs synchronous totalistic evolution and computes:

- exact changed-cell count;
- two deterministic state hashes;
- smoothed timing;
- updated live-cell list.

Hashes are only candidate keys. Browser cycle detection confirms equality against the stored state bytes before reporting a cycle.

### Catalogue (`discoveries.js`)

Each entry also has immutable `provenance` metadata: classification, short credit, scope note, source links and local evidence paths. Edit `research/fixtures/catalogue-provenance.json` and run `node tools/build_catalogue_credits.js` to update the embedded data and `docs/CATALOGUE_CREDITS.md`. The standard tests reject missing or stale records. No runtime network request is needed; source links open only when the user follows them.

The catalogue is declarative data. An entry specifies a board, graph, rule, state count, border, declared playback speed, view policy, and either explicit cells or a deterministic random seed. Speeds are integers in the UI's 1–240 range, and the exact 81-entry mapping is frozen by regression tests; view objects and trajectory-bound arrays are immutable. Claimed periods, finite travel, horizons, and presentation metadata are regression-tested by `test-discoveries.js`; `research/verify-catalog.js` independently checks the behavioural catalogue claims. Traveller entries may also declare directionality, live-population bounds, component-count history, required birth or survival clauses, and exact translated phases; independent tests replay their complete states and local graph translations. Regular-hexagonal fixtures use axial translations; Penrose fixtures additionally require a checked local-graph radius because congruent translated tile sets do not imply a global symmetry of the aperiodic board.

View metadata has one of three modes:

```text
initial:    mode, padding
trajectory: mode, bounds[minX,minY,maxX,maxY], steps, padding
contain:    mode, padding
```

All trajectory envelopes are derived from, and tested against, every nonzero tile's complete bounding box over generations 0 through `steps`. Fixed initial views are likewise observed through their asserted behaviour horizons. Containment examples are required to outgrow the initial padded frame, ensuring the automatic policy is exercised by the advertised evolution.

### Browser layer (`app.js`)

The browser layer provides:

- instanced WebGL2 rendering;
- patch rebuild coalescing;
- simulation timing with bounded backlog;
- single-pointer painting, robust panning, cursor-anchored zooming, and export;
- dynamic board controls;
- exact whole-state cycle detection;
- discovery loading, declared playback speed, and declarative framing;
- an accessible contextual dialog explaining rules, states, graphs, and finite boundaries;
- accessibility and mobile drawer behaviour.

## Common patch contract

A patch contains at least:

```text
tiling, tilingLabel, seed, depth, tileCount
verticesPerTile, outline
transforms, vertices, centers, bboxes
coordinates (where applicable), tileTypes, typeCounts
edgeGraph, touchGraph
edgeBoundary, touchBoundary
edgeBoundaryDistance, touchBoundaryDistance
bounds, buildMilliseconds
```

The graph contract is compressed sparse row:

```text
offsets: Uint32Array(tileCount + 1)
neighbors: Uint32Array(2 * edgeCount)
degree: Uint32Array(tileCount)
histogram, edgeCount, maxDegree, averageDegree
boundary, boundaryDistance
```

## Geometry backends

### Square

Cells are indexed by integer `(column,row)` coordinates. Shared-edge pairs are horizontal and vertical coordinate differences of one. Touch pairs add the four diagonals. The finite board is a centred square.

### Hexagonal

Cells use axial `(q,r)` coordinates with cube radius `max(|q|,|r|,|-q-r|)`. Six integer direction offsets generate adjacency. In the regular honeycomb, two hexagons meeting at a vertex also share an edge, so both graph choices coincide.

### Einstein hat

The H/T/P/F hierarchy produces affine copies of a 13-vertex hat. The mathematical construction lies on a half-scale triangular lattice; the implementation evaluates affine coordinates in binary64 and rejects either lattice-coordinate residual above `1e-6` before snapping to canonical integer keys. Those integer keys determine topology. Float32 coordinates are downstream display and picking products. The prototype's unique double-length edge is split into two elementary lattice segments before ownership is calculated.

### Penrose P3

Robinson triangles are deflated exactly over `Z[φ]` and paired into complete thin or thick rhombs. A canonical four-integer point key identifies every constructed vertex. See the [Penrose backend](PENROSE_BACKEND.md).

## Boundary semantics

Shared-edge boundary cells own an exposed elementary edge. Touch-boundary cells include every tile incident to either endpoint of an exposed edge, including point-only contacts. Breadth-first distance is computed separately in each graph.

For regular square and hexagonal boards the two boundary sets coincide. The square distance fields also coincide: diagonal Moore-graph steps do not shorten the minimum row-or-column distance to the perimeter.

## Rendering

The renderer uses one prototype polygon for the active patch:

- unit square for square cells and affine Penrose rhombs;
- unit regular hexagon for hex cells;
- 13-vertex hat for Einstein cells.

Per-cell affine transforms, byte state, and byte tile type are instanced attributes. Changing tiling rebuilds geometry buffers; stepping updates only the state buffer.

## Discovery framing and camera ownership

Loading a discovery applies its declared speed and view after the exact state has been installed:

- `initial` fits the generation-0 nonzero support with the declared padding. Whole-field examples use larger padding and naturally cover nearly the complete patch.
- `trajectory` first computes the fit for one verified world-coordinate envelope through generation `view.steps`. If it yields at least 3 CSS pixels per world unit, the envelope remains fixed for that interval; from the next generation onward, a still-managed trajectory uses containment-style following so continuing mobile or expanding behaviour does not later escape. If the envelope would yield less than 3 CSS pixels per world unit, the loader instead closely fits the generation-0 state and enables containment immediately. This keeps long paths such as the Penrose traveller legible on narrow or portrait viewports while using its complete generation-0-through-220 corridor when the viewport can show it clearly.
- `contain` initially fits the seed, then checks the current nonzero support after every manual or timed simulation step. It zooms out only when required and never zooms in. After choosing the zoom, each axis is shifted only far enough to bring the padded support inside the visible rectangle instead of recentring it, reducing camera jitter.

R-pentomino and Acorn use `contain`. A nonzero manual pan, wheel zoom, or **Fit view** disables automatic containment immediately. State-editing and reseeding operations also clear the active discovery. This ownership rule prevents automatic presentation from undoing a user's chosen camera position.

The browser separately records whether the discovery view is still managed. On viewport resize—including orientation changes that alter its dimensions—managed initial and trajectory modes recompute their fit for the new aspect ratio; trajectory mode also re-evaluates the 3 CSS-pixel legibility threshold. Managed containment calls `containState`, so it can zoom out if necessary even while paused. Manual camera input clears the managed flag; subsequent resize still refreshes the canvas dimensions but deliberately preserves the user's centre and zoom.

Pan is the default pointer tool. Paint mode remains an explicit continuous-drag operation, while Shift, Alt, or a non-primary button temporarily selects pan. The controller records one active pointer ID, requests canvas capture on a best-effort basis, and receives move/up events at window level so a rejected capture or movement beyond the canvas does not truncate the drag. Cancellation, `lostpointercapture`, or window blur clears the gesture state and cursor class safely. A mouse/pen move with `buttons === 0` also closes the active gesture: this repairs the case where release occurred outside the window and its `pointerup` was never delivered.

Paint direction is gesture-local. It begins unset and is chosen from the first cell actually hit: a live cell starts erasing and any other cell starts painting state 1. Consequently a press in empty margin may move into the patch naturally and cannot reuse stale paint/erase state from a previous gesture.

The mobile controls drawer is closed only after a discovery has loaded successfully, using the same helper as its close button. This exposes the newly framed canvas, updates `aria-expanded`, and returns focus to the drawer opener; a failed load keeps the controls open for correction.

## Rule-help dialog

The Tiling and Rule headings each expose a labelled **?** button with `aria-haspopup="dialog"` and a shared `aria-controls` target. Both open the same native modal dialog, providing one shared complete explanation. The content defines synchronous updates, edge/touch adjacency, the finite dead exterior and graph-distance border rings, compact and multi-digit `B/S` notation, and binary versus refractory transitions. A worked `B2/S`, four-state example explicitly gives `1 → 2 → 3 → 0` and says that only state 1 contributes to neighbour counts.

Opening moves focus into the modal. Native modal behaviour confines keyboard focus and supplies Escape handling; both visible close controls submit the same `method="dialog"` form. Closing restores focus to the contextual button that opened it. Global simulation shortcuts ignore key events while the dialog is open.

## Translation-aware research output

`research/search-mobile-patterns.js` uses a two-stage exact-return check: a necessary translated shape signature first narrows candidates, then every nonzero state must map onto a congruent translated tile with the identical state value. A local graph comparison measures how far the translation preserves the selected contact graph.

An exact translated return is one strong finite observation, not the definition of every catalogue traveller. An observed finite-horizon traveller may instead be accepted when a deterministic replay stays active and boundary-clear, remains within declared compactness/component bounds, and continues making strongly directional net progress through its stated horizon. On an aperiodic tiling, neither classification by itself asserts indefinite motion.

There is one important geometric qualification. On the regular hexagonal lattice, the local update rule and substrate are invariant under every axial translation. Therefore an exact complete-state return by a nonzero axial vector proves that the orbit repeats translated forever on the unbounded lattice; a finite-board production replay then checks implementation and boundary clearance. A Penrose patch has no global translation symmetry, so even an exact translated state with a radius-3 neighbourhood match proves only the measured local recurrence. The catalogue and documentation classify the former as exact spaceships and the latter as finite-horizon travellers.

Schema-3 output maintains two bounded pools. The general elite pool ranks the motion objective; a separate pool retains exact-translation hits and deduplicates them by canonical initial-state signature. Its comparison order prioritises neighbourhood radius, latest return, return count, evaluated duration, translation distance, and secondary motion measures. The best member of each relevant pool is replayed against the dense `Automaton`. Keeping the pools separate prevents an exact return from being counted but omitted merely because it scores below an unrelated motion candidate.

## Cycle detector

The UI stores state snapshots under a 16 MiB approximate budget. Capacity is

```text
clamp(floor(16 MiB / tileCount), 64, 1024)
```

Each generation is keyed by two state hashes and alive count, then checked byte-for-byte against matching snapshots. Evicted and reset snapshots are recycled through a same-size buffer pool. The detector reports exact whole-board cycles within the retained history window. It does not detect translation-equivalent travellers; research tools perform that separate geometric check.

## Determinism

Geometry, seeded random initialisation, catalogue loading, and research scripts are deterministic for a fixed source revision. Rendering pixels are not promised byte-identical across GPUs or browsers.

## Priority-table rules

The named registry in `core.js` defines immutable ordered semi-totalistic tables. Every neighbour state, including zero, contributes to its own count. First-match priority and the default-to-zero transition are explicit. Each registered table is quiescent on an all-zero neighbourhood. Dense stepping therefore marks every nonzero cell and its neighbours before interpreting tables, while still updating and hashing the entire board. Ordinary B/S stepping keeps its state-1 neighbour accumulation. The sparse engine follows the same synchronous semantics; independent references in `research/aperiodic-reference.js` verify them.

The rule selector locks the state count for a table and explains that its higher states influence neighbours. Exact snapshots retain named rules and reject mismatched state counts. Penrose depth 11 is available for the larger launcher examples. `test-priority-rules.js` checks transitions, all-state trajectories, emitted-body independence and labelled tile/dead-halo matches; it does not infer infinite propagation from a finite match.
