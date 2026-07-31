import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { hoursBetween, lastNDays, shortDateLabel, shortDayLabel, today } from '../lib/dates';
import { formatHours } from '../lib/units';
import { useStore } from '../store/AppStore';

export default function Sleep() {
  const { data, settings, logSleep, removeSleep } = useStore();
  const [mode, setMode] = useState<'times' | 'hours'>('times');
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [hours, setHours] = useState('8.5');
  const [quality, setQuality] = useState(0);
  const [notes, setNotes] = useState('');
  const [range, setRange] = useState<7 | 30>(7);

  const { sleepGoalMinHours: minGoal, sleepGoalMaxHours: maxGoal } = settings;

  const computedHours = mode === 'times' ? hoursBetween(bedtime, wakeTime) : Number(hours) || 0;

  const chartData = useMemo(() => {
    const byDate = new Map(data.sleepLog.map((s) => [s.date, s]));
    return lastNDays(range).map((d) => ({
      date: d,
      label: range === 7 ? shortDayLabel(d) : shortDateLabel(d),
      hours: byDate.get(d)?.hours ?? 0,
    }));
  }, [data.sleepLog, range]);

  const logged = chartData.filter((d) => d.hours > 0);
  const average = logged.length
    ? logged.reduce((sum, d) => sum + d.hours, 0) / logged.length
    : 0;
  const nightsOnTarget = logged.filter((d) => d.hours >= minGoal).length;

  const recent = useMemo(
    () => [...data.sleepLog].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [data.sleepLog],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (computedHours <= 0) return;
    logSleep({
      date: today(),
      hours: computedHours,
      bedtime: mode === 'times' ? bedtime : undefined,
      wakeTime: mode === 'times' ? wakeTime : undefined,
      quality: quality > 0 ? (quality as 1 | 2 | 3 | 4 | 5) : undefined,
      notes: notes.trim() || undefined,
    });
    setNotes('');
    setQuality(0);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Log last night</h3>
          <div className="flex gap-1">
            {(['times', 'hours'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  mode === m
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {m === 'times' ? 'Bed / wake' : 'Total hours'}
              </button>
            ))}
          </div>
        </div>

        {mode === 'times' ? (
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400">Bedtime</span>
              <input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                className="field mt-1"
              />
            </label>
            <label className="text-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400">Wake up</span>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="field mt-1"
              />
            </label>
          </div>
        ) : (
          <label className="block text-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400">Hours slept</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.25"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="field mt-1"
            />
          </label>
        )}

        <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
          <p className="text-2xl font-bold tabular-nums">{formatHours(computedHours)}</p>
          <p
            className={`mt-0.5 text-xs font-medium ${
              computedHours < minGoal
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {computedHours < minGoal
              ? `Under the ${minGoal}–${maxGoal} h teen target — try for an earlier night.`
              : `In the ${minGoal}–${maxGoal} h target band 👍`}
          </p>
        </div>

        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Quality (optional)</span>
          <div className="mt-1 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setQuality((q) => (q === star ? 0 : star))}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                className="text-2xl leading-none"
              >
                <span className={star <= quality ? '' : 'opacity-25'}>⭐</span>
              </button>
            ))}
          </div>
        </div>

        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          aria-label="Notes"
          className="field"
        />

        <button type="submit" className="btn btn-primary w-full py-3">
          Save sleep
        </button>
      </form>

      <section className="card">
        <div className="flex items-center justify-between">
          <h3 className="section-title">History</h3>
          <div className="flex gap-1">
            {([7, 30] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  range === r
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {r} nights
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <ReferenceArea y1={minGoal} y2={maxGoal} fill="#34d399" fillOpacity={0.12} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                interval={range === 7 ? 0 : 4}
                stroke="currentColor"
                className="text-slate-400"
              />
              <YAxis
                domain={[0, 12]}
                tick={{ fontSize: 10 }}
                stroke="currentColor"
                className="text-slate-400"
              />
              <Tooltip
                formatter={(value: number) => [formatHours(value), 'Sleep']}
                contentStyle={{ borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {chartData.map((d) => (
                  <Cell
                    key={d.date}
                    fill={d.hours === 0 ? '#e2e8f0' : d.hours >= minGoal ? '#10b981' : '#fbbf24'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-slate-50 py-2 dark:bg-slate-800/60">
            <dt className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Average
            </dt>
            <dd className="text-lg font-bold tabular-nums">
              {average > 0 ? formatHours(average) : '—'}
            </dd>
          </div>
          <div className="rounded-xl bg-slate-50 py-2 dark:bg-slate-800/60">
            <dt className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Nights on target
            </dt>
            <dd className="text-lg font-bold tabular-nums">
              {nightsOnTarget}/{logged.length || 0}
            </dd>
          </div>
        </dl>
      </section>

      {recent.length > 0 && (
        <section className="card">
          <h3 className="section-title">Recent nights</h3>
          <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
            {recent.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {shortDateLabel(s.date)} · {formatHours(s.hours)}
                    {s.quality ? ` · ${'⭐'.repeat(s.quality)}` : ''}
                  </p>
                  {s.notes && (
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{s.notes}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeSleep(s.id)}
                  aria-label="Remove sleep entry"
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
