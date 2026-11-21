# Vice Heat — Palmera Cover Studio

An offline browser cover studio for make.fun's **gta6-cover-art-01** ("Make GTA 6
Cover Art"). It turns any photo plus a caption into multi-panel GTA-style cover
art with a Vice City neon-sunset grade, exported as a PNG in the common post
sizes. Photos are read on the visitor's own machine and never uploaded; the app
is plain static files with no build step and no network requests.

## Run it

```
node serve.ts            # serves app/ at http://localhost:8080
node main.ts             # with MAKEFUN_OUTPUT_DIR set, hands the entry in
```

## What it does

- **Photos** — three built-in demo scenes plus the visitor's own photos
  (file picker, multiple at once). Every panel can hold any loaded photo.
- **Layouts** — four-panel grid, hero + two, classic six-panel, full bleed.
- **Per-panel crop** — click a panel (or drag on the preview) and set its
  photo, zoom and pan with sliders.
- **Grades** — Vice Sunset, Neon Night, Golden Hour and Teal Heat, painted as
  canvas gradient washes with film grain and a vignette.
- **Lettering** — a heavy system-font title with a sunset gradient fill, a
  neon-script subtitle, a tilted badge ribbon and a star heat meter. No font
  files ship with the app; lettering uses system font stacks only, and all
  artwork and titles are original (no Rockstar Games material).
- **Export** — one click to PNG at 1080×1080, 1080×1350 or 1920×1080.

## Demo photos are procedural

The three demo photos under `app/assets/` are painted by committed code, not
downloaded or produced elsewhere:

```
python3 tools/render_samples.py
```

regenerates `boulevard.jpg` (sunset boulevard, art-deco blocks, convertible
silhouette), `pier.jpg` (neon pier at night with a diner sign) and `beach.jpg`
(beach aerial with a lifeguard tower and a speedboat) with Pillow.

## Screenshots

`screenshots/` holds four captures of this app taken from a headless browser:
the wide exported cover first, the editor with a demo photo loaded, then the
portrait and square exported covers. `shots.json` records the exact `?shot=`
scene each capture used; the app renders those scenes itself.

## Layout of this repository

- `main.ts` — the entry program: copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json` via `vendor/makefun-app.ts`.
- `vendor/makefun-app.ts` — the kit's dossier library, byte for byte.
- `app/` — the studio: `index.html`, `style.css`, `src/cover.js` (the cover
  engine), `src/main.js` (page wiring), `src/shots.js` (screenshot scenes),
  `assets/` (the procedural demo photos).
- `tools/render_samples.py` — the demo-photo renderer described above.
- `serve.ts` — a tiny local static server for trying the app.

Licensed under the MIT License (see `LICENSE`).
