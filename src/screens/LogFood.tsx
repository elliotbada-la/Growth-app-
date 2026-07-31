import { useMemo, useState } from 'react';
import { NUTRIENT_TARGETS, NUTRIENTS_BY_KEY } from '../data/nutrients';
import { AiLookupPanel, OpenFoodFactsPanel } from '../components/FoodImport';
import { roundServings as round, StepperButton } from '../components/Stepper';
import { formatAmount } from '../lib/nutrition';
import type { FoodItem, NutrientKey } from '../lib/types';
import { useStore } from '../store/AppStore';

export default function LogFood() {
  const { foods, data, date, logFood, removeFoodEntry, updateFoodEntry } = useStore();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [showCustom, setShowCustom] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? foods.filter((f) => f.name.toLowerCase().includes(q)) : foods;
    return list.slice(0, q ? 40 : 12);
  }, [foods, query]);

  const todayEntries = useMemo(() => {
    const byId = new Map(foods.map((f) => [f.id, f]));
    return data.foodLog
      .filter((e) => e.date === date)
      .sort((a, b) => b.loggedAt - a.loggedAt)
      .map((e) => ({ entry: e, food: byId.get(e.foodItemId) }));
  }, [data.foodLog, foods, date]);

  return (
    <div className="space-y-4">
      <section className="card">
        <label htmlFor="food-search" className="section-title">
          Search foods
        </label>
        <input
          id="food-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="eggs, spinach, salmon…"
          className="field mt-2"
        />

        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {results.map((food) => (
            <li key={food.id}>
              <button
                type="button"
                onClick={() => setSelected(food)}
                className="flex w-full items-center gap-3 py-2.5 text-left"
              >
                <span className="text-xl" aria-hidden="true">
                  {food.emoji || '🍽️'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{food.name}</span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                    {food.servingLabel}
                    {food.custom && ' · custom'}
                  </span>
                </span>
                <span className="text-brand-600 dark:text-brand-400" aria-hidden="true">
                  +
                </span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No matches. Add it as a custom food below.
            </li>
          )}
        </ul>

        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          className="btn btn-ghost mt-3 w-full"
        >
          {showCustom ? 'Close custom food' : '➕ Quick add custom food'}
        </button>
      </section>

      <OpenFoodFactsPanel />

      <AiLookupPanel />

      {showCustom && <CustomFoodForm onDone={() => setShowCustom(false)} />}

      <section className="card">
        <h3 className="section-title">Eaten today</h3>
        {todayEntries.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Nothing logged yet today.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
            {todayEntries.map(({ entry, food }) => (
              <li key={entry.id} className="flex items-center gap-3 py-2.5">
                <span className="text-xl" aria-hidden="true">
                  {food?.emoji ?? '🍽️'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{food?.name ?? 'Removed food'}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {entry.servings} × {food?.servingLabel ?? 'serving'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <StepperButton
                    label="Decrease servings"
                    onClick={() =>
                      entry.servings <= 0.5
                        ? removeFoodEntry(entry.id)
                        : updateFoodEntry(entry.id, round(entry.servings - 0.5))
                    }
                  >
                    −
                  </StepperButton>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">
                    {entry.servings}
                  </span>
                  <StepperButton
                    label="Increase servings"
                    onClick={() => updateFoodEntry(entry.id, round(entry.servings + 0.5))}
                  >
                    +
                  </StepperButton>
                  <button
                    type="button"
                    onClick={() => removeFoodEntry(entry.id)}
                    aria-label={`Remove ${food?.name ?? 'entry'}`}
                    className="ml-1 rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected && (
        <AddFoodSheet
          food={selected}
          onClose={() => setSelected(null)}
          onAdd={(servings) => {
            logFood(selected.id, servings);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}


/** Bottom sheet for choosing a serving count, with an inline editor for the food's values. */
function AddFoodSheet({
  food,
  onClose,
  onAdd,
}: {
  food: FoodItem;
  onClose: () => void;
  onAdd: (servings: number) => void;
}) {
  const { editFoodNutrients } = useStore();
  const [servings, setServings] = useState(1);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(food.nutrients).map(([k, v]) => [k, v === undefined ? '' : String(v)]),
    ),
  );

  const notable = NUTRIENT_TARGETS.filter((t) => (food.nutrients[t.key] ?? 0) > 0).slice(0, 8);

  const saveEdits = () => {
    const patch: Partial<Record<NutrientKey, number>> = {};
    for (const [key, raw] of Object.entries(draft)) {
      const value = Number(raw);
      patch[key] = raw.trim() === '' || Number.isNaN(value) ? 0 : value;
    }
    editFoodNutrients(food.id, patch);
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 dark:bg-slate-900 sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">
              <span aria-hidden="true">{food.emoji || '🍽️'}</span> {food.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{food.servingLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4">
          <StepperButton
            label="Fewer servings"
            onClick={() => setServings((s) => Math.max(0.5, round(s - 0.5)))}
          >
            −
          </StepperButton>
          <div className="text-center">
            <p className="text-3xl font-bold tabular-nums">{servings}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">servings</p>
          </div>
          <StepperButton label="More servings" onClick={() => setServings((s) => round(s + 0.5))}>
            +
          </StepperButton>
        </div>

        {!editing && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {notable.map((t) => (
              <span
                key={t.key}
                className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {t.label} {formatAmount((food.nutrients[t.key] ?? 0) * servings)} {t.unit}
              </span>
            ))}
          </div>
        )}

        {editing && (
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            {NUTRIENT_TARGETS.map((t) => (
              <label key={t.key} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">{t.label}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  value={draft[t.key] ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [t.key]: e.target.value }))}
                  className="field w-24 py-1 text-right text-sm"
                />
                <span className="w-10 text-xs text-slate-400">{t.unit}</span>
              </label>
            ))}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          {editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost flex-1">
                Cancel
              </button>
              <button type="button" onClick={saveEdits} className="btn btn-primary flex-1">
                Save values
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setEditing(true)} className="btn btn-ghost">
                Edit values
              </button>
              <button
                type="button"
                onClick={() => onAdd(servings)}
                className="btn btn-primary flex-1"
              >
                Add to today
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


/** Type a food name and its nutrient amounts; it's saved to the database for reuse. */
function CustomFoodForm({ onDone }: { onDone: () => void }) {
  const { addCustomFood, logFood } = useStore();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🍽️');
  const [servingLabel, setServingLabel] = useState('1 serving');
  const [values, setValues] = useState<Record<string, string>>({});
  const [logNow, setLogNow] = useState(true);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const nutrients: Partial<Record<NutrientKey, number>> = {};
    for (const [key, raw] of Object.entries(values)) {
      const value = Number(raw);
      if (raw.trim() !== '' && !Number.isNaN(value) && value !== 0) nutrients[key] = value;
    }

    const created = addCustomFood({
      name: name.trim(),
      emoji: emoji.trim() || '🍽️',
      servingLabel: servingLabel.trim() || '1 serving',
      nutrients,
    });
    if (logNow) logFood(created.id, 1);
    onDone();
  };

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h3 className="section-title">Custom food</h3>

      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          aria-label="Emoji"
          className="field w-16 text-center"
          maxLength={4}
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Food name"
          aria-label="Food name"
          className="field flex-1"
          required
        />
      </div>

      <input
        value={servingLabel}
        onChange={(e) => setServingLabel(e.target.value)}
        placeholder="Serving, e.g. 1 cup"
        aria-label="Serving size"
        className="field"
      />

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Fill in what you know — anything left blank counts as zero. You can edit these later.
      </p>

      <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
        {NUTRIENT_TARGETS.map((t) => (
          <label key={t.key} className="flex items-center gap-2 text-sm">
            <span className="flex-1 truncate">{NUTRIENTS_BY_KEY[t.key].label}</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={values[t.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [t.key]: e.target.value }))}
              className="field w-24 py-1 text-right text-sm"
              placeholder="0"
            />
            <span className="w-10 text-xs text-slate-400">{t.unit}</span>
          </label>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={logNow}
          onChange={(e) => setLogNow(e.target.checked)}
          className="h-4 w-4 rounded"
        />
        Log one serving right away
      </label>

      <div className="flex gap-2">
        <button type="button" onClick={onDone} className="btn btn-ghost flex-1">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary flex-1">
          Save food
        </button>
      </div>
    </form>
  );
}
