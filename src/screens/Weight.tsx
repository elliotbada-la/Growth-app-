import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { shortDateLabel, today } from '../lib/dates';
import { proteinGoal } from '../lib/nutrition';
import { useStore } from '../store/AppStore';

export default function Weight() {
  const { data, settings, logWeight, removeWeight } = useStore();
  const [value, setValue] = useState('');
  const [date, setDate] = useState(today());

  const chartData = useMemo(
    () =>
      data.weightLog.map((w) => ({
        date: w.date,
        label: shortDateLabel(w.date),
        weight: Number(w.weightLb.toFixed(1)),
      })),
    [data.weightLog],
  );

  const latest = data.weightLog[data.weightLog.length - 1];
  const first = data.weightLog[0];
  const change = latest && first && latest.id !== first.id ? latest.weightLb - first.weightLb : 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = Number(value);
    if (!(entered > 0)) return;
    logWeight(Number(entered.toFixed(1)), date);
    setValue('');
  };

  return (
    <div className="space-y-4">
      <section className="card">
        <h2 className="text-sm font-bold">Growth tracker</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          You're tracking a trend, not chasing a number. Steady growth is the whole point.
        </p>

        {latest && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 py-2.5 dark:bg-slate-800/60">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Current
              </p>
              <p className="text-xl font-bold tabular-nums">
                {latest.weightLb.toFixed(1)} lb
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 py-2.5 dark:bg-slate-800/60">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Since you started
              </p>
              <p className="text-xl font-bold tabular-nums">
                {change > 0 ? '+' : ''}
                {change.toFixed(1)} lb
              </p>
            </div>
          </div>
        )}
      </section>

      <form onSubmit={submit} className="card space-y-3">
        <h3 className="section-title">Log a weigh-in</h3>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Weight in lb"
            aria-label="Weight in pounds"
            className="field flex-1"
            required
          />
          <input
            type="date"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Date"
            className="field w-40"
          />
        </div>
        <button type="submit" className="btn btn-primary w-full py-3">
          Save weight
        </button>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Your newest weigh-in sets your protein goal automatically — right now that's{' '}
          <strong>{proteinGoal(settings)} g</strong> a day at {settings.proteinPerLb} g per pound.
        </p>
      </form>

      {chartData.length > 1 && (
        <section className="card">
          <h3 className="section-title">Trend</h3>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-slate-200 dark:stroke-slate-800"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  stroke="currentColor"
                  className="text-slate-400"
                />
                <YAxis
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fontSize: 10 }}
                  stroke="currentColor"
                  className="text-slate-400"
                />
                <Tooltip
                  formatter={(v: number) => [`${v} lb`, 'Weight']}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#1f71e0"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {data.weightLog.length > 0 && (
        <section className="card">
          <h3 className="section-title">Entries</h3>
          <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
            {[...data.weightLog].reverse().map((w) => (
              <li key={w.id} className="flex items-center justify-between py-2 text-sm">
                <span>{shortDateLabel(w.date)}</span>
                <span className="font-semibold tabular-nums">
                  {w.weightLb.toFixed(1)} lb
                </span>
                <button
                  type="button"
                  onClick={() => removeWeight(w.id)}
                  aria-label="Remove weigh-in"
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
