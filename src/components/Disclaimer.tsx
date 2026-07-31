export default function Disclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="px-1 pb-2 text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
        For tracking and education only — not medical advice. Talk to a doctor or registered
        dietitian before starting any supplement (including creatine) or making big diet changes.
      </p>
    );
  }

  return (
    <section className="rounded-2xl bg-slate-100 p-4 text-xs leading-relaxed text-slate-500 dark:bg-slate-900 dark:text-slate-400">
      <h3 className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
        A quick note
      </h3>
      <p>
        GrowthTracker is for tracking and education only. It isn't medical advice and it isn't a
        medical device. Targets shown are general teen guidelines, not a personal prescription —
        talk to a doctor or registered dietitian before starting any supplement (including
        creatine) or making big changes to how you eat.
      </p>
    </section>
  );
}
