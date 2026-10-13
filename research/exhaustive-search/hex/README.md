# Bounded exhaustive hexagonal search

This campaign executed **4,998,720 trials** and **127,452,139 cellular-automaton transitions**. A trial means one seed, one rule and one number of states; trials may converge to the same object. It yielded five selected, independently verified catalogue additions. No claim of first discovery is made.

The main exhaustive part covers all **116 connected live-cell seeds of sizes 1–6**, up to translation, reflection and hexagonal rotation, under all **8,192 six-neighbour B/S rules with a quiescent dead background**, and each of **2–6 states**: **4,751,360 trials**. The numbers of seed shapes are 1, 1, 3, 7, 22 and 82. Birth sets are every subset of 1–6; survival sets are every subset of 0–6. Only state 1 contributes neighbours. A dying live cell advances through refractory states when the rule has more than two states.

Each exhaustive trial stops at the first detected complete-state recurrence, extinction, 400 transitions, support exceeding 600 nonzero cells, or approach to the finite search array's boundary. Translated recurrence is checked only while support has at most 350 cells. The 512-by-512 axial array never wraps. Three empty coordinate rows and columns separate checked support from its outer edge.

These limits are part of the result: this is an exhaustive search of the stated finite inputs with bounded replay, not an exhaustive search of all possible hexagonal gliders. B0 rules, initially refractory seeds and disconnected seeds fall outside this exhaustive part.

Two complementary campaigns made 200,000 mutations around 612 phases of earlier ships, launchers and emitters, and 47,360 perturbations of the earlier three-way gun and puffer. The latter includes every single-cell state substitution inside axial radius 8 across 40 source phases, plus 30,000 random multiple-cell edits. Their exact generators, fixed source configurations, seed-file hashes, bounds, counts and stop reasons are retained here. Replaying the 47,360 emitter trials for classification is recorded separately and is **not** added to the total twice.

## Selected behaviour

| Live seed | Rule | States | Launch settles at | Exact period | Axial translation |
|---|---|---:|---:|---:|---|
| Three cells | B2/S0 | 3 | 0 | 2 | (0,−1) |
| Four cells | B234/S1346 | 3 | 9 | 8 | (1,1) |
| Five cells | B2456/S1345 | 4 | 6 | 43 | (−6,3) |
| Six cells | B23/S13 | 4 | 16 | 9 | (5,−4) |
| Six cells | B234/S245 | 5 | 12 | 10 | (1,2) |

The last two are **knightships**: their movement follows neither a hexagonal axis nor a diagonal. The five-cell launcher leads to a compact but elaborate 43-generation cycle. In the final six-cell launcher, four S5 survivals during the first three generations are essential: deleting S5 before launch causes extinction at generation 25, whereas deleting it after launch preserves the complete recurrent orbit.

The independent coordinate-map reference checks every live and refractory state, the first recurrence and its minimal period. Full phase trajectories are compared under all six rotations and reflections, with phase shifts, against the earlier catalogue and one another. The selected finite trajectories also agree with the browser's automaton over **4,952,355 cell-generation comparisons**, with at least three dead rings outside all nonzero cells.

On the infinite regular hexagonal lattice, an exact full-state translated recurrence proves indefinite propagation by translation invariance and determinism. The playable board remains finite. This argument does not automatically apply to a Penrose or Einstein tiling.

No additional distinct indefinitely emitting gun or puffer is certified here. The emitter filter checks recurrence inside a bounded central region together with linear growth outside; that filter alone cannot establish an emission proof.

## Reproduce

Run these commands from the repository root with Node.js and a C++17 compiler. `hex-work` is a generated working directory and should not be committed.

```sh
mkdir -p hex-work
c++ -O3 -std=c++17 research/exhaustive-search/hex/search.cpp -o hex-work/search
node research/exhaustive-search/hex/generate-small-seeds.js hex-work
hex-work/search exhaustive hex-work/small-seeds.txt hex-work/small 400 600 6
hex-work/search exhaustive hex-work/n5-seeds.txt hex-work/n5 400 600 6
hex-work/search exhaustive hex-work/n6-seeds.txt hex-work/n6 400 600 6
node research/exhaustive-search/hex/generate-mutations.js hex-work 200000
hex-work/search mutations hex-work/mutation-seeds.txt hex-work/mutations 1200 850 8
node research/exhaustive-search/hex/generate-emitter-mutations.js hex-work
hex-work/search emitters hex-work/emitter-seeds.txt hex-work/emitters 240 650 4
node test-hex-exhaustive-evidence.js
node test-hexagonal-evidence.js
```

The source-phase fixture is fixed so that adding future catalogue entries cannot change these searches. Generation of all five input files was reproduced byte for byte. `campaigns.json` contains their SHA-256 hashes and exact counts. Generated candidate files are discovery aids, not verified catalogues: phase collection deliberately suppresses some rule variants before the stricter independent orbit comparison.

The catalogue contracts and full scientific evidence are in `research/fixtures/hex-exhaustive-evidence.json`. The general hexagonal evidence test also checks the selected paths against Core; the additional test verifies the complete launch-and-flight traces, oblique directions, and essential launch-only clause.
