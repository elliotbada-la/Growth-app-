import { TREND_WINDOW_DAYS } from '../lib/constants';
import { useStore } from '../store/AppStore';

/**
 * "Nutrients to watch" — the 1–3 nutrients most worth extra attention, with specific
 * foods that fix them. Encouraging by design: no guilt language, and everything is
 * snoozeable.
 */
export default function FocusCard({ onLogFood }: { onLogFood?: () => void }) {
  const { focusAlerts, snoozeAlert } = useStore();

  if (focusAlerts.length === 0) {
    return (
      <section className="card border-l-4 border-l-emerald-400">
        <h3 className="text-sm font-bold">Nothing to catch up on ✨</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          No nutrient is running consistently short right now. Keep logging and this card will
          flag anything worth extra focus.
        </p>
      </section>
    );
  }

  return (
    <section className="card border-l-4 border-l-amber-400">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Nutrients to watch</h3>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          last {TREND_WINDOW_DAYS} days
        </span>
      </div>

      <ul className="mt-3 space-y-3">
        {focusAlerts.map((alert) => (
          <li key={alert.key} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{alert.headline}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{alert.message}</p>
              </div>
              <button
                type="button"
                onClick={() => snoozeAlert(alert.key)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
                aria-label={`Snooze ${alert.target.label} alert`}
              >
                Snooze
              </button>
            </div>

            {alert.suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {alert.suggestions.map((food) => (
                  <span
                    key={food.id}
                    className="rounded-full bg-white px-2 py-1 text-xs font-medium ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                  >
                    {food.emoji} {food.name}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {onLogFood && (
        <button type="button" onClick={onLogFood} className="btn btn-ghost mt-3 w-full">
          Log something now
        </button>
      )}
    </section>
  );
}
