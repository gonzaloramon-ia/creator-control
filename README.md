# Creator Control

A SFW public-discovery and attribution MVP for independent adult creators.

## Live prototype

- Public site: https://gonzaloramon-ia.github.io/creator-control/
- Sample creator page: https://gonzaloramon-ia.github.io/creator-control/alina-reyes.html
- Claim page: https://gonzaloramon-ia.github.io/creator-control/claim.html

## MVP boundaries

- SFW public profiles only
- Creator-selected destination links
- Platform-native attribution tests where available
- No platform passwords, bots, public uploads, comments or messaging

## Source layout

- `index.html` — public landing
- `alina-reyes.html` — sample public profile
- `claim.html` — pilot claim experience
- `collector/` — private write-only intake API for Airtable; deployed separately from the public site

The public site remains on GitHub Pages. The collector is deliberately private so no Airtable credential is exposed in browser code.
