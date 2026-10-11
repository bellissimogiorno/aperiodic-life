# Catalogue rules and structures

The 69 configurations in `discoveries.js` use a uniform graph-totalistic model: each tile is one cell, and rules inspect only its state and number of state-1 neighbours. Geometry and the selected contact graph supply the local structure. The [configuration reference](CONFIGURATION.md) defines binary and refractory transitions.

## Exact localised oscillators

A period is the first return of the complete labelled state, including all refractory cells. Cycle territory counts every tile used during a period rather than the simultaneous population.

| Pattern | Rule and graph | States | Period | Cycle territory |
| --- | --- | ---: | ---: | ---: |
| Penrose compact oscillator | `B23/S23`, edge | 2 | 822 | 46 tiles |
| Penrose three-state oscillator | `B3/S23`, touch | 3 | 14 | 27 tiles |
| Hat small rotating wave | `B2/S1`, edge | 3 | 39 | 39 tiles |
| Hat large rotating wave | `B2/S23`, edge | 6 | 219 | 300 tiles |
| Hat refractory clock | `B2/S13`, edge | 4 | 11 | 8 tiles |

In the period-822 oscillator, 39 of the 46 tiles have least temporal period 822 individually. The long period is therefore not merely the least common multiple of independent shorter clocks. The supplied depth-8 pattern is well clear of the finite boundary.

The hat waves have a local 120-degree clockwise phase relation after 13 and 73 generations respectively. Their complete labelled states recur after three such intervals. This is a property of the pattern's occupied territory, not a claim that the whole surrounding tiling has rotational symmetry. Their instantaneous nonzero support can split.

The eight-tile clock starts with two live tiles. With the same phase and total state count `C`, its period is `2C + 3` for each computationally checked `C = 4…255`. The browser supports counts up to 32; the core API supports the larger counts. No claim is made beyond the checked range.

![Exact phases of localised oscillators](../research/figures/oscillator-atlas.svg)

The catalogue also includes binary Penrose touch-graph `B3/S23` oscillators of periods 4, 5, 7, and 12, a Penrose edge-graph period-4 example, hat touch-graph `B3/S23` periods 6, 9, and 26, a hat edge-graph period-15 example, a hat `B2/S` period-8 oscillator, and hat `B23/S` periods 20, 24, and 28.

## Finite Penrose travellers

The touch-graph `B2/S` family has a live front followed by refractory cells. Four-, five-, and six-state catalogue phases remain compact and connected through generation 220. Exact complete-state translated phases also match the surrounding contact graph through radius 3.

| Rule | States | Supplied support | Verified horizon | Characteristic launch behaviour |
| --- | ---: | --- | ---: | --- |
| `B2/S` | 4, 5, or 6 | Explicit complete phases | 220 | Compact live-front/refractory-wake motion |
| `B24/S` | 4 | 27 live cells | 200 | Eight births require the `B4` clause |
| `B2/S4` | 5 | 7 live cells | 200 | Two four-neighbour survivals |
| `B26/S` | 4 | 18 nonzero cells, including 8 live | 200 | One six-neighbour birth |
| `B27/S4` | 4 | 26 live cells | 200 | Four seven-neighbour births and seven four-neighbour survivals |

The launchers demonstrate distinct rule-dependent transients into related compact motion. Catalogue contracts check the distinguishing events, boundary clearance, trajectory bounds, translated phases, and complete final states.

**All Penrose travel claims are finite.** A radius-3 graph match at two phases does not give a global translation symmetry. The continuation may encounter a different environment. These results do not establish an indefinitely propagating glider, a gun, a stable collision system, or computation on the tiling.

## Regular hexagonal spaceships

The catalogue contains 28 hexagonal configurations. The [hexagonal guide](HEXAGONAL_STRUCTURES.md) covers the full selection, including exact spaceships, oscillators, rotors, a gun, a puffer, wall repair, a billiard table and a parity replicator. The table below records the original traveller benchmarks; the guide supplies the additional examples and their source and verification records.

The regular hexagonal lattice is translation invariant. Exact complete-state recurrence under a nonzero axial translation therefore establishes indefinitely repeated motion on the unbounded lattice when the observed evolution is independent of the finite boundary.

