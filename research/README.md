# Reproducible automaton search

The research tools verify the 81 examples in the application catalogue and search for additional structures on square, hexagonal, Penrose and Einstein-hat tilings. Catalogue verification runs with Node.js and requires no package-manager dependencies. The optional bulk hexagonal miners use C++17, with Python replay and analysis helpers.

See the [intensive search report](../docs/GLIDER_SEARCH.md) and [campaign sources](exhaustive-search/README.md) for the Hat, Penrose and small-seed hexagonal campaigns. `node test-priority-rules.js` checks the independent table semantics and aperiodic replays; `node test-hex-exhaustive-evidence.js` checks the five small hexagonal launchers.

See the [hexagonal search guide](hex-search/README.md) for the 6,630,400-trial campaign, and the [hexagonal configuration guide](../docs/HEXAGONAL_STRUCTURES.md) for its curated results and published examples. `node test-hexagonal-evidence.js` (from the repository root) independently checks full-state recurrences, rotations, boundary clearance, emission certificates, wall repair and replication. The [hexagonal atlas](figures/hexagonal-atlas.svg) renders exact phases from the application geometry.

## Verify the catalogue

Every example has a record in [catalogue-provenance.json](fixtures/catalogue-provenance.json), rendered as [Catalogue credits and provenance](../docs/CATALOGUE_CREDITS.md) and embedded in the offline app. These records distinguish published rules and patterns from independent rediscoveries, adaptations and locally selected demonstrations. They do not certify worldwide originality. James Edmond’s [Hat and Spectre paper](https://arxiv.org/abs/2609.22579) and [interactive project](https://offlattice.org/monotile/) are credited for the Hat A/B/C gliders and Hat C triple behaviour.

Run these commands from the repository root:

```bash
node research/verify-catalog.js
node test-research.js
node test-traveller-evidence.js
node test-structures.js
node tools/build_catalogue_credits.js --check
```

`verify-catalog.js` reconstructs every catalogue configuration and checks its stated contract: an exact period, translated complete state, replication, extinction time or finite activity horizon. `fixtures/catalogue-verification.json` contains the expected results. Tests also compare sparse and dense evolution and independently replay the moving patterns and selected localised structures.

The compact source record in `fixtures/hex-b245s3-source.json` credits Golly's hexagonal RLE example and its relationship to the period-10 ship described by Carter Bays. Preserve this attribution when reusing the pattern.

## Search tools

| Script | Purpose |
| --- | --- |
| `mine-oscillators.js` | Evolve deterministic soups, isolate connected cycle components and verify exact localised oscillators. |
| `search-transients.js` | Search for compact seeds with long activity, delayed extinction or eventual localised cycles. |
| `search-movers.js` | Explore seeds using bounded centroid-motion heuristics. |
| `search-mobile-patterns.js` | Detect translated complete states and check the surrounding local graph. |
| `verify-penrose-traveller.js` | Transplant the compact four-state Penrose traveller to congruent placements and replay each placement. |
| `survey-fields.js` | Run a deterministic 32-case, 3,000-generation field panel. |

The search scripts provide `--help`. Store new search output outside the source tree, retaining the exact seed, rule, state count, patch and generation limit. A useful starting point is:

```bash
node research/mine-oscillators.js --help
node research/search-mobile-patterns.js --help
node research/verify-penrose-traveller.js --depth 10 --horizon 300
```

`lib/sparse-automaton.js` supplies the sparse engine used by the search tools. It supports rules without `B0` and the named quiescent priority tables; non-quiescent backgrounds require dense whole-board updates.

## Interpreting a result

A recurrence requires equality of the complete state, including refractory cells. Hashes and shape signatures identify candidates for exact comparison; they do not establish recurrence on their own. The oscillator miner's fingerprints suppress duplicates heuristically and are not counts of graph-isomorphism classes.

A translated return on a finite Penrose patch is a checked observation over a stated interval. The surrounding tiling need not repeat, so such a return does not establish indefinite travel. The catalogue includes finite Penrose travellers, stationary Penrose and hat oscillators, and a hat directional transient that becomes fully extinct at generation 83. It also independently reproduces published Einstein-hat glider behaviour under named priority tables. The evidence establishes the recorded finite flights and does not prove immortality.

On the regular square and hexagonal lattices, an exact translated complete state can establish a repeating spaceship when the local evolution is independent of the finite boundary. Independent traveller checks include this boundary condition. Every bounded negative search remains a result about its sampled configurations and horizon, not a proof of nonexistence.

## Figures and performance

`figures/oscillator-atlas.svg` and its PNG preview show exact simulation phases of five localised oscillators. Regenerate the SVG with:

```bash
node research/render-oscillator-atlas.js
```

Measure construction and simulation timings for the current implementation:

```bash
node --expose-gc research/benchmark-core-performance.js --rounds 5 --output ../benchmark.json
```

Use `--quick` to limit construction measurements to smaller Penrose patches. The output includes host and runtime details, samples and medians; timings depend on the machine and its workload.

See [the rule survey](../docs/RULE_SURVEY.md) for the catalogue's rules and interpretation.
