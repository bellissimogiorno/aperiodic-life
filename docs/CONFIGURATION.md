# Configuration reference

**Copy settings** emits version-3 JSON describing the experiment controls. It does not include the evolved state array.

```json
{
  "version": 3,
  "tiling": "penrose",
  "patchDepth": 8,
  "penroseSeed": "sun",
  "neighborhood": "touch",
  "rule": "B3/S23",
  "generations": 2,
  "deadBorderRings": 2,
  "density": 0.12,
  "seed": "repeatable",
  "stepsPerSecond": 24,
  "palette": "cyan",
  "drawGrid": true,
  "showTileTypes": true,
  "discovery": "penrose-conway-p12"
}
```

## Fields

| Field | Meaning | Values |
|---|---|---|
| `version` | schema | `3` |
| `tiling` | geometry family | `square`, `hex`, `hat`, `penrose` |
| `patchDepth` | square side, hex radius, or substitution depth | must be valid for the selected backend |
| `penroseSeed` | Penrose orientation | `sun`, `sun-mirror` |
| `neighborhood` | contact graph | `edge`, `touch` |
| `rule` | canonical rule | `B.../S...` or a registered `TABLE:...` name |
| `generations` | states | browser 2–32; fixed by a named table |
| `deadBorderRings` | locked graph-distance rings | browser 0–12 |
| `density` | state-1 probability for randomisation | 0–1 |
| `seed` | deterministic random seed | text |
| `stepsPerSecond` | requested rate | 1–240 |
| `palette` | palette | `cyan`, `ember`, `paper` |
| `drawGrid` | outlines | Boolean |
| `showTileTypes` | Penrose thin/thick substrate colours | Boolean |
| `discovery` | active curated entry, if unchanged | catalogue ID or omitted |

`penroseSeed` and `showTileTypes` are harmless on other tilings. The hex `edge` and `touch` choices produce the same six-neighbour graph.

## Browser board values

```text
square:  25, 51, 101, 201, 301
hex:     8, 16, 32, 64, 128
hat:     1, 2, 3, 4, 5
penrose: 2, 4, 6, 8, 10, 11
```

## Rule notation

Every cell reads the previous generation and all cells update synchronously. For a B/S rule, the neighbour count includes only adjacent cells in state 1, using the selected `edge` or `touch` contact graph. `B` lists the counts that birth a state-0 cell into state 1; `S` lists the counts that keep a state-1 cell in state 1. Compact notation is digit-wise:

```text
B3/S23      birth 3; survive 2 or 3
B12/S       birth 1 or 2
B[10]/S23   birth 10
```

An empty list means no matching counts: `B2/S` births at exactly two but never preserves a state-1 cell. With two cell states, a live cell that does not survive returns immediately to state 0. With `C > 2` states, it instead advances through refractory states 2 through `C - 1` before returning to 0; refractory states neither contribute to neighbour counts nor apply `B` or `S`. Thus the Penrose Compact Traveller's `B2/S` and four states mean `0 → 1` at exactly two live neighbours, and the unconditional non-survival sequence `1 → 2 → 3 → 0`.

The contextual **?** buttons beside Tiling and Rule open the same in-app explanation of these semantics, including the worked four-state traveller example and the selected graph's finite-boundary meaning. They explain the controls; they do not alter or serialise any configuration field.

### Named priority tables

The hat presets select `TABLE:HAT-A`, `TABLE:HAT-B`, `TABLE:HAT-C`, `TABLE:HAT-SIMPLE`, `TABLE:HAT-WAKE` or `TABLE:HAT-RELAY`. They use ordered conditions on the numbers of neighbours in each state, including state 0. The first matching condition supplies the next state; otherwise the cell becomes zero. States above 1 are signals in these rules, not automatically ageing refractory cells. The state-count control is fixed at four for A/B/C/WAKE and three for SIMPLE/RELAY. The [Core API](CORE_API.md) lists the additional programmatic table names and their exact representation.

For `TABLE:HAT-SIMPLE`, a zero cell becomes 1 if it has at least one state-2 neighbour and at most one state-1 neighbour. A state-1 cell becomes 2 if it has a state-2 neighbour. Every other cell becomes zero. This is a derived rule: it agrees with relabelled Hat B on the checked flights, but is not equivalent on arbitrary configurations.

### Finite boundaries

Cells beyond a finite patch are absent and never counted. For B/S rules this is equivalent to a permanently dead exterior, because only state 1 is counted. For a table that tests state 0, an absent neighbour is **not** a counted zero-state neighbour; behaviour at an incomplete boundary can therefore differ from a complete infinite tiling. Traveller verification keeps the entire nonzero pattern and its dependency neighbourhood clear of that boundary.

One dead-border ring locks the outer graph boundary at state 0; every additional ring locks one more graph-distance layer inward. Locked tiles still exist and are counted as zero-state neighbours by table rules. Boundary distance uses the selected contact graph.

## Reproducibility boundary

A configuration recreates geometry, controls, and a deterministic random initial population. It does not preserve an evolved state, hand-painted edits, camera position, or browser-specific PNG bytes. Use **Save state** and **Load state** for exact exchange as described below.


## Exact state files

**Save state** emits JSON with `format: "aperiodic-life-state"` and `version: 1`. **Load state** validates and restores it paused. Files preserve the tiling, patch depth/orientation, neighbourhood, tile count, two graph checksums, rule, total state count, dead-border rings, simulation generation, sparse `cellStates` pairs, view `{x,y,zoom}`, playback speed, palette, grid, and tile-type colours. Every omitted cell is zero. Refractory and table-state values are preserved exactly.

The importer restricts sizes to the browser menu, state count to 2–32, border rings to 0–12 and files to 8 MiB. A named table’s stored state count must match the count fixed by that rule. It rejects duplicate/out-of-range cells, nonzero locked-border cells, malformed values, unsupported versions, and graph mismatches. Checksums guard accidental graph/index drift and are not authentication. A failed schema or topology check preserves the current experiment. Snapshot files and settings-only exports are intentionally different formats; settings-only JSON cannot be loaded as an exact state.
