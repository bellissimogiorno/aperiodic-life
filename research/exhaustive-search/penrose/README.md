# Penrose search and multiple-traveller launchers

This release's new Penrose campaigns completed **6,121,536 candidate
executions and 122,563,637 simulated transitions**. Earlier search campaigns
are excluded from these totals. The search found useful small launchers, but
has not established a new indefinitely travelling Penrose glider.

The curated five- and six-traveller launchers each start from **three live
cells** under `B2/S`. They release separate compact instances of the established
Penrose wave. Five-state and six-state refractory dynamics give different
launch behaviour. These are additions to the catalogue, not claims of
previously unknown mathematical patterns. Some emitted waves follow parallel
tracks: the numbers count bodies, not necessarily different directions.

## Completed campaigns

| Campaign | Graph | States | Candidate executions | Transitions |
|---|---|---|---:|---:|
| Mixed soups and mutations | Touch | C2–C16 | 1,080,000 | 15,964,693 |
| Binary rule grid | Edge | C2 | 2,080,768 | 48,232,523 |
| Binary rule grid | Touch | C2 | 2,080,768 | 28,181,515 |
| Long refractory states | Touch | C16–C32 | 720,000 | 17,568,554 |
| Multiple-traveller launchers | Touch | C4–C10 | 160,000 | 12,616,352 |
| **Total** | | | **6,121,536** | **122,563,637** |

General searches used the 20,800-cell depth-9 sun patch. The launcher campaign
used the 54,560-cell depth-10 patch. A further **125 depth-11 transplants**
matched each source seed and three surrounding neighbour rings before
simulation. Those validation screens are reported separately, rather than
added to the random/evolutionary search total.

`campaigns.json` records exact seeds, commands, limits, outcomes, graph hashes
and configuration counts. The CSV files in `accounting/` record every completed
configuration, including its actual transitions and terminal outcomes. These
accounting files are sufficient to recompute the reported totals.

## What the rule grid covers

The binary grids cross every nonempty birth subset of counts 1–7 with every
survival subset of counts 0–6: 16,256 syntactic rows per graph. An edge tile
has at most four neighbours, so clauses for larger counts are dormant. The
edge campaign consequently covers **512 effective rule combinations**,
including the effective empty-birth rule. Repeated effective rules use fresh
random-stream positions; they are not extra kinds of rule.

The touch graph can have eleven neighbours. Its binary grid therefore covers
a substantial restricted family, not every possible rule on that graph.
The general campaigns cover 18,011 distinct effective `(graph, rule, states)`
combinations in total. Counts exclude the separately sampled launcher rules.

Initial soups contain 3–48 cells, with occasional 49–96-cell seeds. The
connected seed generator alternates live-biased, entirely live and phased
initial conditions. General searches also mutate retained candidates; states
may repeat within those streams. The reported number is **executions**, not a
count of provably distinct initial states.

## Verification and interpretation

The C++ miner uses a 64-bit state hash as a screening guard and ranks compact
net movement. That hash is not a proof of a cycle. Only selected candidates
receive the stronger complete-state checks.

The independent JavaScript audit replays 301 retained mobile candidates from
the three touch campaigns. Twenty-six have a complete-state translated return
with matching tile polygons and graph neighbourhoods through radius three.
**None of those recurrent intervals exercises a transition that distinguishes
its rule from `B2/S`.** Extra clauses can affect the initial launch; dormant
clauses are not counted as a new recurrent mechanism. This statement applies
to the retained candidates, not every unretained intermediate state in the
search.

The catalogue's five- and six-traveller examples are independently verified
through generations **240 and 200**, respectively, on depth 11. The release
verification fixture checks the complete state, including refractory cells,
and confirms that independently evolved emitted bodies reconstruct the whole
configuration. It also checks translated tile polygons and surrounding empty
cells and adjacency. The minimum boundary distances within those catalogue
horizons are nine neighbour steps in both cases.

`selected-launcher-evidence.json` and `verify-launchers.js` provide a second
replay of these mechanisms and one additional three-traveller example. The
second replay follows the six-traveller case through generation 210, with
minimum boundary distance five. This longer research horizon is separate from
the more conservative catalogue contract.

The geometry checks use the production patch's floating-point coordinates and
the documented 0.0015 positional/polygon tolerance in
`research/search-mobile-patterns.js`; equality of labelled cell states is
exact. A translated return on an aperiodic tiling certifies a repeated local
phase over a finite trajectory. It does not prove global translation symmetry
or perpetual travel. Negative results remain bounded by the documented rules,
seeds, ranking, patch sizes, horizons and compactness guards.

## Reproduction

From the repository root, create a working directory and build the two miners:

```sh
mkdir -p /tmp/penrose-search
node research/exhaustive-search/penrose/export.js 9 /tmp/penrose-search
node research/exhaustive-search/penrose/export.js 10 /tmp/penrose-search
g++ -O3 -std=c++17 research/exhaustive-search/penrose/search.cpp -o /tmp/penrose-search/penrose-search
g++ -O3 -std=c++17 research/exhaustive-search/penrose/launchers.cpp -o /tmp/penrose-search/penrose-launchers
```

Run the complete campaigns:

```sh
cd /tmp/penrose-search
./penrose-search penrose-9-touch.graph touch-broad.jsonl 36511001 900 1200 384 broad
./penrose-search penrose-9-edge.graph edge-binary-grid.jsonl 36511002 16256 128 384 grid-binary
./penrose-search penrose-9-touch.graph touch-binary-grid.jsonl 36511004 16256 128 384 grid-binary
./penrose-search penrose-9-touch.graph touch-high.jsonl 36511005 600 1200 512 high
./penrose-launchers penrose-10-touch.graph multi-launchers.jsonl 160000 36511003
```

From the repository root, audit the retained touch candidates and replay the
selected multi-launchers:

```sh
node research/exhaustive-search/penrose/audit-candidates.js /tmp/penrose-search /tmp/penrose-search/candidate-audit.json
node research/exhaustive-search/penrose/verify-launchers.js /tmp/penrose-search/launcher-evidence.json
```

The miners require a C++17 compiler. Export and replay require Node.js and use
the dependency-free production geometry and reference simulation tools.
