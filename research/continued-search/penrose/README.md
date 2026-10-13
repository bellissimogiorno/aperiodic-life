# Continued Penrose search

This campaign adds **350,000 executed seed trials and 28,171,773 cellular-automaton transitions** to the earlier search. Validation runs are separate. Trials are samples and can repeat a seed; these totals do not count distinct configurations.

The selected result is a **three-live-cell, twelve-traveller launcher** under the existing Penrose B2/S C6 rule. On the depth-10 sun patch, twelve compact bodies evolve independently from generation 90 through generation 130: their disjoint union reproduces the entire labelled state at every generation. Each has a complete-state translated return with matching tile polygons; **five** also have a return with three matching neighbour rings within that interval. The other seven do not receive that stronger local-environment certificate. All twelve move approximately 34.7–36.0 tile-coordinate units during the interval, remain at most 18 nonzero cells, and have radius at most 2.701. The whole evolution stays at least seven neighbour steps from the patch boundary.

This is a further launcher for the existing B2/S traveller family, not an established new propagation mechanism, repeating gun or proof of unbounded motion. External first-discovery priority for this particular launcher has not been established.

The initial live cells are `46186`, `51676` and `51680`. The miner originally retained an additional cell `51685` in refractory state 5; the subset check found that this extra cell does not affect the generation-130 endpoint. None of the six nonempty proper subsets of the three live cells produces the same complete endpoint. One two-cell subset approaches boundary distance two, so its later behaviour should not be extrapolated. No inclusion-minimality claim over other placements or other state assignments is made.

## Completed campaigns

| Stream | Trials | Actual transitions | Horizon |
| --- | ---: | ---: | ---: |
| Connected and partly refractory seeds | 300,000 | 25,023,752 | 130 |
| High-neighbour-count rules | 50,000 | 3,148,021 | 130 |
| Total | 350,000 | 28,171,773 | |

Both use the 54,560-cell depth-10 Penrose sun patch and the touching-neighbour graph. Eligible starting cells have boundary distance at least 70 and centre radius below 38, giving 270 possible start cells. Seeds are grown by adding randomly selected neighbours, so their occupied support is connected at generation zero. Runs stop on extinction, a repeated-state screening hash, boundary distance below three, more than 1,800 nonzero cells, radius above 210, or the horizon. The 64-bit hash is a screening shortcut, not an exact cycle certificate; the selected launcher receives full-state production verification.

The first stream uses B2/S, C4–C10, with every sixteenth trial instead using C3. Seven eighths of the trials start with four to six occupied cells; the others use seven to twenty-four. Every fifth trial permits refractory initial states; otherwise all occupied cells are live. Its seed is `37210491` with xorshift64star. The second stream uses C2–C9, B2 plus one birth count from 8–11, optional B3, and optionally one survival count from 8–11. It starts with eight to thirty-two connected cells at one of the 240 eligible cells of degree at least eight, and half the trials permit refractory states. Its random seed is `37210811`.

The high-count stream actually used the added clauses: there were 349,224 births and 56,467 survivals at counts of at least eight across all completed runs. All 189 retained candidate endpoints agree with the production engine. However, in the generation-90-to-130 interval, none of those retained candidates used a high-count transition or differed from B2/S when applied to its current state. This establishes neither a new moving core nor a nonexistence result for other seeds and rules.

The screen also retained larger emission counts and apparent source remnants. The fifteen-body C4 candidate still had interactions at early attempted splits; it is not presented as fifteen independent emissions. Of 99 retained near-source remnants evolved alone for up to 240 further generations, 87 travelled to the boundary and twelve became extinct. No repeating emitter was established.

## Larger-patch placement checks

`transplant-more.js` seeks translated copies of each source seed and its three-ring neighbourhood on the depth-11 sun patch, requiring the target anchor to have boundary distance at least 110. The match checks tile-shape keys, tile centres and the induced neighbour graph. It then replays up to 230 generations. These are local matches, not claims that the whole future environment is identical.

For trial 95542 there were no eligible matches under those restrictions. Trial 4435 had two: one died at generation 99; the other had eight connected components at generation 130 and reached the boundary buffer at generation 191. Trial 28186 also had two: one had five components at generation 130 and reached the buffer at 212; the other had eleven at 130 and reached the buffer at 190. Later component counts include interactions and are not independently verified traveller counts. The tested larger placements therefore did not preserve the selected twelve-body demonstration. This negative result is limited to the tested translations and boundary restrictions.

## Reproduction

Run these commands from this directory in a checkout of Aperiodic Life. They require Node.js and a C++17 compiler. Re-running a campaign overwrites its local result files.

```sh
node export.js 10 penrose-10-touch.graph
g++ -O3 -std=c++17 launch-more.cpp -o launch-more
./launch-more penrose-10-touch.graph sun-connected 37210491 300000 130 connected
./launch-more penrose-10-touch.graph touch-high-counts 37210811 50000 130 high
node check-source-and-subsets.js
node transplant-more.js
node audit-high-counts.js
node verify-twelve.js
```

`campaigns.json` records the exported graph checksum and exact totals. Individual `.account.json` files give rule/state/seed-size execution counts and outcomes. The `.jsonl` files retain successive best screening candidates, including their complete initial and final labelled states. Graph paths have been normalised to a portable basename. Rule strings are regenerated from the authoritative numerical masks, with bracket notation for counts 10 and 11; the final miner formatter produces the same unambiguous notation.

`verify-twelve.js` compares the reduced seed against the production engine for all 131 states, verifies the exact disjoint union of twelve isolated evolutions for 41 states, checks all six proper subsets, and records the complete-state trajectory SHA-256. `twelve-launcher-evidence.json` contains checkpoints, component states and measured returns. `recommended-catalogue.json` is the proposed app entry at speed 6 and horizon 130. The independent checker used during the campaign also verified the original four-cell seed; its longer generation-137 interval had seven radius-three returns, but that count is deliberately not used for the shorter catalogue interval.
