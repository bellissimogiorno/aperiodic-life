/* Curated configurations used by Aperiodic Life. */
(function (root, factory) {
  const discoveries = factory();
  if (typeof module === 'object' && module.exports) module.exports = discoveries;
  else root.AperiodicLifeDiscoveries = discoveries;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // BEGIN GENERATED CATALOGUE PROVENANCE
  // Edit research/fixtures/catalogue-provenance.json, then run:
  // node tools/build_catalogue_credits.js
  const PROVENANCE = {
    "hat-wake-traveller": {
      "status": "package-found",
      "credit": "Aperiodic Life search; published Hat glider framework credited to James Edmond",
      "note": "Random-initialised evolutionary lineage, evaluation 358893, epoch 11. Four-row reduction preserves the recorded seven-row trajectory. The original six-cell launch supplies the larger-patch evidence; at generation 1000 it retains eight boundary rings. None of 341 tested nontrivial state projections reproduces its observed mature dynamics under the included reference tables. This is not a proof of a wholly new transport mechanism, historical priority or indefinite flight.",
      "sources": [
        {
          "label": "James Edmond’s Hat and Spectre paper",
          "url": "https://arxiv.org/abs/2609.22579"
        },
        {
          "label": "Edmond’s Glider Compendium",
          "url": "https://github.com/jamesedmond/monotile-ca/blob/main/GLIDERS.md"
        }
      ],
      "evidence": [
        "research/continued-search/hat-relay/campaigns.json",
        "research/continued-search/hat-relay/final-rules.json",
        "research/continued-search/verification/README.md"
      ]
    },
    "hat-two-row-relay": {
      "status": "adapted",
      "credit": "Aperiodic Life variant of James Edmond’s Spectre relay",
      "note": "The rule was reached by simplifying the independently evolved wake rule, but comparison identifies the mature generation 60–235 trajectory as Edmond’s published Spectre mechanism under [0,1,2] → [0,3,1]. The global guards and ignition differ. Credit for the reproduced travelling mechanism belongs to Edmond; this is not counted as another independent glider discovery.",
      "sources": [
        {
          "label": "James Edmond’s Hat and Spectre paper",
          "url": "https://arxiv.org/abs/2609.22579"
        },
        {
          "label": "Edmond’s Glider Compendium",
          "url": "https://github.com/jamesedmond/monotile-ca/blob/main/GLIDERS.md"
        }
      ],
      "evidence": [
        "research/continued-search/hat-relay/final-rules.json",
        "research/continued-search/hat-relay/README.md",
        "research/continued-search/verification/README.md"
      ]
    },
    "hat-edmond-a-six-way-launcher": {
      "status": "package-found",
      "credit": "Aperiodic Life seed search under James Edmond’s published rule",
      "note": "A connected six-cell seed found by this package launches six separated bodies under Edmond’s published Hat A table. Independent packet evolution reconstructs the complete state from generation 60 to 180. Every nontrivial seed bipartition diverges from the interacting launch; no smaller subset reaches the same checked outcome. The rule and glider mechanism are published; this is a newly catalogued finite launch configuration. Historical priority is unestablished.",
      "sources": [
        {
          "label": "James Edmond’s Hat and Spectre paper",
          "url": "https://arxiv.org/abs/2609.22579"
        },
        {
          "label": "Edmond’s Glider Compendium",
          "url": "https://github.com/jamesedmond/monotile-ca/blob/main/GLIDERS.md"
        }
      ],
      "evidence": [
        "research/continued-search/hat-emitters/README.md",
        "research/continued-search/verification/README.md",
        "research/continued-search/verification/hat-a-six-launcher-evidence.json"
      ]
    },
    "hat-edmond-b-periodic-emitter": {
      "status": "package-found",
      "credit": "Aperiodic Life seed search under James Edmond’s published rule",
      "note": "A three-cell seed found by this package ignites a recurring source under Edmond’s unchanged Hat B table. The whole state at generation 30 is a 56-cell source: after 40 steps it returns with a 23-cell packet containing four travellers. Independent cohort reconstruction is checked at every source generation through 180 with seven boundary rings. Two pairs follow the same trajectories 20 steps apart. This establishes finite recurring emission, not a least period of 40 or perpetual operation. Credit for the rule and travelling mechanism belongs to Edmond; historical priority for this emitting configuration is unestablished.",
      "sources": [
        {
          "label": "James Edmond’s Hat and Spectre paper",
          "url": "https://arxiv.org/abs/2609.22579"
        },
        {
          "label": "Edmond’s Glider Compendium",
          "url": "https://github.com/jamesedmond/monotile-ca/blob/main/GLIDERS.md"
        }
      ],
      "evidence": [
        "research/continued-search/hat-emitters/README.md",
        "research/continued-search/verification/README.md",
        "research/continued-search/verification/hat-emitter-independent.json",
        "research/continued-search/verification/verify-hat-emitter.js"
      ]
    },
    "hat-edmond-b-glider": {
      "status": "published",
      "credit": "James Edmond — Hat B; seed placement found for Aperiodic Life",
      "note": "Uses Edmond’s published Hat B transition rule and previously demonstrated travelling behaviour. Aperiodic Life independently selected this two-cell placement on its own finite hat patch; its tile numbering and recorded trajectory are not an import of Edmond’s saved run. The package’s finite replay does not establish indefinite propagation.",
      "sources": [
        {
          "label": "James Edmond’s interactive project",
          "url": "https://offlattice.org/monotile/"
        },
        {
          "label": "Edmond’s paper: Gliders on Aperiodic Monotilings",
          "url": "https://arxiv.org/abs/2609.22579"
        },
        {
          "label": "Edmond’s Glider Compendium",
          "url": "https://github.com/jamesedmond/monotile-ca/blob/main/GLIDERS.md"
        }
      ],
      "evidence": [
        "research/fixtures/published-priority-rules.json",
        "research/fixtures/aperiodic-evidence.json",
        "research/exhaustive-search/hat-targeted/selected.json",
        "test-priority-rules.js"
      ]
    },
    "hat-edmond-a-glider": {
      "status": "published",
      "credit": "James Edmond — Hat A; seed placement found for Aperiodic Life",
      "note": "Uses Edmond’s published Hat A transition rule and previously demonstrated travelling behaviour. Aperiodic Life independently selected this two-cell placement on its own finite hat patch; its tile numbering and recorded trajectory are not an import of Edmond’s saved run. The package’s finite replay does not establish indefinite propagation.",
      "sources": [
        {
          "label": "James Edmond’s interactive project",
          "url": "https://offlattice.org/monotile/"
        },
        {
          "label": "Edmond’s paper: Gliders on Aperiodic Monotilings",
          "url": "https://arxiv.org/abs/2609.22579"
        },
        {
          "label": "Edmond’s Glider Compendium",
          "url": "https://github.com/jamesedmond/monotile-ca/blob/main/GLIDERS.md"
        }
      ],
      "evidence": [
        "research/fixtures/published-priority-rules.json",
        "research/fixtures/aperiodic-evidence.json",
        "research/exhaustive-search/hat-targeted/selected.json",
        "test-priority-rules.js"
      ]
    },
    "hat-edmond-c-glider": {
      "status": "published",
      "credit": "James Edmond — Hat C; seed placement found for Aperiodic Life",
      "note": "Uses Edmond’s published Hat C transition rule and previously demonstrated travelling behaviour. Aperiodic Life independently selected this two-cell placement on its own finite hat patch; its tile numbering and recorded trajectory are not an import of Edmond’s saved run. The package’s finite replay does not establish indefinite propagation.",
      "sources": [
        {
          "label": "James Edmond’s interactive project",
          "url": "https://offlattice.org/monotile/"
        },
        {
          "label": "Edmond’s paper: Gliders on Aperiodic Monotilings",
          "url": "https://arxiv.org/abs/2609.22579"
        },
        {
          "label": "Edmond’s Glider Compendium",
          "url": "https://github.com/jamesedmond/monotile-ca/blob/main/GLIDERS.md"
        }
      ],
      "evidence": [
        "research/fixtures/published-priority-rules.json",
        "research/fixtures/aperiodic-evidence.json",
        "research/exhaustive-search/hat-targeted/selected.json",
        "test-priority-rules.js"
      ]
    },
    "hat-simple-glider": {
      "status": "adapted",
      "credit": "Aperiodic Life variant of James Edmond’s Hat B rule",
      "note": "Derived from Edmond’s Hat B: remove its unreachable state from the two-cell launch, relabel state 3 as 2, and drop the empty-neighbour birth requirement. The resulting three-state rule matches the checked launches but differs on other inputs. Credit for the parent rule and travelling mechanism belongs to Edmond; no claim of historical priority is made for the simplification.",
      "sources": [
        {
          "label": "James Edmond’s interactive project",
          "url": "https://offlattice.org/monotile/"
        },
        {
          "label": "Edmond’s paper: Gliders on Aperiodic Monotilings",
          "url": "https://arxiv.org/abs/2609.22579"
        },
        {
          "label": "Edmond’s Glider Compendium",
          "url": "https://github.com/jamesedmond/monotile-ca/blob/main/GLIDERS.md"
        }
      ],
      "evidence": [
        "research/fixtures/published-priority-rules.json",
        "research/fixtures/aperiodic-evidence.json",
        "research/exhaustive-search/hat-targeted/selected.json",
        "test-priority-rules.js",
        "research/exhaustive-search/hat-targeted/priority-simplification.json",
        "research/exhaustive-search/hat-targeted/simplification-counterexample.json"
      ]
    },
    "hat-edmond-c-triple-launcher": {
      "status": "published",
      "credit": "James Edmond — Hat C triple launch; seed placement found for Aperiodic Life",
      "note": "Edmond’s compendium already demonstrates a two-cell Hat C seed producing three gliders. This catalogue entry uses the same published rule with a placement independently selected on Aperiodic Life’s patch. Its three separated travellers are verified through the stated finite horizon. It is a reproduction of published launch behaviour, not a claim to the first triple launcher or a repeating gun.",
      "sources": [
        {
          "label": "James Edmond’s interactive project",
          "url": "https://offlattice.org/monotile/"
        },
        {
          "label": "Edmond’s paper: Gliders on Aperiodic Monotilings",
          "url": "https://arxiv.org/abs/2609.22579"
        },
        {
          "label": "Edmond’s Glider Compendium",
          "url": "https://github.com/jamesedmond/monotile-ca/blob/main/GLIDERS.md"
        }
      ],
      "evidence": [
        "research/fixtures/published-priority-rules.json",
        "research/fixtures/aperiodic-evidence.json",
        "research/exhaustive-search/hat-targeted/selected.json",
        "test-priority-rules.js",
        "research/exhaustive-search/hat-targeted/selected-launchers.json",
        "research/exhaustive-search/hat-targeted/priority-launchers.js"
      ]
    },
    "penrose-b2-c6-twelve-launcher": {
      "status": "package-found",
      "credit": "Aperiodic Life seed search in the existing B2/S traveller family",
      "note": "Three live cells selected by the connected/phased-seed campaign launch twelve independent compact bodies from generation 90 to 130, with seven boundary rings. All twelve have translated full-state and polygon returns, while five have radius-three halo returns within that horizon. All six nonempty proper seed subsets differ at generation 130. This is a finite launcher using an established package propagation family, not a new glider mechanism or repeating gun. Larger locally matching placements need not preserve this outcome. Historical priority is unestablished.",
      "sources": [],
      "evidence": [
        "research/continued-search/penrose/campaigns.json",
        "research/continued-search/penrose/twelve-launcher-evidence.json",
        "research/continued-search/penrose/verify-twelve.js"
      ]
    },
    "hex-b245s02-c5-p6-puffer": {
      "status": "package-found",
      "credit": "Found and independently verified in this package’s bounded search; discovery priority has not been established.",
      "note": "A moving head extracted from the three-cell mixed-state seed. Its complete period-6 recurrence and permanent separation from every deposit are certified. B5 is unused in flight; the three-cell launch uses B5 twice. This is a newly verified package example, not a claim of first discovery.",
      "sources": [],
      "evidence": [
        "research/continued-search/hex/campaigns.json",
        "research/continued-search/hex/selected-evidence.json"
      ]
    },
    "hex-b245s02-c5-three-cell-twin-puffer-launcher": {
      "status": "package-found",
      "credit": "Found and independently verified in this package’s bounded search; discovery priority has not been established.",
      "note": "Mixed-state exhaustive campaign, seed mixed-n3-c5-s10. Complete replay gives two opposite certified p6 puffers and four stationary live cells at generation 30. This is a finite launch, not a stationary gun. A related four-live-cell seed had remained unclassified in the earlier exhaustive campaign; priority outside this package is unestablished.",
      "sources": [],
      "evidence": [
        "research/continued-search/hex/campaigns.json",
        "research/continued-search/hex/selected-evidence.json"
      ]
    },
    "hex-b2345s24-c4-p48-traveller": {
      "status": "package-found",
      "credit": "Found and independently verified in this package’s bounded search; discovery priority has not been established.",
      "note": "Seven-cell exhaustive campaign, seed n7c4s245: seven live cells settle after 16 generations into this exact period-48 ship. The displayed recurrent phase was centred for viewing. Full D6/phase comparison finds no match in the preceding 33-entry hexagonal catalogue. Independent decomposition at every phase confirms one persistent body with short-lived sparks, rather than a convoy of independently recurring ships. No worldwide priority claim is made.",
      "sources": [],
      "evidence": [
        "research/continued-search/hex/campaigns.json",
        "research/continued-search/hex/selected-evidence.json"
      ]
    },
    "hex-b2s0-c3-three-cell-glider": {
      "status": "package-found",
      "credit": "Found by this package’s bounded exhaustive search; discovery priority has not been established.",
      "note": "Campaign small, enumerated seed 3, recorded trial 101391. Three live cells already form a period-2 spaceship in B2/S0 with three states; complete-state translation is (0,-1). The campaign enumerated connected all-live seeds of one to six cells up to translations, rotations and reflections, with all 8,192 quiescent binary birth/survival rules and state counts 2–6, subject to its documented simulation limits. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/fixtures/hex-exhaustive-evidence.json",
        "research/exhaustive-search/hex/campaigns.json",
        "research/exhaustive-search/hex/search.cpp",
        "test-hex-exhaustive-evidence.js"
      ]
    },
    "hex-b234s1346-c3-four-cell-launcher": {
      "status": "package-found",
      "credit": "Found by this package’s bounded exhaustive search; discovery priority has not been established.",
      "note": "Campaign small, enumerated seed 6, recorded trial 120894. Four live cells settle after nine generations into a period-8 spaceship translating (1,1). This is a finite launch, not a periodically emitting gun. The campaign enumerated connected all-live seeds of one to six cells up to translations, rotations and reflections, with all 8,192 quiescent binary birth/survival rules and state counts 2–6, subject to its documented simulation limits. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/fixtures/hex-exhaustive-evidence.json",
        "research/exhaustive-search/hex/campaigns.json",
        "research/exhaustive-search/hex/search.cpp",
        "test-hex-exhaustive-evidence.js"
      ]
    },
    "hex-b2456s1345-c4-five-cell-launcher": {
      "status": "package-found",
      "credit": "Found by this package’s bounded exhaustive search; discovery priority has not been established.",
      "note": "Campaign n5, enumerated seed n5s19, recorded trial 525071. Five live cells settle after six generations into a period-43 spaceship translating (-6,3). This is a finite launch, not a periodically emitting gun. The campaign enumerated connected all-live seeds of one to six cells up to translations, rotations and reflections, with all 8,192 quiescent binary birth/survival rules and state counts 2–6, subject to its documented simulation limits. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/fixtures/hex-exhaustive-evidence.json",
        "research/exhaustive-search/hex/campaigns.json",
        "research/exhaustive-search/hex/search.cpp",
        "test-hex-exhaustive-evidence.js"
      ]
    },
    "hex-b23s13-c4-p9-knightship-launcher": {
      "status": "package-found",
      "credit": "Found by this package’s bounded exhaustive search; discovery priority has not been established.",
      "note": "Campaign n6, enumerated seed n6s14, recorded trial 1407298. Six live cells settle after sixteen generations into a period-9 spaceship translating (5,-4). Its oblique heading is outside the edge-axis and angle-bisector directions; this does not establish a first such hexagonal spaceship. The campaign enumerated connected all-live seeds of one to six cells up to translations, rotations and reflections, with all 8,192 quiescent binary birth/survival rules and state counts 2–6, subject to its documented simulation limits. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/fixtures/hex-exhaustive-evidence.json",
        "research/exhaustive-search/hex/campaigns.json",
        "research/exhaustive-search/hex/search.cpp",
        "test-hex-exhaustive-evidence.js"
      ]
    },
    "hex-b234s245-c5-p10-knightship-launcher": {
      "status": "package-found",
      "credit": "Found by this package’s bounded exhaustive search; discovery priority has not been established.",
      "note": "Campaign n6, enumerated seed n6s78, recorded trial 2166518. Six live cells settle after twelve generations into a period-10 spaceship translating (1,2). Survival clause S5 acts during the launch, although inactive in the eventual orbit; removing it before launch destroys the example. This is a finite launch, not a gun. The campaign enumerated connected all-live seeds of one to six cells up to translations, rotations and reflections, with all 8,192 quiescent binary birth/survival rules and state counts 2–6, subject to its documented simulation limits. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/fixtures/hex-exhaustive-evidence.json",
        "research/exhaustive-search/hex/campaigns.json",
        "research/exhaustive-search/hex/search.cpp",
        "test-hex-exhaustive-evidence.js"
      ]
    },
    "penrose-b2-c5-five-launcher": {
      "status": "package-found",
      "credit": "Launcher found by package search; priority unestablished",
      "note": "This three-live-cell launch and its depth-11 placement were located by the package's connected-seed search and polygon-matched transplants. Its five emitted bodies use the existing B2/S travelling family, with finite verification through generation 240. This identifies the origin of this recorded launch, not a first-discovery claim for the rule or propagating mechanism. Earlier published Penrose gliders use a different rule.",
      "sources": [
        {
          "label": "Goucher (2012): earlier Penrose glider under a different rule",
          "url": "https://cp4space.hatsya.com/wp-content/uploads/2012/11/2012-penrose-gliders.pdf"
        }
      ],
      "evidence": [
        "research/exhaustive-search/penrose/campaigns.json",
        "research/exhaustive-search/penrose/selected-launcher-evidence.json",
        "research/fixtures/aperiodic-evidence.json",
        "docs/GLIDER_SEARCH.md"
      ]
    },
    "penrose-b2-c6-six-launcher": {
      "status": "package-found",
      "credit": "Launcher found by package search; priority unestablished",
      "note": "This three-live-cell launch and its depth-11 placement were located by the package's connected-seed search and polygon-matched transplants. Its six emitted bodies use the existing B2/S travelling family, with finite verification through generation 200. This identifies the origin of this recorded launch, not a first-discovery claim for the rule or propagating mechanism. Earlier published Penrose gliders use a different rule.",
      "sources": [
        {
          "label": "Goucher (2012): earlier Penrose glider under a different rule",
          "url": "https://cp4space.hatsya.com/wp-content/uploads/2012/11/2012-penrose-gliders.pdf"
        }
      ],
      "evidence": [
        "research/exhaustive-search/penrose/campaigns.json",
        "research/exhaustive-search/penrose/selected-launcher-evidence.json",
        "research/fixtures/aperiodic-evidence.json",
        "docs/GLIDER_SEARCH.md"
      ]
    },
    "square-block": {
      "status": "published",
      "credit": "Classical Conway Life pattern",
      "note": "Published in the original 1970 presentation of Conway Life. The package uses the standard four-cell block, translated for display; it makes no separate discovery claim. An individual discoverer is not assigned here.",
      "sources": [
        {
          "label": "Martin Gardner, Scientific American, October 1970 (original article)",
          "url": "https://www.ibiblio.org/lifepatterns/october1970.html"
        },
        {
          "label": "Stephen Silver, Life Lexicon: block (Golly distribution)",
          "url": "https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_b.htm"
        }
      ],
      "evidence": [
        "discoveries.js",
        "test-discoveries.js",
        "research/verify-catalog.js",
        "research/fixtures/catalogue-verification.json"
      ]
    },
    "square-blinker": {
      "status": "published",
      "credit": "John H. Conway",
      "note": "The Life Lexicon credits Conway; the period-2 three-cell oscillator also appears in Gardner’s original article. The package uses its standard horizontal phase, translated for display.",
      "sources": [
        {
          "label": "Stephen Silver, Life Lexicon: blinker (Golly distribution)",
          "url": "https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_b.htm"
        },
        {
          "label": "Martin Gardner, Scientific American, October 1970 (original article)",
          "url": "https://www.ibiblio.org/lifepatterns/october1970.html"
        }
      ],
      "evidence": [
        "discoveries.js",
        "test-discoveries.js",
        "research/verify-catalog.js",
        "research/fixtures/catalogue-verification.json"
      ]
    },
    "square-pulsar": {
      "status": "published",
      "credit": "John H. Conway",
      "note": "The Life Lexicon credits Conway, and the 48-cell pulsar is described in the original 1970 article. The package uses the standard published 48-cell phase; placement and playback settings are package choices.",
      "sources": [
        {
          "label": "Stephen Silver, Life Lexicon: pulsar (Golly distribution)",
          "url": "https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_p.htm"
        },
        {
          "label": "Martin Gardner, Scientific American, October 1970 (original article)",
          "url": "https://www.ibiblio.org/lifepatterns/october1970.html"
        }
      ],
      "evidence": [
        "discoveries.js",
        "test-discoveries.js",
        "research/verify-catalog.js",
        "research/fixtures/catalogue-verification.json"
      ]
    },
    "square-pentadecathlon": {
      "status": "published",
      "credit": "John H. Conway",
      "note": "The Life Lexicon credits Conway’s 1970 investigation of short rows. This is the published 12-cell oscillator phase, not a new 12-cell construction; the ten-cell row is a predecessor.",
      "sources": [
        {
          "label": "Stephen Silver, Life Lexicon: pentadecathlon (Golly distribution)",
          "url": "https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_p.htm"
        },
        {
          "label": "Martin Gardner, Scientific American, October 1970 (original article)",
          "url": "https://www.ibiblio.org/lifepatterns/october1970.html"
        }
      ],
      "evidence": [
        "discoveries.js",
        "test-discoveries.js",
        "research/verify-catalog.js",
        "research/fixtures/catalogue-verification.json"
      ]
    },
    "square-glider": {
      "status": "published",
      "credit": "Richard K. Guy",
      "note": "Credit is to Richard K. Guy, as explicitly recorded in the Life Lexicon, rather than to Conway personally. The package seed is a rotated and translated standard glider phase. Older sources conventionally date it 1970 and newer histories say 1969; no discovery year is asserted here.",
      "sources": [
        {
          "label": "Stephen Silver, Life Lexicon: glider (Golly distribution)",
          "url": "https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_g.htm"
        }
      ],
      "evidence": [
        "discoveries.js",
        "test-discoveries.js",
        "research/verify-catalog.js",
        "research/fixtures/catalogue-verification.json",
        "test-traveller-evidence.js"
      ]
    },
    "square-lwss": {
      "status": "published",
      "credit": "John H. Conway",
      "note": "The Life Lexicon credits Conway’s 1970 discovery of the lightweight spaceship. The package uses the published nine-cell phase, translated for display, under ordinary B3/S23.",
      "sources": [
        {
          "label": "Stephen Silver, Life Lexicon: LWSS (Golly distribution)",
          "url": "https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_l.htm"
        }
      ],
      "evidence": [
        "discoveries.js",
        "test-discoveries.js",
        "research/verify-catalog.js",
        "research/fixtures/catalogue-verification.json",
        "test-traveller-evidence.js"
      ]
    },
    "square-highlife-replicator": {
      "status": "published",
      "credit": "Nathan Thompson (1994)",
      "note": "Eppstein credits the HighLife replicator to Nathan Thompson in 1994. David Bell subsequently documented and investigated HighLife; he is not credited here as this replicator’s discoverer. The package uses the published 12-cell B36/S23 seed and independently checks its two-copy return after 12 generations.",
      "sources": [
        {
          "label": "David Eppstein, Replicators: HighLife",
          "url": "https://ics.uci.edu/~eppstein/ca/replicators/b36s23.html"
        },
        {
          "label": "Published HighLife replicator seed",
          "url": "https://conwaylife.com/wiki/OCA:HighLife/Replicator"
        }
      ],
      "evidence": [
        "discoveries.js",
        "test-discoveries.js",
        "research/verify-catalog.js",
        "research/fixtures/catalogue-verification.json"
      ]
    },
    "square-diehard": {
      "status": "published",
      "credit": "Classical pattern; discoverer unconfirmed",
      "note": "The seven-cell seed matches the published Life Lexicon diehard exactly after translation. Its extinction at generation 130 is independently checked. The consulted sources do not establish an individual discoverer; no personal attribution or new-discovery claim is made.",
      "sources": [
        {
          "label": "Stephen Silver, Life Lexicon: diehard (Golly distribution)",
          "url": "https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_d.htm"
        }
      ],
      "evidence": [
        "discoveries.js",
        "test-discoveries.js",
        "research/verify-catalog.js",
        "research/fixtures/catalogue-verification.json"
      ]
    },
    "square-r-pentomino": {
      "status": "published",
      "credit": "John H. Conway’s classical R-pentomino",
      "note": "Gardner’s original article documents Conway’s study of this five-cell seed; the package uses the standard published shape. Its finite-board check establishes activity through generation 1,103, not equality with the infinite-plane final census.",
      "sources": [
        {
          "label": "Martin Gardner, Scientific American, October 1970 (original article)",
          "url": "https://www.ibiblio.org/lifepatterns/october1970.html"
        },
        {
          "label": "Stephen Silver, Life Lexicon: R-pentomino (Golly distribution)",
          "url": "https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_r.htm"
        }
      ],
      "evidence": [
        "discoveries.js",
        "test-discoveries.js",
        "research/verify-catalog.js",
        "research/fixtures/catalogue-verification.json"
      ]
    },
    "square-acorn": {
      "status": "published",
      "credit": "Charles L. Corderman",
      "note": "Robert Wainwright’s Lifeline No. 3 (1971), page 12, credits Charles L. Corderman; Wainwright supplied the name. The package uses the same seven-cell seed, translated for display. Its finite-board replay establishes activity through 5,206 generations, not the infinite-plane final ash. Gosper is not the discoverer of this seed.",
      "sources": [
        {
          "label": "Robert Wainwright, Lifeline No. 3 (1971), page 12: original Acorn attribution",
          "url": "https://conwaylife.com/wiki/Lifeline_Volume_3"
        },
        {
          "label": "Stephen Silver, Life Lexicon: acorn (Golly distribution)",
          "url": "https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_a.htm"
        }
      ],
      "evidence": [
        "discoveries.js",
        "test-discoveries.js",
        "research/verify-catalog.js",
        "research/fixtures/catalogue-verification.json"
      ]
    },
    "hex-conway-p2": {
      "status": "package-found",
      "credit": "Independently found by this package’s soup search; earlier discovery priority has not been established.",
      "note": "Recovered campaign provenance: deterministic soup seed hex-conway-v31-2, B3/S23 with six edge neighbours, hexagonal depth 32, density 0.12, transient 6, period 2. The archived soup campaign covered indices 0–4,999 and used a 1,200-generation limit. Exact full-orbit comparison with the archived result confirms the curated pattern. The old campaign archive was examined in the handover workspace; it is not part of the fresh release. “Conway” describes the birth/survival rule notation and is not a claim that John Conway discovered this hexagonal pattern. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/mine-oscillators.js",
        "discoveries.js",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js"
      ]
    },
    "hex-conway-p3": {
      "status": "package-found",
      "credit": "Independently found by this package’s soup search; earlier discovery priority has not been established.",
      "note": "Recovered campaign provenance: deterministic soup seed hex-conway-v31-3851, B3/S23 with six edge neighbours, hexagonal depth 32, density 0.35, transient 28, period 3. The archived soup campaign covered indices 0–4,999 and used a 1,200-generation limit. Exact full-orbit comparison with the archived result confirms the curated pattern. The old campaign archive was examined in the handover workspace; it is not part of the fresh release. “Conway” describes the birth/survival rule notation and is not a claim that John Conway discovered this hexagonal pattern. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/mine-oscillators.js",
        "discoveries.js",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js"
      ]
    },
    "hex-conway-p6": {
      "status": "package-found",
      "credit": "Independently found by this package’s soup search; earlier discovery priority has not been established.",
      "note": "Recovered campaign provenance: deterministic soup seed hex-conway-v31-2813, B3/S23 with six edge neighbours, hexagonal depth 32, density 0.35, transient 39, period 6. The archived soup campaign covered indices 0–4,999 and used a 1,200-generation limit. Exact full-orbit comparison with the archived result confirms the curated pattern. The old campaign archive was examined in the handover workspace; it is not part of the fresh release. “Conway” describes the birth/survival rule notation and is not a claim that John Conway discovered this hexagonal pattern. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/mine-oscillators.js",
        "discoveries.js",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js"
      ]
    },
    "hex-b2s35-p5-traveller": {
      "status": "published",
      "credit": "Known B2/S35 spaceship described by Carter Bays (2005), with a matching RLE published by John Cerkan (2016). Independently recovered for this package.",
      "note": "Bays Figure 3 documents a period-5, one-cell-displacement spaceship in rule 3,5/2, equivalent to B2/S35. Cerkan’s 22 January 2016 RLE is 2bo$o3bo$2bo$bo2bo$6bo$2bo2bo$4bo!. Mapping Golly coordinates by (q,r)=(x,y-x) and comparing every complete orbit state proves exact equivalence to the catalogue: phase shift 2, rotation by one 60-degree step, no reflection, translation (3,0). The package’s independent constrained-search recovery does not make this a new spaceship. The earlier paper supplies scholarly context; its drawing was not independently transcribed in this audit.",
      "sources": [
        {
          "label": "Carter Bays, A Note on the Game of Life in Hexagonal and Pentagonal Tessellations (2005)",
          "url": "https://www.complex-systems.com/abstracts/v15_i03_a04/"
        },
        {
          "label": "Bays (2005), Figures 3 and 4",
          "url": "https://wpmedia.wolfram.com/uploads/sites/13/2018/02/15-3-4.pdf"
        },
        {
          "label": "John Cerkan, published B2/S35H spaceship RLE (22 January 2016)",
          "url": "https://conwaylife.com/forums/viewtopic.php?p=28428"
        }
      ],
      "evidence": [
        "discoveries.js",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "test-traveller-evidence.js",
        "research/fixtures/hex-published-provenance.json",
        "research/verify-hex-published-provenance.js"
      ]
    },
    "hex-b245s3-p10-traveller": {
      "status": "published",
      "credit": "Published Golly example, corresponding to the B245/S3 spaceship described by Carter Bays (2005).",
      "note": "The catalogue is D6-equivalent to Golly’s official QuickLife hexagonal example, RLE obo$4bo$2bo$bo2bobo$3bo$5bo!, using (q,r)=(x,y-x). Complete-state replay verifies period 10 and a two-cell displacement. Bays Figure 4 documents this rule and motion. Golly’s page does not itself name Bays, so distinguish the executable pattern source from scholarly context; this is not a new package discovery.",
      "sources": [
        {
          "label": "Golly QuickLife documentation, hexagonal neighbourhood example",
          "url": "https://golly.sourceforge.io/Help/Algorithms/QuickLife.html"
        },
        {
          "label": "Carter Bays, A Note on the Game of Life in Hexagonal and Pentagonal Tessellations (2005)",
          "url": "https://www.complex-systems.com/abstracts/v15_i03_a04/"
        },
        {
          "label": "Bays (2005), Figures 3 and 4",
          "url": "https://wpmedia.wolfram.com/uploads/sites/13/2018/02/15-3-4.pdf"
        }
      ],
      "evidence": [
        "research/fixtures/hex-b245s3-source.json",
        "test-traveller-evidence.js",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/fixtures/hex-published-provenance.json",
        "research/verify-hex-published-provenance.js"
      ]
    },
    "hex-b235s146-c4-launcher-traveller": {
      "status": "adapted",
      "credit": "Package rule adaptation of the published B2/S35 spaceship geometry (Bays; Cerkan). Priority of this multistate launcher has not been established.",
      "note": "The initial twelve live-cell coordinates are identical to the package’s published B2/S35 p5 spaceship phase, but the rule is changed to B235/S146 with 4 states. After 21 generations the seed becomes a period-10 spaceship translating (-5,0). Credit Bays and Cerkan for the starting pattern, not for these changed-rule dynamics. The package establishes this particular adaptation and verifies its launch and eventual complete-state recurrence; it does not establish worldwide priority for the launcher or resulting ship.",
      "sources": [
        {
          "label": "Carter Bays, A Note on the Game of Life in Hexagonal and Pentagonal Tessellations (2005)",
          "url": "https://www.complex-systems.com/abstracts/v15_i03_a04/"
        },
        {
          "label": "John Cerkan, published B2/S35H spaceship RLE (22 January 2016)",
          "url": "https://conwaylife.com/forums/viewtopic.php?p=28428"
        }
      ],
      "evidence": [
        "discoveries.js",
        "docs/RULE_SURVEY.md",
        "test-traveller-evidence.js",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js"
      ]
    },
    "hex-b235s134-c5-launcher-traveller": {
      "status": "adapted",
      "credit": "Package rule adaptation of the published B2/S35 spaceship geometry (Bays; Cerkan). Priority of this multistate launcher has not been established.",
      "note": "The initial twelve live-cell coordinates are identical to the package’s published B2/S35 p5 spaceship phase, but the rule is changed to B235/S134 with 5 states. After 58 generations the seed becomes a period-4 spaceship translating (2,0). Credit Bays and Cerkan for the starting pattern, not for these changed-rule dynamics. The package establishes this particular adaptation and verifies its launch and eventual complete-state recurrence; it does not establish worldwide priority for the launcher or resulting ship.",
      "sources": [
        {
          "label": "Carter Bays, A Note on the Game of Life in Hexagonal and Pentagonal Tessellations (2005)",
          "url": "https://www.complex-systems.com/abstracts/v15_i03_a04/"
        },
        {
          "label": "John Cerkan, published B2/S35H spaceship RLE (22 January 2016)",
          "url": "https://conwaylife.com/forums/viewtopic.php?p=28428"
        }
      ],
      "evidence": [
        "discoveries.js",
        "docs/RULE_SURVEY.md",
        "test-traveller-evidence.js",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js"
      ]
    },
    "penrose-edge-b23s23-p822": {
      "status": "package-found",
      "credit": "Found by package search; priority unestablished",
      "note": "Recovered in the package's focused B23/S23 edge search, then transplanted from depth 7 to depth 8. The recorded full period is 822 and 39 individual sites have that period. Owens–Stepney is earlier work on Penrose oscillators, but its Conway touch-graph catalogue does not establish authorship of this different-rule edge-graph pattern. No external exact-pattern attribution was established.",
      "sources": [
        {
          "label": "Owens & Stepney (2010): Penrose Life catalogue and classification",
          "url": "https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/penroselife.htm"
        }
      ],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "docs/RULE_SURVEY.md",
        "research/render-oscillator-atlas.js"
      ]
    },
    "penrose-conway-c3-p14": {
      "status": "package-found",
      "credit": "Found by package search; priority unestablished",
      "note": "Recovered in the package's multistate oscillator survey and transplanted from depth 7 to depth 8. This is a three-state B3/S23 Generations oscillator; it must not be identified with a published binary Penrose oscillator merely by period. External first-discovery priority of this exact configuration is unestablished.",
      "sources": [
        {
          "label": "Owens & Stepney (2010): Penrose Life catalogue and classification",
          "url": "https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/penroselife.htm"
        }
      ],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "docs/RULE_SURVEY.md",
        "research/render-oscillator-atlas.js"
      ]
    },
    "hat-b2s1-c3-rotor-p39": {
      "status": "package-found",
      "credit": "Found in Aperiodic Life searches; earlier priority unestablished",
      "note": "Found by the package’s compact-seed oscillator search under three-state B2/S1 on the shared-edge graph. The retained phase is an exact period-39 rotating wave. Its original search record identifies trial 44 of the B2/S1 edge-orbit follow-up. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.",
      "sources": [],
      "evidence": [
        "discoveries.js",
        "research/fixtures/catalogue-verification.json",
        "research/verify-catalog.js",
        "test-structures.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "hat-b2s23-c6-rotor-p219": {
      "status": "package-found",
      "credit": "Found in Aperiodic Life searches; earlier priority unestablished",
      "note": "Found by the package’s compact-seed oscillator search under six-state B2/S23 on the shared-edge graph. The retained phase is an exact period-219 rotating wave. Its original pilot record identifies trial 122 for that rule and state count. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.",
      "sources": [],
      "evidence": [
        "discoveries.js",
        "research/fixtures/catalogue-verification.json",
        "research/verify-catalog.js",
        "test-structures.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "hat-b2s13-c4-clock-p11": {
      "status": "package-found",
      "credit": "Found in Aperiodic Life searches; earlier priority unestablished",
      "note": "Developed from an eight-tile clock found by the package’s B2/S13 search at ten states (trial 1730). The catalogue keeps the same two-live-cell phase and changes the state count to four, giving period 11. The relation period = 2C + 3 was then checked for C = 4 through 255. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.",
      "sources": [],
      "evidence": [
        "discoveries.js",
        "research/fixtures/catalogue-verification.json",
        "research/verify-catalog.js",
        "test-structures.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "hat-directional-transient-83": {
      "status": "package-found",
      "credit": "Found in Aperiodic Life searches; earlier priority unestablished",
      "note": "Selected from the package’s Hat B/S motion search and reduced to a ten-cell complete phase, including one refractory cell. The reduction preserves the retained parent state at generation 40. All activity ends at generation 83; the example is a directional transient, not a glider. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.",
      "sources": [],
      "evidence": [
        "discoveries.js",
        "research/fixtures/catalogue-verification.json",
        "research/verify-catalog.js",
        "test-structures.js",
        "research/search-mobile-patterns.js"
      ]
    },
    "hex-conway-p4": {
      "status": "package-found",
      "credit": "Found by this package’s deterministic soup search; discovery priority has not been established.",
      "note": "Oscillator miner source seed 272632, radius 8, initial density 60%, soup transient 19; the displayed phase is offset 1 within the resulting orbit. The source fixture retains the replayable initial state and resulting cycle. Known rule notation does not establish authorship of this exact pattern. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/hex-search/oscillators/miner.cpp",
        "research/hex-search/oscillators/campaigns.json"
      ]
    },
    "hex-conway-p5": {
      "status": "package-found",
      "credit": "Found by this package’s deterministic soup search; discovery priority has not been established.",
      "note": "Oscillator miner source seed 1045970, radius 6, initial density 67%, soup transient 10; the displayed phase is offset 0 within the resulting orbit. The source fixture retains the replayable initial state and resulting cycle. Known rule notation does not establish authorship of this exact pattern. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/hex-search/oscillators/miner.cpp",
        "research/hex-search/oscillators/campaigns.json"
      ]
    },
    "hex-conway-p8": {
      "status": "package-found",
      "credit": "Found by this package’s deterministic soup search; discovery priority has not been established.",
      "note": "Oscillator miner source seed 511247, radius 9, initial density 46%, soup transient 25; the displayed phase is offset 6 within the resulting orbit. The source fixture retains the replayable initial state and resulting cycle. Known rule notation does not establish authorship of this exact pattern. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/hex-search/oscillators/miner.cpp",
        "research/hex-search/oscillators/campaigns.json"
      ]
    },
    "hex-b34s234-p269": {
      "status": "package-found",
      "credit": "Found by this package’s deterministic soup search; discovery priority has not been established.",
      "note": "Oscillator miner source seed 15338, radius 6, initial density 18%, soup transient 182; the displayed phase is offset 266 within the resulting orbit. The source fixture retains the replayable initial state and resulting cycle. Known rule notation does not establish authorship of this exact pattern. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/hex-search/oscillators/miner.cpp",
        "research/hex-search/oscillators/campaigns.json"
      ]
    },
    "hex-b245s35-p25-traveller": {
      "status": "published",
      "credit": "Published by muzik (2019), independently rediscovered by this package’s search.",
      "note": "The primary hexagonal spaceship thread credits muzik (2019) for B245/S35H RLE b3o$bobo$4o$bo!. Independent full-orbit comparison with the catalogue succeeds after phase shift 5, rotation by four 60-degree steps, no reflection and translation (1,1), using (q,r)=(x,y-x). Thus the package’s binary campaign seed 20261011, trial 483, mode 3, transient 57 recovered an already published spaceship. The displayed phase and orientation are not a distinct discovery.",
      "sources": [
        {
          "label": "muzik, B245/S35H period-25 spaceship (2019)",
          "url": "https://conwaylife.com/forums/viewtopic.php?f=11&t=3670"
        }
      ],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/hex-search/binary/search.cpp",
        "research/hex-search/binary/campaigns.json",
        "research/fixtures/hex-published-provenance.json",
        "research/verify-hex-published-provenance.js"
      ]
    },
    "hex-b2s34-p48-rotor": {
      "status": "published",
      "credit": "Published by drc (2016), independently rediscovered by this package’s search.",
      "note": "The 18 January 2016 RLE o16bo$obo12b2o$2b2o10bobo$5bo9bo! contains two independently oscillating six-cell components. Catalogue coordinates translated by axial (2,-1) reproduce its first component exactly at generation zero. Extracting that independent component does not create a new oscillator. The package independently recovered it in binary campaign seed 20261011, trial 194, mode 4. Dean Hickerson also mentions earlier work on the rule, but the audit does not assign him priority for this particular oscillator.",
      "sources": [
        {
          "label": "drc, published pair of B2/S34 period-48 oscillators (18 January 2016)",
          "url": "https://conwaylife.com/forums/viewtopic.php?p=28430"
        }
      ],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/hex-search/binary/search.cpp",
        "research/hex-search/binary/campaigns.json",
        "research/fixtures/hex-published-provenance.json",
        "research/verify-hex-published-provenance.js"
      ]
    },
    "hex-b245s3-p57-pulsator": {
      "status": "package-found",
      "credit": "Found by this package’s binary-rule soup search; discovery priority has not been established.",
      "note": "Binary campaign seed 20261011, trial 2586, mode 1, transient 7, chosen cycle phase offset 34. The source fixture retains the initial state and verification evidence. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/hex-search/binary/search.cpp",
        "research/hex-search/binary/campaigns.json"
      ]
    },
    "hex-b24s3-p128-rotor": {
      "status": "package-found",
      "credit": "Found by this package’s binary-rule soup search; discovery priority has not been established.",
      "note": "Binary campaign seed 908020261011, trial 53543, mode 3, transient 25, chosen cycle phase offset 67. The source fixture retains the initial state and verification evidence. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/hex-search/binary/search.cpp",
        "research/hex-search/binary/campaigns.json"
      ]
    },
    "hex-b234s3-p4104": {
      "status": "package-found",
      "credit": "Found by this package’s binary-rule soup search; discovery priority has not been established.",
      "note": "Binary campaign seed 60520261011, trial 127, mode 2, transient 802, chosen cycle phase offset 2268. The source fixture retains the initial state and verification evidence. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/hex-search/binary/search.cpp",
        "research/hex-search/binary/campaigns.json"
      ]
    },
    "hex-b2s3456-c7-p372-rotor": {
      "status": "package-found",
      "credit": "Found by this package’s Generations search; discovery priority has not been established.",
      "note": "Generations campaign first, random seed 7522551138070962214, trial 75416, original rule B25/S3456, source transient 13. The displayed rule B2/S3456 removes B5, which is inactive throughout the verified periodic orbit. Rule simplification certifies the selected complete-state orbit; it does not assert that the original preperiodic soup takes the same route under the simplified rule. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/hex-search/generations/search.cpp",
        "research/hex-search/generations/analyse.py",
        "research/hex-search/generations/campaigns.json"
      ]
    },
    "hex-b24s16-c3-p248-breather": {
      "status": "package-found",
      "credit": "Found by this package’s Generations search; discovery priority has not been established.",
      "note": "Generations campaign million, random seed 7529271334792788165, trial 15937, original rule B24/S16, source transient 86. The original searched rule is retained. Rule simplification certifies the selected complete-state orbit; it does not assert that the original preperiodic soup takes the same route under the simplified rule. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/hex-search/generations/search.cpp",
        "research/hex-search/generations/analyse.py",
        "research/hex-search/generations/campaigns.json"
      ]
    },
    "hex-b23s13-c5-p138-traveller": {
      "status": "package-found",
      "credit": "Found by this package’s Generations search; discovery priority has not been established.",
      "note": "Generations campaign million, random seed 7529271334792788165, trial 106888, original rule B235/S13, source transient 53. The displayed rule B23/S13 removes B5, which is inactive throughout the verified travelling orbit. Rule simplification certifies the selected complete-state orbit; it does not assert that the original preperiodic soup takes the same route under the simplified rule. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/hex-search/generations/search.cpp",
        "research/hex-search/generations/analyse.py",
        "research/hex-search/generations/campaigns.json"
      ]
    },
    "hex-b234s13-c4-p23-traveller": {
      "status": "package-found",
      "credit": "Found by this package’s Generations search; discovery priority has not been established.",
      "note": "Generations campaign first, random seed 7522551138070962214, trial 50, original rule B2345/S135, source transient 15. The displayed rule B234/S13 removes B5 and S5, which are inactive throughout the verified travelling orbit. Rule simplification certifies the selected complete-state orbit; it does not assert that the original preperiodic soup takes the same route under the simplified rule. No earlier exact-pattern match was established in this audit; this records package provenance, not worldwide discovery priority.",
      "sources": [],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/hex-search/generations/search.cpp",
        "research/hex-search/generations/analyse.py",
        "research/hex-search/generations/campaigns.json"
      ]
    },
    "hex-b246s246-c4-p30-gun": {
      "status": "published",
      "credit": "Published by confocaloid (2024). The package independently verifies indefinite three-way emission.",
      "note": "Confocaloid published the twelve-live-cell seed 3A$4A$.3A$2.2A! on 14 October 2024 in Hexagonal Generations Rules. Direct comparison confirms that the catalogue retains exactly the published initial states, after coordinate conversion and translation. The package adds a complete-state emission certificate for the period-30 core and three permanently separating output streams; that verification is not authorship of the gun.",
      "sources": [
        {
          "label": "confocaloid, 246/246/4H three-way gun (14 October 2024)",
          "url": "https://conwaylife.com/forums/viewtopic.php?f=11&t=1319"
        }
      ],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/hex-search/literature/certify-emitters.py",
        "research/fixtures/hex-published-provenance.json",
        "research/verify-hex-published-provenance.js"
      ]
    },
    "hex-b25s34-p20-puffer": {
      "status": "published",
      "credit": "Published by Naszvadi (2024); Dmitry Maitak points to an earlier 2023 occurrence. The package independently verifies its persistent oscillator trail.",
      "note": "Naszvadi’s 1 February 2024 post supplies the exact twenty-three-cell RLE used here and describes it as probably known. Dmitry Maitak’s later response links to a 2023 occurrence. This audit confirms the 2024 source and the report of earlier publication, but does not establish the original discoverer or independently compare the linked 2023 seed. Initial-state comparison confirms translation-only equivalence to the 2024 RLE. The package adds a certificate of period-20 translated core recurrence and independently separating period-2 deposits.",
      "sources": [
        {
          "label": "Naszvadi, B25/S34H puffer (1 February 2024)",
          "url": "https://conwaylife.com/forums/viewtopic.php?p=177053#p177053"
        },
        {
          "label": "Source thread containing Naszvadi’s RLE and Dmitry Maitak’s earlier-publication note",
          "url": "https://conwaylife.com/forums/viewtopic.php?p=162954"
        },
        {
          "label": "Earlier 2023 occurrence cited by Dmitry Maitak; original priority not established in this audit",
          "url": "https://conwaylife.com/forums/viewtopic.php?p=163227#p163227"
        }
      ],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/hex-search/literature/certify-emitters.py",
        "research/fixtures/hex-published-provenance.json",
        "research/verify-hex-published-provenance.js"
      ]
    },
    "hex-b2s1-c3-p999-rotor": {
      "status": "published",
      "credit": "Published by c0b0p0 (2014); independently replayed and verified for this package.",
      "note": "The Hexagonal Generations Rules post by c0b0p0 dated 27 February 2014 supplies this exact B2/S1 three-state period-999 rotor RLE. The catalogue retains every live and refractory initial state under (q,r)=(x,y-x), followed only by a centring translation. The full-state dynamics are therefore a replay of the published object, not a new package discovery.",
      "sources": [
        {
          "label": "c0b0p0, B2/S1 three-state period-999 rotor (27 February 2014)",
          "url": "https://conwaylife.com/forums/viewtopic.php?f=11&t=1319"
        }
      ],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/fixtures/hex-published-provenance.json",
        "research/verify-hex-published-provenance.js"
      ]
    },
    "hex-b23s4-p13-traveller": {
      "status": "published",
      "credit": "Published by John Cerkan (2020); independently replayed and verified for this package.",
      "note": "John Cerkan’s 15 March 2020 post in Outer-totalistic hexagonal rules with spaceships gives RLE o3bo$bo2bo$2b3o$2bo2bo! for B23/S4H. The catalogue is exactly this nine-cell published seed after (q,r)=(x,y-x) and a centring translation. The exact period and displacement were independently replayed. Use the original thread URL rather than the author-search URL retained in the older source fixture.",
      "sources": [
        {
          "label": "John Cerkan, B23/S4H period-13 spaceship (15 March 2020)",
          "url": "https://conwaylife.com/forums/viewtopic.php?f=11&t=3670"
        }
      ],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/fixtures/hex-published-provenance.json",
        "research/verify-hex-published-provenance.js"
      ]
    },
    "hex-b2s1-c3-p158-traveller": {
      "status": "published",
      "credit": "Published by c0b0p0 (2014); independently replayed and verified for this package.",
      "note": "The Hexagonal Generations Rules post by c0b0p0 dated 27 February 2014 supplies this exact B2/S1 three-state period-158 spaceship RLE. The catalogue retains every live and refractory initial state under (q,r)=(x,y-x), followed only by a centring translation. The full-state dynamics are therefore a replay of the published object, not a new package discovery.",
      "sources": [
        {
          "label": "c0b0p0, B2/S1 three-state period-158 spaceship (27 February 2014)",
          "url": "https://conwaylife.com/forums/viewtopic.php?f=11&t=1319"
        }
      ],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/fixtures/hex-published-provenance.json",
        "research/verify-hex-published-provenance.js"
      ]
    },
    "hex-b2s34-wall-repair": {
      "status": "published",
      "credit": "Self-repairing wall published by Dean Hickerson (2016). The package independently verifies recovery of the complete state.",
      "note": "The 20 January 2016 post supplies the exact damaged-wall RLE used here. Direct coordinate comparison confirms the catalogue changes only embedding and centring. Independent replay of damaged and pristine walls shows full-state reunion at generation 44, including exterior debris. Hickerson describes earlier investigations of the rule, but this audit dates the retrieved public example to 2016 rather than assigning an unverified earlier discovery date.",
      "sources": [
        {
          "label": "Dean Hickerson, B2/S34 walls and billiard tables (20 January 2016)",
          "url": "https://conwaylife.com/forums/viewtopic.php?p=28428"
        },
        {
          "label": "Primary discussion containing the published wall and billiard-table RLEs",
          "url": "https://conwaylife.com/forums/viewtopic.php?p=26919"
        }
      ],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/fixtures/hex-published-provenance.json",
        "research/verify-hex-published-provenance.js"
      ]
    },
    "hex-b2s34-p2044-billiard": {
      "status": "published",
      "credit": "Period-2044 billiard table published by Dean Hickerson (2016); independently verified for this package.",
      "note": "The 20 January 2016 post supplies the exact B2/S34H period-2044 billiard-table RLE used here and describes the one-dimensional XOR behaviour inside its walls. Direct coordinate comparison confirms the catalogue changes only embedding and centring. The package’s long complete-state replay verifies the published oscillator; it does not establish a new oscillator or a new XOR mechanism.",
      "sources": [
        {
          "label": "Dean Hickerson, B2/S34 walls and billiard tables (20 January 2016)",
          "url": "https://conwaylife.com/forums/viewtopic.php?p=28428"
        },
        {
          "label": "Primary discussion containing the published wall and billiard-table RLEs",
          "url": "https://conwaylife.com/forums/viewtopic.php?p=26919"
        }
      ],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "research/fixtures/hex-published-provenance.json",
        "research/verify-hex-published-provenance.js"
      ]
    },
    "hex-parity-seven-copy": {
      "status": "package-constructed",
      "credit": "Illustrative seed constructed for this package using the standard additive/XOR cellular-automaton mechanism.",
      "note": "The three-live-cell initial pattern was assembled for the package, not mined from a soup or imported as an attributed published pattern. B135/S0246 computes the XOR of the centre and six neighbours. Over GF(2), powers of two of this linear update yield translated copies, giving the seven-copy demonstration once their supports are disjoint. The package claims this illustrative arrangement and its exact verification only; neither XOR replication nor the underlying algebra is a new principle. No external source is asserted for this particular seed.",
      "sources": [],
      "evidence": [
        "research/fixtures/hexagonal-sources.json",
        "research/fixtures/hexagonal-evidence.json",
        "research/hex-reference.js",
        "test-hexagonal-evidence.js",
        "docs/HEXAGONAL_STRUCTURES.md"
      ]
    },
    "penrose-conway-p4": {
      "status": "package-found",
      "credit": "Independently found here; published-pattern identity unresolved",
      "note": "The package record recovers this exact phase from deterministic soup penrose-touch-B3/S23-2-osc-v3-6566, density 0.16. It has 12 support tiles and minimum population 9. Penrose Conway oscillators were catalogued by Owens and Stepney, but an exact identification with their illustrated patterns has not been established; this is a package search attribution, not a worldwide originality claim.",
      "sources": [
        {
          "label": "Owens & Stepney (2010): Penrose Life catalogue and classification",
          "url": "https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/penroselife.htm"
        }
      ],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "research/mine-oscillators.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "penrose-conway-p5": {
      "status": "package-found",
      "credit": "Independently found here; published-pattern identity unresolved",
      "note": "The exact phase is recorded under soup penrose-touch-B3/S23-2-osc-v3-1151, density 0.35. It has 18 support tiles and minimum population 8. It is not identified with the published r-p5-14-7 juggler: those support/population invariants differ. Other possible earlier matches remain unestablished.",
      "sources": [
        {
          "label": "Owens & Stepney (2010): Penrose Life catalogue and classification",
          "url": "https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/penroselife.htm"
        }
      ],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "research/mine-oscillators.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "penrose-conway-p7": {
      "status": "package-found",
      "credit": "Independently found here; published-pattern identity unresolved",
      "note": "The package soup replay records seed penrose-touch-osc-149, density 0.16, and this exact isolated period-7 phase. It has 20 support tiles and minimum population 7. Prior Penrose Conway oscillator catalogues are relevant background, but an exact earlier-pattern identification remains unestablished.",
      "sources": [
        {
          "label": "Owens & Stepney (2010): Penrose Life catalogue and classification",
          "url": "https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/penroselife.htm"
        }
      ],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "research/mine-oscillators.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "penrose-conway-p12": {
      "status": "package-found",
      "credit": "Package search; possible Owens–Stepney fireworks match, exact identity unverified",
      "note": "Found from the package’s deterministic soup penrose-touch-osc-98 at density 0.08. The published fireworks oscillator r-p12-33-6 in Stepney’s 2016 Fig. 6, reproduced from Owens–Stepney 2010 Fig. 18.96, has matching period 12, cycle support 33 and minimum population 6. These invariants do not establish identity: the primary phase geometry has not been independently compared. The earlier oscillator is therefore credited as a possible antecedent, without claiming that this is either a confirmed reproduction or a new pattern. Historical priority remains unestablished.",
      "sources": [
        {
          "label": "Stepney (2016), Fig. 6: published fireworks oscillator",
          "url": "https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/AAGoL2016.pdf"
        },
        {
          "label": "Owens & Stepney (2010): Penrose Life catalogue and classification",
          "url": "https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/penroselife.htm"
        }
      ],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "research/mine-oscillators.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "penrose-edge-conway-p4": {
      "status": "package-found",
      "credit": "Found by package search; priority unestablished",
      "note": "The exact phase is recorded under soup penrose-edge-B3/S23-2-osc-v3-4732, density 0.30. This example uses edge adjacency, unlike the generalised Moore contact graph in the cited Penrose Conway catalogue. Same rule name or period alone does not identify an earlier exact pattern; external priority remains unestablished.",
      "sources": [
        {
          "label": "Owens & Stepney (2010): Penrose Life catalogue and classification",
          "url": "https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/penroselife.htm"
        }
      ],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "research/mine-oscillators.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "hat-conway-p6": {
      "status": "package-found",
      "credit": "Found in Aperiodic Life searches; earlier priority unestablished",
      "note": "Extracted from a deterministic soup by the package’s oscillator miner: source seed hat-touch-B3/S23-2-osc-v3-2285, density 0.35. The isolated component has period 6. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.",
      "sources": [],
      "evidence": [
        "discoveries.js",
        "research/fixtures/catalogue-verification.json",
        "research/verify-catalog.js",
        "research/mine-oscillators.js"
      ]
    },
    "hat-conway-p9": {
      "status": "package-found",
      "credit": "Found in Aperiodic Life searches; earlier priority unestablished",
      "note": "Extracted from the package’s deterministic Conway-rule soup hat-touch-osc-61 at density 0.30. The whole soup has period 18; the isolated catalogue component has period 9. The name credits Conway’s B3/S23 rule, not authorship of this hat configuration. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.",
      "sources": [],
      "evidence": [
        "discoveries.js",
        "research/fixtures/catalogue-verification.json",
        "research/verify-catalog.js",
        "research/mine-oscillators.js"
      ]
    },
    "hat-conway-p26": {
      "status": "package-found",
      "credit": "Found in Aperiodic Life searches; earlier priority unestablished",
      "note": "Extracted from the package’s deterministic Conway-rule soup hat-touch-osc-27 at density 0.35. The isolated catalogue component has period 26. The name credits Conway’s B3/S23 rule, not authorship of this hat configuration. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.",
      "sources": [],
      "evidence": [
        "discoveries.js",
        "research/fixtures/catalogue-verification.json",
        "research/verify-catalog.js",
        "research/mine-oscillators.js"
      ]
    },
    "hat-edge-conway-p15": {
      "status": "package-found",
      "credit": "Found in Aperiodic Life searches; earlier priority unestablished",
      "note": "Extracted from a deterministic soup by the package’s oscillator miner: source seed hat-edge-B3/S23-2-osc-v3-467, density 0.35. This is an exact period-15 component on the shared-edge hat graph, using Conway’s B3/S23 counts. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.",
      "sources": [],
      "evidence": [
        "discoveries.js",
        "research/fixtures/catalogue-verification.json",
        "research/verify-catalog.js",
        "research/mine-oscillators.js"
      ]
    },
    "hat-seeds-p8": {
      "status": "package-found",
      "credit": "Found in Aperiodic Life searches; earlier priority unestablished",
      "note": "Extracted from a deterministic soup by the package’s oscillator miner: source seed hat-edge-B2/S-2-osc-v3-97, density 0.04. The four-live-cell catalogue phase has period 8 on the shared-edge hat graph. Seeds names the B2/S rule family; it does not identify a published source for this particular configuration. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.",
      "sources": [],
      "evidence": [
        "discoveries.js",
        "research/fixtures/catalogue-verification.json",
        "research/verify-catalog.js",
        "research/mine-oscillators.js"
      ]
    },
    "hat-b23-p20": {
      "status": "package-found",
      "credit": "Found in Aperiodic Life searches; earlier priority unestablished",
      "note": "Extracted from a deterministic soup by the package’s oscillator miner: source seed hat-edge-B23/S-2-osc-v3-333, density 0.12. The whole soup has period 60; the isolated catalogue component has period 20. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.",
      "sources": [],
      "evidence": [
        "discoveries.js",
        "research/fixtures/catalogue-verification.json",
        "research/verify-catalog.js",
        "research/mine-oscillators.js"
      ]
    },
    "hat-b23-p24": {
      "status": "package-found",
      "credit": "Found in Aperiodic Life searches; earlier priority unestablished",
      "note": "Extracted from a deterministic soup by the package’s oscillator miner: source seed hat-edge-B23/S-2-osc-v3-748, density 0.10. The eight-live-cell catalogue phase has period 24. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.",
      "sources": [],
      "evidence": [
        "discoveries.js",
        "research/fixtures/catalogue-verification.json",
        "research/verify-catalog.js",
        "research/mine-oscillators.js"
      ]
    },
    "hat-b23-p28": {
      "status": "package-found",
      "credit": "Found in Aperiodic Life searches; earlier priority unestablished",
      "note": "Extracted from a deterministic soup by the package’s oscillator miner: source seed hat-edge-B23/S-2-osc-v3-694, density 0.16. The whole soup has period 56; the isolated catalogue component has period 28. No earlier publication of this exact configuration was identified in the reviewed sources; this records its origin within the package, not a claim of first discovery.",
      "sources": [],
      "evidence": [
        "discoveries.js",
        "research/fixtures/catalogue-verification.json",
        "research/verify-catalog.js",
        "research/mine-oscillators.js"
      ]
    },
    "penrose-b2-c4-compact-traveller": {
      "status": "package-found",
      "credit": "Traveller phase found here; priority unestablished",
      "note": "The package retains an explicit source phase and a polygon-preserving transplant verifier. It is a 4-state B2/S live-front/refractory-wake example with a finite 220-generation certificate. Earlier published Penrose gliders use a different rule; no exact-pattern identity with them is asserted. The general refractory idea is established, and no worldwide first-discovery claim is made for this Penrose phase.",
      "sources": [
        {
          "label": "Goucher (2012): earlier Penrose glider under a different rule",
          "url": "https://cp4space.hatsya.com/wp-content/uploads/2012/11/2012-penrose-gliders.pdf"
        }
      ],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "test-traveller-evidence.js",
        "research/search-mobile-patterns.js",
        "docs/RULE_SURVEY.md",
        "research/verify-penrose-traveller.js"
      ]
    },
    "penrose-b2-c5-compact-traveller": {
      "status": "package-found",
      "credit": "Traveller phase found here; priority unestablished",
      "note": "The recorded depth-10 phase is taken from the package's five-state traveller campaign. It is a 5-state B2/S live-front/refractory-wake example with a finite 220-generation certificate. Earlier published Penrose gliders use a different rule; no exact-pattern identity with them is asserted. The general refractory idea is established, and no worldwide first-discovery claim is made for this Penrose phase.",
      "sources": [
        {
          "label": "Goucher (2012): earlier Penrose glider under a different rule",
          "url": "https://cp4space.hatsya.com/wp-content/uploads/2012/11/2012-penrose-gliders.pdf"
        }
      ],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "test-traveller-evidence.js",
        "research/search-mobile-patterns.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "penrose-b2-c6-compact-traveller": {
      "status": "package-found",
      "credit": "Traveller phase found here; priority unestablished",
      "note": "The recorded depth-10 phase is taken from the package's six-state traveller campaign. It is a 6-state B2/S live-front/refractory-wake example with a finite 220-generation certificate. Earlier published Penrose gliders use a different rule; no exact-pattern identity with them is asserted. The general refractory idea is established, and no worldwide first-discovery claim is made for this Penrose phase.",
      "sources": [
        {
          "label": "Goucher (2012): earlier Penrose glider under a different rule",
          "url": "https://cp4space.hatsya.com/wp-content/uploads/2012/11/2012-penrose-gliders.pdf"
        }
      ],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "test-traveller-evidence.js",
        "research/search-mobile-patterns.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "penrose-b24-c4-launcher-traveller": {
      "status": "package-found",
      "credit": "Launcher found by package search; priority unestablished",
      "note": "The package's altered-rule search supplied this 27-cell phased launcher. Eight B4 births affect its launch; its mature travelling core belongs to the package's B2/S family. This attributes the recorded seed and launch mechanism, not a new recurrent glider core or a proved immortal Penrose glider. No external exact-pattern source has been established.",
      "sources": [],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "test-traveller-evidence.js",
        "research/search-mobile-patterns.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "penrose-b2s4-c5-survival-launcher": {
      "status": "package-found",
      "credit": "Launcher found by package search; priority unestablished",
      "note": "This seven-live-cell seed comes from the package's Penrose traveller search. Two S4 survivals distinguish its launch before it settles into the established B2/S-type wave. The exact seed, clause ablation and finite traversal are documented; prior worldwide identity of this launch is unestablished.",
      "sources": [],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "test-traveller-evidence.js",
        "research/search-mobile-patterns.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "penrose-b26s-c4-birth-launcher": {
      "status": "package-found",
      "credit": "Launcher found by package search; priority unestablished",
      "note": "The package search supplied this eighteen-cell phased seed. One B6 birth genuinely affects the launch; its eventual recurrent wave uses the established B2/S mechanism. It is a separately recorded launcher rather than evidence of a new recurrent rule mechanism. No external exact-pattern attribution was established.",
      "sources": [],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "test-traveller-evidence.js",
        "research/search-mobile-patterns.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "penrose-b27s4-c4-dual-clause-launcher": {
      "status": "package-found",
      "credit": "Launcher found by package search; priority unestablished",
      "note": "The recorded 26-live-cell launch comes from the package's altered-rule campaign. Both added clauses fire during launch: B7 births and S4 survivals. The mature core belongs to the B2/S travelling family. This is package provenance for the seed, with external first-discovery priority unestablished.",
      "sources": [],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "test-traveller-evidence.js",
        "research/search-mobile-patterns.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "penrose-conway-diehard-293": {
      "status": "package-found",
      "credit": "Found by package search; priority unestablished",
      "note": "This exact fourteen-cell seed is the retained extinction-at-293 result of the package's 5,000-candidate transient campaign, deterministic seed penrose-touch-B3/S23-2-transient-v1. Earlier Penrose Life lifetime studies provide context, but do not identify this exact initial state. No world-record or original-discovery claim is made.",
      "sources": [
        {
          "label": "Owens & Stepney (2010): Penrose Life statistics",
          "url": "https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/jca10.pdf"
        }
      ],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "research/search-transients.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "penrose-conway-methuselah-289": {
      "status": "package-found",
      "credit": "Found by package search; priority unestablished",
      "note": "The exact 22-live-cell seed is the retained result of the package's 35,000-candidate campaign penrose-touch-b3s23-transient-v2. Its transient is 289 generations before a fixed point. This is a locally documented search result, not an attribution of the underlying Conway rule or a claim to the longest known Penrose transient.",
      "sources": [
        {
          "label": "Owens & Stepney (2010): Penrose Life statistics",
          "url": "https://www-users.york.ac.uk/~ss44/bib/ss/nonstd/jca10.pdf"
        }
      ],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "research/search-transients.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "penrose-b12-p840-field": {
      "status": "package-constructed",
      "credit": "Deterministic field generated for this package",
      "note": "The initial field is generated by the package from seed penrose-edge-B12/S-2, density 0.12 and eight dead border rings. The finite field has transient 51 and period 840. This is a reproducible seeded demonstration, not a claim to an independently indivisible period-840 oscillator or an original cellular-automaton rule.",
      "sources": [],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "research/survey-fields.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "penrose-brain-field": {
      "status": "package-constructed",
      "credit": "Package-seeded field; Brian Silverman's Brain rule",
      "note": "The B2/S three-state transition is Brian Silverman's established Brain rule, here applied to the Penrose touch graph instead of its usual square neighbourhood. The exact random field is package-generated from seed penrose-touch-B2/S-3 at density 0.12 with eight border rings. Its 3,000-generation observation is a finite demonstration, not a published fixed pattern or a first-discovery claim.",
      "sources": [
        {
          "label": "CelLab documentation: Brian Silverman's Brain rule",
          "url": "https://www.fourmilab.ch/cellab/manual/chap4.html"
        }
      ],
      "evidence": [
        "research/fixtures/catalogue-verification.json",
        "research/survey-fields.js",
        "docs/RULE_SURVEY.md"
      ]
    },
    "hat-b1-field": {
      "status": "package-constructed",
      "credit": "Aperiodic Life seeded-field demonstration",
      "note": "A reproducible pseudorandom field constructed for the package’s rule survey, using seed hat-touch-B1/S-2, density 0.12 and an eight-ring dead border. It was selected because it remains active through 3,000 generations. This is a finite-board demonstration of collective dynamics, not an attributed compact pattern or a claim of a newly discovered rule.",
      "sources": [],
      "evidence": [
        "discoveries.js",
        "research/fixtures/catalogue-verification.json",
        "research/verify-catalog.js",
        "research/survey-fields.js"
      ]
    }
  };
  for (const record of Object.values(PROVENANCE)) {
    record.sources.forEach(Object.freeze);
    Object.freeze(record.sources);
    Object.freeze(record.evidence);
    Object.freeze(record);
  }
  Object.freeze(PROVENANCE);
  // END GENERATED CATALOGUE PROVENANCE

  // Decode the live-cell subset of ordinary two-state RLE.  Keeping classic
  // patterns in their published compact form makes the catalogue verifiable.
  function rleStates(rle, originX = 0, originY = 0) {
    const states = [];
    let x = 0;
    let y = 0;
    let digits = '';
    const source = String(rle).replace(/\s+/g, '');
    for (const symbol of source) {
      if (symbol >= '0' && symbol <= '9') {
        digits += symbol;
        continue;
      }
      const hadCount = digits.length > 0;
      const count = hadCount ? Number(digits) : 1;
      digits = '';
      if (!Number.isSafeInteger(count) || count < 1) throw new RangeError('Invalid RLE run length');
      if (symbol === 'b') {
        x += count;
      } else if (symbol === 'o') {
        for (let index = 0; index < count; index++) states.push([originX + x + index, originY + y, 1]);
        x += count;
      } else if (symbol === '$') {
        y += count;
        x = 0;
      } else if (symbol === '!') {
        if (hadCount) throw new SyntaxError('Unexpected RLE count before terminator');
        return states;
      } else {
        throw new SyntaxError(`Unsupported RLE symbol ${JSON.stringify(symbol)}`);
      }
    }
    throw new SyntaxError('RLE pattern is missing its ! terminator');
  }

  // Presentation is part of a curated example: the same verified state can
  // be unintelligible if it starts off-centre, is cropped during its headline
  // behaviour, or runs too quickly to inspect.  Keep the common policies
  // shared and immutable; trajectory bounds are checked in test-discoveries.
  const INITIAL_VIEW = Object.freeze({ mode: 'initial', padding: 4 });
  const FIELD_VIEW = Object.freeze({ mode: 'initial', padding: 6 });
  const CONTAIN_VIEW = Object.freeze({ mode: 'contain', padding: 4 });

  function trajectoryView(bounds, steps, padding = 4) {
    return Object.freeze({
      mode: 'trajectory',
      bounds: Object.freeze(bounds),
      steps,
      padding,
    });
  }

  const entries = [
  // BEGIN CONTINUED SEARCH ENTRIES
    {
      "id": "hat-wake-traveller",
      "title": "Hat wake traveller",
      "tiling": "hat",
      "depth": 5,
      "neighborhood": "touch",
      "rule": "TABLE:HAT-WAKE",
      "generations": 4,
      "cellStates": [
        [
          7392,
          2
        ],
        [
          7396,
          1
        ],
        [
          7307,
          3
        ],
        [
          2948,
          1
        ],
        [
          2955,
          1
        ],
        [
          2952,
          1
        ]
      ],
      "expectedActivityThrough": 293,
      "speed": 6,
      "borderRings": 1,
      "view": {
        "mode": "contain",
        "padding": 4
      },
      "category": "Einstein-hat gliders and launchers",
      "summary": "An independently evolved four-state rule carries a compact wake traveller through 293 generations. Larger-patch evidence covers 1,000 interior generations with at most nine nonzero cells. Finite evidence; priority and indefinite propagation remain open."
    },
    {
      "id": "hat-two-row-relay",
      "title": "Hat two-row relay — Spectre variant",
      "tiling": "hat",
      "depth": 5,
      "neighborhood": "touch",
      "rule": "TABLE:HAT-RELAY",
      "generations": 3,
      "cellStates": [
        [
          7293,
          2
        ],
        [
          7295,
          1
        ]
      ],
      "expectedActivityThrough": 235,
      "speed": 6,
      "borderRings": 1,
      "view": {
        "mode": "contain",
        "padding": 4
      },
      "category": "Einstein-hat gliders and launchers",
      "summary": "A two-cell seed travels under a three-state rule with just two rows. The mature trajectory matches Edmond’s Spectre relay after relabelling; this is a credited adaptation. Verified through 235 finite generations; the complete support can split."
    },
    {
      "id": "hat-edmond-a-six-way-launcher",
      "category": "Einstein-hat gliders and launchers",
      "title": "Hat A six-way launcher",
      "summary": "A connected six-cell seed launches six independently verified Hat A gliders under Edmond’s published rule. Complete-state replay is checked through generation 180; this is a finite launcher.",
      "tiling": "hat",
      "depth": 5,
      "neighborhood": "touch",
      "rule": "TABLE:HAT-A",
      "generations": 4,
      "borderRings": 1,
      "speed": 6,
      "view": {
        "mode": "contain",
        "padding": 4
      },
      "cellStates": [
        [
          24180,
          2
        ],
        [
          24181,
          1
        ],
        [
          24717,
          2
        ],
        [
          24718,
          1
        ],
        [
          24722,
          1
        ],
        [
          24724,
          2
        ]
      ],
      "expectedActivityThrough": 180
    },
    {
      "id": "hat-edmond-b-periodic-emitter",
      "category": "Einstein-hat gliders and launchers",
      "title": "Hat B recurring emitter — finite verification",
      "summary": "Three cells ignite a recurring source under Edmond’s Hat B rule. A complete 40-generation emission identity and separated-packet replay are verified over finite intervals; perpetual emission is not proved.",
      "tiling": "hat",
      "depth": 5,
      "neighborhood": "touch",
      "rule": "TABLE:HAT-B",
      "generations": 4,
      "borderRings": 1,
      "speed": 6,
      "view": {
        "mode": "contain",
        "padding": 4
      },
      "cellStates": [
        [
          23821,
          1
        ],
        [
          23824,
          3
        ],
        [
          23836,
          1
        ]
      ],
      "expectedActivityThrough": 180
    },
    {
      "id": "penrose-b2-c6-twelve-launcher",
      "category": "Aperiodic travelling dynamics",
      "title": "Penrose twelve-traveller launcher",
      "summary": "Three live cells launch twelve compact six-state travellers. Their independent evolutions reconstruct the whole state from generation 90 through 130; 5 have a verified complete-state translated return with matching tile polygons and three surrounding neighbour rings during that interval. This finite traversal uses the established B2/S traveller family.",
      "tiling": "penrose",
      "depth": 10,
      "penroseSeed": "sun",
      "neighborhood": "touch",
      "rule": "B2/S",
      "generations": 6,
      "borderRings": 0,
      "speed": 6,
      "view": {
        "mode": "trajectory",
        "bounds": [
          -98.0040922164917,
          -98.19349271059036,
          75.3704924583435,
          92.6484106183052
        ],
        "steps": 130,
        "padding": 4
      },
      "cellStates": [
        [
          46186,
          1
        ],
        [
          51676,
          1
        ],
        [
          51680,
          1
        ]
      ],
      "expectedActivityThrough": 130
    },
    {
      "tiling": "hex",
      "neighborhood": "edge",
      "borderRings": 1,
      "speed": 4,
      "id": "hex-b245s02-c5-p6-puffer",
      "category": "Hexagonal guns, puffers and replication",
      "title": "Hexagonal p6 single-cell-trail puffer",
      "summary": "A five-state puffer shifts by axial (−2,4) every six generations, depositing one stationary live cell each cycle. Exact separation certificates prove continued propagation on the infinite hexagonal lattice.",
      "depth": 128,
      "rule": "B245/S02",
      "generations": 5,
      "coordinateStates": [
        [
          -3,
          5,
          1
        ],
        [
          -2,
          3,
          4
        ],
        [
          -2,
          4,
          2
        ],
        [
          -2,
          5,
          1
        ],
        [
          -1,
          0,
          1
        ],
        [
          -1,
          1,
          1
        ],
        [
          -1,
          3,
          1
        ],
        [
          -1,
          4,
          2
        ],
        [
          -1,
          5,
          1
        ],
        [
          0,
          -1,
          2
        ],
        [
          0,
          0,
          2
        ],
        [
          0,
          1,
          1
        ],
        [
          0,
          3,
          4
        ],
        [
          1,
          -4,
          2
        ],
        [
          1,
          -3,
          3
        ],
        [
          1,
          -2,
          4
        ],
        [
          1,
          -1,
          4
        ],
        [
          1,
          0,
          2
        ],
        [
          1,
          1,
          1
        ],
        [
          2,
          -4,
          2
        ],
        [
          2,
          -3,
          4
        ],
        [
          2,
          -2,
          4
        ],
        [
          2,
          -1,
          2
        ],
        [
          2,
          0,
          1
        ],
        [
          3,
          -5,
          1
        ],
        [
          3,
          -4,
          2
        ],
        [
          3,
          -3,
          3
        ],
        [
          4,
          -4,
          2
        ]
      ],
      "expectedActivityThrough": 120,
      "view": {
        "mode": "trajectory",
        "bounds": [
          -3.464101552963257,
          -8.5,
          5.196152210235596,
          68.5
        ],
        "steps": 60,
        "padding": 3
      }
    },
    {
      "tiling": "hex",
      "neighborhood": "edge",
      "borderRings": 1,
      "speed": 4,
      "id": "hex-b245s02-c5-three-cell-twin-puffer-launcher",
      "category": "Hexagonal guns, puffers and replication",
      "title": "Hexagonal three-cell twin-puffer launcher",
      "summary": "Two live cells and one refractory cell launch two opposite puffers. By generation 30 they have separated from four stationary cells; each puffer then deposits one live cell every six generations.",
      "depth": 128,
      "rule": "B245/S02",
      "generations": 5,
      "coordinateStates": [
        [
          0,
          1,
          2
        ],
        [
          1,
          0,
          1
        ],
        [
          2,
          0,
          1
        ]
      ],
      "expectedActivityThrough": 120,
      "view": {
        "mode": "trajectory",
        "bounds": [
          -8.66025447845459,
          -56.5,
          13.856406211853027,
          56.5
        ],
        "steps": 60,
        "padding": 3
      }
    },
    {
      "tiling": "hex",
      "neighborhood": "edge",
      "borderRings": 1,
      "speed": 4,
      "id": "hex-b2345s24-c4-p48-traveller",
      "category": "Hexagonal travellers",
      "title": "Hexagonal p48 long-cycle spaceship",
      "summary": "A four-state spaceship follows a 48-generation cycle, moving by axial (−32,16). It can also be launched from seven live cells, as recorded in the accompanying evidence.",
      "depth": 192,
      "rule": "B2345/S24",
      "generations": 4,
      "coordinateStates": [
        [
          -4,
          4,
          1
        ],
        [
          -3,
          3,
          1
        ],
        [
          -3,
          4,
          1
        ],
        [
          -2,
          2,
          3
        ],
        [
          -2,
          3,
          1
        ],
        [
          -2,
          4,
          3
        ],
        [
          0,
          1,
          1
        ],
        [
          0,
          2,
          2
        ],
        [
          0,
          3,
          1
        ],
        [
          0,
          4,
          1
        ],
        [
          1,
          0,
          1
        ],
        [
          1,
          1,
          1
        ],
        [
          1,
          2,
          3
        ],
        [
          1,
          3,
          1
        ],
        [
          2,
          -3,
          2
        ],
        [
          2,
          -2,
          3
        ],
        [
          2,
          2,
          2
        ],
        [
          2,
          3,
          3
        ],
        [
          3,
          -4,
          3
        ],
        [
          3,
          -1,
          3
        ],
        [
          4,
          -2,
          3
        ]
      ],
      "expectedPeriod": 48,
      "moving": true,
      "translation": [
        -32,
        16
      ],
      "view": {
        "mode": "trajectory",
        "bounds": [
          -56.29165267944336,
          -7,
          9.52627944946289,
          38.5
        ],
        "steps": 60,
        "padding": 3
      }
    },
  // END CONTINUED SEARCH ENTRIES
    {
      "id": "hex-b2s0-c3-three-cell-glider",
      "category": "Hexagonal travellers",
      "title": "Hexagonal three-cell glider",
      "summary": "Three live cells form an exact three-state spaceship. Its complete state moves one axial cell every two generations; the alternating refractory phase is part of the glider.",
      "tiling": "hex",
      "depth": 128,
      "neighborhood": "edge",
      "rule": "B2/S0",
      "generations": 3,
      "borderRings": 1,
      "speed": 3,
      "coordinateStates": [
        [
          0,
          1,
          1
        ],
        [
          1,
          0,
          1
        ],
        [
          2,
          0,
          1
        ]
      ],
      "expectedTravel": {
        "steps": 120,
        "minimumDisplacement": 103.923,
        "minimumDirectionality": 0.999,
        "maximumRadius": 1.733,
        "minimumActive": 3,
        "maximumActive": 5,
        "minimumLive": 2,
        "maximumLive": 3,
        "minimumBoundaryDistance": 68,
        "connectedThroughout": false,
        "expectedRuleClauses": [
          {
            "kind": "birth",
            "liveNeighbors": 2,
            "count": 180,
            "lastToGeneration": 120
          },
          {
            "kind": "survival",
            "liveNeighbors": 0,
            "count": 120,
            "lastToGeneration": 120
          }
        ],
        "translatedReturn": {
          "fromGeneration": 1,
          "toGeneration": 3,
          "dx": -0.8660253882408142,
          "dy": -1.5,
          "neighborhoodRadius": 3
        },
        "finalHash": [
          1531259721,
          1540034580
        ],
        "finalCellStates": [
          [
            24709,
            1
          ],
          [
            24965,
            1
          ],
          [
            25221,
            1
          ]
        ]
      },
      "view": {
        "mode": "trajectory",
        "bounds": [
          -10.392304420471191,
          -19,
          4.330127239227295,
          2.5
        ],
        "steps": 24,
        "padding": 3
      }
    },
    {
      "id": "hex-b234s1346-c3-four-cell-launcher",
      "category": "Hexagonal travellers",
      "title": "Hexagonal four-cell diagonal launcher",
      "summary": "Four live cells settle after nine generations into a period-8 spaceship travelling by axial (1,1). Every live and refractory cell repeats in the translated cycle.",
      "tiling": "hex",
      "depth": 128,
      "neighborhood": "edge",
      "rule": "B234/S1346",
      "generations": 3,
      "borderRings": 1,
      "speed": 4,
      "coordinateStates": [
        [
          0,
          0,
          1
        ],
        [
          1,
          0,
          1
        ],
        [
          1,
          1,
          1
        ],
        [
          2,
          0,
          1
        ]
      ],
      "expectedTravel": {
        "steps": 120,
        "minimumDisplacement": 43.125,
        "minimumDirectionality": 0.64,
        "maximumRadius": 8.223,
        "minimumActive": 4,
        "maximumActive": 27,
        "minimumLive": 4,
        "maximumLive": 19,
        "minimumBoundaryDistance": 97,
        "connectedThroughout": false,
        "expectedRuleClauses": [
          {
            "kind": "birth",
            "liveNeighbors": 2,
            "count": 595,
            "lastToGeneration": 120
          },
          {
            "kind": "birth",
            "liveNeighbors": 3,
            "count": 171,
            "lastToGeneration": 119
          },
          {
            "kind": "birth",
            "liveNeighbors": 4,
            "count": 57,
            "lastToGeneration": 116
          },
          {
            "kind": "survival",
            "liveNeighbors": 1,
            "count": 125,
            "lastToGeneration": 120
          },
          {
            "kind": "survival",
            "liveNeighbors": 3,
            "count": 369,
            "lastToGeneration": 119
          },
          {
            "kind": "survival",
            "liveNeighbors": 4,
            "count": 297,
            "lastToGeneration": 118
          },
          {
            "kind": "survival",
            "liveNeighbors": 6,
            "count": 28,
            "lastToGeneration": 117
          }
        ],
        "translatedReturn": {
          "fromGeneration": 9,
          "toGeneration": 17,
          "dx": 2.5980762243270874,
          "dy": 1.5,
          "neighborhoodRadius": 3
        },
        "finalHash": [
          2862079887,
          2583090950
        ],
        "finalCellStates": [
          [
            28047,
            1
          ],
          [
            28049,
            2
          ],
          [
            28290,
            1
          ],
          [
            28291,
            1
          ],
          [
            28532,
            1
          ],
          [
            28534,
            1
          ],
          [
            28773,
            1
          ],
          [
            28775,
            2
          ],
          [
            29013,
            1
          ],
          [
            29014,
            1
          ],
          [
            29015,
            1
          ],
          [
            29492,
            2
          ]
        ]
      },
      "view": {
        "mode": "trajectory",
        "bounds": [
          -4.330127239227295,
          -5.5,
          12.990381240844727,
          10
        ],
        "steps": 25,
        "padding": 3
      }
    },
    {
      "id": "hex-b2456s1345-c4-five-cell-launcher",
      "category": "Hexagonal travellers",
      "title": "Hexagonal five-cell p43 launcher",
      "summary": "Five live cells launch a compact four-state spaceship. Its complete shape follows a 43-generation cycle, moving six hexagonal neighbour steps along a diagonal.",
      "tiling": "hex",
      "depth": 128,
      "neighborhood": "edge",
      "rule": "B2456/S1345",
      "generations": 4,
      "borderRings": 1,
      "speed": 6,
      "coordinateStates": [
        [
          0,
          3,
          1
        ],
        [
          1,
          2,
          1
        ],
        [
          2,
          1,
          1
        ],
        [
          3,
          1,
          1
        ],
        [
          4,
          0,
          1
        ]
      ],
      "expectedTravel": {
        "steps": 178,
        "minimumDisplacement": 38.833,
        "minimumDirectionality": 0.366,
        "maximumRadius": 13.955,
        "minimumActive": 5,
        "maximumActive": 48,
        "minimumLive": 5,
        "maximumLive": 32,
        "minimumBoundaryDistance": 102,
        "connectedThroughout": false,
        "expectedRuleClauses": [
          {
            "kind": "birth",
            "liveNeighbors": 2,
            "count": 880,
            "lastToGeneration": 178
          },
          {
            "kind": "birth",
            "liveNeighbors": 4,
            "count": 84,
            "lastToGeneration": 172
          },
          {
            "kind": "birth",
            "liveNeighbors": 5,
            "count": 16,
            "lastToGeneration": 163
          },
          {
            "kind": "birth",
            "liveNeighbors": 6,
            "count": 16,
            "lastToGeneration": 167
          },
          {
            "kind": "survival",
            "liveNeighbors": 1,
            "count": 540,
            "lastToGeneration": 178
          },
          {
            "kind": "survival",
            "liveNeighbors": 3,
            "count": 632,
            "lastToGeneration": 178
          },
          {
            "kind": "survival",
            "liveNeighbors": 4,
            "count": 392,
            "lastToGeneration": 170
          },
          {
            "kind": "survival",
            "liveNeighbors": 5,
            "count": 136,
            "lastToGeneration": 168
          }
        ],
        "translatedReturn": {
          "fromGeneration": 6,
          "toGeneration": 49,
          "dx": -7.794228623310725,
          "dy": 4.5,
          "neighborhoodRadius": 3
        },
        "finalHash": [
          3522641762,
          4221220525
        ],
        "finalCellStates": [
          [
            18425,
            1
          ],
          [
            18428,
            1
          ],
          [
            18655,
            1
          ],
          [
            18656,
            1
          ],
          [
            18657,
            3
          ],
          [
            18659,
            3
          ],
          [
            18660,
            1
          ],
          [
            18661,
            1
          ],
          [
            18888,
            3
          ],
          [
            18889,
            1
          ],
          [
            18892,
            1
          ],
          [
            18893,
            3
          ],
          [
            19124,
            3
          ],
          [
            19357,
            3
          ],
          [
            19358,
            1
          ],
          [
            19359,
            1
          ],
          [
            19360,
            3
          ],
          [
            19594,
            1
          ]
        ]
      },
      "view": {
        "mode": "trajectory",
        "bounds": [
          -18.186532974243164,
          -4,
          10.392304420471191,
          20.5
        ],
        "steps": 92,
        "padding": 3
      }
    },
    {
      "id": "hex-b23s13-c4-p9-knightship-launcher",
      "category": "Hexagonal travellers",
      "title": "Hexagonal six-cell p9 knightship launcher",
      "summary": "Six live cells launch a spaceship travelling between the standard hexagonal axes and diagonals. The exact four-state cycle shifts by axial (5,-4) every nine generations.",
      "tiling": "hex",
      "depth": 128,
      "neighborhood": "edge",
      "rule": "B23/S13",
      "generations": 4,
      "borderRings": 1,
      "speed": 4,
      "coordinateStates": [
        [
          0,
          0,
          1
        ],
        [
          0,
          2,
          1
        ],
        [
          1,
          0,
          1
        ],
        [
          1,
          1,
          1
        ],
        [
          1,
          2,
          1
        ],
        [
          2,
          1,
          1
        ]
      ],
      "expectedTravel": {
        "steps": 120,
        "minimumDisplacement": 101.306,
        "minimumDirectionality": 0.811,
        "maximumRadius": 11.288,
        "minimumActive": 6,
        "maximumActive": 33,
        "minimumLive": 6,
        "maximumLive": 15,
        "minimumBoundaryDistance": 61,
        "connectedThroughout": false,
        "expectedRuleClauses": [
          {
            "kind": "birth",
            "liveNeighbors": 2,
            "count": 581,
            "lastToGeneration": 120
          },
          {
            "kind": "birth",
            "liveNeighbors": 3,
            "count": 179,
            "lastToGeneration": 120
          },
          {
            "kind": "survival",
            "liveNeighbors": 1,
            "count": 334,
            "lastToGeneration": 120
          },
          {
            "kind": "survival",
            "liveNeighbors": 3,
            "count": 208,
            "lastToGeneration": 120
          }
        ],
        "translatedReturn": {
          "fromGeneration": 16,
          "toGeneration": 25,
          "dx": 5.1961523691813145,
          "dy": -6,
          "neighborhoodRadius": 3
        },
        "finalHash": [
          884841413,
          1339690346
        ],
        "finalCellStates": [
          [
            38564,
            3
          ],
          [
            38566,
            3
          ],
          [
            38567,
            1
          ],
          [
            38762,
            1
          ],
          [
            38763,
            1
          ],
          [
            38764,
            3
          ],
          [
            38953,
            1
          ],
          [
            38956,
            3
          ],
          [
            38957,
            3
          ],
          [
            39146,
            2
          ],
          [
            39147,
            2
          ],
          [
            39148,
            1
          ],
          [
            39149,
            2
          ],
          [
            39150,
            3
          ],
          [
            39151,
            2
          ],
          [
            39152,
            3
          ],
          [
            39153,
            3
          ],
          [
            39338,
            1
          ],
          [
            39339,
            1
          ],
          [
            39341,
            2
          ],
          [
            39342,
            1
          ],
          [
            39345,
            3
          ],
          [
            39346,
            2
          ],
          [
            39530,
            1
          ],
          [
            39531,
            2
          ],
          [
            39532,
            1
          ],
          [
            39533,
            1
          ],
          [
            39534,
            1
          ],
          [
            39535,
            3
          ],
          [
            39536,
            2
          ],
          [
            39537,
            1
          ],
          [
            39722,
            1
          ],
          [
            39723,
            1
          ]
        ]
      },
      "view": {
        "mode": "trajectory",
        "bounds": [
          -2.598076105117798,
          -25,
          22.516660690307617,
          10
        ],
        "steps": 34,
        "padding": 3
      }
    },
    {
      "id": "hex-b234s245-c5-p10-knightship-launcher",
      "category": "Hexagonal travellers",
      "title": "Hexagonal six-cell p10 knightship launcher",
      "summary": "Six live cells launch a second oblique spaceship: its complete five-state shape repeats with axial shift (1,2) every ten generations, rather than following a hexagonal axis or diagonal.",
      "tiling": "hex",
      "depth": 128,
      "neighborhood": "edge",
      "rule": "B234/S245",
      "generations": 5,
      "borderRings": 1,
      "speed": 4,
      "coordinateStates": [
        [
          0,
          3,
          1
        ],
        [
          1,
          2,
          1
        ],
        [
          2,
          1,
          1
        ],
        [
          3,
          1,
          1
        ],
        [
          4,
          0,
          1
        ],
        [
          5,
          0,
          1
        ]
      ],
      "expectedTravel": {
        "steps": 120,
        "minimumDisplacement": 54.116,
        "minimumDirectionality": 0.425,
        "maximumRadius": 12.705,
        "minimumActive": 6,
        "maximumActive": 58,
        "minimumLive": 6,
        "maximumLive": 24,
        "minimumBoundaryDistance": 85,
        "connectedThroughout": false,
        "expectedRuleClauses": [
          {
            "kind": "birth",
            "liveNeighbors": 2,
            "count": 722,
            "lastToGeneration": 120
          },
          {
            "kind": "birth",
            "liveNeighbors": 3,
            "count": 246,
            "lastToGeneration": 120
          },
          {
            "kind": "birth",
            "liveNeighbors": 4,
            "count": 11,
            "lastToGeneration": 111
          },
          {
            "kind": "survival",
            "liveNeighbors": 2,
            "count": 629,
            "lastToGeneration": 120
          },
          {
            "kind": "survival",
            "liveNeighbors": 4,
            "count": 95,
            "lastToGeneration": 120
          },
          {
            "kind": "survival",
            "liveNeighbors": 5,
            "count": 4,
            "lastToGeneration": 3
          }
        ],
        "translatedReturn": {
          "fromGeneration": 12,
          "toGeneration": 22,
          "dx": 3.464101642370224,
          "dy": 3,
          "neighborhoodRadius": 3
        },
        "finalHash": [
          4282980425,
          1911281688
        ],
        "finalCellStates": [
          [
            28055,
            1
          ],
          [
            28056,
            1
          ],
          [
            28297,
            1
          ],
          [
            28298,
            1
          ],
          [
            28299,
            2
          ],
          [
            28300,
            1
          ],
          [
            28540,
            1
          ],
          [
            28541,
            3
          ],
          [
            28542,
            1
          ],
          [
            28543,
            1
          ],
          [
            28781,
            1
          ],
          [
            28782,
            2
          ],
          [
            28783,
            4
          ],
          [
            28785,
            1
          ],
          [
            28786,
            4
          ],
          [
            29022,
            1
          ],
          [
            29023,
            2
          ],
          [
            29024,
            3
          ],
          [
            29025,
            1
          ],
          [
            29026,
            2
          ],
          [
            29262,
            1
          ],
          [
            29263,
            1
          ],
          [
            29264,
            2
          ],
          [
            29265,
            2
          ],
          [
            29266,
            1
          ],
          [
            29502,
            1
          ],
          [
            29503,
            1
          ]
        ]
      },
      "view": {
        "mode": "trajectory",
        "bounds": [
          -0.8660253882408142,
          -5.5,
          24.24871063232422,
          14.5
        ],
        "steps": 32,
        "padding": 3
      }
    },
    {
      "id": "hat-edmond-b-glider",
      "category": "Einstein-hat gliders and launchers",
      "title": "Hat glider B — Edmond rule",
      "summary": "A two-cell seed launches a compact Hat glider under James Edmond’s published B priority table. Verified through 307 generations with a dead boundary buffer; no immortality or first-discovery claim.",
      "tiling": "hat",
      "depth": 5,
      "neighborhood": "touch",
      "rule": "TABLE:HAT-B",
      "generations": 4,
      "borderRings": 1,
      "speed": 6,
      "view": {
        "mode": "contain",
        "padding": 4
      },
      "cellStates": [
        [
          2945,
          1
        ],
        [
          2943,
          3
        ]
      ],
      "expectedActivityThrough": 307
    },
    {
      "id": "hat-edmond-a-glider",
      "category": "Einstein-hat gliders and launchers",
      "title": "Hat glider A — Edmond rule",
      "summary": "A two-cell seed launches a compact Hat glider under James Edmond’s published A priority table. Verified through 307 generations with a dead boundary buffer; no immortality or first-discovery claim.",
      "tiling": "hat",
      "depth": 5,
      "neighborhood": "touch",
      "rule": "TABLE:HAT-A",
      "generations": 4,
      "borderRings": 1,
      "speed": 6,
      "view": {
        "mode": "contain",
        "padding": 4
      },
      "cellStates": [
        [
          2945,
          2
        ],
        [
          2943,
          1
        ]
      ],
      "expectedActivityThrough": 307
    },
    {
      "id": "hat-edmond-c-glider",
      "category": "Einstein-hat gliders and launchers",
      "title": "Hat glider C — Edmond rule",
      "summary": "A two-cell seed launches a compact Hat glider under James Edmond’s published C priority table. Verified through 311 generations with a dead boundary buffer; no immortality or first-discovery claim.",
      "tiling": "hat",
      "depth": 5,
      "neighborhood": "touch",
      "rule": "TABLE:HAT-C",
      "generations": 4,
      "borderRings": 1,
      "speed": 6,
      "view": {
        "mode": "contain",
        "padding": 4
      },
      "cellStates": [
        [
          7267,
          1
        ],
        [
          7283,
          2
        ]
      ],
      "expectedActivityThrough": 311
    },
    {
      "id": "hat-simple-glider",
      "category": "Einstein-hat gliders and launchers",
      "title": "Hat glider — three-state variant",
      "summary": "A derived three-state version of Edmond’s B rule reproduces the tested compact flights after relabelling. It differs on some other inputs; this is a finite reproduction, not a proof of endless travel.",
      "tiling": "hat",
      "depth": 5,
      "neighborhood": "touch",
      "rule": "TABLE:HAT-SIMPLE",
      "generations": 3,
      "borderRings": 1,
      "speed": 6,
      "view": {
        "mode": "contain",
        "padding": 4
      },
      "cellStates": [
        [
          2945,
          1
        ],
        [
          2943,
          2
        ]
      ],
      "expectedActivityThrough": 307
    },
    {
      "id": "hat-edmond-c-triple-launcher",
      "category": "Einstein-hat gliders and launchers",
      "title": "Hat triple launcher — two-cell seed",
      "summary": "Two cells under Edmond’s C rule emit three separated compact travellers. Their complete independent evolutions reproduce the whole configuration through generation 160, with no leftover debris. This is a finite launcher, not a repeating gun.",
      "tiling": "hat",
      "depth": 5,
      "neighborhood": "touch",
      "rule": "TABLE:HAT-C",
      "generations": 4,
      "borderRings": 1,
      "speed": 6,
      "view": {
        "mode": "contain",
        "padding": 4
      },
      "cellStates": [
        [
          23905,
          1
        ],
        [
          23907,
          2
        ]
      ],
      "expectedActivityThrough": 160
    },
    {
      "id": "penrose-b2-c5-five-launcher",
      "category": "Aperiodic travelling dynamics",
      "title": "Penrose five-traveller launcher",
      "summary": "Three live cells launch 5 separate compact 5-state travellers. Each emitted wave has a verified complete-state translated return with matching tile polygons and three surrounding neighbour rings; the demonstrated 240-generation traversal is finite.",
      "tiling": "penrose",
      "depth": 11,
      "penroseSeed": "sun",
      "neighborhood": "touch",
      "rule": "B2/S",
      "generations": 5,
      "borderRings": 0,
      "speed": 6,
      "view": {
        "mode": "contain",
        "padding": 4
      },
      "cellStates": [
        [
          120863,
          1
        ],
        [
          120865,
          1
        ],
        [
          120867,
          1
        ]
      ],
      "expectedActivityThrough": 240
    },
    {
      "id": "penrose-b2-c6-six-launcher",
      "category": "Aperiodic travelling dynamics",
      "title": "Penrose six-traveller launcher",
      "summary": "Three live cells launch 6 separate compact 6-state travellers. Each emitted wave has a verified complete-state translated return with matching tile polygons and three surrounding neighbour rings; the demonstrated 200-generation traversal is finite.",
      "tiling": "penrose",
      "depth": 11,
      "penroseSeed": "sun",
      "neighborhood": "touch",
      "rule": "B2/S",
      "generations": 6,
      "borderRings": 0,
      "speed": 6,
      "view": {
        "mode": "contain",
        "padding": 4
      },
      "cellStates": [
        [
          65275,
          1
        ],
        [
          65271,
          1
        ],
        [
          65274,
          1
        ]
      ],
      "expectedActivityThrough": 200
    },
    {
      id: 'square-block',
      category: 'Classic square Life',
      title: 'Block still life',
      summary: 'The four-cell block is unchanged after every update: an exact period-1 still life in Conway Life.',
      tiling: 'square', depth: 51, neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 2, view: INITIAL_VIEW,
      coordinateStates: rleStates('2o$2o!', -1, -1), expectedPeriod: 1,
    },
    {
      id: 'square-blinker',
      category: 'Classic square Life',
      title: 'Blinker — period 2',
      summary: 'The smallest Conway oscillator alternates between horizontal and vertical lines.',
      tiling: 'square', depth: 51, neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 4, view: INITIAL_VIEW,
      coordinateStates: rleStates('3o!', -1, 0), expectedPeriod: 2,
    },
    {
      id: 'square-pulsar',
      category: 'Classic square Life',
      title: 'Pulsar — period 3',
      summary: 'A symmetric 48-cell Conway oscillator with exact first-return period 3.',
      tiling: 'square', depth: 51, neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 5, view: INITIAL_VIEW,
      coordinateStates: rleStates(
        '2b3o3b3o$13b$o4bobo4bo$o4bobo4bo$o4bobo4bo$2b3o3b3o$13b$' +
        '2b3o3b3o$o4bobo4bo$o4bobo4bo$o4bobo4bo$13b$2b3o3b3o!',
        -6, -6,
      ),
      expectedPeriod: 3,
    },
    {
      id: 'square-pentadecathlon',
      category: 'Classic square Life',
      title: 'Pentadecathlon — period 15',
      summary: 'A compact Conway oscillator whose complete state first returns after 15 generations.',
      tiling: 'square', depth: 51, neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 12, view: INITIAL_VIEW,
      coordinateStates: rleStates('2bo4bo$2ob4ob2o$2bo4bo!', -5, -1),
      expectedPeriod: 15,
    },
    {
      id: 'square-glider',
      category: 'Classic square Life',
      title: 'Glider — diagonal spaceship',
      summary: 'The traditional Conway glider translates by one square in each axis every four generations.',
      tiling: 'square', depth: 51, neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 8,
      view: trajectoryView([-1.5, -1.5, 17.5, 17.5], 64),
      coordinateStates: rleStates('bo$2bo$3o!', -1, -1),
      expectedPeriod: 4, moving: true, translation: [1, 1],
    },
    {
      id: 'square-lwss',
      category: 'Classic square Life',
      title: 'Lightweight spaceship',
      summary: 'The nine-cell LWSS translates two squares horizontally every four Conway generations.',
      tiling: 'square', depth: 51, neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 8,
      view: trajectoryView([-22.5, -2.5, 2.5, 2.5], 40),
      coordinateStates: rleStates('bo2bo$o4b$o3bo$4o!', -2, -2),
      expectedPeriod: 4, moving: true, translation: [-2, 0],
    },
    {
      id: 'square-highlife-replicator',
      category: 'Classic square Life',
      title: 'HighLife replicator',
      summary: 'Under B36/S23 this 12-cell seed becomes two translated copies of itself after 12 generations.',
      tiling: 'square', depth: 101, neighborhood: 'touch', rule: 'B36/S23', generations: 2,
      borderRings: 1, speed: 6,
      view: trajectoryView([-11.5, -11.5, 11.5, 11.5], 48),
      coordinateStates: rleStates('2b3o$bobbo$o3bo$obbo$3o!', -2, -2),
      expectedReplication: { steps: 12, translations: [[-2, -2], [2, 2]] },
    },
    {
      id: 'square-diehard',
      category: 'Classic square Life',
      title: 'Diehard — extinction at 130',
      summary: 'A famous seven-cell Conway methuselah that vanishes exactly at generation 130.',
      tiling: 'square', depth: 101, neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 15,
      view: trajectoryView([-10.5, -5.5, 7.5, 17.5], 130),
      coordinateStates: rleStates('6bo$2o$bo3b3o!', -4, -1),
      expectedExtinction: 130,
    },
    {
      id: 'square-r-pentomino',
      category: 'Classic square Life',
      title: 'R-pentomino methuselah',
      summary: 'Five live cells generate a long, intricate Conway transient; this finite board is verified active through generation 1,103.',
      tiling: 'square', depth: 301, neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 100, view: CONTAIN_VIEW,
      coordinateStates: rleStates('b2o$2o$bo!', -1, -1),
      expectedActivityThrough: 1103,
    },
    {
      id: 'square-acorn',
      category: 'Classic square Life',
      title: 'Acorn methuselah',
      summary: 'Seven cells sustain a celebrated long Conway evolution; this finite board is verified active through generation 5,206.',
      tiling: 'square', depth: 301, neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 180, view: CONTAIN_VIEW,
      coordinateStates: rleStates('bo$3bo$2o2b3o!', -3, -1),
      expectedActivityThrough: 5206,
    },
    {
      id: 'hex-conway-p2',
      category: 'Hexagonal benchmarks',
      title: 'Hexagonal Conway p2',
      summary: 'A compact period-2 oscillator under B3/S23 on the six-neighbour honeycomb.',
      tiling: 'hex', depth: 32, neighborhood: 'edge', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 4, view: INITIAL_VIEW,
      coordinateStates: [[-1, 0, 1], [0, 0, 1], [0, 1, 1], [1, -1, 1]], expectedPeriod: 2,
    },
    {
      id: 'hex-conway-p3',
      category: 'Hexagonal benchmarks',
      title: 'Hexagonal Conway p3',
      summary: 'An isolated period-3 B3/S23 oscillator extracted from a deterministic hexagonal soup.',
      tiling: 'hex', depth: 32, neighborhood: 'edge', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 5, view: INITIAL_VIEW,
      coordinateStates: [
        [0, 0, 1], [0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 0, 1], [1, 4, 1],
        [2, 1, 1], [2, 3, 1], [3, 1, 1], [3, 3, 1], [3, 4, 1], [4, 1, 1], [4, 2, 1],
        [4, 4, 1], [5, 1, 1], [5, 3, 1], [6, 1, 1], [6, 2, 1],
      ],
      expectedPeriod: 3,
    },
    {
      id: 'hex-conway-p6',
      category: 'Hexagonal benchmarks',
      title: 'Hexagonal Conway p6',
      summary: 'A larger isolated B3/S23 honeycomb oscillator with exact period 6.',
      tiling: 'hex', depth: 32, neighborhood: 'edge', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 6, view: INITIAL_VIEW,
      coordinateStates: [
        [0, -2, 1], [0, -1, 1], [0, 0, 1], [1, -4, 1], [1, -3, 1], [1, -2, 1], [1, 0, 1],
        [2, -5, 1], [2, -1, 1], [3, -6, 1], [3, -4, 1], [3, -3, 1], [3, -2, 1],
        [4, -7, 1], [4, -6, 1], [4, -5, 1], [4, -4, 1], [5, -8, 1], [6, -9, 1], [6, -8, 1], [7, -9, 1],
      ],
      expectedPeriod: 6,
    },
    {
      id: 'hex-b2s35-p5-traveller',
      category: 'Hexagonal travellers',
      title: 'Hexagonal B2/S35 p5 traveller',
      summary: 'A 12-cell phase of the published B2/S35 hexagonal spaceship translates by one axial cell every five generations; the complete state return is exact.',
      tiling: 'hex', depth: 64, neighborhood: 'edge', rule: 'B2/S35', generations: 2,
      borderRings: 1, speed: 5,
      view: trajectoryView(
        [-5.196152210235596, -5.5, 33.77499008178711, 5.5],
        80,
      ),
      coordinateStates: [
        [-3, 2, 1], [-2, 1, 1], [-2, 3, 1], [-1, -2, 1], [-1, -1, 1], [0, 0, 1],
        [0, 3, 1], [1, -3, 1], [1, 1, 1], [2, -1, 1], [2, 0, 1], [3, -3, 1],
      ],
      expectedPeriod: 5,
      expectedPhasePopulations: [12, 17, 13, 10, 18, 12],
      moving: true,
      translation: [1, 0],
    },
    {
      id: 'hex-b245s3-p10-traveller',
      category: 'Hexagonal travellers',
      title: 'Hexagonal B245/S3 p10 traveller',
      summary: 'This nine-cell two-state spaceship translates by two axial cells every ten generations. Its exact recurrence and the use of every B245/S3 rule clause are verified.',
      tiling: 'hex', depth: 64, neighborhood: 'edge', rule: 'B245/S3', generations: 2,
      borderRings: 1, speed: 5,
      view: trajectoryView(
        [-4.330127239227295, -8.5, 40.70319366455078, 8.5],
        100,
      ),
      coordinateStates: [
        [-2, 2, 1], [-1, 0, 1], [0, -2, 1], [0, 1, 1], [0, 3, 1],
        [1, -1, 1], [2, 1, 1], [3, -3, 1], [3, -1, 1],
      ],
      expectedPeriod: 10,
      expectedPhasePopulations: [9, 13, 17, 18, 16, 17, 15, 16, 15, 11, 9],
      expectedRuleClauses: [
        { kind: 'birth', liveNeighbors: 2, count: 90, lastToGeneration: 10 },
        { kind: 'birth', liveNeighbors: 4, count: 32, lastToGeneration: 10 },
        { kind: 'birth', liveNeighbors: 5, count: 3, lastToGeneration: 4 },
        { kind: 'survival', liveNeighbors: 3, count: 22, lastToGeneration: 6 },
      ],
      moving: true,
      translation: [2, 0],
    },
    {
      id: 'hex-b235s146-c4-launcher-traveller',
      category: 'Hexagonal travellers',
      title: 'Hexagonal B235/S146 four-state launcher',
      summary: 'A twelve-cell seed uses three launch-only clauses before settling at generation 21 into an exact period-10 traveller that advances five axial cells per cycle.',
      tiling: 'hex', depth: 128, neighborhood: 'edge', rule: 'B235/S146', generations: 4,
      borderRings: 1, speed: 6,
      view: trajectoryView(
        [-171.4730224609375, -13, 10.392304420471191, 13],
        200,
      ),
      coordinateStates: [
        [-3, 2, 1], [-2, 1, 1], [-2, 3, 1], [-1, -2, 1], [-1, -1, 1], [0, 0, 1],
        [0, 3, 1], [1, -3, 1], [1, 1, 1], [2, -1, 1], [2, 0, 1], [3, -3, 1],
      ],
      expectedTravel: {
        steps: 200,
        minimumDisplacement: 168,
        minimumDirectionality: 0.95,
        maximumRadius: 22,
        minimumActive: 12,
        maximumActive: 53,
        minimumLive: 6,
        maximumLive: 26,
        minimumBoundaryDistance: 28,
        connectedThroughout: false,
        expectedRuleClauses: [
          { kind: 'birth', liveNeighbors: 2, count: 871, lastToGeneration: 200 },
          { kind: 'birth', liveNeighbors: 3, count: 370, lastToGeneration: 200 },
          { kind: 'birth', liveNeighbors: 5, count: 2, lastToGeneration: 2 },
          { kind: 'survival', liveNeighbors: 1, count: 727, lastToGeneration: 200 },
          { kind: 'survival', liveNeighbors: 4, count: 17, lastToGeneration: 10 },
          { kind: 'survival', liveNeighbors: 6, count: 2, lastToGeneration: 2 },
        ],
        translatedReturn: {
          fromGeneration: 21,
          toGeneration: 31,
          dx: -8.660254041353861,
          dy: 0,
          neighborhoodRadius: 3,
        },
        finalHash: [2599405182, 2572184891],
        finalCellStates: [
          [4021, 1], [4022, 1], [4023, 1], [4177, 1], [4178, 1], [4179, 3], [4180, 1],
          [4334, 1], [4335, 2], [4336, 2], [4337, 3], [4492, 1], [4493, 1], [4494, 2],
          [4499, 3], [4652, 1], [4653, 3], [4654, 3], [4813, 1], [4814, 1], [5141, 3],
        ],
      },
    },
    {
      id: 'hex-b235s134-c5-launcher-traveller',
      category: 'Hexagonal travellers',
      title: 'Hexagonal B235/S134 five-state launcher',
      summary: 'The same twelve-cell seed under a five-state rule uses seven essential B5 births, then condenses into an eight-to-ten-cell period-4 traveller at generation 58.',
      tiling: 'hex', depth: 128, neighborhood: 'edge', rule: 'B235/S134', generations: 5,
      borderRings: 1, speed: 6,
      view: trajectoryView(
        [-11.258330345153809, -14.5, 135.9659881591797, 14.5],
        200,
      ),
      coordinateStates: [
        [-3, 2, 1], [-2, 1, 1], [-2, 3, 1], [-1, -2, 1], [-1, -1, 1], [0, 0, 1],
        [0, 3, 1], [1, -3, 1], [1, 1, 1], [2, -1, 1], [2, 0, 1], [3, -3, 1],
      ],
      expectedTravel: {
        steps: 200,
        minimumDisplacement: 132,
        minimumDirectionality: 0.80,
        maximumRadius: 17.37,
        minimumActive: 8,
        maximumActive: 94,
        minimumLive: 3,
        maximumLive: 45,
        minimumBoundaryDistance: 50,
        connectedThroughout: false,
        expectedRuleClauses: [
          { kind: 'birth', liveNeighbors: 2, count: 465, lastToGeneration: 199 },
          { kind: 'birth', liveNeighbors: 3, count: 168, lastToGeneration: 200 },
          { kind: 'birth', liveNeighbors: 5, count: 7, lastToGeneration: 32 },
          { kind: 'survival', liveNeighbors: 1, count: 475, lastToGeneration: 200 },
          { kind: 'survival', liveNeighbors: 3, count: 402, lastToGeneration: 200 },
          { kind: 'survival', liveNeighbors: 4, count: 123, lastToGeneration: 197 },
        ],
        translatedReturn: {
          fromGeneration: 58,
          toGeneration: 62,
          dx: 3.4641016125679016,
          dy: 0,
          neighborhoodRadius: 3,
        },
        finalHash: [727694774, 2253692016],
        finalCellStates: [
          [41085, 3], [41268, 4], [41450, 1], [41451, 3], [41630, 3],
          [41631, 1], [41632, 1], [41810, 1], [41811, 1],
        ],
      },
    },
    {
      id: "penrose-edge-b23s23-p822",
      category: "Penrose oscillators",
      title: "Penrose compact oscillator — period 822",
      summary: "A 19-live-cell phase produces an exact period-822 oscillator on 46 Penrose rhombs. Thirty-nine tiles individually have period 822; this is not merely independent smaller oscillators combined.",
      tiling: "penrose",
      depth: 8,
      penroseSeed: "sun",
      neighborhood: "edge",
      rule: "B23/S23",
      generations: 2,
      borderRings: 1,
      speed: 40,
      view: trajectoryView([-8.057479858398438, -11.399187088012695, 0.5877852439880371, -4.736067771911621], 822, 2),
      cellStates: [[5116, 1], [5117, 1], [5118, 1], [5887, 1], [5888, 1], [5889, 1], [5892, 1], [5893, 1], [5909, 1], [5911, 1], [5922, 1], [5924, 1], [5925, 1], [5926, 1], [5932, 1], [5940, 1], [5947, 1], [5950, 1], [5952, 1]],
      expectedPeriod: 822,
    },
    {
      id: "penrose-conway-c3-p14",
      category: "Penrose oscillators",
      title: "Penrose three-state oscillator — period 14",
      summary: "Four live cells and two refractory cells form an exact period-14 oscillator under three-state B3/S23 on the Penrose touch graph.",
      tiling: "penrose",
      depth: 8,
      penroseSeed: "sun",
      neighborhood: "touch",
      rule: "B3/S23",
      generations: 3,
      borderRings: 1,
      speed: 7,
      view: trajectoryView([-3.077683448791504, 15.017220497131348, 2.489898204803467, 20.371322631835938], 14, 2),
      cellStates: [[1944, 1], [2003, 1], [2004, 1], [2007, 1], [2710, 2], [2747, 2]],
      expectedPeriod: 14,
    },
    {
      id: "hat-b2s1-c3-rotor-p39",
      category: "Einstein-hat rotating waves and clocks",
      title: "Hat rotating wave — period 39",
      summary: "A 3-state wave turns through 120 degrees every 13 generations and returns to exactly its original complete state after 39. It rotates about a fixed centre; it has no net translational drift.",
      tiling: "hat",
      depth: 4,
      neighborhood: "edge",
      rule: "B2/S1",
      generations: 3,
      borderRings: 1,
      speed: 8,
      view: trajectoryView([6.5000000134611735, 10.39230453190867, 22.25, 26.41377410681216], 39, 3),
      cellStates: [[2729, 1], [2731, 1], [3380, 1], [3395, 2], [3396, 1]],
      expectedPeriod: 39,
    },
    {
      id: "hat-b2s23-c6-rotor-p219",
      category: "Einstein-hat rotating waves and clocks",
      title: "Hat rotating wave — period 219",
      summary: "A 6-state wave turns through 120 degrees every 73 generations and returns to exactly its original complete state after 219. It rotates about a fixed centre; it has no net translational drift.",
      tiling: "hat",
      depth: 4,
      neighborhood: "edge",
      rule: "B2/S23",
      generations: 6,
      borderRings: 1,
      speed: 20,
      view: trajectoryView([-4.7499999865388265, -12.990381129407249, 35.75, 25.547748738000877], 219, 3),
      cellStates: [[1696, 5], [1701, 4], [3372, 1], [3373, 1], [3375, 1], [3389, 2], [3390, 1], [3401, 3]],
      expectedPeriod: 219,
    },
    {
      id: "hat-b2s13-c4-clock-p11",
      category: "Einstein-hat rotating waves and clocks",
      title: "Hat eight-tile refractory clock — period 11",
      summary: "A two-live-cell phase generates an exact period-11 clock on eight hat tiles under four-state B2/S13. The same phase has period 2C+3 for every tested state count C from 4 through 255.",
      tiling: "hat",
      depth: 4,
      neighborhood: "edge",
      rule: "B2/S13",
      generations: 4,
      borderRings: 1,
      speed: 5,
      view: trajectoryView([2.7500000134611735, -0.43301269800631337, 9.499999993269412, 7.361215684723538], 11, 3),
      cellStates: [[3519, 1], [3522, 1]],
      expectedPeriod: 11,
    },
    {
      id: "hat-directional-transient-83",
      category: "Einstein-hat transients",
      title: "Hat directional transient — extinction 83",
      summary: "A ten-cell phase launches a directional pulse under ten-state B2/S1. Its last live cell disappears at generation 75; the refractory wake is completely gone at generation 83. This finite transient is not a glider.",
      tiling: "hat",
      depth: 5,
      neighborhood: "touch",
      rule: "B2/S1",
      generations: 10,
      borderRings: 1,
      speed: 6,
      view: trajectoryView([-47, 33.341976165771484, 18.25, 92.66471862792969], 83, 3),
      cellStates: [[7788, 1], [7789, 1], [17211, 1], [17212, 1], [17296, 1], [17298, 1], [17301, 1], [17303, 1], [17305, 7], [17319, 1]],
      expectedExtinction: 83,
    },
    {
      id: "hex-conway-p4",
      category: "Hexagonal oscillators and rotors",
      title: "Hexagonal Conway p4 half-turn rotor",
      summary: "A 14-cell phase turns through 180 degrees after two generations and returns exactly after four under the six-neighbour B3/S23 rule.",
      tiling: "hex",
      depth: 32,
      neighborhood: "edge",
      rule: "B3/S23",
      generations: 2,
      borderRings: 1,
      speed: 4,
      coordinateStates: [
        [-1,-2,1], [0,-2,1], [1,-2,1], [-1,-1,1], [1,-1,1], [0,0,1],
        [1,0,1], [0,1,1], [1,2,1], [0,3,1], [2,3,1], [0,4,1],
        [1,4,1], [2,4,1],
      ],
      expectedPeriod: 4,
      view: trajectoryView([-4.330127239227295,-4,7.794228553771973,7], 4, 3),
    },
    {
      id: "hex-conway-p5",
      category: "Hexagonal oscillators and rotors",
      title: "Hexagonal Conway p5",
      summary: "A compact B3/S23 oscillator with 14–16 live cells and an exact five-generation cycle.",
      tiling: "hex",
      depth: 32,
      neighborhood: "edge",
      rule: "B3/S23",
      generations: 2,
      borderRings: 1,
      speed: 5,
      coordinateStates: [
        [3,-4,1], [2,-3,1], [3,-3,1], [1,-2,1], [0,-1,1], [1,-1,1],
        [1,0,1], [-2,1,1], [-2,2,1], [-2,3,1], [-1,3,1], [-1,4,1],
        [-2,5,1], [-1,5,1],
      ],
      expectedPeriod: 5,
      view: trajectoryView([-3.464101552963257,-7,3.464101552963257,8.5], 5, 3),
    },
    {
      id: "hex-conway-p8",
      category: "Hexagonal oscillators and rotors",
      title: "Hexagonal Conway p8",
      summary: "A period-8 B3/S23 oscillator: eight changing sites sit among 19 permanently live cells. Step through it to inspect the small moving parts.",
      tiling: "hex",
      depth: 32,
      neighborhood: "edge",
      rule: "B3/S23",
      generations: 2,
      borderRings: 1,
      speed: 5,
      coordinateStates: [
        [0,-2,1], [1,-2,1], [2,-2,1], [4,-2,1], [5,-2,1], [-1,-1,1],
        [2,-1,1], [3,-1,1], [5,-1,1], [-2,0,1], [-1,0,1], [1,0,1],
        [3,0,1], [4,0,1], [-3,1,1], [1,1,1], [-3,2,1], [0,2,1],
        [-3,3,1], [-1,3,1], [-3,4,1], [-2,4,1],
      ],
      expectedPeriod: 8,
      view: trajectoryView([-5.196152210235596,-4,8.66025447845459,7], 8, 3),
    },
    {
      id: "hex-b34s234-p269",
      category: "Hexagonal oscillators and rotors",
      title: "Hexagonal p269 clock",
      summary: "A B34/S234 oscillator cycles through 269 distinct complete states within a 53-cell footprint; 29 individual cells share the full period.",
      tiling: "hex",
      depth: 32,
      neighborhood: "edge",
      rule: "B34/S234",
      generations: 2,
      borderRings: 1,
      speed: 30,
      coordinateStates: [
        [3,-4,1], [4,-4,1], [5,-4,1], [2,-3,1], [5,-3,1], [1,-2,1],
        [4,-2,1], [5,-2,1], [0,-1,1], [5,-1,1], [-1,0,1], [4,0,1],
        [-2,1,1], [3,1,1], [-3,2,1], [2,2,1], [-4,3,1], [1,3,1],
        [-5,4,1], [0,4,1], [-5,5,1], [-4,5,1], [-3,5,1], [-2,5,1],
        [-1,5,1],
      ],
      expectedPeriod: 269,
      view: trajectoryView([-6.062177658081055,-7,8.66025447845459,8.5], 269, 3),
    },
    {
      id: "hex-b245s35-p25-traveller",
      category: "Hexagonal travellers",
      title: "Hexagonal p25 diagonal spaceship",
      summary: "An exact B245/S35 spaceship: its complete state shifts by axial (1,1) every 25 generations, with 9–24 live cells during the cycle.",
      tiling: "hex",
      depth: 128,
      neighborhood: "edge",
      rule: "B245/S35",
      generations: 2,
      borderRings: 1,
      speed: 8,
      coordinateStates: [
        [-2,2,1], [0,1,1], [0,3,1], [1,0,1], [1,3,1], [2,-2,1],
        [2,2,1], [3,0,1], [3,1,1],
      ],
      expectedPeriod: 25,
      moving: true,
      translation: [1,1],
      view: trajectoryView([-4.330127239227295,-5.5,23.382686614990234,16], 150, 3),
    },
    {
      id: "hex-b2s34-p48-rotor",
      category: "Hexagonal oscillators and rotors",
      title: "Hexagonal p48 half-turn rotor",
      summary: "Six live cells expand and rearrange into a half-turn after 24 generations, returning exactly after 48. The cycle has 6–16 live cells.",
      tiling: "hex",
      depth: 32,
      neighborhood: "edge",
      rule: "B2/S34",
      generations: 2,
      borderRings: 1,
      speed: 8,
      coordinateStates: [
        [-2,1,1], [-2,2,1], [0,0,1], [0,1,1], [1,0,1], [3,-1,1],
      ],
      expectedPeriod: 48,
      view: trajectoryView([-6.062177658081055,-8.5,12.12435531616211,7], 48, 3),
    },
    {
      id: "hex-b245s3-p57-pulsator",
      category: "Hexagonal oscillators and rotors",
      title: "Hexagonal p57 pulsator",
      summary: "Nine live cells expand into a 99-cell phase and contract back to the exact starting state after 57 generations.",
      tiling: "hex",
      depth: 32,
      neighborhood: "edge",
      rule: "B245/S3",
      generations: 2,
      borderRings: 1,
      speed: 10,
      coordinateStates: [
        [-2,2,1], [-1,0,1], [-1,3,1], [0,-1,1], [0,3,1], [2,-2,1],
        [2,2,1], [3,-1,1], [3,0,1],
      ],
      expectedPeriod: 57,
      view: trajectoryView([-13.856406211853027,-16,17.32050895690918,16], 57, 3),
    },
    {
      id: "hex-b24s3-p128-rotor",
      category: "Hexagonal oscillators and rotors",
      title: "Hexagonal p128 half-turn rotor",
      summary: "A nine-cell phase grows and rearranges into a half-turn after 64 generations; the complete state first returns after 128.",
      tiling: "hex",
      depth: 32,
      neighborhood: "edge",
      rule: "B24/S3",
      generations: 2,
      borderRings: 1,
      speed: 16,
      coordinateStates: [
        [-3,1,1], [-3,4,1], [-2,2,1], [0,0,1], [1,-3,1], [1,3,1],
        [2,-2,1], [3,1,1], [4,-3,1],
      ],
      expectedPeriod: 128,
      view: trajectoryView([-12.990381240844727,-10,10.392304420471191,8.5], 128, 3),
    },
    {
      id: "hex-b234s3-p4104",
      category: "Hexagonal oscillators and rotors",
      title: "Hexagonal p4104 long clock",
      summary: "Only 50 sites ever become live, yet the complete B234/S3 state takes 4,104 generations to return. Twenty-six individual cells have the full period; this is not a collection of independent shorter clocks.",
      tiling: "hex",
      depth: 32,
      neighborhood: "edge",
      rule: "B234/S3",
      generations: 2,
      borderRings: 1,
      speed: 180,
      coordinateStates: [
        [-4,0,1], [-4,2,1], [-4,4,1], [-3,2,1], [-2,-2,1], [-2,4,1],
        [0,-4,1], [0,2,1], [2,-4,1], [2,0,1], [4,-4,1], [4,-2,1],
      ],
      expectedPeriod: 4104,
      view: trajectoryView([-7.794228553771973,-7,6.062177658081055,7], 4104, 3),
    },
    {
      id: "hex-b2s3456-c7-p372-rotor",
      category: "Hexagonal oscillators and rotors",
      title: "Hexagonal p372 sixfold rotor",
      summary: "Seven-state B2/S3456 activity rotates around a live core: the complete labelled state turns 60 degrees every 62 generations and returns after 372.",
      tiling: "hex",
      depth: 32,
      neighborhood: "edge",
      rule: "B2/S3456",
      generations: 7,
      borderRings: 1,
      speed: 30,
      coordinateStates: [
        [-1,1,4], [-1,2,3], [0,-1,4], [0,0,1], [0,1,1], [0,2,1],
        [1,-2,6], [1,-1,1], [1,0,1], [1,1,1], [2,-1,1], [2,0,1],
      ],
      expectedPeriod: 372,
      view: trajectoryView([-4.330127239227295,-5.5,7.794228553771973,5.5], 372, 3),
    },
    {
      id: "hex-b24s16-c3-p248-breather",
      category: "Hexagonal oscillators and rotors",
      title: "Hexagonal p248 giant breather",
      summary: "A tiny 13-cell phase expands to 209 live or refractory cells across a 1,281-site footprint, then contracts. It makes a half-turn after 124 generations and returns after 248.",
      tiling: "hex",
      depth: 64,
      neighborhood: "edge",
      rule: "B24/S16",
      generations: 3,
      borderRings: 1,
      speed: 20,
      coordinateStates: [
        [-3,1,2], [-3,3,1], [-3,4,1], [-2,3,1], [-1,0,1], [-1,1,1],
        [0,-1,1], [0,0,2], [1,-3,2], [1,-1,1], [3,-3,1], [3,-2,1],
        [4,-3,1],
      ],
      expectedPeriod: 248,
      view: trajectoryView([-50.22947311401367,-41.5,34.64101791381836,32.5], 248, 3),
    },
    {
      id: "hex-b23s13-c5-p138-traveller",
      category: "Hexagonal travellers",
      title: "Hexagonal p138 wandering spaceship",
      summary: "This five-state spaceship makes a wide excursion before returning with an axial (0,-8) shift after 138 generations. Every refractory cell is included in the exact recurrence.",
      tiling: "hex",
      depth: 128,
      neighborhood: "edge",
      rule: "B23/S13",
      generations: 5,
      borderRings: 1,
      speed: 20,
      coordinateStates: [
        [-2,-3,4], [-1,-2,4], [-1,5,4], [0,-3,4], [0,-2,1], [0,-1,1],
        [0,0,1], [0,1,1], [0,3,2], [1,-3,2], [1,-2,4], [1,-1,3],
        [1,0,1], [1,1,4], [1,3,3], [2,-4,1], [2,-3,2], [2,-2,1],
        [2,-1,4], [2,1,1], [2,2,3], [2,3,2], [3,-3,1], [3,0,1],
        [3,1,1], [3,2,1],
      ],
      expectedPeriod: 138,
      moving: true,
      translation: [0,-8],
      view: trajectoryView([-28.578838348388672,-55,58.02370071411133,13], 276, 3),
    },
    {
      id: "hex-b234s13-c4-p23-traveller",
      category: "Hexagonal travellers",
      title: "Hexagonal p23 fast spaceship",
      summary: "A four-state spaceship shifts by axial (10,-5) every 23 generations; its complete live and refractory state repeats exactly.",
      tiling: "hex",
      depth: 128,
      neighborhood: "edge",
      rule: "B234/S13",
      generations: 4,
      borderRings: 1,
      speed: 10,
      coordinateStates: [
        [-3,1,1], [-3,4,1], [-2,0,1], [-2,1,1], [-2,2,3], [-2,3,1],
        [-2,4,1], [-1,0,2], [-1,1,1], [-1,2,1], [-1,3,2], [0,1,3],
        [1,-2,3], [1,-1,2], [1,0,2], [1,1,2], [1,2,2], [1,3,3],
        [2,-3,1], [2,-2,1], [2,-1,3], [2,0,1], [2,1,3], [2,2,1],
        [2,3,1], [3,-3,1], [3,-2,1], [3,1,1], [3,2,1],
      ],
      expectedPeriod: 23,
      moving: true,
      translation: [10,-5],
      view: trajectoryView([-6.062177658081055,-52,85.73651123046875,8.5], 138, 3),
    },
    {
      id: "hex-b246s246-c4-p30-gun",
      category: "Hexagonal guns, puffers and replication",
      title: "Hexagonal three-way spaceship gun",
      summary: "A 12-live-cell seed rebuilds its core every 30 generations while emitting three period-3 spaceships in different directions. Published by confocaloid; ships eventually reach this finite board's edge.",
      tiling: "hex",
      depth: 128,
      neighborhood: "edge",
      rule: "B246/S246",
      generations: 4,
      borderRings: 1,
      speed: 12,
      coordinateStates: [
        [-1,1,1], [-1,2,1], [0,0,1], [0,1,1], [0,2,1], [1,-1,1],
        [1,0,1], [1,1,1], [1,2,1], [2,-1,1], [2,0,1], [2,1,1],
      ],
      expectedActivityThrough: 120,
      view: trajectoryView([-104.78907012939453,-61,108.253173828125,124], 120, 3),
    },
    {
      id: "hex-b25s34-p20-puffer",
      category: "Hexagonal guns, puffers and replication",
      title: "Hexagonal oscillator-trail puffer",
      summary: "The engine advances ten axial cells every 20 generations and leaves a period-2 oscillator behind. Published by Naszvadi, with an earlier pattern noted by Dmitry Maitak. The finite board eventually ends the trail.",
      tiling: "hex",
      depth: 128,
      neighborhood: "edge",
      rule: "B25/S34",
      generations: 2,
      borderRings: 1,
      speed: 10,
      coordinateStates: [
        [-3,2,1], [-3,3,1], [-3,5,1], [-2,0,1], [-2,4,1], [-2,6,1],
        [-1,0,1], [-1,6,1], [0,-2,1], [0,-1,1], [0,1,1], [0,3,1],
        [0,5,1], [0,6,1], [1,3,1], [1,4,1], [1,5,1], [2,-5,1],
        [2,-3,1], [2,5,1], [3,-3,1], [3,1,1], [3,3,1],
      ],
      expectedActivityThrough: 160,
      view: trajectoryView([-6.062177658081055,-8.5,77.9422836303711,130], 160, 3),
    },
    {
      id: "hex-b2s1-c3-p999-rotor",
      category: "Hexagonal oscillators and rotors",
      title: "Hexagonal p999 threefold rotor",
      summary: "A three-state rotating wave first returns after 999 generations, making a 120-degree turn every 333. Published by c0b0p0; all refractory states are part of the rotation.",
      tiling: "hex",
      depth: 64,
      neighborhood: "edge",
      rule: "B2/S1",
      generations: 3,
      borderRings: 1,
      speed: 60,
      coordinateStates: [
        [-8,7,2], [-7,6,1], [-6,5,1], [-6,6,2], [-6,7,2], [-6,8,1],
        [-5,4,2], [-5,6,2], [-5,8,2], [-5,10,2], [-4,3,1], [-4,6,1],
        [-4,7,2], [-4,8,2], [-4,9,1], [-3,1,1], [-3,2,1], [-3,3,1],
        [-3,4,1], [-3,8,1], [-2,-1,1], [-2,0,2], [-2,1,1], [-2,3,1],
        [-2,4,1], [-2,7,2], [-1,-1,1], [-1,4,2], [0,-7,2], [0,-6,1],
        [0,-5,1], [0,-4,2], [1,-6,2], [1,-1,1], [1,0,2], [1,1,2],
        [1,2,1], [2,-7,2], [2,-6,2], [2,-1,1], [2,0,1], [2,1,1],
        [3,-8,1], [3,-6,1], [3,-3,1], [3,-2,1], [4,-8,2], [4,-7,2],
        [4,-5,1], [4,-4,2], [4,-3,2], [4,-2,1], [4,4,2], [4,6,2],
        [5,-8,2], [5,-7,2], [5,-5,1], [6,-10,2], [6,-8,2], [6,-7,2],
        [6,-5,1], [6,-2,1], [6,4,2], [7,-7,1], [7,-6,1], [7,-3,1],
        [7,-2,1], [8,-6,2], [9,-7,1], [9,-6,1],
      ],
      expectedPeriod: 999,
      view: trajectoryView([-26.84678840637207,-40,46.76537322998047,32.5], 999, 3),
    },
    {
      id: "hex-b23s4-p13-traveller",
      category: "Hexagonal travellers",
      title: "Hexagonal p13 diagonal spaceship",
      summary: "John Cerkan's B23/S4 spaceship returns exactly with axial shift (1,1) every 13 generations, using at most 15 live cells.",
      tiling: "hex",
      depth: 128,
      neighborhood: "edge",
      rule: "B23/S4",
      generations: 2,
      borderRings: 1,
      speed: 8,
      coordinateStates: [
        [-2,2,1], [-1,2,1], [0,2,1], [0,3,1], [1,1,1], [2,-2,1],
        [2,-1,1], [2,0,1], [3,0,1],
      ],
      expectedPeriod: 13,
      moving: true,
      translation: [1,1],
      view: trajectoryView([-4.330127239227295,-4,32.908966064453125,20.5], 130, 3),
    },
    {
      id: "hex-b2s1-c3-p158-traveller",
      category: "Hexagonal travellers",
      title: "Hexagonal p158 wandering spaceship",
      summary: "Published by c0b0p0: this three-state spaceship changes shape dramatically and doubles back locally, then repeats its complete state shifted by axial (-11,22) after 158 generations.",
      tiling: "hex",
      depth: 128,
      neighborhood: "edge",
      rule: "B2/S1",
      generations: 3,
      borderRings: 1,
      speed: 20,
      coordinateStates: [
        [-2,3,1], [-2,4,1], [-1,1,1], [-1,2,2], [-1,4,1], [-1,5,1],
        [0,-4,1], [0,-3,1], [0,1,1], [0,4,1], [1,-4,2], [2,-4,2],
        [2,-3,1], [2,-2,1], [2,-1,2], [2,0,2], [2,1,2], [2,2,1],
        [3,-5,1], [3,-4,1], [3,-2,1], [3,-1,1], [3,0,1], [3,1,1],
      ],
      expectedPeriod: 158,
      moving: true,
      translation: [-11,22],
      view: trajectoryView([-38.97114181518555,-19,29.44486427307129,79], 316, 3),
    },
    {
      id: "hex-b2s34-wall-repair",
      category: "Hexagonal constructions",
      title: "Hexagonal self-repairing wall",
      summary: "Dean Hickerson's oscillating wall repairs one missing cell. Its damaged evolution rejoins the pristine period-5 wall exactly at generation 44, after the exterior debris has disappeared.",
      tiling: "hex",
      depth: 64,
      neighborhood: "edge",
      rule: "B2/S34",
      generations: 2,
      borderRings: 1,
      speed: 8,
      coordinateStates: [
        [-21,10,1], [-21,11,1], [-20,10,1], [-19,9,1], [-19,10,1], [-18,9,1],
        [-17,8,1], [-17,9,1], [-16,8,1], [-15,7,1], [-15,8,1], [-14,7,1],
        [-13,6,1], [-13,7,1], [-12,6,1], [-11,5,1], [-11,6,1], [-10,5,1],
        [-9,4,1], [-9,5,1], [-8,4,1], [-7,3,1], [-7,4,1], [-6,3,1],
        [-5,2,1], [-5,3,1], [-4,2,1], [-3,1,1], [-3,2,1], [-2,1,1],
        [-1,0,1], [-1,1,1], [1,-1,1], [1,0,1], [2,-1,1], [3,-2,1],
        [3,-1,1], [4,-2,1], [5,-3,1], [5,-2,1], [6,-3,1], [7,-4,1],
        [7,-3,1], [8,-4,1], [9,-5,1], [9,-4,1], [10,-5,1], [11,-6,1],
        [11,-5,1], [12,-6,1], [13,-7,1], [13,-6,1], [14,-7,1], [15,-8,1],
        [15,-7,1], [16,-8,1], [17,-9,1], [17,-8,1], [18,-9,1], [19,-10,1],
        [19,-9,1], [20,-10,1], [21,-11,1], [21,-10,1],
      ],
      expectedPeriod: 5,
      expectedTransient: 44,
      view: trajectoryView([-30.310888290405273,-19,30.310888290405273,19], 49, 3),
    },
    {
      id: "hex-b2s34-p2044-billiard",
      category: "Hexagonal constructions",
      title: "Hexagonal p2044 billiard table",
      summary: "Dean Hickerson's narrow B2/S34 enclosure contains a bouncing, branching signal with exact period 2,044. The construction illustrates an XOR-like one-dimensional evolution inside a hexagonal board.",
      tiling: "hex",
      depth: 64,
      neighborhood: "edge",
      rule: "B2/S34",
      generations: 2,
      borderRings: 1,
      speed: 100,
      coordinateStates: [
        [-14,-7,1], [-13,-7,1], [-12,-9,1], [-12,-8,1], [-12,-7,1], [-12,-6,1],
        [-11,-12,1], [-11,-11,1], [-11,-10,1], [-11,-9,1], [-11,-7,1], [-11,-6,1],
        [-11,-5,1], [-10,-11,1], [-10,-6,1], [-10,-5,1], [-10,-4,1], [-9,-12,1],
        [-9,-11,1], [-9,-5,1], [-9,-4,1], [-9,-3,1], [-8,-12,1], [-8,-7,1],
        [-8,-4,1], [-8,-3,1], [-8,-2,1], [-7,-13,1], [-7,-12,1], [-7,-11,1],
        [-7,-8,1], [-7,-3,1], [-7,-2,1], [-7,-1,1], [-6,-14,1], [-6,-12,1],
        [-6,-11,1], [-6,-10,1], [-6,-2,1], [-6,-1,1], [-6,0,1], [-5,-11,1],
        [-5,-10,1], [-5,-9,1], [-5,-1,1], [-5,0,1], [-5,1,1], [-4,-10,1],
        [-4,-9,1], [-4,-8,1], [-4,0,1], [-4,1,1], [-4,2,1], [-3,-9,1],
        [-3,-8,1], [-3,-7,1], [-3,1,1], [-3,2,1], [-3,3,1], [-2,-8,1],
        [-2,-7,1], [-2,-6,1], [-2,2,1], [-2,3,1], [-2,4,1], [-1,-7,1],
        [-1,-6,1], [-1,-5,1], [-1,3,1], [-1,4,1], [-1,5,1], [0,-6,1],
        [0,-5,1], [0,-4,1], [0,4,1], [0,5,1], [0,6,1], [1,-5,1],
        [1,-4,1], [1,-3,1], [1,5,1], [1,6,1], [1,7,1], [2,-4,1],
        [2,-3,1], [2,-2,1], [2,6,1], [2,7,1], [2,8,1], [3,-3,1],
        [3,-2,1], [3,-1,1], [3,7,1], [3,8,1], [3,9,1], [4,-2,1],
        [4,-1,1], [4,0,1], [4,8,1], [4,9,1], [4,10,1], [5,-1,1],
        [5,0,1], [5,1,1], [5,9,1], [5,10,1], [5,11,1], [6,0,1],
        [6,1,1], [6,2,1], [6,10,1], [6,11,1], [6,12,1], [6,14,1],
        [7,1,1], [7,2,1], [7,3,1], [7,11,1], [7,12,1], [7,13,1],
        [8,2,1], [8,3,1], [8,4,1], [8,12,1], [9,3,1], [9,4,1],
        [9,5,1], [9,11,1], [9,12,1], [10,4,1], [10,5,1], [10,6,1],
        [10,11,1], [11,5,1], [11,6,1], [11,7,1], [11,9,1], [11,10,1],
        [11,11,1], [11,12,1], [12,6,1], [12,7,1], [12,8,1], [12,9,1],
        [13,7,1], [14,7,1],
      ],
      expectedPeriod: 2044,
      view: trajectoryView([-31.17691421508789,-22,31.17691421508789,22], 2044, 3),
    },
    {
      id: "hex-parity-seven-copy",
      category: "Hexagonal guns, puffers and replication",
      title: "Hexagonal seven-copy replicator",
      summary: "Three live cells become seven exact separated copies after eight generations: one central copy and six around it. B135/S0246 is an XOR rule; the same seven-copy relation holds at larger powers of two.",
      tiling: "hex",
      depth: 128,
      neighborhood: "edge",
      rule: "B135/S0246",
      generations: 2,
      borderRings: 1,
      speed: 6,
      coordinateStates: [
        [-1,0,1], [0,0,1], [-1,2,1],
      ],
      expectedReplication: {"steps": 8,"translations": [[0,0],[8,0],[0,8],[-8,8],[-8,0],[0,-8],[8,-8]]},
      view: trajectoryView([-58.02370071411133,-49,56.29165267944336,52], 32, 3),
    },
    {
      id: 'penrose-conway-p4',
      category: 'Penrose Conway oscillators',
      title: 'Penrose Conway p4',
      summary: 'An isolated eleven-cell phase of a period-4 oscillator on the Penrose touch graph.',
      tiling: 'penrose', depth: 8, penroseSeed: 'sun', neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 4, view: INITIAL_VIEW,
      cellStates: [[4316, 1], [4319, 1], [4321, 1], [4326, 1], [4327, 1], [5095, 1], [5098, 1], [5101, 1], [5102, 1], [5107, 1], [5108, 1]],
      expectedPeriod: 4,
    },
    {
      id: 'penrose-conway-p5',
      category: 'Penrose Conway oscillators',
      title: 'Penrose Conway p5',
      summary: 'A compact eight-cell phase of an isolated period-5 oscillator on the Penrose touch graph.',
      tiling: 'penrose', depth: 8, penroseSeed: 'sun', neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 5, view: INITIAL_VIEW,
      cellStates: [[376, 1], [433, 1], [1070, 1], [1116, 1], [1120, 1], [1127, 1], [1225, 1], [1228, 1]],
      expectedPeriod: 5,
    },
    {
      id: 'penrose-conway-p7',
      category: 'Penrose Conway oscillators',
      title: 'Penrose Conway p7',
      summary: 'An isolated period-7 oscillator under ordinary B3/S23 with edge-or-corner adjacency.',
      tiling: 'penrose', depth: 8, penroseSeed: 'sun', neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 5, view: INITIAL_VIEW,
      cellStates: [[5545, 1], [5546, 1], [5549, 1], [6188, 1], [6189, 1], [6200, 1], [6216, 1], [6225, 1], [6226, 1], [6227, 1], [6230, 1]],
      expectedPeriod: 7,
    },
    {
      id: 'penrose-conway-p12',
      category: 'Penrose Conway oscillators',
      title: 'Penrose Conway p12',
      summary: 'A six-live-cell phase of an isolated period-12 oscillator on the Penrose touch graph.',
      tiling: 'penrose', depth: 8, penroseSeed: 'sun', neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 6, view: INITIAL_VIEW,
      cellStates: [[3566, 1], [3596, 1], [3600, 1], [3607, 1], [3608, 1], [3609, 1]],
      expectedPeriod: 12,
    },
    {
      id: 'penrose-edge-conway-p4',
      category: 'Penrose Conway oscillators',
      title: 'Penrose edge-graph p4',
      summary: 'A distinct period-4 Conway oscillator using shared-edge rather than corner-contact adjacency.',
      tiling: 'penrose', depth: 8, penroseSeed: 'sun', neighborhood: 'edge', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 4, view: INITIAL_VIEW,
      cellStates: [[1135, 1], [1136, 1], [1137, 1], [1141, 1], [1157, 1], [1171, 1], [1176, 1], [1177, 1], [1178, 1], [1179, 1], [1192, 1], [1194, 1], [1195, 1], [1199, 1], [1200, 1], [1201, 1], [1203, 1], [1917, 1], [1919, 1], [1922, 1], [1975, 1], [1976, 1], [1977, 1]],
      expectedPeriod: 4,
    },
    {
      id: 'hat-conway-p6',
      category: 'Einstein-hat Conway oscillators',
      title: 'Hat Conway p6',
      summary: 'An isolated period-6 Conway oscillator on the Einstein-hat edge-or-corner graph.',
      tiling: 'hat', depth: 4, neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 6, view: INITIAL_VIEW,
      cellStates: [[3261, 1], [3264, 1], [3285, 1], [3287, 1], [3289, 1], [3358, 1], [3359, 1], [3362, 1], [3547, 1], [3548, 1], [3549, 1]],
      expectedPeriod: 6,
    },
    {
      id: 'hat-conway-p9',
      category: 'Einstein-hat Conway oscillators',
      title: 'Hat Conway p9',
      summary: 'A compact isolated period-9 Conway oscillator on the hat touch graph.',
      tiling: 'hat', depth: 4, neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 6, view: INITIAL_VIEW,
      cellStates: [[1509, 1], [1595, 1], [1596, 1], [1600, 1], [1602, 1], [3444, 1], [3448, 1], [3449, 1]],
      expectedPeriod: 9,
    },
    {
      id: 'hat-conway-p26',
      category: 'Einstein-hat Conway oscillators',
      title: 'Hat Conway p26',
      summary: 'A compact isolated period-26 Conway oscillator on the Einstein-hat touch graph.',
      tiling: 'hat', depth: 4, neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 8, view: INITIAL_VIEW,
      cellStates: [[3468, 1], [3469, 1], [3470, 1], [3473, 1], [3475, 1], [3480, 1], [3485, 1], [3486, 1], [3487, 1], [3488, 1]],
      expectedPeriod: 26,
    },
    {
      id: 'hat-edge-conway-p15',
      category: 'Einstein-hat Conway oscillators',
      title: 'Hat edge-graph p15',
      summary: 'A period-15 Conway oscillator on the shared-edge hat graph.',
      tiling: 'hat', depth: 4, neighborhood: 'edge', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 10, view: INITIAL_VIEW,
      cellStates: [[2899, 1], [2907, 1], [2908, 1], [2909, 1], [2910, 1], [2914, 1], [2915, 1], [2940, 1], [7297, 1], [7298, 1], [7299, 1], [7301, 1], [7302, 1], [7315, 1], [7319, 1], [7322, 1], [7325, 1], [7326, 1], [7327, 1], [7335, 1], [7337, 1], [7340, 1], [7403, 1], [7406, 1], [7416, 1], [7417, 1]],
      expectedPeriod: 15,
    },
    {
      id: 'hat-seeds-p8',
      category: 'Alternative-rule aperiodic oscillators',
      title: 'Hat Seeds p8',
      summary: 'Only four live cells are needed for this isolated period-8 oscillator under B2/S on the shared-edge hat graph.',
      tiling: 'hat', depth: 4, neighborhood: 'edge', rule: 'B2/S', generations: 2,
      borderRings: 1, speed: 8, view: INITIAL_VIEW,
      cellStates: [[2484, 1], [2492, 1], [2493, 1], [2498, 1]], expectedPeriod: 8,
    },
    {
      id: 'hat-b23-p20',
      category: 'Alternative-rule aperiodic oscillators',
      title: 'Hat B23/S p20',
      summary: 'A thirteen-cell phase of an isolated period-20 oscillator under B23/S with shared-edge adjacency.',
      tiling: 'hat', depth: 4, neighborhood: 'edge', rule: 'B23/S', generations: 2,
      borderRings: 1, speed: 12, view: INITIAL_VIEW,
      cellStates: [[1102, 1], [1112, 1], [1115, 1], [1129, 1], [1130, 1], [1134, 1], [1139, 1], [2612, 1], [2616, 1], [3197, 1], [3209, 1], [3222, 1], [3257, 1]],
      expectedPeriod: 20,
    },
    {
      id: 'hat-b23-p24',
      category: 'Alternative-rule aperiodic oscillators',
      title: 'Hat B23/S p24',
      summary: 'A particularly compact eight-cell phase of an isolated period-24 shared-edge oscillator.',
      tiling: 'hat', depth: 4, neighborhood: 'edge', rule: 'B23/S', generations: 2,
      borderRings: 1, speed: 14, view: INITIAL_VIEW,
      cellStates: [[2641, 1], [2643, 1], [2649, 1], [2703, 1], [2715, 1], [2733, 1], [2818, 1], [3302, 1]],
      expectedPeriod: 24,
    },
    {
      id: 'hat-b23-p28',
      category: 'Alternative-rule aperiodic oscillators',
      title: 'Hat B23/S p28',
      summary: 'A localised B23/S shared-edge oscillator with an exact first return after 28 generations.',
      tiling: 'hat', depth: 4, neighborhood: 'edge', rule: 'B23/S', generations: 2,
      borderRings: 1, speed: 14, view: INITIAL_VIEW,
      cellStates: [[634, 1], [636, 1], [639, 1], [641, 1], [642, 1], [644, 1], [659, 1], [673, 1], [4451, 1], [4538, 1], [4539, 1], [4540, 1], [4650, 1], [4663, 1], [4664, 1], [4665, 1], [4667, 1], [4668, 1]],
      expectedPeriod: 28,
    },
    {
      id: 'penrose-b2-c4-compact-traveller',
      category: 'Aperiodic travelling dynamics',
      title: 'Penrose compact traveller',
      summary: 'A seven-cell phase of a compact four-state B2/S wave follows a narrow track for more than 193 tile-edge units in 220 generations; the claim is a verified finite traversal, not proof of motion forever.',
      tiling: 'penrose', depth: 10, penroseSeed: 'sun', neighborhood: 'touch', rule: 'B2/S', generations: 4,
      borderRings: 0, speed: 10,
      view: trajectoryView(
        [-103.93494415283203, 13.20820426940918, 92.43650817871094, 17.135255813598633],
        220,
      ),
      cellStates: [[5, 1], [11, 1], [12, 3], [20, 2], [21, 1], [23, 2], [27, 2]],
      expectedTravel: {
        steps: 220,
        minimumDisplacement: 193,
        maximumRadius: 2.01,
        minimumActive: 7,
        maximumActive: 11,
        minimumBoundaryDistance: 9,
        translatedReturn: {
          fromGeneration: 102,
          toGeneration: 164,
          dx: -55.22679090499878,
          dy: 0,
          neighborhoodRadius: 3,
        },
        finalHash: [2716353629, 1431658492],
        finalCellStates: [[28513, 3], [28514, 2], [28515, 2], [28518, 1], [28925, 1], [28926, 3], [28927, 1], [28930, 1]],
      },
    },
    {
      id: 'penrose-b2-c5-compact-traveller',
      category: 'Aperiodic travelling dynamics',
      title: 'Penrose five-state traveller',
      summary: 'An eleven-cell phase of the five-state B2/S traveller carries a longer refractory wake along the same Penrose propagation family, moving more than 192 tile-edge units in 220 generations; this is a verified finite traversal, not proof of perpetual motion.',
      tiling: 'penrose', depth: 10, penroseSeed: 'sun', neighborhood: 'touch', rule: 'B2/S', generations: 5,
      borderRings: 0, speed: 8,
      view: trajectoryView(
        [-35.670875549316406, -95.5754623413086, 27.61339569091797, 91.64840698242188],
        220,
      ),
      cellStates: [[17168, 2], [17169, 2], [17172, 2], [17173, 1], [17174, 1], [17185, 1], [17187, 1], [17219, 4], [17220, 3], [17221, 3], [17228, 4]],
      expectedTravel: {
        steps: 220,
        minimumDisplacement: 192,
        maximumRadius: 2.34,
        minimumActive: 11,
        maximumActive: 14,
        minimumBoundaryDistance: 12,
        translatedReturn: {
          fromGeneration: 59,
          toGeneration: 161,
          dx: 27.61339521408081,
          dy: -84.98529226129705,
          neighborhoodRadius: 3,
        },
        finalHash: [1804692515, 504227277],
        finalCellStates: [[44427, 4], [44428, 4], [44457, 1], [44461, 1], [44476, 2], [44478, 2], [44479, 3], [44480, 3], [44486, 1], [44487, 3], [44488, 2], [44489, 2]],
      },
    },
    {
      id: 'penrose-b2-c6-compact-traveller',
      category: 'Aperiodic travelling dynamics',
      title: 'Penrose six-state traveller',
      summary: 'A fourteen-cell phase of the six-state B2/S traveller remains compact and connected while its longer refractory wake advances more than 192 tile-edge units in 220 generations; this is a verified finite traversal, not proof of perpetual motion.',
      tiling: 'penrose', depth: 10, penroseSeed: 'sun', neighborhood: 'touch', rule: 'B2/S', generations: 6,
      borderRings: 0, speed: 8,
      view: trajectoryView(
        [-97.41630554199219, -31.652475357055664, 99.90620422363281, -27.725425720214844],
        220,
      ),
      cellStates: [[30966, 1], [30970, 1], [30976, 4], [30977, 3], [30978, 5], [30980, 4], [30983, 5], [30984, 2], [30985, 2], [30987, 2], [30988, 3], [30989, 3], [36409, 2], [36419, 1]],
      expectedTravel: {
        steps: 220,
        minimumDisplacement: 192,
        maximumRadius: 2.71,
        minimumActive: 14,
        maximumActive: 18,
        minimumBoundaryDistance: 11,
        translatedReturn: {
          fromGeneration: 80,
          toGeneration: 143,
          dx: 55.22679030895233,
          dy: 0,
          neighborhoodRadius: 3,
        },
        finalHash: [3638894468, 346151744],
        finalCellStates: [[3681, 2], [3682, 1], [3683, 2], [3692, 2], [3693, 1], [3695, 2], [3696, 4], [3698, 3], [3699, 3], [3700, 4], [3701, 4], [3702, 3], [3703, 4], [3708, 5], [3709, 5]],
      },
    },
    {
      id: 'penrose-b24-c4-launcher-traveller',
      category: 'Aperiodic travelling dynamics',
      title: 'Penrose B24 launcher traveller',
      summary: 'A four-state B24/S launcher uses eight genuine four-neighbour births, briefly splits, then self-cleans into a connected compact wave that travels more than 171 tile-edge units in 200 generations; this is a verified finite traversal, not proof of perpetual motion.',
      tiling: 'penrose', depth: 10, penroseSeed: 'sun', neighborhood: 'touch', rule: 'B24/S', generations: 4,
      borderRings: 0, speed: 6,
      view: trajectoryView(
        [-95.8774642944336, -31.652475357055664, 80.93807220458984, -11.590169906616211],
        200,
      ),
      cellStates: [
        [53164, 3], [53272, 1], [53285, 3], [53293, 3], [53174, 3], [53176, 1],
        [53171, 3], [53172, 1], [53113, 2], [53114, 3], [53273, 1], [53117, 3],
        [53282, 1], [53121, 3], [53127, 2], [53128, 1], [3971, 3], [4020, 1],
        [53269, 2], [53270, 1], [53208, 3], [4109, 2], [4113, 1], [53206, 2],
        [4110, 3], [4052, 3], [4053, 1],
      ],
      expectedTravel: {
        steps: 200,
        minimumDisplacement: 171,
        minimumDirectionality: 0.95,
        maximumRadius: 7.5,
        minimumActive: 7,
        maximumActive: 37,
        minimumLive: 2,
        maximumLive: 13,
        minimumBoundaryDistance: 14,
        requiredBirths: { liveNeighbors: 4, count: 8, lastToGeneration: 14 },
        connectedThroughout: false,
        connectivity: {
          maximumSupportComponents: 4,
          componentCountHistogram: { 1: 188, 2: 10, 3: 1, 4: 2 },
          disconnectedGenerations: [3, 4, 8, 9, 11, 12, 14, 15, 16, 17, 18, 19, 26],
          firstGenerationConnectedThereafter: 27,
        },
        translatedReturn: {
          fromGeneration: 63,
          toGeneration: 126,
          dx: -55.22679011027019,
          dy: 0,
          neighborhoodRadius: 3,
        },
        finalHash: [3684102456, 4123039717],
        finalCellStates: [[30581, 2], [30584, 3], [30585, 3], [30590, 1], [30596, 2], [30597, 2], [30599, 1], [30739, 3], [30756, 2]],
      },
    },
    {
      id: 'penrose-b2s4-c5-survival-launcher',
      category: 'Aperiodic travelling dynamics',
      title: 'Penrose B2/S4 survival launcher',
      summary: 'Seven live cells use two genuine S4 survivals to launch a compact five-state wave that travels more than 170 tile-edge units in 200 generations; this is a verified finite traversal, not proof of perpetual motion.',
      tiling: 'penrose', depth: 10, penroseSeed: 'sun', neighborhood: 'touch', rule: 'B2/S4', generations: 5,
      borderRings: 0, speed: 5,
      view: trajectoryView(
        [-71.34175109863281, -57.56888198852539, 74.78270721435547, 48.59674835205078],
        200,
      ),
      cellStates: [[53470, 1], [53474, 1], [53475, 1], [53620, 1], [53619, 1], [53622, 1], [53789, 1]],
      expectedTravel: {
        steps: 200,
        minimumDisplacement: 170,
        minimumDirectionality: 0.95,
        maximumRadius: 9.26,
        minimumActive: 7,
        maximumActive: 31,
        minimumLive: 2,
        maximumLive: 9,
        minimumBoundaryDistance: 17,
        expectedRuleClauses: [
          { kind: 'birth', liveNeighbors: 2, count: 670, lastToGeneration: 200 },
          { kind: 'survival', liveNeighbors: 4, count: 2, lastToGeneration: 7 },
        ],
        connectedThroughout: false,
        connectivity: {
          maximumSupportComponents: 2,
          componentCountHistogram: { 1: 196, 2: 5 },
          disconnectedGenerations: [5, 10, 11, 12, 13],
          firstGenerationConnectedThereafter: 14,
        },
        translatedReturn: {
          fromGeneration: 36,
          toGeneration: 60,
          dx: -17.066017150878906,
          dy: 12.399187088012695,
          neighborhoodRadius: 3,
        },
        finalHash: [3636027621, 1670214676],
        finalCellStates: [
          [26442, 4], [26456, 3], [26582, 3], [26587, 4], [26588, 4], [26598, 2],
          [26605, 3], [26606, 3], [26608, 2], [26609, 1], [26610, 1],
        ],
      },
    },
    {
      id: 'penrose-b26s-c4-birth-launcher',
      category: 'Aperiodic travelling dynamics',
      title: 'Penrose B26/S birth launcher',
      summary: 'An eighteen-cell phased seed uses one genuine six-neighbour birth, self-cleans after a brief split, and travels more than 175 tile-edge units in 200 generations; this is a verified finite traversal, not proof of perpetual motion.',
      tiling: 'penrose', depth: 10, penroseSeed: 'sun', neighborhood: 'touch', rule: 'B26/S', generations: 4,
      borderRings: 0, speed: 6,
      view: trajectoryView(
        [-56.1778450012207, -96.5754623413086, 6.5186381340026855, 75.20413970947266],
        200,
      ),
      cellStates: [
        [20355, 2], [20356, 2], [20357, 3], [20361, 1], [20364, 1], [20367, 1],
        [20369, 1], [20370, 1], [20373, 1], [20375, 1], [20376, 1], [25826, 2],
        [25798, 3], [25800, 3], [25806, 2], [26236, 3], [25814, 2], [25822, 3],
      ],
      expectedTravel: {
        steps: 200,
        minimumDisplacement: 175,
        minimumDirectionality: 0.98,
        maximumRadius: 4.68,
        minimumActive: 7,
        maximumActive: 20,
        minimumLive: 2,
        maximumLive: 8,
        minimumBoundaryDistance: 15,
        expectedRuleClauses: [
          { kind: 'birth', liveNeighbors: 2, count: 637, lastToGeneration: 200 },
          { kind: 'birth', liveNeighbors: 6, count: 1, lastToGeneration: 1 },
        ],
        connectedThroughout: false,
        connectivity: {
          maximumSupportComponents: 3,
          componentCountHistogram: { 1: 198, 2: 1, 3: 2 },
          disconnectedGenerations: [1, 3, 4],
          firstGenerationConnectedThereafter: 5,
        },
        translatedReturn: {
          fromGeneration: 32,
          toGeneration: 56,
          dx: 6.518638610839844,
          dy: -20.062305450439453,
          neighborhoodRadius: 3,
        },
        finalHash: [2007869915, 447599390],
        finalCellStates: [
          [46941, 3], [46942, 3], [46946, 1], [46952, 2], [46953, 3], [46955, 3],
          [46957, 2], [47375, 2], [47377, 1], [47382, 1], [47391, 1],
        ],
      },
    },
    {
      id: 'penrose-b27s4-c4-dual-clause-launcher',
      category: 'Aperiodic travelling dynamics',
      title: 'Penrose B27/S4 dual-clause launcher',
      summary: 'A live-cell seed uses both added clauses—four B7 births and seven S4 survivals—then self-cleans into a compact four-state wave that travels more than 177 tile-edge units in 200 generations; this is a verified finite traversal.',
      tiling: 'penrose', depth: 10, penroseSeed: 'sun', neighborhood: 'touch', rule: 'B27/S4', generations: 4,
      borderRings: 0, speed: 5,
      view: trajectoryView(
        [-8.057479858398438, -94.76644134521484, 53.687950134277344, 80.24922180175781],
        200,
      ),
      cellStates: [
        [42184, 1], [42599, 1], [42185, 1], [42614, 1], [42613, 1], [42180, 1],
        [42618, 1], [42591, 1], [42596, 1], [42195, 1], [42606, 1], [42595, 1],
        [42616, 1], [42610, 1], [42598, 1], [42611, 1], [47629, 1], [42200, 1],
        [42619, 1], [42194, 1], [42197, 1], [42183, 1], [42620, 1], [42189, 1],
        [42609, 1], [42608, 1],
      ],
      expectedTravel: {
        steps: 200,
        minimumDisplacement: 177,
        minimumDirectionality: 0.98,
        maximumRadius: 8.76,
        minimumActive: 7,
        maximumActive: 54,
        minimumLive: 2,
        maximumLive: 26,
        minimumBoundaryDistance: 15,
        expectedRuleClauses: [
          { kind: 'birth', liveNeighbors: 2, count: 660, lastToGeneration: 200 },
          { kind: 'birth', liveNeighbors: 7, count: 4, lastToGeneration: 1 },
          { kind: 'survival', liveNeighbors: 4, count: 7, lastToGeneration: 4 },
        ],
        connectedThroughout: false,
        connectivity: {
          maximumSupportComponents: 5,
          componentCountHistogram: { 1: 199, 5: 2 },
          disconnectedGenerations: [4, 5],
          firstGenerationConnectedThereafter: 6,
        },
        translatedReturn: {
          fromGeneration: 34,
          toGeneration: 58,
          dx: 6.5186384064810605,
          dy: 20.062305450439453,
          neighborhoodRadius: 3,
        },
        finalHash: [3375366975, 1925669226],
        finalCellStates: [
          [14200, 3], [14201, 3], [14204, 3], [14205, 2], [14206, 2],
          [14216, 1], [14217, 2], [14219, 2], [14221, 1], [14639, 1],
        ],
      },
    },
    {
      id: 'penrose-conway-diehard-293',
      category: 'Aperiodic compact transients',
      title: 'Penrose Conway diehard — 293',
      summary: 'A fourteen-cell Penrose seed expands locally and then becomes completely extinct at generation 293.',
      tiling: 'penrose', depth: 8, penroseSeed: 'sun', neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 30,
      view: trajectoryView(
        [-12.086219787597656, -9.281152725219727, 5.567581653594971, 13.70820426940918],
        293,
      ),
      cellStates: [[5101, 1], [5898, 1], [5899, 1], [5902, 1], [5903, 1], [5904, 1], [6680, 1], [6682, 1], [6683, 1], [6684, 1], [6688, 1], [7484, 1], [7490, 1], [7491, 1]],
      expectedExtinction: 293,
    },
    {
      id: 'penrose-conway-methuselah-289',
      category: 'Aperiodic compact transients',
      title: 'Penrose Conway methuselah — 289',
      summary: 'A compact 22-cell seed evolves for 289 generations before reaching a four-cell still life.',
      tiling: 'penrose', depth: 8, penroseSeed: 'sun', neighborhood: 'touch', rule: 'B3/S23', generations: 2,
      borderRings: 1, speed: 30,
      view: trajectoryView(
        [-20.143699645996094, -15.326237678527832, 4.028739929199219, 8.972135543823242],
        290,
      ),
      cellStates: [[2729, 1], [3514, 1], [3515, 1], [3517, 1], [3518, 1], [4310, 1], [4312, 1], [4313, 1], [4316, 1], [5091, 1], [5095, 1], [5098, 1], [5100, 1], [5108, 1], [5894, 1], [5896, 1], [5900, 1], [5901, 1], [6676, 1], [6680, 1], [6686, 1], [7483, 1]],
      expectedTransient: 289, expectedPeriod: 1,
    },
    {
      id: 'penrose-b12-p840-field',
      category: 'Collective aperiodic dynamics',
      title: 'Penrose B12/S p840 field',
      summary: 'A deterministic shared-edge soup enters an exact period-840 collective cycle after a 51-generation transient.',
      tiling: 'penrose', depth: 8, penroseSeed: 'sun', neighborhood: 'edge', rule: 'B12/S', generations: 2,
      borderRings: 8, density: 0.12, randomSeed: 'penrose-edge-B12/S-2', speed: 60,
      view: FIELD_VIEW, randomize: true,
      expectedTransient: 51, expectedPeriod: 840,
    },
    {
      id: 'penrose-brain-field',
      category: 'Collective aperiodic dynamics',
      title: 'Penrose excitable field',
      summary: 'B2/S with three states produces firing and refractory waves that remain active through 3,000 generations on the Penrose touch graph.',
      tiling: 'penrose', depth: 8, penroseSeed: 'sun', neighborhood: 'touch', rule: 'B2/S', generations: 3,
      borderRings: 8, density: 0.12, randomSeed: 'penrose-touch-B2/S-3', speed: 30,
      view: FIELD_VIEW, randomize: true,
      expectedActivityThrough: 3000,
    },
    {
      id: 'hat-b1-field',
      category: 'Collective aperiodic dynamics',
      title: 'Hat B1 wave field',
      summary: 'A two-state B1/S field remains active through 3,000 generations on the hat touch graph.',
      tiling: 'hat', depth: 4, neighborhood: 'touch', rule: 'B1/S', generations: 2,
      borderRings: 8, density: 0.12, randomSeed: 'hat-touch-B1/S-2', speed: 30,
      view: FIELD_VIEW, randomize: true,
      expectedActivityThrough: 3000,
    },
  ];

  const hatHighlights = 'Einstein-hat gliders and launchers';
  const orderedEntries = [
    ...entries.filter((entry) => entry.category === hatHighlights),
    ...entries.filter((entry) => entry.category !== hatHighlights),
  ];
  return Object.freeze(orderedEntries.map((entry) => {
    entry.provenance = PROVENANCE[entry.id];
    if (entry.view.bounds) Object.freeze(entry.view.bounds);
    Object.freeze(entry.view);
    return Object.freeze(entry);
  }));
});
