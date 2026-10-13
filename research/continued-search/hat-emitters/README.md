# Connected Hat launchers and recurring emission: 13 October 2026

This campaign searches the existing Hat priority rules for interacting launches
and recurring sources. The recommended examples are a six-way Hat A launcher
and a Hat B recurring emitter with a checked 40-generation emission identity.
**All motion and repeated emission claims are finite. No indefinitely firing
glider gun, immortal glider, or historical priority is claimed.**

James Edmond supplied the unchanged Hat A, B and C rule tables in *Gliders on
Aperiodic Monotilings: Cellular Automata on the Hat and Spectre*,
[arXiv:2609.22579v1](https://arxiv.org/html/2609.22579v1), Tables 4–6.
`priority-rules.json` retains the published tables and their ordering. Search
preset D is the already documented SIMPLE variant of Hat B: remove the unused
state, relabel state 3 as 2 and drop the requirement for two empty neighbours.
It is not equivalent to Hat B on arbitrary inputs. All these are priority-table
automata, not Generations birth/survival rules.

## Recommended examples

### Six-way finite Hat A launcher

The initial connected six-cell phase is:

```json
[[24180,2],[24181,1],[24717,2],[24718,1],[24722,1],[24724,2]]
```

Use depth 5, touch adjacency and `TABLE:HAT-A`. The complete evolution is replayed
through generation 180. Six separated bodies at generation 60 independently
reproduce every subsequent complete state through 180, with no omitted debris.
Each body has at most eight nonzero cells and advances more than 128 coordinate
units during that interval. The whole trajectory stays at least seven touch
graph steps from the patch boundary.

All 31 bipartitions of the initial seed diverge from the actual complete
trajectory within the first 30 generations when their halves evolve separately.
All 62 proper nonempty subsets fail to join the complete trajectory through the
checked horizon. Thus the six-cell launch is not a disjoint superposition of
independently evolving smaller launches. This test does not establish that the
seed is minimum among all possible seeds on all placements.

`A-best-signal.json` records the deterministic source trial; the corresponding
`-analysis.json` records packet replay and subset tests. The final independent
verifier supplies geometric translated-return certificates for the six bodies,
including their complete radius-3 dead neighbourhoods. Its executable is
`../verification/verify-hat-six-launcher.js`, and its result is
`../verification/hat-a-six-launcher-evidence.json`.

### Hat B recurring emitter, checked over a finite interval

The ignition phase contains only three connected cells:

```json
[[23821,1],[23824,3],[23836,1]]
```

Use depth 5, touch adjacency and `TABLE:HAT-B`. The original launch is checked
through generation 180 with minimum boundary distance 10. Its central radius-20
crop first suggested a period of 20. That cropped observation is **not** the
accepted source certificate.

Let `F` denote one complete-board update. At generation 30, the **entire** state is the 56-cell phase `C` recorded in
`B-native-emission-identity.json`: nothing is discarded and no exterior remainder
is needed. Direct replay establishes the exact identity

```text
F^40(C) = C disjoint-union E
```

where `E` consists of all 23 additional nonzero cells, including all state
labels. The final independent check reconstructs **every complete source state
through local generation 180** as the disjoint union of the recurring phase and
independently evolved emitted cohorts. The minimum boundary distance is seven.
There are no external arrivals feeding the source: its initial phase is the
entire parent state, and its emitted cohorts do not overlap or affect it during
the checked interval.

`E` consists of four independently verified connected travelling bodies. Each
is checked for 140 generations, has at most seven nonzero cells and radius less
than 3.440, and advances between 149.68 and 150.24 coordinate units. Two pairs
follow exactly the same complete trajectories with a 20-generation offset;
this relation is checked for the subsequent 120 generations. The independent
audit performs 1,067 production-dense versus direct-reference state comparisons
across seven runs. Its files are
`../verification/verify-hat-emitter.js` and
`../verification/hat-emitter-independent.json`.

The identity records a 40-generation emission cycle; it is not a claim that
40 is a least period. The catalogue ignition remains the original three cells.

This is a full-state emission identity, not equality of a few live populations
or a forced boundary condition. The isolated source is always evolved by the
ordinary rule on the complete patch; no crop is cleared during replay. The
global state is not an oscillator, so the catalogue uses an activity horizon,
not `expectedPeriod: 40`. The spatially extended source also includes emerging
packets; no claim that its active support is connected at every phase is made.

Every nontrivial bipartition of the three-cell ignition interacts, and no proper
subset joins its full trajectory in the checked interval. The emitted packets
and any later interactions on the nonperiodic substrate still require finite
observation: the identity alone does not prove that an unlimited succession of
packets will escape forever without returning or interfering with the source.

An earlier extracted 38-cell source also obeys an isolated emission identity,
but its split from the original ignition immediately interacts with the
remainder. It is retained as research evidence in `B-emission-identity.json`;
the **native 56-cell extraction** is the basis of the recommendation.

## Other observations, not additional catalogue entries

A five-cell Hat C seed produces many outgoing packets. Its ten-group geometric
partition at generation 140 independently reconstructs the complete trajectory
through 180; one group contains a larger interacting pair, so it must not be
called ten independently certified single gliders from that screen alone.
An earlier nearest-centroid screen incorrectly suggested a stationary residue;
direct replay shows that those bodies move. The reduced seed and all subset
tests are preserved in `C-five-cell-candidate*.json`.

SIMPLE produces exact period-36 central-crop signals; the source-extraction
screen also finds 72-step endpoint identities. These are research candidates,
not a certified additional gun. The `*-source-analysis.json` files are
**screens**: `twoCycleEndpointCoincidence` checks an endpoint only. The strict
all-generation checks in `B-extraction-checks.json` reject several such endpoint
coincidences. None of those rejected rows supports the curated emitter claim.

## Deterministic search accounting

Both searches use the same 54,289-cell depth-5 patch. They start from connected
three- to six-cell configurations, allow mixed nonzero states, and evolve at
most 180 generations. A run stops if support comes within five graph steps of
the patch boundary or exceeds 160 nonzero cells. The starting tile is selected
from the 812 tiles with touch-boundary distance at least 75. Grown neighbouring
seed cells need not individually retain that starting-tile bound; all occupied
cells are checked during evolution.

| Campaign | Rules in RNG order | Trials per rule | Candidate evaluations | Actual evolution steps |
|---|---|---:|---:|---:|
| Connected launch screen | C, A, B, D | 80,000 | 320,000 | 44,252,418 |
| Periodic-centre screen | C, D, A, B | 20,000 | 80,000 | 9,631,661 |
| Total | | | 400,000 | 53,884,079 |

Seeds for the C++ `std::mt19937` streams are 3721301 and 3721313. Each stream
continues across rules in the displayed order; reproducing only the last rule
would not reproduce its trial numbers. Promising seeds are mutated, so the
evaluations are correlated and can repeat configurations. These are not counts
of independent samples or distinct mathematical structures.

`accounting.json` records all outcome partitions, graph checksums, retained-record
counts and search limits. The first geometric screen uses spatial clustering
and nearest-centroid comparisons only to suggest candidates. Its raw
`source-signal` and `launcherSignalsByMultiplicity` fields do not certify a
stationary source or a number of gliders. The periodic screen retains at most
400 proposals per rule. Its retained counter was corrected from the saved
records after an omitted counter increment was noticed; states and evolution
counts were unchanged, and the included C++ source contains that correction.

## Reproduction

From the repository root:

```sh
node research/continued-search/hat-emitters/export-graphs.js 5
g++ -O3 -std=c++17 research/continued-search/hat-emitters/search.cpp -o /tmp/hat-emitter-search
/tmp/hat-emitter-search research/continued-search/hat-emitters/hat-5-touch.dat research/continued-search/hat-emitters/hat-5-edge.dat 80000 CABD 3721301 0 > /tmp/hat-connected-seeds.jsonl
/tmp/hat-emitter-search research/continued-search/hat-emitters/hat-5-touch.dat research/continued-search/hat-emitters/hat-5-edge.dat 20000 CDAB 3721313 1 > /tmp/hat-periodic-core.jsonl
node research/continued-search/hat-emitters/analyze-candidate.js A-best-signal.json
node research/continued-search/hat-emitters/analyze-candidate.js B-core-signal.json
```

The two C++ runs should reproduce candidate and summary records with the
included final source. Their standard-error progress is not evidence of a
successful physical mechanism. The separate independent gun verifier is
`research/continued-search/verification/verify-hat-emitter.js`; its result and
the catalogue replay provide the final accepted finite contracts.

`recommended-catalogue.json` contains the proposed UI entries. Rule provenance
is explicit in `provenance.json`; historical novelty beyond this search is not
asserted.
