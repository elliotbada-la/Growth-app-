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

Stack: React 19 + TypeScript + Vite, Tailwind CSS v4, Recharts.

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

**Food logging** — search the bundled database, add by servings, edit or delete anything
logged today. Any food's nutrient values can be edited, and custom foods can be added by hand
and reused.

**Best foods today** — ranks the database by how well each food closes the day's remaining
gaps, capped at the size of the gap so nothing wins by megadosing a single nutrient. Updates
live as you log.

**Protein calculator** — body-weight based, not a fixed number. Everyday mode uses 0.85 g/kg;
lifting mode is adjustable between 1.2 and 1.7 g/kg (default 1.4). The goal recalculates
whenever weight changes.

**Water** — 3.3 L default goal with quick-add buttons and a fill-up visual.

**Sleep** — log bedtime/wake time or total hours, plus optional quality and notes. History
chart over 7 or 30 nights against the 8–10 hour teen target band.

**Growth** — weight log and trend line. Framed as growth tracking: no goal weight, no calorie
restriction, no diet features. The newest weigh-in feeds the protein calculator.

**Wrap up your day** — end-of-day view with streaks, a final water top-up, tonight's sleep
plan and what to catch tomorrow.

**Settings** — units, training mode, protein multiplier, water and sleep goals, theme
(light/dark/system), CSV export, reset today, erase all.

## Layout

```
src/
  data/
    nutrients.ts   daily targets for all 30 nutrients
    foods.json     40-food seed database, per-serving values
  lib/
    constants.ts   every tunable threshold
    types.ts       data model
    nutrition.ts   daily totals, goal resolution, progress
    recommend.ts   best-foods ranking
    focus.ts       focus alert engine
    streaks.ts     water / protein / sleep streaks
    storage.ts     local storage load & save
    dates.ts       local-date helpers
    units.ts       kg/lb, ml/oz, hours
  store/AppStore.tsx   app state and every action
  components/          rings, bars, cards, nav
  screens/             the seven screens
```

## Data notes

Nutrient targets follow general DRI/AI guidance for ages 14–18 and are hard-coded in
`src/data/nutrients.ts`. Food values in `src/data/foods.json` are reasonable per-serving
estimates, not lab measurements — they're editable in the app, and the file is a drop-in place
to swap in a real source like USDA FoodData Central later.
