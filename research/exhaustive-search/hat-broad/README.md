# Broad B/S and Generations searches on Einstein-hat tiles

This campaign searches the six/five/four-neighbour edge graph and the
seven/six/five-neighbour vertex-touch graph of the app's depth-5 hat patch
(54,289 tiles). It concerns ordinary outer-totalistic B/S rules and their
Generations extensions. The priority-table rules used by the separately
verified published hat gliders are a different rule family.

The five completed random campaigns contain **10,100,000 trials**. A further
**45,180 systematic transplant trials** test two compact moving phases at all
440 matching interior placements found in the patch, with neighbouring rules
and state counts. These are bounded searches, not an exhaustive enumeration of
all initial configurations or a proof that a B/S hat glider cannot exist.
The random trial count is not a claim of that many distinct configurations.

No persistent compact B/S hat glider was established. Full-state translated
returns did occur. Replaying them exposed spreading activity, eventual
extinction or stationary oscillators. The four examples in
`rejected-glider-candidates.json` show why a translated active shape alone is
insufficient evidence on an aperiodic substrate: its surrounding dead tiles
and graph may differ. In the three translated examples, the first dead
neighbourhood ring already fails the translation test.

## Reproduce the random campaigns

Run these commands from the repository root. A C++17 compiler and Node.js are
required only for research; the browser app does not use the miner.

```sh
mkdir -p /tmp/hat-broad
node research/exhaustive-search/hat-broad/export.js 5 /tmp/hat-broad
g++ -O3 -std=c++17 research/exhaustive-search/hat-broad/search.cpp -o /tmp/hat-broad/search

/tmp/hat-broad/search /tmp/hat-broad/hat-5-edge.dat 100000 /tmp/hat-broad/edge-broad 7525949657324569941 800 350 0 1
/tmp/hat-broad/search /tmp/hat-broad/hat-5-edge.dat 3000000 /tmp/hat-broad/edge-wide 7525949657324569942 1200 500 0 1
/tmp/hat-broad/search /tmp/hat-broad/hat-5-touch.dat 3000000 /tmp/hat-broad/touch-compact 7525949657324569943 1200 350 0 0
/tmp/hat-broad/search /tmp/hat-broad/hat-5-edge.dat 2000000 /tmp/hat-broad/edge-small 7525949657324569944 1600 250 1 0
/tmp/hat-broad/search /tmp/hat-broad/hat-5-touch.dat 2000000 /tmp/hat-broad/touch-small 7525949657324569945 1600 250 1 0
```

The positional arguments are graph, trial count, output prefix, decimal PRNG
seed, generation horizon, nonzero-cell limit, small-seed flag and endpoint-score
flag. The PRNG is xorshift64star with unsigned 64-bit arithmetic. The exporter
stores centres, complete polygon orientation classes, boundary distances and
adjacency; no generated graphs or binaries are needed in the release.

Broad trials use 2–48 target seed cells grown through random graph neighbours;
some soups have cells removed afterwards. Initial cells are usually alive,
with mixed refractory states in one quarter of multistate soups. State counts
range from 2 to 32. Birth and survival masks vary each trial, with most births
centred on counts 2 or 3; the exact distribution is in `search.cpp`.
Small-seed trials instead use 2–11 target cells, B2-bearing birth masks,
survival masks on counts 0–6 and state counts 2–16. Rule clauses above a graph's
maximum degree have no effect, so syntactically different sampled rules may be
equivalent on that graph. B0 is excluded because the sparse finite-background
method does not represent spontaneous births throughout an infinite plane.

Initial anchor cells have graph-boundary distance at least 24; added seed
cells have distance at least 16. Trials stop before nonzero activity comes
within fewer than five boundary rings. They also stop at extinction,
population limits, a hashed stationary recurrence or the specified horizon.
All refractory states count towards population and geometry limits.

The first two campaigns used endpoint displacement divided by endpoint radii
as a candidate score. Independent replay showed this could favour waves that
spread widely and later contract. Subsequent campaigns require maximum radius
at the eight-generation checkpoints to remain at most 25 world units over
the scored interval, and divide travel by that maximum radius. Continuous
trajectory checks are still required afterwards: checkpoint measurements can
miss a larger intervening phase. Neither score is a glider certificate.

Translated-shape candidates include every nonzero state and complete polygon
orientation, with relative centres rounded to 0.001 world units. Candidates
are retained separately from the 200 highest mobility scores. Shape searches
cover populations up to 90 and generations up to 400; therefore the absence
of a candidate does not exclude larger or slower gliders. Stationary-cycle
hashes and quantised shape returns are mining heuristics and require exact
replay before any mathematical claim.

## Transplant search and independent rejection checks

```sh
node research/exhaustive-search/hat-broad/transplant.js research/exhaustive-search/hat-broad/transplant-seeds.jsonl /tmp/hat-broad/transplants
node research/exhaustive-search/hat-broad/verify-rejections.js
```

The transplant search takes the final retained matching phase of each of the
two seeds, tries every congruent interior placement with the same complete
polygons, and tests the original rule plus eight nearby rule strings. State
counts run from one above the largest initial state through 16. Its horizon
is 1,200 generations, population cap 200 and radius cap 25, checked every
generation. Outcomes were 31,571 extinctions, 7,040 radius stops, 6,190
population stops, 147 boundary stops and 232 stationary cycles. No run reached
the horizon.

`verify-rejections.js` uses a separate neighbour-query implementation, compares
every complete state with `Core.Automaton`, checks exact first extinction or
stationary recurrence, verifies translated tile polygons, tests the dead halo,
and includes a refractory-state mutation negative control. Its report is
stored in `rejection-verification.json`. The examples retain ample boundary
clearance, so their extinction and stationary recurrence are not edge effects.

`classify-translated.js` can replay all distinct seeds in a miner's
`*-translated.jsonl` file for up to 5,000 further generations:

```sh
node research/exhaustive-search/hat-broad/classify-translated.js /tmp/hat-broad/touch-compact-translated.jsonl touch
```

This secondary screen starts at each candidate's first reported return phase,
stops above 1,500 nonzero cells or below four boundary rings, and reports full
trajectory radius. `campaigns.json` records completed counts, settings and
source hashes. Raw search logs, binaries and generated graph files are omitted.

The 200 leading mobility-score candidates from each of the three campaigns
using interval compactness were also replayed from their original seeds, with
a 5,000-generation horizon and a 2,000-cell cap. This screen checks saved C++
endpoint states and samples radius every eight generations; its radius report
is not a continuous compactness certificate. Reproduce it with:

```sh
node research/exhaustive-search/hat-broad/screen-mobility.js /tmp/hat-broad/edge-small-best.json edge 200
node research/exhaustive-search/hat-broad/screen-mobility.js /tmp/hat-broad/touch-compact-best.json touch 200
node research/exhaustive-search/hat-broad/screen-mobility.js /tmp/hat-broad/touch-small-best.json touch 200
```
