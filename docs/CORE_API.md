# Core API reference

`core.js` is dependency-free. Node loads it with `require('./core.js')`; browsers expose `window.AperiodicLifeCore`.

## Patch construction

### `buildPatch(tiling, depth, options = {})`

Accepted canonical tilings are `square`, `hex`, `hat`, and `penrose`. The dispatcher also accepts `einstein` and `penrose-p3` as programmatic spelling aliases, but these are not filenames or browser namespaces.

```js
const square = Core.buildPatch('square', 101);
const hex = Core.buildPatch('hex', 32);
const hat = Core.buildPatch('hat', 4);
const penrose = Core.buildPatch('penrose', 8, { seed: 'sun' });
```

### Backend builders

- `buildSquarePatch(size)` — integer size 3–511.
- `buildHexPatch(radius)` — integer radius 1–256.
- `buildEinsteinPatch(depth)` — integer depth 0–6.
- `buildPenrosePatch(depth, options)` — integer depth 1–11; seed `sun` or `sun-mirror`.

### `PATCH_OPTIONS`

Read-only metadata for browser menu tiers:

```js
Core.PATCH_OPTIONS.square
Core.PATCH_OPTIONS.hex
Core.PATCH_OPTIONS.hat
Core.PATCH_OPTIONS.penrose
```

Entries contain `{ depth, tileCount, label? }`.

## Patch arrays

```text
transforms: Float32Array(tileCount * 6)
vertices: Float32Array(tileCount * verticesPerTile * 2)
centers: Float32Array(tileCount * 2)
bboxes: Float32Array(tileCount * 4)
tileTypes: Uint8Array(tileCount)
edgeBoundary, touchBoundary: Uint8Array(tileCount)
edgeBoundaryDistance, touchBoundaryDistance: Uint16Array(tileCount)
```

Square and hex patches additionally expose integer `coordinates` pairs. Penrose tile types use 0 for thin and 1 for thick.

`patch.boundary`, `patch.boundaryDistance`, and `patch.boundaryCount` are convenience aliases for the shared-edge versions inside the patch contract.

## Graph contract

```text
offsets: Uint32Array(tileCount + 1)
neighbors: Uint32Array(2 * edgeCount)
degree: Uint32Array(tileCount)
histogram: Uint32Array(maxDegree + 1)
edgeCount, maxDegree, averageDegree
boundary, boundaryDistance
```

Graphs are undirected, duplicate-free, self-loop-free, and connected for built-in patches. Neighbour order is unspecified.

## Rules

### `parseRule(text, maxDegree = 255)`

```js
Core.parseRule('B3/S23', 8);
Core.parseRule('B2,4/S1,2,3', 8);
Core.parseRule('B[10]/S[9,10]', 11);
Core.parseRule('TABLE:HAT-B', 7);
```

For `B…/S…`, the result contains canonical `text`, sorted count arrays, byte lookup tables, and `ignored` counts above the graph degree. Counts are restricted to 0–255.

A named table returns `{ kind: 'priority', text, name, states, rows, ignored: [] }`. Each row has `{ own, conditions, next }`: `own: null` matches any current state, and each condition `[state, minimum]` tests a neighbour-state count. The first matching row determines the next state; no matching row means state 0. Counts include neighbours in state 0. These objects do not have B/S lookup arrays.

### `PRIORITY_RULES` and `priorityTransition(rule, own, counts)`

The immutable registry provides `TABLE:HAT-A`, `TABLE:HAT-B`, `TABLE:HAT-C`, `TABLE:HAT-SIMPLE`, `TABLE:HAT-WAKE`, `TABLE:HAT-RELAY`, `TABLE:SPECTRE` and `TABLE:PENROSE-GOUCHER`. `priorityTransition` evaluates one cell from an already parsed table and an array of counts indexed by state. It does not inspect geometry or mutate its arguments.

```js
const rule = Core.parseRule('TABLE:HAT-SIMPLE');
Core.priorityTransition(rule, 0, [5, 0, 1]); // 1
```

The names identify rules, not geometry backends: `TABLE:SPECTRE` does not add a Spectre tiling to the app. Only the hat table presets are presented in the browser. The [published source records](../research/fixtures/published-priority-rules.json) and [continued-search report](CONTINUED_SEARCH.md) distinguish published rules, adaptations and the independently evolved wake rule.

### `formatRule(birth, survive)`

Produces canonical notation and uses brackets where multi-digit counts require disambiguation.

## `Automaton`

```js
const simulation = new Core.Automaton(patch, patch.touchGraph, {
  rule: 'B3/S23',
  generations: 2,
  borderRings: 2,
});
```

Important public fields:

- `state`, `generation`, `generations`, `borderRings`, `graph`, `rule`;
- `lastChangedCount`;
- `smoothedStepMilliseconds`;
- `stateHashA`, `stateHashB`, `hashDirty`.

Methods:

- `step()`
- `clear()`
- `randomize(density, seed)`
- `aliveCount()`
- `setCell(index, value)`
- `setRule(text)`
- `setGraph(graph)`
- `setGenerations(count)`
- `setBorderRings(rings)`
- `refreshDerivedState()` after intentional direct state mutation
- `refreshStateHash()` and `ensureStateHash()`

With B/S rules, only state 1 contributes to neighbour counts and states 2 and above are refractory. Priority tables count every state separately; higher states can send signals to their neighbours and need not age towards zero. `aliveCount()` continues to mean the count of state-1 cells, rather than the complete nonzero population.

A table fixes its state count. Construction and `setRule()` adopt that count; `setGenerations()` preserves it while a table is selected. Switching to a smaller count clears cells whose values are no longer valid. To return to a chosen B/S count, call `setRule('B…/S…')` followed by `setGenerations(count)`.

`setCell()` remains a binary painting operation. For a multistate experimental seed, assign valid integers below `generations` directly to `state`, then call `refreshDerivedState()`. Exact state files retain those values.

All registered tables preserve an entirely zero neighbourhood at every graph degree. The engine uses this property to interpret only occupied cells and their neighbours while still updating and hashing the whole state array. The research `SparseAutomaton` follows the same synchronous semantics and includes neighbours of every nonzero state. Its constructor checks quiescence at every degree up to the graph maximum.

The dual hashes are deterministic acceleration keys, not cryptographic digests. Confirm full state equality before declaring recurrence.

## Picking

`new PickingIndex(patch, cellSize)` builds a bounded spatial index. `find(x,y)` returns a tile ID or `-1`. `pointInTile` tests one emitted polygon. Boundary points may belong to multiple cells; the first matching cell is selected.

## Mutability

Treat patch geometry and graph arrays as read-only. `Automaton.state` is intentionally writable for experiments, but callers must invoke `refreshDerivedState()` after bulk direct writes.
