import { useMemo, useState } from 'react';
import type { Screen } from '../components/BottomNav';
import Disclaimer from '../components/Disclaimer';
import { GLASS_ML } from '../lib/constants';
import { hoursBetween, today } from '../lib/dates';
import { formatAmount } from '../lib/nutrition';
import { computeStreaks } from '../lib/streaks';
import { formatHours } from '../lib/units';
import { useStore } from '../store/AppStore';

export default function NightWrapUp({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { progress, data, foods, settings, addWater, logSleep, overall } = useStore();
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [saved, setSaved] = useState(false);

  const streaks = useMemo(
    () => computeStreaks(data, foods, settings),
    [data, foods, settings],
  );

  const counted = progress.filter((p) => p.target.category !== 'optional');
  const hit = counted.filter((p) => p.ratio >= 0.8);
  const missed = counted
    .filter((p) => p.ratio < 0.8)
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 5);

  const plannedHours = hoursBetween(bedtime, wakeTime);
  const sleepOk = plannedHours >= settings.sleepGoalMinHours;
  const waterProgress = progress.find((p) => p.target.key === 'water');

  return (
    <div className="space-y-4">
      <section className="card">
        <h2 className="text-lg font-bold">How today went 🌙</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {overall >= 80
            ? 'Great day — almost everything covered.'
            : overall >= 50
              ? 'Decent day. A couple of things to pick up tomorrow.'
              : 'Every day is a fresh start. Here is what to aim at tomorrow.'}
        </p>
        <p className="mt-3 text-3xl font-bold tabular-nums">{overall}%</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {hit.length} of {counted.length} goals at 80%+
        </p>
      </section>

      <section className="card">
        <h3 className="section-title">Streaks</h3>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Streak label="Water" days={streaks.water} icon="💧" />
          <Streak label="Protein" days={streaks.protein} icon="💪" />
          <Streak label="Sleep" days={streaks.sleep} icon="😴" />
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Top up your water</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {waterProgress && waterProgress.remaining > 0
            ? `${formatAmount(waterProgress.remaining)} L left to hit today's goal.`
            : 'Water goal is done for today 🎉'}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => addWater(GLASS_ML)} className="btn btn-ghost py-3">
            🥛 +1 glass
          </button>
          <button type="button" onClick={() => addWater(500)} className="btn btn-ghost py-3">
            🍶 +500 ml
          </button>
        </div>
      </section>

      <section className="card space-y-3">
        <h3 className="section-title">Tonight's sleep plan</h3>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400">Lights out</span>
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
        <p
          className={`text-sm font-medium ${
            sleepOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          That's {formatHours(plannedHours)}
          {sleepOk
            ? ` — right in the ${settings.sleepGoalMinHours}–${settings.sleepGoalMaxHours} h band.`
            : ` — about ${formatHours(settings.sleepGoalMinHours - plannedHours)} short of the ${settings.sleepGoalMinHours} h target.`}
        </p>
        <button
          type="button"
          onClick={() => {
            logSleep({ date: today(), hours: plannedHours, bedtime, wakeTime });
            setSaved(true);
            window.setTimeout(() => setSaved(false), 1500);
          }}
          className="btn btn-primary w-full py-3"
        >
          {saved ? 'Saved ✓' : 'Save as tonight’s plan'}
        </button>
      </section>

      {missed.length > 0 && (
        <section className="card">
          <h3 className="section-title">Catch these tomorrow</h3>
          <ul className="mt-2 space-y-1.5">
            {missed.map((p) => (
              <li key={p.target.key} className="flex items-center justify-between text-sm">
                <span>{p.target.label}</span>
                <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                  {p.percent}% · {formatAmount(p.remaining)} {p.target.unit} short
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onNavigate('best')}
            className="btn btn-ghost mt-3 w-full"
          >
            ✨ See foods that fix these
          </button>
        </section>
      )}

      <Disclaimer compact />
    </div>
  );
}

function Streak({ label, days, icon }: { label: string; days: number; icon: string }) {
  return (
    <div className="rounded-xl bg-slate-50 py-3 dark:bg-slate-800/60">
      <p className="text-xl" aria-hidden="true">
        {icon}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums">{days}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        {label} · {days === 1 ? 'day' : 'days'}
      </p>
    </div>
  );
}
