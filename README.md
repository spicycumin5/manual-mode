# Manual Mode

An interactive web app that teaches camera settings (aperture, shutter speed, ISO, metering, modes, white balance, focus) and photo editing (tone, curves, white balance, HSL, color grading).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/ (works from any folder or host; uses hash routing)
npm test           # unit tests (exposure/optics math, curves, preset exposures)
npm run test:e2e   # Playwright smoke test of every route, desktop + 375px mobile
```

## What's inside

| Area | Where |
|---|---|
| Virtual camera (WebGL2): depth of field, motion blur, panning, camera shake, ISO noise, highlight clipping, metering modes, M/Av/Tv/P, Auto ISO, ND filters | `src/sim/` |
| 7 scenes built from procedural SVG depth layers | `src/sim/scenes/` |
| 15 MDX lessons (9 shooting, 6 editing) | `src/content/lessons/` |
| 10 graded camera challenges | `src/content/challenges.ts` |
| Quiz bank (multiple choice, "which photo?", "set the dial") | `src/content/quizzes.tsx` |
| 15 scenario recipes + "What should I use?" wizard | `src/content/scenarios.ts`, `wizard.ts` |
| Edit Lab (WebGL2 develop pipeline, curve editor, 6 "match the look" exercises) | `src/edit/` |
| Calculators, glossary, printable cheat sheet | `src/pages/` |
| Progress (localStorage, export/import) | `src/progress/store.ts` |

## Adding real photos

Lesson comparisons show simulator renders until you register a real photo for that slot:

1. Put the image in `public/photos/`.
2. Add it to `src/content/photos/manifest.ts`, e.g. `'aperture-f1.8': { src: 'photos/aperture-f1.8.jpg', credit: 'You' }`.
3. If you didn't take it, record the source and license in `CREDITS.md`.

Slot ids are the `slot:` values in the lesson files (`aperture-f1.8`, `aperture-f4`, `shutter-fast`, `iso-1600`, …).

## How the simulation works

- **Exposure**: `offset = sceneEV100 − (log2(N²/t) − log2(ISO/100))`, applied as a linear gain before a highlight shoulder and clipping.
- **Depth of field**: thin-lens blur disc per layer, `b = f²/(N(s−f)) · |d−s|/d`, rendered as a disc ("bokeh") blur. Changing focal length keeps the subject framed and moves the camera back, so backgrounds magnify (compression).
- **Motion**: each layer has an image-space velocity; blur length = speed × shutter time. Panning subtracts the subject's motion. Camera shake is calibrated to the 1/focal-length rule and reduced by stabilization stops.
- **Metering**: each scene has a per-mode meter bias (e.g. snow reads +1.7 stops "too bright"), so auto modes are fooled the way real cameras are.

The simulator is a teaching model, not a physically exact renderer. Star trailing is magnified about 6× to match what you'd see at 100% zoom.
