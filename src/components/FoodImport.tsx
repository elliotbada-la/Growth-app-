import { useState } from 'react';
import { NUTRIENT_TARGETS, NUTRIENTS_BY_KEY } from '../data/nutrients';
import { loadApiKey, lookupFoodWithAi } from '../lib/aiLookup';
import { formatAmount } from '../lib/nutrition';
import {
  lookupBarcode,
  searchOpenFoodFacts,
  type OffFood,
} from '../lib/openFoodFacts';
import type { FoodItem, NutrientKey } from '../lib/types';
import { useStore } from '../store/AppStore';
import BarcodeScanner from './BarcodeScanner';
import { ServingStepper } from './Stepper';

/** A food that came from somewhere external and is waiting to be accepted. */
interface PendingFood {
  food: Omit<FoodItem, 'id'>;
  /** Where it came from, shown so the numbers can be judged. */
  source: string;
  note?: string;
  /** Nutrient keys whose imported value looks implausible. */
  suspicious?: NutrientKey[];
}

/**
 * Review step shared by every import route. Nothing reaches the food log without
 * passing through here first, so an odd figure from any source is visible and
 * correctable rather than silently skewing the day's totals.
 */
function ImportPreview({
  pending,
  onSaved,
  onDiscard,
}: {
  pending: PendingFood;
  onSaved: () => void;
  onDiscard: () => void;
}) {
  const { addCustomFood, logFood } = useStore();
  const [servings, setServings] = useState(1);

  const notable = NUTRIENT_TARGETS.filter((t) => (pending.food.nutrients[t.key] ?? 0) > 0).slice(
    0,
    10,
  );

  const save = () => {
    const created = addCustomFood({
      name: pending.food.name,
      emoji: pending.food.emoji,
      servingLabel: pending.food.servingLabel,
      nutrients: pending.food.nutrients,
    });
    logFood(created.id, servings);
    onSaved();
  };

  return (
    <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <p className="text-sm font-semibold">
        <span aria-hidden="true">{pending.food.emoji}</span> {pending.food.name}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {pending.food.servingLabel} · {pending.source}
      </p>
      {pending.note && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{pending.note}</p>
      )}

      {pending.suspicious && pending.suspicious.length > 0 && (
        <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Worth a look:{' '}
          {pending.suspicious.map((k) => NUTRIENTS_BY_KEY[k]?.label ?? k).join(', ')} came back
          unusually high for one serving. Save it and edit the values, or discard it.
        </p>
      )}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {notable.map((t) => (
          <span
            key={t.key}
            className="rounded-full bg-white px-2 py-1 text-[11px] font-medium ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
          >
            {t.label} {formatAmount((pending.food.nutrients[t.key] ?? 0) * servings)} {t.unit}
          </span>
        ))}
      </div>

      <div className="mt-3">
        <ServingStepper servings={servings} onChange={setServings} />
      </div>

      <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
        Saved to your food list so you only import it once. Tap it there any time to edit the
        values.
      </p>

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onDiscard} className="btn btn-ghost flex-1">
          Discard
        </button>
        <button type="button" onClick={save} className="btn btn-primary flex-1">
          Save &amp; log
        </button>
      </div>
    </div>
  );
}

/**
 * Open Food Facts: a free, open database of packaged foods with barcode coverage in
 * the millions. Two ways in — scan the barcode, or search by name.
 */
export function OpenFoodFactsPanel() {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<OffFood[] | null>(null);
  const [pending, setPending] = useState<PendingFood | null>(null);
  const [scanning, setScanning] = useState(false);

  const toPending = (found: OffFood): PendingFood => ({
    food: found.food,
    source: found.per100g
      ? 'Open Food Facts · per 100 g'
      : `Open Food Facts${found.barcode ? ` · ${found.barcode}` : ''}`,
    note: found.per100g
      ? 'This product lists no serving size, so values are per 100 g — set servings to match what you ate.'
      : undefined,
    suspicious: found.suspicious,
  });

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setError('');
    setResults(null);
    setPending(null);
    try {
      const found = await searchOpenFoodFacts(query.trim());
      setResults(found);
      if (found.length === 0) setError('No packaged foods matched that. Try a brand name.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setBusy(false);
    }
  };

  const runBarcode = async (barcode: string) => {
    setScanning(false);
    setBusy(true);
    setError('');
    setResults(null);
    setPending(null);
    try {
      setPending(toPending(await lookupBarcode(barcode)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Barcode lookup failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <h3 className="section-title">Packaged foods &amp; barcodes</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Scan a barcode or search Open Food Facts, a free open database of millions of packaged
        products.
      </p>

      <button
        type="button"
        onClick={() => setScanning(true)}
        className="btn btn-primary mt-3 w-full py-3"
      >
        📷 Scan a barcode
      </button>

      <form onSubmit={runSearch} className="mt-2 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by brand or product…"
          aria-label="Search packaged foods"
          className="field flex-1"
        />
        <button type="submit" disabled={busy || !query.trim()} className="btn btn-ghost">
          {busy ? '…' : 'Search'}
        </button>
      </form>

      {error && (
        <p className="mt-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}

      {results && results.length > 0 && !pending && (
        <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
          {results.map((r, i) => (
            <li key={r.barcode || `${r.food.name}-${i}`}>
              <button
                type="button"
                onClick={() => setPending(toPending(r))}
                className="flex w-full items-center gap-3 py-2.5 text-left"
              >
                <span className="text-xl" aria-hidden="true">
                  🛒
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.food.name}</span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                    {r.food.servingLabel}
                    {r.per100g ? ' · per 100 g' : ''}
                  </span>
                </span>
                <span className="text-brand-600 dark:text-brand-400" aria-hidden="true">
                  +
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {pending && (
        <ImportPreview
          pending={pending}
          onSaved={() => {
            setPending(null);
            setResults(null);
            setQuery('');
          }}
          onDiscard={() => setPending(null)}
        />
      )}

      {scanning && (
        <BarcodeScanner onDetected={(code) => void runBarcode(code)} onClose={() => setScanning(false)} />
      )}
    </section>
  );
}

/**
 * Claude-estimated nutrients for anything with no barcode — home cooking, restaurant
 * meals, whole foods the packaged database doesn't cover.
 */
export function AiLookupPanel() {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<PendingFood | null>(null);
  const hasKey = Boolean(loadApiKey());

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setError('');
    setPending(null);
    try {
      const found = await lookupFoodWithAi(query.trim(), loadApiKey());
      setPending({ food: found.food, source: 'AI estimate', note: found.note });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <h3 className="section-title">No barcode? Ask AI</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        For home cooking, restaurant meals and anything unpackaged — describe it and Claude
        estimates the nutrients.
      </p>

      <form onSubmit={run} className="mt-3 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="chicken shawarma wrap, bubble tea…"
          aria-label="Food or drink to look up"
          className="field flex-1"
        />
        <button type="submit" disabled={busy || !query.trim()} className="btn btn-primary">
          {busy ? 'Looking…' : '✨ Look up'}
        </button>
      </form>

      {!hasKey && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Add your Anthropic API key in Settings to turn this on.
        </p>
      )}

      {error && (
        <p className="mt-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}

      {pending && (
        <ImportPreview
          pending={pending}
          onSaved={() => {
            setPending(null);
            setQuery('');
          }}
          onDiscard={() => setPending(null)}
        />
      )}
    </section>
  );
}
