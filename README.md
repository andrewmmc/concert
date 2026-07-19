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
| **Hong Kong Coliseum** 香港體育館 | Centre Stage 四面台 (360°) | `#/hkc/center-stage` |
| | End Stage 三面台 (with arena-floor blocks 61–67) | `#/hkc/end-stage` |

Modelled from the official LCSD arena plans with the real HKC conventions:
40 sections (Red 40–49, Blue 50–59, Green 60–69, Yellow 70–79), rows 1–39,
and the column-slot seat numbering (81–98) repeated per section row. Arena
40 m × 40 m · ceiling 23 m · inverted-pyramid roof 41 m. The end-stage
layout moves the stage to the Red Gate (40s) end and adds 648 flat-floor
seats across seven Brown Gate (啡閘) blocks 61–67.

- [Centre-stage seating plan (PDF)](https://www.lcsd.gov.hk/en/hkc/common/form/hkc_center_stage.pdf)
- [End-stage seating plan (PDF)](https://www.lcsd.gov.hk/en/hkc/common/form/hkc_end_stage.pdf)

## Known limitations

- Only the **Hong Kong Coliseum** venue is modelled so far — see the roadmap
  for other venues still to come.
- Seat dimensions are visual approximations and are scaled to fit the available
  spacing in each section, so their size is not physically exact.

## Roadmap — venues to support

- AsiaWorld-Expo Hall 1
- AsiaWorld-Expo Hall 10
- Kai Tak Stadium
- Kai Tak Arena
- …and others

## Tech stack

- **Svelte 5** (runes) + **Vite 8**
- **three.js** for the 3D scene (instanced seats, raycast picking, orbit controls)
- Hash routing — `#/<venue>/<layout>`

## Getting started

```bash
npm install
npm run dev      # → http://localhost:5173
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
   (see `src/venues/hkc.js` for the shape).
2. Register it in `src/venues/index.js` (`venues` array).
3. It's automatically available at `#/<id>/<layout>` and in the venue picker.

## Data sources

- Hong Kong Coliseum centre-stage seating plan —
  [LCSD](https://www.lcsd.gov.hk/en/hkc/common/form/hkc_center_stage.pdf)
- Hong Kong Coliseum end-stage seating plan —
  [LCSD](https://www.lcsd.gov.hk/en/hkc/common/form/hkc_end_stage.pdf)
- LCSD technical information (dimensions, capacity).
