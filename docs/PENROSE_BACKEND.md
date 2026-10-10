# Penrose P3 backend

## Scope

The backend generates finite patches of the Penrose rhomb (P3) tiling. Each complete thin or thick rhomb is one automaton cell. It does not use vertices as cells and does not display arrow decorations or Ammann bars.

## Triangle substitution

The seed is a wheel of ten Robinson triangles centred at the origin. The initial radius is `φ^depth`. Two triangle kinds are deflated `depth` times:

```text
kind 0 → 2 children
kind 1 → 3 children
```

Every division point lies at `1/φ` along one parent side. After deflation, equal-kind mirror triangles sharing their designated seam are paired into a complete rhomb. Remaining unpaired boundary triangles are omitted.

The `sun-mirror` option reflects the initial triangle wheel. Once arrow and triangle-orientation decorations are discarded, its emitted rhomb patch is congruent to the `sun` patch (up to rotation/reflection and tile renumbering), so it is a view/indexing option rather than a second graph-totalistic substrate.

Tile kind 0 produces the thin rhomb (acute angle 36 degrees, area `sin(36°)` for unit sides). Tile kind 1 produces the thick rhomb (acute angle 72 degrees, area `sin(72°)`).

## Canonical exact coordinates

Let `d0` and `d1` be unit vectors at 18 and 54 degrees. The other positive decagonal directions satisfy:

```text
d2 = -d0 + φ d1
d3 = -φ d0 + φ d1
d4 = -φ d0 + d1
```

Each point is stored as four signed integers:

```text
[u_a, u_b, v_a, v_b]
```

meaning

```text
(u_a + u_b φ) d0 + (v_a + v_b φ) d1.
```

Because `d0` and `d1` are nonparallel, this representation is unique. Deflation needs exact division by `φ`; for each coefficient pair:

```text
(a + bφ) / φ = (b - a) + aφ.
```

The core interns the four-integer tuple and assigns a point ID. Edges are canonical unordered pairs of point IDs. Thus production topology never compares display floats.

## Patch data at supported UI depths

| Depth | Rhombs | Thin | Thick | Exact points | Shared-edge pairs | Touch pairs | Edge-boundary cells | Touch-boundary cells |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2 | 20 | 10 | 10 | 31 | 30 | 60 | 15 | 15 |
| 4 | 160 | 60 | 100 | 191 | 290 | 680 | 40 | 55 |
| 6 | 1,140 | 440 | 700 | 1,211 | 2,210 | 5,150 | 100 | 160 |
| 8 | 7,920 | 3,030 | 4,890 | 8,111 | 15,650 | 36,860 | 280 | 425 |
| 10 | 54,560 | 20,860 | 33,700 | 55,051 | 108,630 | 256,430 | 730 | 1,130 |

The non-UI depth-11 smoke target contains 143,010 rhombs, 143,806 exact points, 285,225 shared-edge pairs, and 673,770 touch pairs.

## Independent verification

`test-penrose-topology.js` does not use production exact IDs or graph maps. It independently:

1. regenerates triangle geometry in ordinary floating-point coordinates;
2. pairs the triangles into a rhomb multiset;
3. reconstructs point incidence and edge ownership from emitted Float32 polygons;
4. builds edge and touch pairs;
5. reconstructs both boundary definitions and both BFS distance fields;
6. checks one boundary cycle and Euler characteristic 1.

Both sun orientations pass at every depth 1 through 10. The depth-11 smoke test also runs both orientations. The production and independent reconstructions agree on every pair, boundary bit, and distance value through depth 10.

## References

These are mathematical/background references, not runtime dependencies:

- N. G. de Bruijn, “Algebraic theory of Penrose's non-periodic tilings of the plane. I and II,” *Indagationes Mathematicae (Proceedings)* 84 (1981), 39–66. DOI: https://doi.org/10.1016/1385-7258(81)90016-0 and https://doi.org/10.1016/1385-7258(81)90017-2
- Tilings Encyclopedia, “Penrose Rhomb”: https://tilings.math.uni-bielefeld.de/substitution/penrose-rhomb/
- Jeff Preshing, “Penrose Tiling Explained”: https://preshing.com/20110831/penrose-tiling-explained/

The implementation follows the standard substitution mathematics but was written independently for this project.
