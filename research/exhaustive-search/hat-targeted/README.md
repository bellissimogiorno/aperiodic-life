# Einstein-hat relay patterns

These experiments reproduce published Einstein-hat gliders and launchers on this application's independently generated hat tiling. They also test a smaller three-state rule and transfer the published Spectre relay rule to the hat graph.

The source is James Edmond, *Gliders on Aperiodic Monotilings: Cellular Automata on the Hat and Spectre*, [arXiv:2609.22579v1](https://arxiv.org/html/2609.22579v1), Tables 4–7. The accompanying project is [monotile-ca](https://github.com/jamesedmond/monotile-ca). These are reproductions and extensions of published patterns, not a claim to the first Einstein-hat glider.

## A different rule family

Every tile has a state in `{0,1,2,3}`. Each priority-table row tests the tile's current state and counts neighbours in specified states. The first matching row supplies the next state; the default is zero. All states are visible to neighbouring cells, including zero. Neighbours are all tiles sharing an edge or vertex. This differs from Generations B/S rules, where only state 1 contributes to neighbour counts and refractory states follow a fixed countdown.

`priority-rules.json` records the full published tables, including redundant or unreachable rows. The reference probe evaluates equivalent working rows. In particular, Hat B includes its otherwise unreachable state-2 birth condition.

## Finite exhaustive checks

The depth-5 patch contains 54,289 tiles. The sweep enumerates every shared-edge pair whose two tiles meet the specified boundary-distance constraint, and tests both orders of the seed states.

| Experiment | Oriented seed pairs | Limit | Result |
| --- | ---: | --- | --- |
| Published Hat B | 37,858 | Seed at least 50 touch-graph rings from the edge; 700 generations | Every seed reaches the five-ring boundary buffer; 3,911 remain within radius 12 about their complete-state centroid throughout |
| Published Hat C | 8,506 | Seed at least 70 rings from the edge; 700 generations; at most 128 active cells | 6,187 reach the buffer, 98 become extinct, 2,221 exceed the population cap |
| Hat B versus the simplified three-state rule | 37,858 | Same seed placements and horizon as Hat B | 6,316,315 complete-state comparisons agree exactly after relabelling state 3 as state 2 |

Hat B uses 6,278,457 evolution steps in the first sweep. The remaining seeds in that sweep often launch multiple separating objects, so the radius-12 criterion is deliberately more restrictive than successful ignition. All trajectories stop before the finite boundary can influence their occupied support. Reaching a boundary buffer is a finite outcome, not evidence of survival outside the patch.

A separate deterministic 9,000-seed experiment finds 56 three-object Hat C launchers, 370 two-object Hat C launchers, 2,324 two-object Hat B launchers and 2,297 two-object Hat A launchers under its stated finite classification. `campaigns.json` gives all seeds, limits, outcome counts and classification details. Trial totals can overlap and are not counts of distinct mathematical structures.

## The simplified three-state rule

Hat B never produces state 2 from its two-cell seed. Removing that unreachable state and relabelling state 3 as state 2 gives the exact three-state reduction:

* A zero cell becomes 1 precisely when it has at most one state-1 neighbour, at least one state-2 neighbour and at least two zero neighbours.
* A state-1 cell becomes 2 precisely when it has at least one state-2 neighbour.
* Every other cell becomes zero.

The tested simplification drops the requirement for two zero neighbours. All 37,858 inspected launches still give exactly the same complete trajectory through the finite observation interval. This is stronger than matching populations or centroids, but it remains a statement about those trajectories.

The two rules are **not equivalent on arbitrary configurations**. A zero cell surrounded entirely by state-2 neighbours remains zero under the exact reduction and is born under the simplification. `simplification-counterexample.json` gives an explicit seven-neighbour example on the same hat patch. The exact state relabelling and the empirically successful rule change should not be confused.

## Reproduction

Run from the repository root with Node.js. The probes require no package dependencies:

```sh
node research/exhaustive-search/hat-targeted/priority-probe.js 5 300 B > hat-b-probe.jsonl
node research/exhaustive-search/hat-targeted/priority-probe.js 5 1000 A,C,S > hat-other-probes.jsonl
node research/exhaustive-search/hat-targeted/priority-experiments.js > hat-simplification.json
node research/exhaustive-search/hat-targeted/priority-launchers.js > hat-launchers.jsonl
```

For the finite exhaustive sweeps, use a C++17 compiler:

```sh
node research/exhaustive-search/hat-targeted/export-graphs.js 5
g++ -O3 -std=c++17 research/exhaustive-search/hat-targeted/priority-sweep.cpp -o /tmp/hat-priority-sweep
/tmp/hat-priority-sweep research/exhaustive-search/hat-targeted/hat-5-touch.dat research/exhaustive-search/hat-targeted/hat-5-edge.dat B 50 700 > hat-b-sweep.jsonl
/tmp/hat-priority-sweep research/exhaustive-search/hat-targeted/hat-5-touch.dat research/exhaustive-search/hat-targeted/hat-5-edge.dat C 70 700 > hat-c-sweep.jsonl
/tmp/hat-priority-sweep research/exhaustive-search/hat-targeted/hat-5-touch.dat research/exhaustive-search/hat-targeted/hat-5-edge.dat E 50 700 > hat-equivalence-sweep.jsonl
```

Mode `E` compares sorted complete state lists, including every nonzero state, without relying on hashes. The other sweep modes use a 64-bit hash only to screen possible stationary recurrence; any such candidate needs independent verification before a period is claimed. None of the Hat B sweeps terminates on that screen.

The JSON selections retain initial states, finite trajectory metrics and sampled phases. They are search evidence, with independent checks supplied separately by the project verifier.

The internal sampled-probe fields `cleanSingleCount` and `cleanSingleBoundaryArrivals` count boundary arrivals whose complete nonzero support stays within radius 12 of its centroid. This is only a compactness screen: it does not check connectivity or count independent bodies, and does not certify a clean single glider. Selected catalogue examples receive separate independent verification.

## What a proof would require

Neither this finite replay nor the published million-ring flight proves immortal propagation. One promising route is to enumerate all legal collared glider situations using the hat substitution, prove completeness of that set across supertile boundaries, and establish transition closure with monotone progress. A vocabulary that merely stops growing in a sampled patch does not meet that standard. A long flight, a translated local return and an infinite-glider proof are different claims.
