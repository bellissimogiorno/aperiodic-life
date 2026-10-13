# Evolutionary search for B/S hat travellers

This complements the earlier broad random search. It starts from 1,276
complete phases selected from its best directional candidates, including
refractory states. Separate elite pools for graph and state count preserve
promising seeds while mutations add, remove or change nearby cells, alter
nearby B/S clauses, or change the number of states. Fifteen per cent of
generated attempts are fresh local soups to maintain exploration.

The completed campaign evaluated **1,000,000 configurations** after skipping
67,294 repeated initial-state hashes. It examined **59,597,029 states** and
performed **58,597,029 transitions**, containing **3,056,091,749 sparse
candidate-cell updates**. Counts include initial seed evaluations and fresh
soups as well as mutated offspring; they do not assert mathematical novelty
or independence of the sampled configurations. The 64-bit hash is a search
deduplication heuristic, not a proof that configurations are distinct.

Both edge and vertex-touch graphs use the 54,289-tile depth-5 hat patch.
Every generation checks the entire nonzero support, including refractory
cells. Trials stop above radius 18 world units, above 180 nonzero cells,
below six boundary rings, on extinction or a hashed stationary recurrence,
or at 4,096 generations. B0 is excluded. State counts range from 2 to 32;
fresh soups favour B2-bearing rules and counts 3–20, while mutations can
reach the other allowed rules and state counts. See `evolve.cpp` for the
exact deterministic distributions and selection procedure.

The strongest displacement family, under touch B2357/S1345 with nine states,
stays within radius 18 for a substantial directed prefix. Its later
evolution spreads: the representative in `evidence.json` exceeds 2,000
nonzero cells by generation 291. The 20 leading displacement candidates
share this eventual growth. Thus continuous compactness of a finite prefix,
although stronger than endpoint measurements alone, still does not establish
a glider.

All 26 distinct seeds behind the 75 retained translated-return records were
replayed further and became extinct. Their complete state-labelled polygons
really do translate; 25 fail the first dead-neighbourhood ring and one matches
one ring but fails the next. The latter four-cell B27/S25 six-state seed
travels almost 50 world units before extinguishing at generation 55. It was
one of the prior-search seed evaluations, not a newly discovered seed.

The sole trial surviving the 4,096-generation limit was recovered by
deterministic replay and followed further. Under B357/S12345 with 30 states,
it enters a stationary period-31 cycle after a 4,657-generation transient.
Its maximum centroid displacement is only about 5.15 world units. This is a
long local transient, not sustained travel.

These results do **not** prove that a B/S or Generations hat glider cannot
exist. Nor do they concern all priority-table rules: the independently
verified wake traveller elsewhere in this release belongs to that broader
rule family.

## Reproduce

Run from the repository root with Node.js and a C++17 compiler:

```sh
mkdir -p /tmp/hat-evolution
node research/exhaustive-search/hat-broad/export.js 5 /tmp/hat-evolution
g++ -O3 -std=c++17 research/continued-search/hat-bs/evolve.cpp -o /tmp/hat-evolution/evolve
/tmp/hat-evolution/evolve /tmp/hat-evolution/hat-5-edge.dat /tmp/hat-evolution/hat-5-touch.dat research/continued-search/hat-bs/seeds.dat 1000000 /tmp/hat-evolution/evolution 7525949657324569972
node research/continued-search/hat-bs/screen.js /tmp/hat-evolution/evolution-best.json /tmp/hat-evolution/best-screen.json 20
node research/continued-search/hat-bs/screen.js /tmp/hat-evolution/evolution-returns.jsonl /tmp/hat-evolution/returns-screen.json
node research/continued-search/hat-bs/screen.js /tmp/hat-evolution/evolution-survivors.jsonl /tmp/hat-evolution/survivors-screen.json
```

The miner arguments are the two exported graphs, seed file, evaluation
count, output prefix and decimal xorshift64star seed. The shipped miner also
retains every horizon survivor; adding that output does not change the
search or its random stream. A 10,000-evaluation smoke reproduction matches
the original state count, best score, generation and translated-record count.

`seeds.dat` contains graph index (0 edge, 1 touch), birth bit mask, survival
bit mask, state count, entry count, and cell/state pairs. Its first line is
the number of seeds. `seed-provenance.json` identifies the earlier campaign,
trial and source phase for each row, preserving reproducibility without
shipping old raw logs. Clauses above each graph's maximum degree are removed
before the evolutionary run.

`screen.js` independently replays the C++ output using the JavaScript sparse
engine, checks saved complete endpoints, verifies translated polygons and
dead halos, and detects exact stationary repeats. Its horizon is 10,000
generations, population cap 2,000 and boundary buffer four rings. The package's
separate verification directory supplies additional independent checks of
selected cases. `evidence.json` contains representative complete seeds and
the resulting finite classifications; `campaign.json` records exact
accounting, graph hashes and source hashes.

The original horizon-survivor recovery replay evaluated the first 509,317
configurations again. It is a reproducibility check and is **not** added to
the million search evaluations. Population/radius maxima emitted by the
miner concern states checked before its population cutoff; continuation
reports in `evidence.json` give the full checked maxima under their larger
limits. No binaries, generated graphs or bulky progress logs are shipped.
