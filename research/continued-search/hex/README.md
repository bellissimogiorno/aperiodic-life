# Continued hexagonal search

This complementary campaign ran **4,444,400 trials** and **110,171,326 automaton transitions**, using 561.61 CPU seconds for the four miner processes. Only one miner ran at a time. A trial is one initial state, rule and state count; it is not a discovery.

| Campaign | Inputs | Trials | Transitions |
|---|---|---:|---:|
| Mixed small seeds | 180 state-labelled seeds × all 8,192 quiescent rules | 1,474,560 | 20,538,919 |
| Seven live cells | All 333 free connected shapes × all 8,192 rules, C4 | 2,727,936 | 69,805,222 |
| Eight live cells | All 1,448 free connected shapes × 98 selected rule/state pairs | 141,904 | 7,077,851 |
| Fresh mutations | Fixed catalogue phases, PRNG seed `0x3722026` | 100,000 | 12,749,334 |

The mixed campaign exhausts connected supports of one to three occupied cells with both live and refractory cells, C3–6, modulo translation, rotation and reflection. All-live seeds and seeds with no live cells are excluded. The seven-cell campaign exhausts C4 only. The eight-cell campaign covers each of seven fixed catalogue rule/state pairs and all one-clause changes among B1–B6 and S0–S6; it is not an all-rule search. Mutation inputs contain arbitrary allowed refractory values and are generated deterministically.

`campaigns.json` records exact counts, source and seed-file hashes, commands, timings and stop reasons. Mixed and seven-cell trials stop after 700 transitions or support above 650; eight-cell trials use 1,000/850 and mutations use 1,200/850. All runs use a non-wrapping 512×512 array and stop within its outer three rows/columns. Translated recurrence is only checked at support at most 350. These bounds limit what a negative result establishes.

## Selected examples

* **Period-6 puffer, B245/S02, C5.** A 28-state head translates by axial (−2,4), leaving exactly one stationary live cell every six generations. Exact complete-state recurrence and 12 phase-by-phase separation checks, with minimum projection gap four, prove indefinite propagation and deposition on the unbounded hexagonal lattice.
* **Three-cell twin-puffer launcher, same rule.** Two live cells and one refractory cell become two opposite 28-state puffers plus four stationary live cells at generation 30. Each head has its own emission certificate; 18 additional separation checks prove the two outward streams and original debris remain independent. This is a finite launch, not a stationary gun. Two B5 births occur on transition 11→12; B5 is unused in the ensuing puffer cycles.
* **Period-48 spaceship, B2345/S24, C4.** Seven live cells settle after 16 generations into a complete-state cycle translating (−32,16). The displayed centred phase has 21 nonzero cells; the cycle contains 10–23 live and 21–50 nonzero cells. Independent phase decomposition identifies one persistent body and short-lived sparks. The separately found period-130 object was rejected as a convoy of period-10 and period-26 ships.

The first two examples show the same puffer mechanism in isolation and during its small launch. A related four-live-cell seed was already present as an unclassified growing result in the earlier campaign. These examples are newly verified and catalogued package finds; their worldwide discovery priority has not been established. The mutation baseline credits the published gun and puffer geometries it contains. No new stationary gun is certified here.

The selected trajectories match Core over **15,826,131 cell-generation comparisons**, with at least three empty rings outside all nonzero cells: 120 steps for each puffer example and 192 for the p48 ship. The playable boards remain finite. The p48 entry uses depth 192 so its four-period traveller check stays inside the boundary.

Full-orbit comparison of all 983 raw mover records leaves 106 complete-state orbits absent from the preceding 33-entry hexagonal catalogue and one another. This count includes refractory-tail variants and other qualitatively redundant results; it is not a count of new discoveries. Matching compares every state, phase, translation and hexagonal symmetry, rather than only a single live-cell picture or the rule string.

## Evidence and replay

`recommended-catalogue.json` contains the three playable entries. `selected-evidence.json` retains complete-state certificates, launch data, trajectory hashes and Core comparisons. `twin-puffer-evidence.json` records the exact split and inter-group separation certificates. `catalogue-baseline.json` freezes the 33 previous hexagonal examples and their credit information; `hex-reference.js` is the independently implemented coordinate-map reference used for this campaign.

From the repository root, verify the scientific evidence and its catalogue coordinates:

```sh
node research/continued-search/hex/verify-selected.js ./discoveries.js
```

To reproduce the searches without placing generated inputs beside the source, copy this directory to a working directory and use Node.js, Python 3 and a C++17 compiler:

```sh
cp -R research/continued-search/hex hex-work
cd hex-work
c++ -O3 -std=c++17 search.cpp -o search
node generate.js
node generate-targeted.js
python3 run.py ./search coloured mixed-small-seeds.txt mixed 700 650 6
python3 run.py ./search coloured n7-c4-seeds.txt n7 700 650 4
python3 run.py ./search targeted n8-targeted-seeds.txt n8 1000 850 8
python3 run.py ./search mutations new-mutations-seeds.txt mutations 1200 850 8
node analyse-movers.js
node certify-twin-puffer.js
node build-selected.js ../core.js
node verify-selected.js
```

The generators recreate the input files whose hashes are in `campaigns.json`; the targeted and mutation files were reproduced byte for byte. Candidate filters for a repeating central region with growing exterior support are discovery aids only. Their output includes growing fronts and stationary trails, so they cannot by themselves certify a gun or puffer.
