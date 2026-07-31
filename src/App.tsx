import { useEffect, useState } from 'react';
import BottomNav, { type Screen } from './components/BottomNav';
import { useStore } from './store/AppStore';
import BestFoods from './screens/BestFoods';
import Dashboard from './screens/Dashboard';
import LogFood from './screens/LogFood';
import NightWrapUp from './screens/NightWrapUp';
import Settings from './screens/Settings';
import Sleep from './screens/Sleep';
import Water from './screens/Water';
import Weight from './screens/Weight';

const TITLES: Record<Screen, string> = {
  home: 'GrowthTracker',
  food: 'Log food',
  best: 'Best foods today',
  water: 'Water',
  sleep: 'Sleep',
  weight: 'Growth',
  night: 'Wrap up your day',
  settings: 'Settings',
};

export default function App() {
  const { settings } = useStore();
  const [screen, setScreen] = useState<Screen>('home');

  // Apply the theme choice to <html> so Tailwind's dark variant picks it up.
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && media.matches);
      root.classList.toggle('dark', dark);
    };
    apply();
    if (settings.theme === 'system') {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
  }, [settings.theme]);

  // Jumping between screens should start at the top.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  return (
    <div className="min-h-full pb-20">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <h1 className="text-base font-bold tracking-tight">{TITLES[screen]}</h1>
          <div className="flex items-center gap-1">
            <IconButton
              label="Wrap up your day"
              icon="🌙"
              active={screen === 'night'}
              onClick={() => setScreen('night')}
            />
            <IconButton
              label="Settings"
              icon="⚙️"
              active={screen === 'settings'}
              onClick={() => setScreen('settings')}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        {screen === 'home' && <Dashboard onNavigate={setScreen} />}
        {screen === 'food' && <LogFood />}
        {screen === 'best' && <BestFoods onNavigate={setScreen} />}
        {screen === 'water' && <Water />}
        {screen === 'sleep' && <Sleep />}
        {screen === 'weight' && <Weight />}
        {screen === 'night' && <NightWrapUp onNavigate={setScreen} />}
        {screen === 'settings' && <Settings />}
      </main>

      <BottomNav active={screen} onChange={setScreen} />
    </div>
  );
}

function IconButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`rounded-xl px-2.5 py-1.5 text-lg transition ${
        active ? 'bg-slate-200 dark:bg-slate-800' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
      }`}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}
