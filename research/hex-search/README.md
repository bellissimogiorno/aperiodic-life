# Reproducing the hexagonal search

These deterministic research programs search the six-neighbour regular hexagonal lattice. They supplement the application's dependency-free JavaScript tools with faster C++ miners. Running the app and verifying its curated configurations do not require a C++ compiler or rerunning the search campaigns.

Read [Hexagonal structures](../../docs/HEXAGONAL_STRUCTURES.md) for the playable results and their interpretation. Candidate records are leads for independent verification, not a count of distinct discoveries or a claim to mathematical priority.

The completed campaigns total **6,630,400 seed trials**:

| Search family | Completed trials | Scope |
| --- | ---: | --- |
| Binary rule survey | 1,640,400 | 254 distinct binary rules |
| Generations rule survey | 1,100,000 | Sampled rules with 3–16 states |
| Oscillator survey | 3,890,000 | 18 campaigns across 13 binary rules |

The scope overlaps between families. The total counts executed trials, including repeated geometries and multiple rules applied to a seed.

## Build and run

Use a C++17 compiler and Python 3. Run these commands from the repository root. Keep executables, logs and generated candidates in a separate output directory:

```sh
mkdir -p ../hex-search-output
g++ -O3 -std=c++17 research/hex-search/binary/search.cpp -o ../hex-search-output/binary-search
g++ -O3 -std=c++17 research/hex-search/generations/search.cpp -o ../hex-search-output/generations-search
g++ -O3 -std=c++17 research/hex-search/oscillators/miner.cpp -o ../hex-search-output/oscillator-search
g++ -O3 -std=c++17 research/hex-search/oscillators/miner-symmetric.cpp -o ../hex-search-output/symmetric-search
```

For a small exploratory run:

```sh
../hex-search-output/binary-search ../hex-search-output/binary-small.jsonl 1000 20261011 500 B245/S35
../hex-search-output/generations-search 1000 ../hex-search-output/generations-small 7522551138070962214
../hex-search-output/oscillator-search 8 12 1000 1024 0 ../hex-search-output/oscillators-small
```

The binary miner accepts `OUTPUT TRIALS_PER_RULE SEED GENERATION_LIMIT RULES`, where `RULES` is a comma-separated ordered list. The Generations miner accepts `TRIALS OUTPUT_PREFIX SEED`. The oscillator miners accept `B_MASK S_MASK TRIALS GENERATION_LIMIT FIRST_SEED OUTPUT_PREFIX`; the symmetric miner accepts a final mode, `soup`, `sym3`, `sym6` or `large`. The masks contain bit `n` when a birth or survival with `n` neighbours is allowed: `B3/S23` uses masks 8 and 12; `B34/S234` uses 24 and 28. All supplied campaigns exclude `B0`; these sparse miners do not implement infinite-background zero-neighbour births.

## Binary rule survey

The completed binary survey contains **1,640,400 seed trials across 254 distinct rules**. Each campaign keeps one continuous `std::mt19937_64` generator and visits rules in the recorded order. Reordering or omitting a preceding rule changes the later soups.

| Campaign | Completed trials | Trials per rule | Generation limit | PRNG seed |
| --- | ---: | ---: | ---: | --- |
| Broad | 150,000 | 6,000 | 500 | `20261011` |
| Focused | 720,000 | 120,000 | 1,500 | `10720261011` |
| Travellers | 560,000 | 80,000 | 1,500 | `908020261011` |
| Long periods | 20,000 | 20,000 | 5,000 | `60520261011` |
| Rule grid | 190,400 | 800 | 600 | `18620261011` |

[binary/campaigns.json](binary/campaigns.json) records the exact ordered rules, outcomes and command for each campaign. The five `*-completed-rules.txt` files provide comma-separated rule lists. Only fully completed rule runs are counted. To reproduce the broad campaign from the repository root:

```sh
hex_rules=$(cat research/hex-search/binary/broad-completed-rules.txt)
../hex-search-output/binary-search ../hex-search-output/broad.jsonl 6000 20261011 500 "$hex_rules"
```

