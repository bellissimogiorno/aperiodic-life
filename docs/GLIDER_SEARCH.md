# Gliders, launchers and the limits of the evidence

This report records the intensive search supporting Aperiodic Life 3.7.3. The catalogue includes twelve highlights from this work: five Hat configurations, two Penrose launchers and five hexagonal gliders or launchers. Seeds, rules, complete-state evidence, independent replay code and campaign manifests accompany the application.

The [continued search report](CONTINUED_SEARCH.md) adds complementary campaigns and newly verified findings. The sections below describe the original intensive campaign and its published-rule reproductions.

## The Einstein-hat result and its attribution

There is already a public report of Hat gliders: James Edmond, [*Gliders on Aperiodic Monotilings: Cellular Automata on the Hat and Spectre*](https://arxiv.org/abs/2609.22579), submitted 18 September 2026. Its rule tables count neighbours in every state, use ordered conditions and include corner contacts. Those are different dynamics from ordinary B/S Generations, whose higher states age without influencing neighbours. The preprint presents extensive computational evidence, including million-ring sliding-window flights, and explicitly does not prove immortality (§5.2).

This project independently implements the tables and reproduces their Hat behaviour on its own substitution-generated contact graphs. It does not claim the first Hat glider. The public paper, [interactive project](https://offlattice.org/monotile/) and [code and records](https://github.com/jamesedmond/monotile-ca) deserve the credit for the published rules and prior discovery, including the Hat C triple behaviour. The package independently located its seed placements; this does not establish a new launcher mechanism. The [individual credits](CATALOGUE_CREDITS.md) record provenance and originality limits for every catalogue example.

| Playable configuration | Seed size | Rule | Verified finite horizon |
| --- | ---: | --- | ---: |
| Hat glider A | 2 | `TABLE:HAT-A`, 4 states | 307 |
| Hat glider B | 2 | `TABLE:HAT-B`, 4 states | 307 |
| Hat glider C | 2 | `TABLE:HAT-C`, 4 states | 311 |
| Hat three-state variant | 2 | `TABLE:HAT-SIMPLE`, 3 states | 307 |
| Hat triple launcher | 2 | `TABLE:HAT-C`, 4 states | 160 |

All use the 54,289-tile depth-5 Hat patch and the edge-or-corner graph. The displayed gliders eventually approach the finite board boundary. Their declared horizons stop while a dead buffer remains; running beyond those horizons is an experiment, not part of the certificate.

The larger command-line reproduction places B on a 372,100-tile depth-6 patch. It remains active through **1,129 generations**, travels **1,191.17 world units**, and visits **2,752 tiles**, with at most 13 nonzero cells and maximum radius 4.502 throughout the launch and flight. From generation 25 onward it is a single connected body of five or six cells, with radius at most 3.178, no backwards centroid steps and maximum lateral deviation 3.441 from the measured start-to-end line. The final minimum boundary distance is four contact-graph rings. These are measurements in the app's geometry, not tile counts or an infinite-flight theorem. The three-state variant independently matches this flight after relabelling.

The Hat triple launch starts from `[[23905,1],[23907,2]]`. At generation 80 it has three separate compact bodies. Each independently evolves through generation 160, and their disjoint union equals the complete original simulation at every intervening step: there is no omitted stationary residue. Each travels approximately 85.5 world units over that interval. This is a one-off launcher, **not a repeating glider gun**.

![Exact Hat glider and launcher states](../research/figures/hat-gliders.svg)

## A simpler three-state rule

The derived rule uses states 0, 1 and 2:

1. A state-0 cell becomes 1 if it has fewer than two state-1 neighbours and at least one state-2 neighbour.
2. A state-1 cell becomes 2 if it has at least one state-2 neighbour.
3. Every other cell becomes 0.

This removes the unused state from the published B seed's evolution, relabels its state 3 as 2, and removes empty-neighbour guards. The last change is substantive: the rules are **not equivalent on arbitrary configurations**. For example, a dead cell whose neighbours are all signal cells remains dead under B, but is born under the simplified rule.

On the depth-5 patch, every one of the **37,858 oriented shared-edge seed placements** whose cells are at least 50 touch-graph rings from the boundary was compared. All **6,316,315 complete-state time slices** agreed between the relevant relabelled runs, up to their recorded boundary or horizon limits. This is exhaustive over that specified set of two-cell launches, not over all inputs or all legal infinite Hat environments. The exact counterexample and comparison procedure are included in `research/exhaustive-search/hat-targeted/`.

## Penrose launchers

Three live cells under `B2/S` can launch several independent compact travellers:

| Configuration | States | Depth | Seed cell IDs | Verified through |
| --- | ---: | ---: | --- | ---: |
| Five-traveller launcher | 5 | 11 | 120863, 120865, 120867 | 240 |
| Six-traveller launcher | 6 | 11 | 65275, 65271, 65274 | 200 |

These use the 143,010-rhomb sun patch and touch adjacency. The five emitted bodies have at most 14 nonzero cells each and radius at most 2.333 after the checked split; the six have at most 18 and radius at most 2.702. Independent component evolution exactly reconstructs the full state from generation 120 through the respective horizons. Both retain at least nine boundary rings throughout the checked whole trajectory.

The multiplicity counts separate bodies, not necessarily different headings: two travellers can follow parallel tracks. These launchers use the established B2/S travelling mechanism; they are not claimed as new glider cores. Particular complete-state translations and matching local surroundings were certified for each body. The observed return intervals are local matches, not a fixed spaceship period on an infinite aperiodic substrate.

## Small hexagonal seeds

The five additions have exact complete-state translated recurrence in an independent, unbounded axial-coordinate simulator:

| Initial seed | Rule / total states | Launch transient | Period | Axial displacement |
| --- | --- | ---: | ---: | --- |
| Three live cells | `B2/S0`, 3 | 0 | 2 | (0, −1) |
| Four live cells | `B234/S1346`, 3 | 9 | 8 | (1, 1) |
| Five live cells | `B2456/S1345`, 4 | 6 | 43 | (−6, 3) |
| Six live cells, knightship | `B23/S13`, 4 | 16 | 9 | (5, −4) |
| Six live cells, knightship | `B234/S245`, 5 | 12 | 10 | (1, 2) |

A knightship travels away from both the standard hexagonal axes and diagonals. On the regular infinite lattice, complete-state translated recurrence establishes continued periodic travel because the substrate and rule are translation invariant. The browser board is finite, so its replay additionally checks boundary clearance.

The period-10 knightship demonstrates a useful launch-dependent clause: `S5` fires four times, all by generation 3. Removing it from the initial rule makes this seed die at generation 25. Removing it after launch leaves the complete recurring orbit unchanged. The seed therefore demonstrates a real launch mechanism rather than merely adding an unused rule clause.

These examples are new additions to this catalogue. No historical first-discovery claim is made. Exact seeds, canonical phase comparisons and their relation to existing examples are in the hexagonal evidence fixtures.

## Search coverage

The machine-readable manifests in [research/exhaustive-search](../research/exhaustive-search/README.md) specify seeds, PRNGs, rules, stop conditions, measured counts and reproduction commands. Together, the Hat B/S, Penrose and hexagonal campaigns executed **21,265,436 trials**, including the 45,180 systematic Hat transplants. Priority-table searches and verification replays are counted separately. A trial is one initial state under one rule and state count. Trials may share trajectories or differ only in clauses that never fire; their number is not a count of distinct structures.

The finite exhaustive hexagonal subspace contains **116 connected shapes of one to six cells**, up to the twelve hexagonal rotations/reflections, **8,192 B/S rule choices without B0**, and **five total state counts, 2–6**: **4,751,360 trials**. Each has a 400-generation limit and explicit support, boundary and recurrence-detection limits. “Exhaustive” applies to these initial combinations, not to all cellular automata or arbitrarily long behaviour. Mutation and emitter campaigns supplement this enumeration, bringing the hexagonal total to **4,998,720 trials** and **127,452,139 transitions**. Reclassification replays are excluded from that trial count.

Penrose campaigns include **6,121,536 new trials** and **122,563,637 simulated transitions**: broad touch rules, binary edge/touch grids, higher state counts, and connected launcher searches. Rule grids distinguish syntactically different rules from distinct effective rules; clauses exceeding the graph degree do not create different dynamics. Independent larger-patch transplants are validation, not additional discovery trials.

The Hat B/S campaigns completed **10,100,000 random trials** and **45,180 targeted transplants**. All 53 distinct retained translated-return seeds were extended: 39 died, two settled into stationary cycles, six reached a population limit while growing, and six spread to the boundary buffer. None established sustained compact flight. A further 600 leading compact-score candidates were replayed. These campaigns sample binary and refractory rules on both contact graphs, larger soups and small seeds. They include whole-interval compactness checks and targeted transplants of apparent translated returns. **No sustained Hat glider under B/S Generations was verified.** This is a bounded negative result, not a proof that one cannot exist. The positive Hat results use the richer priority-table model.

Targeted priority-table enumeration separately checks all 37,858 eligible B launches and 8,506 more deeply interior C launches. Many seeds split into multiple objects; reaching a boundary is not by itself a clean-single-glider classification. Population caps, boundary buffers and the classification details are recorded explicitly.

## Why the verification is stronger than centroid tracking

Three distinct update implementations agree on the selected complete trajectories: the production dense engine, the production sparse engine, and an independent neighbour-query reference. The checks preserve every nonzero state, not just live-cell counts or hashes. Local returns compare tile polygons, state labels, degrees, adjacency and the complete radius-three empty surrounding neighbourhood. Emission certificates separately replay each component and reconstruct the whole evolution.

The search also found misleading candidates. Some moved far only while spreading, then left a small endpoint before dying. Others had genuinely translated complete-state phases but later became chaotic, settled into oscillators or died. Representative rejected Hat examples are retained with exact seeds and replay outcomes. A short translated return is insufficient evidence for a Hat glider.

A mathematical immortality proof would need control of every legal environment encountered indefinitely. One possible route is a complete set of collared glider situations, a proof that all legal continuations are covered by Hat substitution including supertile boundaries, closure of their transitions, and a progress certificate excluding trapped cycles. A finite patch's observed vocabulary, even when it appears closed, does not supply that completeness proof.

## Reproduce the evidence

From the repository root:

```bash
node test-priority-rules.js
node test-hex-exhaustive-evidence.js
node research/verify-aperiodic.js --long
node research/verify-catalog.js
```

The first two tests are included in the standard test profile. The larger replay is included in the large profile and requires more memory. Source tables and exact state records are in `research/fixtures/`; campaign miners and their commands are in `research/exhaustive-search/`. Repeating the bulk searches requires a C++17 compiler. No remote service is required for the simulations.
