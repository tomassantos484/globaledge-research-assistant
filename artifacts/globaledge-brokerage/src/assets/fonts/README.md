# Local GlobalEdge fonts

Downloaded unchanged on 2026-11-17 from Google's official font distribution.
No font package or runtime third-party requests are required.

## Provenance and redistribution

All three families use the **SIL Open Font License 1.1**, which permits
embedding and redistribution with their copyright and license notices.
Full, unmodified notices ship in `public/fonts/licenses/` and are copied to
the built site's `fonts/licenses/` directory by Vite.

| Asset | Official distribution URL | Official license source |
|---|---|---|
| DM Sans, normal variable, CSS uses 400–700 | https://fonts.gstatic.com/s/dmsans/v17/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K4.woff2 | https://github.com/google/fonts/blob/main/ofl/dmsans/OFL.txt |
| IBM Plex Mono, normal 400 | https://fonts.gstatic.com/s/ibmplexmono/v23/-F63fjptAgt5VM-kVkqdyU8n1i8q1w.woff2 | https://github.com/google/fonts/blob/main/ofl/ibmplexmono/OFL.txt |
| IBM Plex Mono, normal 500 | https://fonts.gstatic.com/s/ibmplexmono/v23/-F6qfjptAgt5VM-kVkqdyU8n3twJwlBFgg.woff2 | https://github.com/google/fonts/blob/main/ofl/ibmplexmono/OFL.txt |
| Instrument Serif, normal 400 | https://fonts.gstatic.com/s/instrumentserif/v5/jizBRFtNs2ka5fXjeivQ4LroWlx-6zUTjg.woff2 | https://github.com/google/fonts/blob/main/ofl/instrumentserif/OFL.txt |

These are the Latin WOFF2 distributions returned by the official Google Fonts
CSS API for the existing families and weights. DM Sans serves the four existing
weights with one variable file. No italic face is used by the authored
interface, so the formerly requested but unused Instrument Serif italic was
not downloaded. Uncovered scripts use the declared system fallback stacks.

`src/fonts.css` uses relative asset URLs so Vite fingerprints the fonts and
resolves them against the configured artifact base path. All faces use
`font-display: swap`, preserving readable fallback text during loading.
