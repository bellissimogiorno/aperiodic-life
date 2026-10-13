# Independently evolved Hat relay rules

The primary result is a compact four-state Hat traveller obtained from a **fresh random rule lineage**. Its original seven-row table reduces to four rows without changing the checked complete trajectory. The three-state, two-row simplification is also playable, but independent comparison identifies its mature behaviour as the published Spectre relay under a state relabelling. These are different scientific claims.

All observations concern finite patches. Neither survival forever nor historical first discovery is established. James Edmond’s [published Hat and Spectre gliders](https://arxiv.org/html/2609.22579v1) supplied reference models and helped inform the search method.

## Exact rules

`final-rules.json` is the locked rule record. Neighbours are tiles sharing an edge or vertex. Let `n0`, `n1`, `n2` and `n3` count neighbours in the corresponding states. Rows are tested in the order shown, and the first match wins; otherwise the cell becomes zero.

### Hat wake traveller — four states

| Own state | Neighbour condition | Next state |
| --- | --- | ---: |
| 1 | `n0 >= 3` and `n2 >= 1` | 2 |
| 0 | `n0 >= 4` and `n2 >= 1` | 1 |
| 1 | `n0 >= 4` | 3 |
| 0 | `n1 >= 1` and `n2 >= 1` | 3 |
| Any | Otherwise | 0 |

State 3 lasts one generation and changes the available count of empty neighbours. The six-cell launch is:

```json
[[7392,2],[7396,1],[7307,3],[2948,1],[2955,1],[2952,1]]
```

On the 54,289-tile depth-5 patch, its complete state is independently checked through generation **293**, with at most **nine nonzero cells**, radius at most **4.638**, displacement **315.733 world units**, and minimum boundary distance four. Its mature support is connected over the checked interval starting at generation 60; the initial launch need not be connected throughout.

A geometric transplant of this **six-cell launch** to a depth-6 patch was checked through generation **1,049**. The original seven-row table and the reduced four-row table give the same complete trajectory throughout that longer replay. At generation 1,000, five cells remain nonzero, the support is connected, its radius is about 3.351 and its boundary distance is eight. Do not transfer these population or launch claims to a different two-cell seed.

The independent comparison checks 341 nontrivial state maps against the included published parent rules, allowing state mergers and removal of apparent decoration. No map reproduces the wake traveller’s mature transitions on the 54 encountered local contexts. This establishes a distinction from those checked mechanisms, **not** priority over all previous work or a completeness theorem about cellular automata.

### Hat two-row relay — Spectre variant

| Own state | Neighbour condition | Next state |
| --- | --- | ---: |
| 1 | `n2 >= 1` | 2 |
| 0 | `n0 >= 4` and `n2 >= 1` | 1 |
| Any | Otherwise | 0 |

The valid two-cell seed is:

```json
[[7293,2],[7295,1]]
```

It is checked through generation **235**, with at most **11 nonzero cells**, radius at most **4.575**, displacement **220.048 world units**, and boundary distance four. Its complete support sometimes has two components.

Crucially, its mature trajectory from generation 60 through 235 matches Edmond’s **Spectre** relay exactly after the state map `[0,1,2] -> [0,3,1]`. This was found by the independent comparison, including all 83 tested nontrivial maps. The global rules and ignition differ, but this selected mature mechanism is a **credited adaptation**, not an independently new glider mechanism.

## Search provenance and counts

Two completed campaigns evaluated **1,440,000 rule-and-seed combinations** and simulated **74,406,068 generations**:

| PRNG seed | Epochs | Evaluations per epoch | Evaluations | Evolution steps |
| --- | ---: | ---: | ---: | ---: |
| 3721047 | 16 | 30,000 | 480,000 | 33,674,652 |
| 3721049 | 24 | 40,000 | 960,000 | 40,731,416 |

The first alternates epochs with published-parent controls and epochs that begin entirely from random rules. The second begins every epoch from random rules. Elites reset between epochs, mutation never crosses genomes, and lineage labels are preserved.

The selected wake rule is evaluation **358,893**, in **epoch 11** of the first campaign. That epoch has no planted reference rule. `candidate-origin.json` preserves its exact original table, seed and search measurements. Its independent origin does not imply that related rules have never been studied.

Genotype-and-seed duplicates are rejected within an epoch, not globally. The search stops at 500 generations, population above 80, radius above 18, boundary distance below five, extinction, or a possible hashed cycle. A hash match is only a search screen, not a recurrence certificate. Full source hashes, PRNG details, actual stop counts and validation counts are in `campaigns.json`.

The first campaign’s prioritised comparison screened 180 retained candidates. The second campaign’s retained buckets are not claimed to be distinct mechanisms or all independently verified. Search counts should never be read as counts of discoveries.

## Reduction and causal checks

Removing three rows from the original genome preserves the complete wake trajectory, first checked on depth 5 and independently extended to the depth-6 replay. Deleting any of the remaining four rows changes the specific mature trajectory on the next checked step. **This does not mean all four rows are necessary for some form of travel.** Removing the two state-3-producing rows changes the anatomy and leads to the smaller relay described above.

The smaller relay’s extra empty-neighbour condition on promotion can also be removed for the selected complete trajectory. Its final two rows are both necessary for this launch: deleting either makes the seed extinct after two generations. Removing the empty-neighbour birth guard instead produces spread, exceeding the population cap after 15 generations.

`launch-and-ablation.json` records 63 source-seed subsets, 318 nearby ordered two-cell placements and the rule ablations. Its 49 successful compact screens can include duplicate seeds across those two sets; they are not 49 distinct patterns. `minimal-relay-evidence.json` records a further 2,120 bounded tests: 106 ordered seed placements under 20 empty-neighbour threshold combinations.

## Reproduction

Run these commands from the repository root. Node.js and a C++17 compiler suffice:

```sh
node research/continued-search/hat-relay/export-graphs.js 5
g++ -O3 -std=c++17 research/continued-search/hat-relay/evolve-relay.cpp -o /tmp/hat-relay-search
/tmp/hat-relay-search research/continued-search/hat-relay/hat-5-touch.dat research/continued-search/hat-relay/hat-5-edge.dat 3721047 16 30000 500 > research/continued-search/hat-relay/evolution.jsonl
/tmp/hat-relay-search research/continued-search/hat-relay/hat-5-touch.dat research/continued-search/hat-relay/hat-5-edge.dat 3721049 24 40000 500 random-only > research/continued-search/hat-relay/random-evolution.jsonl
node research/continued-search/hat-relay/screen.js research/continued-search/hat-relay/evolution.jsonl
node research/continued-search/hat-relay/reduce-candidate.js
node research/continued-search/hat-relay/launch-check.js
node research/continued-search/hat-relay/minimal-relay.js
```

The last three commands replay the retained selected candidate and overwrite their corresponding evidence files. The screening script compares complete labelled states against the literal source tables retained elsewhere in this repository. `for-verification.json` contains the retained inputs used for that check; only its first record is the selected primary result.

`recommended-catalogue.json` identifies the exact proposed display seeds and horizons. The independently generated `hat-relay-depth6-reduction.json` and `hat-minimal-relay-verified.json` record the longer reduction check and the Spectre equivalence respectively. Their conclusions take precedence over a heuristic search score or an earlier candidate classification.
