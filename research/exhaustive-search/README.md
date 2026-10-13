# Intensive glider and launcher searches

These are reproducible computational campaigns, not a claim to exhaust every possible automaton. The [research report](../../docs/GLIDER_SEARCH.md) explains the positive results, negative results, attribution and proof limits.

| Campaign | Executed trials | Scope |
| --- | ---: | --- |
| [Hat B/S](hat-broad/README.md) | 10,100,000 random + 45,180 systematic transplants | Binary and refractory rules, both graphs, soups and small seeds |
| [Penrose](penrose/README.md) | 6,121,536 | Broad and binary rules, higher state counts and launchers |
| [Hexagonal](hex/README.md) | 4,998,720 | Exhaustive small seeds plus mutations and emitter searches |
| [Hat priority tables](hat-targeted/README.md) | 37,858 B + 8,506 C exhaustive placements; 14,300 sampled trials | Published tables, finite flights, launchers and rule transfer |

The first three rows total **21,265,436** trials. Priority-table rule comparisons and independent verification replays are separate. Counts are executions rather than unique configurations or mathematical structures. Each directory's `campaigns.json` records the precise meaning of its counts and stop conditions.

The exhaustive hexagonal subset tests 116 connected all-live shapes of sizes one to six, modulo rotations/reflections, against 8,192 quiescent B/S rules and five state counts. All 4,751,360 initial combinations were executed subject to their recorded generation, population and boundary limits. A larger or later pattern can therefore be missed even within the selected rules.

Use the per-directory instructions from the repository root. Bulk miners require C++17; geometry export and evidence replay require Node.js. Generated graph files and compiled executables belong in a separate output directory. The release includes source, fixed inputs, manifests and selected evidence rather than large raw search logs.

Useful verification commands:

```sh
node test-priority-rules.js
node test-hex-exhaustive-evidence.js
node research/verify-aperiodic.js --long
node research/exhaustive-search/hat-broad/verify-rejections.js
```

The Hat glider rules are credited to James Edmond's September 2026 preprint. The simplified three-state derivative agrees on the enumerated two-cell launches but is not equivalent on arbitrary input. The Hat B/S searches established no sustained compact glider. None of the finite aperiodic replays proves immortality.
