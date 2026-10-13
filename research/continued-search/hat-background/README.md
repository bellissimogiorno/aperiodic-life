# Hat defects on an alternating background

This bounded experiment tests binary B0 rules on a uniform background that
alternates between states 0 and 1. It is separate from the dead-background
glider search and from the browser's finite-board boundary convention.

Both depth-5 Hat graphs received 200,000 random connected seeds of 1–10 defect
cells: **400,000 trials and 6,060,189 actual transitions** in total. Trial
counts include possible repeats. Birth includes zero; survival counts are
below the minimum interior degree, so the two uniform states alternate.
Limits were 600 generations, 180 defects, radius 20 and a six-ring boundary
buffer. The manifests contain PRNG seeds and stopping counts.

No persistent compact travelling defect was established. Independent dense
absolute-state replay checked the complete saved defect sets and continued
the four distinct record candidates: two died and two became stationary
cycles (periods 2 and 24). The C++ hash-return screen is not itself a proof;
the independent verifier compares complete states, including background phase.

Run from the repository root (Node.js and a C++17 compiler are research-only
dependencies):

```sh
mkdir -p /tmp/hat-background
node research/exhaustive-search/hat-broad/export.js 5 /tmp/hat-background
g++ -O3 -std=c++17 research/continued-search/hat-background/search.cpp -o /tmp/hat-background/search
/tmp/hat-background/search /tmp/hat-background/hat-5-touch.dat /tmp/hat-background/touch 200000 20261013160101 5
/tmp/hat-background/search /tmp/hat-background/hat-5-edge.dat /tmp/hat-background/edge 200000 20261013160102 4
node research/continued-search/hat-background/verify.js /tmp/hat-background
```

The dense verifier holds the outer two rings at the specified background.
All retained defects remain at least six rings from the edge, so that collar
does not affect the verified trajectories. No wrapped edges are used.
