# Hong Kong Concert Seats View

An interactive 3D seating-plan viewer for Hong Kong concert venues. Explore the
arena in 3D, hover any seat to see its **section · row · seat number**, search
for a specific seat, and fly the camera straight to it.

---

## Features

- 🏟️ Interactive 3D venue models (orbit · zoom · pan)
- 🖱️ Hover any seat → live tooltip with section, row and seat number
- 🔍 Seat search with camera fly-to and pin highlight
- ♿ Wheelchair platforms and arena-floor wheelchair zones
- 🎭 Multiple seating layouts per venue (e.g. centre stage / end stage)
- 🔗 Deep-linkable routes per venue and layout

## Currently supported

| Venue | Layouts | Route |
|-------|---------|-------|
| **Hong Kong Coliseum** 香港體育館 | Centre Stage 四面台 (360°) | `/viewer/hkc/center-stage/` |
| | End Stage 三面台 (with arena-floor Brown Gate blocks) | `/viewer/hkc/end-stage/` |
| **Queen Elizabeth Stadium** 伊利沙伯體育館 | Five arena layouts | `/viewer/qes/end-stage/` |
| **Kai Tak Arena** 啟德體藝館 | End Stage 正面舞台 | `/viewer/kta/end-stage/` |
| **Kai Tak Stadium** 啟德主場館 | Fixed stadium seating plan | `/viewer/kts/stadium/` |
| **AsiaWorld Expo (Hall 1 Arena)** 亞洲國際博覽館 | EDAN LUI 2023 End Stage | `/viewer/awe/end-stage/` |
| **AsiaWorld Expo (Halls 6, 8 & 10)** 亞洲國際博覽館 | TH8400 End Stage | `/viewer/awe-halls/th8400/` |
| | TH5600 End Stage (Halls 8 & 10) | `/viewer/awe-halls/th5600/` |

The Kai Tak Stadium model follows the row domains and gate totals printed on
the project source drawing. Level 2 row depth varies by stand: the inset north
blocks end at V, north outer blocks at DD, the south stand at FF, and the long
east/west blocks at HH. Level 5 continues through QQ. The drawing totals
47,459 bowl seats, 512 companion positions, and 512 wheelchair positions.

The Kai Tak Arena end-stage plan reconstructs the two project source drawings
in `misc/kta/`: a globally numbered lower bowl and upper west stand (Blocks
102–113, 207–208) around an event floor of Blocks A–J. The floor is arranged
around a central T-stage thrust, so the flanking blocks A–C and G–J face
inward toward the runway while Blocks D–F face the main stage down the centre.

Modelled from the official LCSD arena plans with the real HKC conventions:
40 sections (Red 40–49, Blue 50–59, Green 60–69, Yellow 70–79), rows 1–39,
and the column-slot seat numbering (81–98) repeated per section row. Arena
40 m × 40 m · ceiling 23 m · inverted-pyramid roof 41 m. The end-stage
layout moves the stage to the Green Gate (60s) end and adds 1,316 flat-floor
seats in thirteen Brown Gate (啡閘) blocks (gates 42–47, rows AA–S) plus
two arena-floor wheelchair seating zones.

- [Centre-stage seating plan (PDF)](https://www.lcsd.gov.hk/en/hkc/common/form/hkc_center_stage.pdf)
- [End-stage seating plan (PDF)](https://www.lcsd.gov.hk/en/hkc/common/form/hkc_end_stage.pdf)

## Known limitations

- Seat dimensions are visual approximations and are scaled to fit the available
  spacing in each section, so their size is not physically exact.

## Roadmap — venues to support

- AsiaWorld-Expo Hall 10
- …and others

## Tech stack

- **Astro 5** with static, file-based routes and framework-free client scripts
- **three.js** for the 3D scene (instanced seats, raycast picking, orbit controls)
- Generated viewer routes — `/viewer/<venue>/<layout>/`

Legacy hash links such as `#/<venue>/<layout>` redirect to the matching Astro
route.

## Getting started

```bash
npm install
npm run dev      # → http://localhost:4321
```

Production build:

```bash
npm run build    # → dist/
npm run preview
```

## Adding a venue

Venues are data modules under `src/venues/`:

1. Create `src/venues/<name>.js` exporting an object with
   `{ id, name, zh, subtitle, dims, planUrl, layouts, sides, build(ctx, opts) }`
   (see `src/venues/hkc.js` for the shape). Optional `defaultCamera`
   (`{ target: [x, y, z], position: [x, y, z] }`) frames the initial view;
   missing entries fall back to the default framing.
2. Register it in `src/venues/index.js` (`venues` array).
3. Astro generates its venue and viewer pages at build time, and the venue
   picker includes it automatically.

## Data sources

- Hong Kong Coliseum centre-stage seating plan —
  [LCSD](https://www.lcsd.gov.hk/en/hkc/common/form/hkc_center_stage.pdf)
- Hong Kong Coliseum end-stage seating plan —
  [LCSD](https://www.lcsd.gov.hk/en/hkc/common/form/hkc_end_stage.pdf)
- LCSD technical information (dimensions, capacity).
- Kai Tak Stadium seating plan — project source drawing in
  `misc/kts/stadium_seating_plan.pdf`.
- Kai Tak Arena seating plans — project source drawings in `misc/kta/`.
- AsiaWorld Expo (Hall 1 Arena) EDAN LUI 2023 end-stage plan — project source drawing in
  `misc/awe_hall1/`.
- AsiaWorld Expo VIVA TH8400 and TH5600 end-stage plans — project source drawings in
  `misc/awe_halls/`.

## Managing guide posts

The “Before You Go” guide is a collection of Markdown blog posts in
`src/content/guides/`. Each article has an English file under `en/` and a
Traditional Chinese file under `zh-HK/`.

To add an article, copy one existing pair and update its frontmatter and
Markdown body. Both files must use the same `translationKey`, `publishedAt`
and `order`. The `translationKey` becomes the URL, for example
`translationKey: before-buying` creates `/guide/before-buying/`.
