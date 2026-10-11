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
