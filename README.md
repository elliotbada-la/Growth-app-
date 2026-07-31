# GrowthTracker

A personal nutrition, sleep, water and growth tracker built for a teen. It tracks the
vitamins, minerals and nutrients that support healthy growth, and suggests the foods that
best fill whatever is still missing today.

Everything is stored in the browser's local storage — no account, no server, works offline.

> **For tracking and education only.** This isn't medical advice or a medical device. Talk to
> a doctor or registered dietitian before starting any supplement (including creatine) or
> making big changes to how you eat.

## Running it

```bash
npm install
npm run dev      # dev server
npm run build    # production build into dist/
npm run preview  # serve the production build
```

Stack: React 19 + TypeScript + Vite, Tailwind CSS v4, Recharts, ZXing (barcode decoding).

`npm run build:single` additionally bundles the app into one self-contained HTML file at
`dist/growthtracker.html`, for hosts that can't load external assets.

## What's in it

**Dashboard** — every nutrient from the target table as a progress bar, grouped into Main
focus / Vitamins / Minerals / Optional, coloured red under 34%, amber under 80%, green above.
A summary card up top shows overall goal completion, water, last night's sleep and current
weight, and the eight main-focus nutrients get progress rings.

**Focus alerts ("Nutrients to watch")** — the card at the top of the home screen. It flags the
1–3 nutrients most worth attention, ranked by how far below target they are:

- *Trend alert* (the main one): a nutrient averaging under 70% of goal across the last 7 days.
- *Today alert*: a nutrient under 50% of goal late in the day.

Each alert names specific foods that fix it and can be snoozed. Main-focus nutrients are
weighted to surface first. Every threshold lives in `src/lib/constants.ts`.

**Food logging** — search the bundled database of 90 foods and drinks, add by servings, edit
or delete anything logged today. Any food's nutrient values can be edited, and custom foods can
be added by hand and reused.

**Barcode scanning & Open Food Facts** — scan a packaged product's barcode, or search Open
Food Facts by brand, and its nutrients import in one tap. Open Food Facts is a free, open,
CORS-enabled database of millions of products needing no API key or account. The scanner offers
three routes because no single one works on every phone: a live camera stream (needs HTTPS or
localhost), a photo capture that decodes a still (the iOS Safari path), and typing the digits.
The decoder is fetched only on the first scan, so it costs nothing on a normal app open.

**AI food lookup** — for anything with no barcode (home cooking, restaurant meals), describe it
and Claude estimates its per-serving nutrients across the full nutrient set. Needs an Anthropic
API key (added in Settings) and an internet connection; the request goes straight from the
browser to the Anthropic API, so the key stays on your device and usage bills to your own
account.

Both import routes, plus barcode scanning, need network access. Everything else — logging,
targets, focus alerts, sleep, water, weight — keeps working offline.

**Import review** — nothing from an external source reaches the food log unreviewed. Every
import shows the serving, its source, and the values it will add before you accept it, and
flags any nutrient that comes back implausibly high for a single serving. Imports are saved to
your food list, so a given product is only ever imported once and stays editable.

**Best foods today** — ranks the database by how well each food closes the day's remaining
gaps, capped at the size of the gap so nothing wins by megadosing a single nutrient. Updates
live as you log.

**Protein calculator** — body-weight based, not a fixed number: **1 g of protein per pound of
body weight**, adjustable between 0.5 and 1.5 g/lb in Settings. The goal recalculates whenever
weight changes, and the newest weigh-in is always the source of truth.

**Water** — 3.3 L default goal with quick-add buttons and a fill-up visual.

**Sleep** — log bedtime/wake time or total hours, plus optional quality and notes. History
chart over 7 or 30 nights against the 8–10 hour teen target band.

**Growth** — weight log and trend line, in pounds. Framed as growth tracking: no goal weight,
no calorie restriction, no diet features. The newest weigh-in feeds the protein calculator.

**Wrap up your day** — end-of-day view with streaks, a final water top-up, tonight's sleep
plan and what to catch tomorrow.

**Settings** — weight, grams of protein per pound, water and sleep goals, AI lookup key, theme
(light/dark/system), CSV export, reset today, erase all.

## Layout

```
src/
  data/
    nutrients.ts   daily targets for all 30 nutrients
    foods.json     90-food seed database, per-serving values
  lib/
    constants.ts   every tunable threshold
    types.ts       data model
    nutrition.ts   daily totals, goal resolution, progress
    recommend.ts   best-foods ranking
    focus.ts       focus alert engine
    streaks.ts     water / protein / sleep streaks
    aiLookup.ts    Claude-backed nutrient estimation for arbitrary foods
    openFoodFacts.ts  barcode + name lookup, unit conversion from the OFF schema
    storage.ts     local storage load & save
    dates.ts       local-date helpers
    units.ts       weight, ml/oz and hour formatting
  store/AppStore.tsx   app state and every action
  components/          rings, bars, cards, nav
  screens/             the seven screens
```

## Data notes

Nutrient targets follow general DRI/AI guidance for ages 14–18 and are hard-coded in
`src/data/nutrients.ts`. Food values in `src/data/foods.json` are reasonable per-serving
estimates, not lab measurements — they're editable in the app, and the file is a drop-in place
to swap in a real source like USDA FoodData Central later. Values returned by the AI lookup are
estimates too, and are equally editable once saved.

The app works in **pounds throughout** — there is no kilogram option. Saves written by earlier
builds stored weight in kilograms with a kg/lb toggle; `migrateToPounds` in
`src/lib/storage.ts` converts those weights on load so no history is lost. The protein rate is
deliberately reset to the current default rather than converted, since changing that rate is
the point of the move to pounds.

Open Food Facts stores every `*_100g` / `*_serving` figure normalised to grams, whatever unit a
contributor originally typed (its `*_unit` field describes the raw entered value, not the
normalised one). `src/lib/openFoodFacts.ts` converts from grams into each nutrient's display
unit; that table and `fromGrams` are the only places to look if imported numbers ever land off
by a factor of 1000. Open Food Facts is crowd-sourced, so per-product completeness varies —
missing nutrients import as zero rather than being guessed.
