import { formatAmount } from '../lib/nutrition';
import type { NutrientProgress } from '../lib/types';
import { STATUS_BAR, STATUS_TEXT } from './ui';

interface Props {
  progress: NutrientProgress;
  /** Show a "Focus on this" tag (set by the Focus Alerts engine). */
  focus?: boolean;
}

export default function NutrientBar({ progress, focus }: Props) {
  const { target, goal, consumed, remaining, percent, status } = progress;
  const width = Math.min(100, Math.max(0, percent));

  return (
    <div className="py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-medium">{target.label}</span>
          {focus && (
            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
              Focus on this
            </span>
          )}
        </div>
        <span className={`shrink-0 text-sm font-semibold tabular-nums ${STATUS_TEXT[status]}`}>
          {percent}%
        </span>
      </div>

      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${STATUS_BAR[status]}`}
          style={{ width: `${width}%` }}
        />
      </div>

      <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="tabular-nums">
          {formatAmount(consumed)} / {formatAmount(goal)} {target.unit}
        </span>
        <span className="tabular-nums">
          {remaining > 0 ? `${formatAmount(remaining)} ${target.unit} to go` : 'Goal met 🎉'}
        </span>
      </div>

      {target.note && (
        <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{target.note}</p>
      )}
    </div>
  );
}
