export type Screen =
  | 'home'
  | 'food'
  | 'best'
  | 'water'
  | 'sleep'
  | 'weight'
  | 'night'
  | 'settings';

const NAV: Array<{ id: Screen; label: string; icon: string }> = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'food', label: 'Food', icon: '🍽️' },
  { id: 'best', label: 'Best', icon: '✨' },
  { id: 'water', label: 'Water', icon: '💧' },
  { id: 'sleep', label: 'Sleep', icon: '😴' },
  { id: 'weight', label: 'Growth', icon: '📈' },
];

export default function BottomNav({
  active,
  onChange,
}: {
  active: Screen;
  onChange: (screen: Screen) => void;
}) {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <ul className="mx-auto flex max-w-lg">
        {NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
