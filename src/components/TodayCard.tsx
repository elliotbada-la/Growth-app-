import { WATER_KEY } from '../data/nutrients';
import { addDays, today } from '../lib/dates';
import { formatAmount, statusFor } from '../lib/nutrition';
import { formatHours, formatWeight } from '../lib/units';
import { useStore } from '../store/AppStore';
import ProgressRing from './ProgressRing';

export default function TodayCard() {
  const { overall, progressByKey, data, settings } = useStore();

  const water = progressByKey[WATER_KEY];
  const lastNight =
    data.sleepLog.find((s) => s.date === today()) ??
    data.sleepLog.find((s) => s.date === addDays(today(), -1));
  const latestWeight = data.weightLog[data.weightLog.length - 1];

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <section className="card">
      <div className="flex items-center gap-4">
        <ProgressRing
          ratio={overall / 100}
          status={statusFor(overall / 100)}
          label={`${overall}%`}
          sublabel="goals"
        />
        <div className="min-w-0">
          <h2 className="text-lg font-bold">{greeting} 👋</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {overall >= 80
              ? "You're crushing today's goals."
              : overall >= 40
                ? 'Solid start — a few gaps left to fill.'
                : 'Fresh day. Log what you eat and watch it fill up.'}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat
          label="Water"
          value={water ? `${formatAmount(water.consumed)} L` : '0 L'}
          sub={water ? `of ${formatAmount(water.goal)} L` : ''}
        />
        <Stat
          label="Sleep"
          value={lastNight ? formatHours(lastNight.hours) : '—'}
          sub={lastNight ? 'last night' : 'not logged'}
        />
        <Stat
          label="Weight"
          value={latestWeight ? formatWeight(latestWeight.weightKg, settings.weightUnit) : '—'}
          sub={latestWeight ? 'latest' : 'not logged'}
        />
      </dl>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-2.5 dark:bg-slate-800/60">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-base font-bold tabular-nums">{value}</dd>
      {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}