The other campaigns use the same command shape with their corresponding table values and rule file. Their reference commands in the manifest assume the executable and rule files are in the current directory; adjust paths if using the separate output directory above.

Seeds alternate between connected random clusters targeting 3–27 cells and soups on radius-3 or radius-4 hexagons. The soup densities are 35%, 55% or 20%; the last case is reflected across `q=r`. The 256×256 array is a workspace, not a torus. A trial stops before support crosses the guarded coordinate range `−123…122`, at more than 600 live cells, on extinction, on recurrence, or at its horizon.

Every generation is compared by its complete translation-normalised live-cell set. A first repeat gives the least detected translated period. Recording is restricted to movers or stationary periods of at least 4, with no more than 180 live cells at the repeated phase. Short-period stationary candidates also have a recording quota. Rotations, reflections and phase shifts suppress duplicate candidates within a rule. None of these recording counts is an exhaustive count of structures in that rule.

## Generations rule survey

The Generations miner completed 1,100,000 trials in two campaigns, recorded in [generations/campaigns.json](generations/campaigns.json). It uses `xorshift64star` with explicit 64-bit seeds. Reproduce the two campaigns with:

```sh
../hex-search-output/generations-search 100000 ../hex-search-output/generations-first 7522551138070962214
../hex-search-output/generations-search 1000000 ../hex-search-output/generations-million 7529271334792788165
python3 research/hex-search/generations/analyse.py ../hex-search-output/generations-first-candidates.jsonl ../hex-search-output/generations-first-verified.json
```

Ninety per cent of trials use 3–8 total states and ten per cent use 9–16. Birth rules contain `B2` with randomly selected additional clauses, except in ten per cent of trials, which contain `B3` and optional `B4`–`B6`. Survival clauses are sampled independently; one third of samples additionally remove `S0`. `B0` and `B1` are excluded.

Seeds occupy radius-2–5 hexagons at densities from 15% to 75%. Four trials in five start with live cells only; every fifth trial samples all nonzero states. Only state 1 contributes to neighbour counts, and refractory states advance to dead exactly as in the app.

The miner examines generations 0–700, stopping at extinction, more than 1,400 nonzero cells, or approach to the protected margin of its 256×256 array. Recurrence comparison is performed only at phases with at most 350 nonzero cells. The implementation computes an unused final transition when a trial reaches its horizon. The program's generated `steps` field counts examined states, not simulated transitions; the release manifest names this `stateEvaluations` and records `simulatedTransitions` separately. Hash buckets index candidates; full sorted coordinate/state vectors establish every match.

`generations/analyse.py` independently steps an unbounded coordinate dictionary. It verifies the complete translated return and minimal period, records used birth/survival clauses, compares all phases under the twelve hexagonal symmetries, and counts conservatively separated cycle-footprint components. Its default selection favours movers with periods of at least 10 and stationary cycles of at least 30. Catalogue verification applies further checks to the chosen examples, including complete refractory states and individual-site periods.

## Oscillator survey

The oscillator miners completed 3,890,000 trials across 18 campaigns, recorded in [oscillators/campaigns.json](oscillators/campaigns.json). They target stationary cycles and isolate connected components of their complete cycle territory. Each isolated component is replayed alone; a component that cannot repeat independently is rejected. Hashes only find possible repeats: the entire sorted cell set must agree. Candidate deduplication compares all cycle phases under all twelve hexagonal symmetries.

Seed `s` starts the deterministic sequence with `mix(s + 0x123abc)`, then calls the supplied 64-bit mixing function once per candidate cell, with `q` as the outer loop and `r` as the inner loop. Ordinary seed radius is `4 + s mod 6`; density is `18 + 7 × (floor(s/6) mod 9)` per cent. The `large` mode uses radius `10 + s mod 6`. Modes `sym3` and `sym6` close a soup under threefold or sixfold rotation respectively.

The 128×128 array does not wrap. A trial stops when a live cell reaches the protected two-site edge margin, its population exceeds 2,500, its generation limit is reached, or an exact stationary repeat is detected. A candidate must contain an individual cell whose temporal period is at least 4. That filter removes some trivial composites; the stronger independent catalogue checks determine whether the selected long-period examples contain sites with the full reported period.

