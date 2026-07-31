import type { ReactNode } from 'react';

/** Round to a sane precision for half-serving steps. */
export function roundServings(n: number): number {
  return Math.round(n * 100) / 100;
}

export function StepperButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="h-7 w-7 rounded-lg bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      {children}
    </button>
  );
}

/** Servings chooser used wherever a food is about to be logged. */
export function ServingStepper({
  servings,
  onChange,
}: {
  servings: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <StepperButton
        label="Fewer servings"
        onClick={() => onChange(Math.max(0.5, roundServings(servings - 0.5)))}
      >
        −
      </StepperButton>
      <div className="text-center">
        <p className="text-2xl font-bold tabular-nums">{servings}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">servings</p>
      </div>
      <StepperButton label="More servings" onClick={() => onChange(roundServings(servings + 0.5))}>
        +
      </StepperButton>
    </div>
  );
}
