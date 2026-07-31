import { useMemo, useState } from 'react';
import type { Screen } from '../components/BottomNav';
import { NUTRIENTS_BY_KEY } from '../data/nutrients';
import { formatAmount } from '../lib/nutrition';
import { joinNames, recommendFoods } from '../lib/recommend';
import { useStore } from '../store/AppStore';

export default function BestFoods({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { foods, progress, focusAlerts, logFood } = useStore();
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const emphasize = useMemo(() => focusAlerts.map((a) => a.key), [focusAlerts]);
  const suggestions = useMemo(
    () => recommendFoods(foods, progress, { emphasize }),
    [foods, progress, emphasize],
  );

  const biggestGaps = useMemo(
    () =>
      progress
        .filter((p) => p.target.category !== 'optional' && p.remaining > 0 && p.goal > 0)
        .sort((a, b) => a.ratio - b.ratio)
        .slice(0, 4),
    [progress],
  );

  const headline = useMemo(() => {
    const names = joinNames(suggestions.slice(0, 3).map((s) => `${s.food.emoji} ${s.food.name.toLowerCase()}`));
    return names ? `To hit your goals today, try: ${names}.` : '';
  }, [suggestions]);

  if (suggestions.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-3xl">🎉</p>
        <h2 className="mt-2 text-lg font-bold">Every goal is covered</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Nothing left to fill in today. Nice work.
        </p>
        <button type="button" onClick={() => onNavigate('home')} className="btn btn-ghost mt-4">
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="card">
        <h2 className="text-sm font-bold">Today's easy wins</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{headline}</p>

        {biggestGaps.length > 0 && (
          <div className="mt-3">
            <h3 className="section-title">Biggest gaps right now</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {biggestGaps.map((p) => (
                <span
                  key={p.target.key}
                  className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  {p.target.label} · {formatAmount(p.remaining)} {p.target.unit} to go
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h3 className="section-title">Ranked for what you still need</h3>
        <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
          {suggestions.map(({ food, fills }) => (
            <li key={food.id} className="flex items-center gap-3 py-3">
              <span className="text-2xl" aria-hidden="true">
                {food.emoji || '🍽️'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{food.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {fills.map((k) => NUTRIENTS_BY_KEY[k]?.label ?? k).join(', ')}
                </p>
                <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                  {food.servingLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logFood(food.id, 1);
                  setJustAdded(food.id);
                  window.setTimeout(() => setJustAdded((v) => (v === food.id ? null : v)), 1500);
                }}
                className={`btn shrink-0 ${justAdded === food.id ? 'btn-ghost' : 'btn-primary'}`}
              >
                {justAdded === food.id ? 'Added ✓' : 'Add'}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Suggestions update the moment you log something.
        </p>
      </section>
    </div>
  );
}