To reproduce just the soup containing the selected period-269 oscillator, use one seed:

```sh
../hex-search-output/oscillator-search 24 28 1 512 15338 ../hex-search-output/p269
```

For the selected `B3/S23` periods 4, 5 and 8, use masks `8 12`, one trial, a horizon of 2,048 and seeds `272632`, `1045970` and `511247` respectively. These per-soup seeds are independent; unlike the binary rule survey, earlier seeds need not be replayed.

Representative campaign commands, from the repository root:

```sh
../hex-search-output/oscillator-search 8 12 50000 1024 0 ../hex-search-output/b3s23
../hex-search-output/oscillator-search 8 12 2000000 2048 50000 ../hex-search-output/b3s23-extended
../hex-search-output/symmetric-search 8 12 500000 2048 0 ../hex-search-output/b3s23-sym3 sym3
../hex-search-output/symmetric-search 8 12 500000 2048 0 ../hex-search-output/b3s23-sym6 sym6
../hex-search-output/symmetric-search 8 12 500000 2048 0 ../hex-search-output/b3s23-large large
../hex-search-output/oscillator-search 24 28 20000 512 0 ../hex-search-output/b34s234
../hex-search-output/oscillator-search 24 28 100000 2048 20000 ../hex-search-output/b34s234-extended
```

Campaign manifests retain the completed trial counts, rule masks, seed ranges and stopping outcomes. Repeated numeric seed ranges in different rules or symmetry modes are separate trials, not claims of distinct initial configurations.

The neighbouring-rule sweep runs 20,000 trials from seed 0 to 19,999, with horizon 512, for each of these mask pairs:

| Rule | Birth mask | Survival mask |
| --- | ---: | ---: |
| `B3/S2` | 8 | 4 |
| `B3/S3` | 8 | 8 |
| `B3/S34` | 8 | 24 |
| `B3/S234` | 8 | 28 |
| `B3/S2345` | 8 | 60 |
| `B34/S23` | 24 | 12 |
| `B35/S23` | 40 | 12 |
| `B36/S23` | 72 | 12 |
| `B34/S234` | 24 | 28 |
| `B2/S2` | 4 | 4 |
| `B2/S34` | 4 | 24 |
| `B2/S35` | 4 | 40 |

## Verification and limits

The curated phases live in `discoveries.js`. Run the application checks from the repository root:

```sh
node research/verify-catalog.js
node test-research.js
node test-traveller-evidence.js
node test-hexagonal-evidence.js
```

The release fixtures preserve the selected phases and their verification evidence. Full refractory states are compared throughout. Regular-lattice spaceships require exact translated return; oscillators require exact return with no earlier period. The boundary checks and independent unbounded replay distinguish a genuine local orbit from an artefact of a finite array. Published seeds are replayed under the same six-neighbour model and retain their source attributions.

The portable Python literature checks read the published RLE seeds from `research/fixtures/hexagonal-sources.json`. The first replays each seed on an unbounded coordinate dictionary; the second reconstructs the exact emission, rotation and wall-repair certificates:

```sh
python3 -B research/hex-search/literature/replay.py --output ../hex-search-output/published-replay.json
python3 -B research/hex-search/literature/certify-emitters.py --output ../hex-search-output/emission-certificates.json
```

For the gun and puffer, exact source recurrence is combined with phase-by-phase separating projections along signed axial cube coordinates. Projection gaps of at least three keep the radius-one dependency neighbourhoods of different components disjoint. The translation increments make those gaps non-decreasing for every future emission. This supplies an unbounded argument for continued emission, beyond a long finite replay. The application's separate JavaScript verifier independently reconstructs the certificates.

These campaigns use different seed distributions and can revisit the same orbit. Their trial totals measure search effort, not independent samples, unique geometries or new discoveries. Population caps, generation limits, finite seed sizes, rule choices and recording thresholds all exclude possible behaviours. An unsuccessful bounded search is not a nonexistence proof. The source includes no generated executables, raw search logs or historical handover files.