| Rule | States | Exact translated return | Axial displacement |
| --- | ---: | --- | --- |
| `B2/S35` | 2 | Generation 0 to 5 | `(1, 0)` |
| `B245/S3` | 2 | Generation 0 to 10 | `(2, 0)` |
| `B235/S146` | 4 | Generation 21 to 31 | `(-5, 0)` |
| `B235/S134` | 5 | Generation 58 to 62 | `(2, 0)` |

The binary `B245/S3` phase comes from Golly's hexagonal-rule example and corresponds to Carter Bays's period-10, displacement-2 ship in survival/birth notation `3/2,4,5`. The nine-cell supplied phase has population sequence `9, 13, 17, 18, 16, 17, 15, 16, 15, 11, 9`. See the [pattern source record](../research/fixtures/hex-b245s3-source.json) and [third-party attribution](../THIRD_PARTY_LICENSES.md).

The two multistate examples share a 12-live-cell seed geometry but have different launches and recurring orbits. `B235/S146` reaches a period-10 orbit using only `B23/S1`; `B5`, `S4`, and `S6` are launch-only clauses. `B235/S134` reaches a period-4 orbit using `B23/S134`, with `B5` active only during launch. A launch rule is not the same thing as the effective recurring rule.

Hexagonal `B3/S23` oscillators of periods 2, 3, and 6 provide further small calibration cases. Both contact-graph choices coincide on the regular honeycomb.

## Transients and collective behaviour

The ten-cell hat `B2/S1`, ten-state directional transient uses the touch graph. Its last live cell disappears at generation 75 and its entire refractory wake at generation 83. It is not a glider and is not connected throughout.

The Penrose `B3/S23` catalogue includes extinction at generation 293 and a transient of 289 generations before a fixed point. The Penrose `B12/S` collective field has transient 51 and exact period 840. This is a distributed field rather than a compact local oscillator.

The three-state Penrose `B2/S` excitable field and binary hat `B1/S` wave field remain active through their stated 3,000-generation observation windows. They may later cycle, freeze, die, or reach the finite boundary.

Classic square examples supply familiar reference behaviour: block, blinker, pulsar, pentadecathlon, glider, lightweight spaceship, HighLife replicator, Diehard, R-pentomino, and Acorn. The final two are finite-board runs with explicit observation horizons, not claims about infinite-plane asymptotics.

## Reproduction and interpretation

Run from the repository root:

```bash
node research/verify-catalog.js
node test-structures.js
node test-traveller-evidence.js
python3 tools/project.py test research
```

The catalogue verifier reconstructs every configuration and checks its declared contract. Independent tests compare complete states and local graph translations. Exact periods are never inferred from population alone. See [testing](TESTING.md) and the [research guide](../research/README.md) for search commands and current fixtures.

Search output is evidence for its recorded configurations and horizons. Coarse duplicate-suppression fingerprints are not counts of distinct structures; unsuccessful bounded searches do not prove nonexistence. No literature-priority claim is made for the catalogue's aperiodic structures.

## Related mathematical work

Life-like Penrose rules, ribbon-based glider constructions, and universal semi-totalistic Penrose automata provide useful comparisons. Ribbon information or richer local classifications change the model: they are not equivalent to the uniform neighbour-count rules implemented here.

- N. Owens and S. Stepney, *Investigations of Game of Life Cellular Automata Rules on Penrose Tilings*, [arXiv:0901.3979](https://arxiv.org/abs/0901.3979).
- D. Bailey and E. Lindsey, *A Game of Life Glider on the Penrose Tiling*, [arXiv:1708.09301](https://arxiv.org/abs/1708.09301).
- K. Imai, H. Ishizaka, and V. Poupet, *A Universal Semi-Totalistic Cellular Automaton on Kite and Dart Penrose Tilings*, [arXiv:1201.1379](https://arxiv.org/abs/1201.1379).
- Carter Bays, *A Note on the Game of Life in Hexagonal and Pentagonal Tessellations*, [Complex Systems 15(3)](https://www.complex-systems.com/abstracts/v15_i03_a04/).
