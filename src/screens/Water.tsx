import { useMemo, useState } from 'react';
import { GLASS_ML } from '../lib/constants';
import { lastNDays, shortDayLabel } from '../lib/dates';
import { mlToOz } from '../lib/units';
import { useStore } from '../store/AppStore';

const QUICK_ADDS = [
  { label: '+1 glass', ml: GLASS_ML, icon: '🥛' },
  { label: '+500 ml', ml: 500, icon: '🍶' },
  { label: '+750 ml', ml: 750, icon: '🚰' },
  { label: '+1 L', ml: 1000, icon: '💧' },
];

export default function Water() {
  const { data, date, settings, addWater, removeWater } = useStore();
  const [custom, setCustom] = useState('');

  const todayMl = useMemo(
    () => data.waterLog.filter((w) => w.date === date).reduce((sum, w) => sum + w.amountMl, 0),
    [data.waterLog, date],
  );

  const entries = useMemo(
    () => data.waterLog.filter((w) => w.date === date).sort((a, b) => b.loggedAt - a.loggedAt),
    [data.waterLog, date],
  );

  const week = useMemo(() => {
    const days = lastNDays(7);
    return days.map((d) => ({
      date: d,
      ml: data.waterLog.filter((w) => w.date === d).reduce((sum, w) => sum + w.amountMl, 0),
    }));
  }, [data.waterLog]);

  const goal = settings.waterGoalMl;
  const percent = Math.min(100, Math.round((todayMl / goal) * 100));
  const remaining = Math.max(0, goal - todayMl);

  return (
    <div className="space-y-4">
      <section className="card flex items-center gap-5">
        {/* Fill-up visual */}
        <div className="relative h-40 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
          <div
            className="absolute inset-x-0 bottom-0 bg-linear-to-t from-brand-600 to-brand-400 transition-[height] duration-500"
            style={{ height: `${percent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold tabular-nums text-slate-800 mix-blend-luminosity dark:text-white">
              {percent}%
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-3xl font-bold tabular-nums">{(todayMl / 1000).toFixed(2)} L</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            of {(goal / 1000).toFixed(1)} L ({Math.round(mlToOz(goal))} oz)
          </p>
          <p className="mt-2 text-sm font-medium">
            {remaining > 0 ? `${(remaining / 1000).toFixed(2)} L to go` : 'Goal met 🎉'}
          </p>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            Drink more when you're active or it's hot out.
          </p>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Quick add</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {QUICK_ADDS.map((q) => (
            <button
              key={q.ml}
              type="button"
              onClick={() => addWater(q.ml)}
              className="btn btn-ghost py-3 text-base"
            >
              <span aria-hidden="true">{q.icon}</span> {q.label}
            </button>
          ))}
        </div>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const ml = Number(custom);
            if (ml > 0) addWater(ml);
            setCustom('');
          }}
        >
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Custom amount (ml)"
            aria-label="Custom amount in millilitres"
            className="field flex-1"
          />
          <button type="submit" className="btn btn-primary">
            Add
          </button>
        </form>
      </section>

      <section className="card">
        <h3 className="section-title">Last 7 days</h3>
        <div className="mt-3 flex h-24 items-end gap-2">
          {week.map((d) => {
            const h = Math.min(100, (d.ml / goal) * 100);
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-full w-full items-end rounded-md bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`w-full rounded-md transition-[height] duration-500 ${
                      d.ml >= goal ? 'bg-emerald-500' : 'bg-brand-400'
                    }`}
                    style={{ height: `${Math.max(4, h)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">{shortDayLabel(d.date)}</span>
              </div>
            );
          })}
        </div>
      </section>

      {entries.length > 0 && (
        <section className="card">
          <h3 className="section-title">Today's drinks</h3>
          <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
            {entries.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                <span className="tabular-nums">{e.amountMl} ml</span>
                <span className="text-xs text-slate-400">
                  {new Date(e.loggedAt).toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => removeWater(e.id)}
                  aria-label="Remove drink"
                  className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
