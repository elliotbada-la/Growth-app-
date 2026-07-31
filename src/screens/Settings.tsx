import { useState } from 'react';
import Disclaimer from '../components/Disclaimer';
import {
  PROTEIN_MULTIPLIER_DEFAULT,
  PROTEIN_MULTIPLIER_LIFTING_DEFAULT,
  PROTEIN_MULTIPLIER_LIFTING_MAX,
  PROTEIN_MULTIPLIER_LIFTING_MIN,
} from '../lib/constants';
import { proteinGoal } from '../lib/nutrition';
import { toDisplayWeight, toStoredWeight } from '../lib/units';
import type { Theme, TrainingMode, WeightUnit } from '../lib/types';
import { useStore } from '../store/AppStore';

export default function Settings() {
  const { settings, updateSettings, logWeight, resetDay, resetAll, exportCsv } = useStore();
  const [weightInput, setWeightInput] = useState(() =>
    toDisplayWeight(settings.currentWeightKg, settings.weightUnit).toFixed(1),
  );
  const [confirmReset, setConfirmReset] = useState(false);

  const setUnit = (unit: WeightUnit) => {
    updateSettings({ weightUnit: unit });
    setWeightInput(toDisplayWeight(settings.currentWeightKg, unit).toFixed(1));
  };

  const setMode = (mode: TrainingMode) => {
    updateSettings({
      trainingMode: mode,
      proteinMultiplier:
        mode === 'lifting' ? PROTEIN_MULTIPLIER_LIFTING_DEFAULT : PROTEIN_MULTIPLIER_DEFAULT,
    });
  };

  const commitWeight = () => {
    const entered = Number(weightInput);
    if (entered > 0) logWeight(Number(toStoredWeight(entered, settings.weightUnit).toFixed(2)));
  };

  const downloadCsv = () => {
    const blob = new Blob([exportCsv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'growthtracker-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <section className="card space-y-3">
        <h3 className="section-title">You</h3>

        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Weight unit</span>
          <div className="mt-1 flex gap-2">
            {(['kg', 'lb'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`btn flex-1 ${settings.weightUnit === u ? 'btn-primary' : 'btn-ghost'}`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Current weight ({settings.weightUnit})
          </span>
          <div className="mt-1 flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="field flex-1"
            />
            <button type="button" onClick={commitWeight} className="btn btn-primary">
              Save
            </button>
          </div>
        </label>
      </section>

      <section className="card space-y-3">
        <h3 className="section-title">Protein goal</h3>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('default')}
            className={`btn flex-1 ${settings.trainingMode === 'default' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Everyday
          </button>
          <button
            type="button"
            onClick={() => setMode('lifting')}
            className={`btn flex-1 ${settings.trainingMode === 'lifting' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Lifting / training
          </button>
        </div>

        {settings.trainingMode === 'lifting' ? (
          <label className="block">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Grams per kg: <strong>{settings.proteinMultiplier.toFixed(2)}</strong> (
              {PROTEIN_MULTIPLIER_LIFTING_MIN}–{PROTEIN_MULTIPLIER_LIFTING_MAX})
            </span>
            <input
              type="range"
              min={PROTEIN_MULTIPLIER_LIFTING_MIN}
              max={PROTEIN_MULTIPLIER_LIFTING_MAX}
              step={0.05}
              value={settings.proteinMultiplier}
              onChange={(e) => updateSettings({ proteinMultiplier: Number(e.target.value) })}
              className="mt-2 w-full accent-brand-600"
            />
          </label>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Everyday mode uses {PROTEIN_MULTIPLIER_DEFAULT} g per kg — the minimum for healthy
            growth.
          </p>
        )}

        <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
          <p className="text-2xl font-bold tabular-nums">{proteinGoal(settings)} g</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            daily protein goal · {settings.currentWeightKg.toFixed(1)} kg ×{' '}
            {settings.proteinMultiplier}
          </p>
        </div>
      </section>

      <section className="card space-y-3">
        <h3 className="section-title">Daily targets</h3>

        <label className="block">
          <span className="text-xs text-slate-500 dark:text-slate-400">Water goal (ml)</span>
          <input
            type="number"
            inputMode="numeric"
            min="500"
            step="100"
            value={settings.waterGoalMl}
            onChange={(e) => updateSettings({ waterGoalMl: Number(e.target.value) || 0 })}
            className="field mt-1"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs text-slate-500 dark:text-slate-400">Sleep min (h)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              max="24"
              value={settings.sleepGoalMinHours}
              onChange={(e) => updateSettings({ sleepGoalMinHours: Number(e.target.value) || 0 })}
              className="field mt-1"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500 dark:text-slate-400">Sleep max (h)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              max="24"
              value={settings.sleepGoalMaxHours}
              onChange={(e) => updateSettings({ sleepGoalMaxHours: Number(e.target.value) || 0 })}
              className="field mt-1"
            />
          </label>
        </div>
      </section>

      <section className="card space-y-3">
        <h3 className="section-title">Appearance</h3>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as Theme[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => updateSettings({ theme: t })}
              className={`btn flex-1 capitalize ${settings.theme === t ? 'btn-primary' : 'btn-ghost'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="card space-y-3">
        <h3 className="section-title">Focus alerts</h3>
        {Object.keys(settings.snoozedAlerts).length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">Nothing snoozed right now.</p>
        ) : (
          <button
            type="button"
            onClick={() => updateSettings({ snoozedAlerts: {} })}
            className="btn btn-ghost w-full"
          >
            Un-snooze all alerts
          </button>
        )}
      </section>

      <section className="card space-y-3">
        <h3 className="section-title">Data</h3>
        <button type="button" onClick={downloadCsv} className="btn btn-ghost w-full">
          ⬇️ Export as CSV
        </button>
        <button type="button" onClick={() => resetDay()} className="btn btn-ghost w-full">
          Reset today's food & water
        </button>
        {confirmReset ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="btn btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                resetAll();
                setConfirmReset(false);
              }}
              className="btn flex-1 bg-rose-600 text-white hover:bg-rose-700"
            >
              Yes, erase everything
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="btn w-full text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            Erase all history
          </button>
        )}
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Everything is stored on this device only — no account, works offline.
        </p>
      </section>

      <Disclaimer />
    </div>
  );
}
