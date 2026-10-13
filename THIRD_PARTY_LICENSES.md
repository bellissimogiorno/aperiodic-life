# Third-party attribution

## Einstein hat geometry

The hat outline, affine geometry helpers, initial H/T/P/F metatiles, and hierarchical substitution construction in `core.js` are adapted from Craig S. Kaplan's `hatviz` project:

https://github.com/isohedral/hatviz

Adaptation source reference: `geometry.js` and `hat.js` from the upstream
`main` branch, inspected on 17 September 2026. An immutable upstream commit ID
is not recorded, so this is a date-and-branch reference. When updating the
adaptation, record the full upstream commit SHA and retain the source files
used for comparison.

The adapted code remains subject to the following licence.

---

BSD 3-Clause License

Copyright (c) 2023, Craig S. Kaplan

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## Penrose backend

The Penrose backend was written independently for this project from standard published mathematical substitution rules. No third-party implementation source was copied into the backend. Mathematical and explanatory references are listed in `docs/PENROSE_BACKEND.md`; references are not software dependencies and impose no runtime or source-code licence on this implementation.

## Published priority-table automata

The Hat A, B and C rules and the Spectre rule are independently transcribed
mathematical transition tables from James Edmond's *Gliders on Aperiodic
Monotilings: Cellular Automata on the Hat and Spectre*, submitted on
18 September 2026, and its accompanying rule compendium:

- https://arxiv.org/abs/2609.22579
- https://github.com/jamesedmond/monotile-ca/blob/main/GLIDERS.md
- https://github.com/jamesedmond/monotile-ca/blob/main/LICENSE-MIT

The source records and exact transition semantics are retained in
[the priority-rule fixture](research/fixtures/published-priority-rules.json).
The simulation engine and the catalogue's searches for seeds on this project's
geometry were written independently. The project does not claim original
discovery of Edmond's Hat travellers. `TABLE:HAT-SIMPLE` is a derived
three-state variant of Hat B; it is not equivalent to Hat B on every initial
configuration. The Spectre rule is available through the core API, but a
Spectre tiling backend is not included.

The Goucher Penrose rule is credited to Adam P. Goucher's 2012 paper
[*Gliders in cellular automata on Penrose tilings*](https://cp4space.hatsya.com/wp-content/uploads/2012/11/2012-penrose-gliders.pdf).
Its second printed transition is corrected to state 1, consistently with the
paper's surrounding description and the subsequent implementation recorded in
Edmond's compendium. No Goucher simulator implementation is bundled.

Edmond's accompanying repository makes its source records available under
MIT or Apache-2.0. The MIT notice is retained here for the transcribed source
material. This attribution does not imply endorsement by either author.

---

MIT License

Copyright (c) 2026 James Edmond

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## Referenced pattern data

The nine-cell hexagonal `B245/S3` fixture was transcribed from the mathematical
pattern displayed in Golly's official hexagonal-rule documentation. Its source
URL, retrieval date, original RLE, coordinate conversion, and replay contract
are preserved in
[the source record](research/fixtures/hex-b245s3-source.json).
No Golly software implementation is bundled. Retain that source record when
reusing or distributing the fixture; the project does not claim original
authorship of this known pattern.

The hexagonal catalogue also includes mathematical pattern data published by
confocaloid (the three-way gun), Naszvadi (the oscillator-trail puffer, with an
earlier example noted by Dmitry Maitak), c0b0p0 (the period-999 rotor and
period-158 spaceship), John Cerkan (the period-13 spaceship), and Dean Hickerson
(the repairing wall and period-2,044 billiard table). The period-48 B2/S34
oscillator was also published by drc and was independently encountered by the
project's search. Author names identify the cited publications and do not
assert discovery priority.

Original RLE or generating seeds, source URLs, coordinate conversions, and
attribution are retained in the [hexagonal source records](research/fixtures/hexagonal-sources.json)
and [hexagonal guide](docs/HEXAGONAL_STRUCTURES.md). The reference simulators
and search code were written for this project; no forum or Golly simulator
implementation is included. Preserve these pattern credits when redistributing
the catalogue. The project does not claim original authorship of the published
patterns or assign a separate software licence to their mathematical facts.
