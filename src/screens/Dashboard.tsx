import { useMemo, useState } from 'react';
import type { Screen } from '../components/BottomNav';
import Disclaimer from '../components/Disclaimer';
import FocusCard from '../components/FocusCard';
import NutrientBar from '../components/NutrientBar';
import ProgressRing from '../components/ProgressRing';
import TodayCard from '../components/TodayCard';
import { CATEGORY_LABELS } from '../data/nutrients';
import { formatAmount } from '../lib/nutrition';
import type { NutrientCategory } from '../lib/types';
import { useStore } from '../store/AppStore';

const TABS: NutrientCategory[] = ['main', 'vitamin', 'mineral', 'optional'];

export default function Dashboard({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { progress, focusAlerts } = useStore();
  const [tab, setTab] = useState<NutrientCategory>('main');

  const focusKeys = useMemo(
    () => new Set(focusAlerts.filter((a) => a.kind === 'today').map((a) => a.key)),
    [focusAlerts],
  );

  const mainProgress = progress.filter((p) => p.target.category === 'main');
  const shown = progress.filter((p) => p.target.category === tab);

  return (
    <div className="space-y-4">
      <TodayCard />
      <FocusCard onLogFood={() => onNavigate('food')} />

      <section className="card">
        <h3 className="section-title">Main focus</h3>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {mainProgress.map((p) => (
            <button
              key={p.target.key}
              type="button"
              onClick={() => setTab('main')}
              className="flex flex-col items-center gap-1"
              title={`${p.target.label}: ${formatAmount(p.consumed)} of ${formatAmount(p.goal)} ${p.target.unit}`}
            >
              <ProgressRing
                ratio={p.ratio}
                status={p.status}
                size={62}
                strokeWidth={6}
                label={`${p.percent}`}
              />
              <span className="w-full truncate text-center text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {p.target.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                tab === t
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {CATEGORY_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
          {shown.map((p) => (
            <NutrientBar key={p.target.key} progress={p} focus={focusKeys.has(p.target.key)} />
          ))}
        </div>

        {tab === 'optional' && (
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            Creatine is optional and isn't needed for growth. If you're curious about it, talk it
            through with a doctor or dietitian first.
          </p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => onNavigate('food')} className="btn btn-primary py-3">
          🍽️ Log food
        </button>
        <button type="button" onClick={() => onNavigate('best')} className="btn btn-ghost py-3">
          ✨ Best foods
        </button>
      </div>

      <Disclaimer />
    </div>
  );
}
