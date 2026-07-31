import { useState } from 'react';
import Disclaimer from '../components/Disclaimer';
import { loadApiKey, saveApiKey } from '../lib/aiLookup';
import { PROTEIN_PER_LB_MAX, PROTEIN_PER_LB_MIN } from '../lib/constants';
import { proteinGoal } from '../lib/nutrition';
import type { Theme } from '../lib/types';
import { useStore } from '../store/AppStore';

export default function Settings() {
  const { settings, updateSettings, logWeight, resetDay, resetAll, exportCsv } = useStore();
  const [weightInput, setWeightInput] = useState(() => settings.currentWeightLb.toFixed(1));
  const [confirmReset, setConfirmReset] = useState(false);

  const commitWeight = () => {
    const entered = Number(weightInput);
    if (entered > 0) logWeight(Number(entered.toFixed(1)));
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

        <label className="block">
          <span className="text-xs text-slate-500 dark:text-slate-400">Current weight (lb)</span>
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

        <p className="text-xs text-slate-500 dark:text-slate-400">
          One gram of protein per pound of body weight. Nudge it if you want a different rate.
        </p>

        <label className="block">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Grams per pound: <strong>{settings.proteinPerLb.toFixed(2)}</strong>
          </span>
          <input
            type="range"
            min={PROTEIN_PER_LB_MIN}
            max={PROTEIN_PER_LB_MAX}
            step={0.05}
            value={settings.proteinPerLb}
            onChange={(e) => updateSettings({ proteinPerLb: Number(e.target.value) })}
            className="mt-2 w-full accent-brand-600"
          />
        </label>

        <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
          <p className="text-2xl font-bold tabular-nums">{proteinGoal(settings)} g</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            daily protein goal · {settings.currentWeightLb.toFixed(1)} lb ×{' '}
            {settings.proteinPerLb} g
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

      <AiLookupSettings />

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

/**
 * The AI food lookup calls Anthropic directly from this device with the user's own key.
 * Nothing is proxied through a server, so the key never leaves the browser except in the
 * request to Anthropic itself.
 */
function AiLookupSettings() {
  const [key, setKey] = useState(() => loadApiKey());
  const [saved, setSaved] = useState(false);

  const commit = (value: string) => {
    setKey(value);
    saveApiKey(value);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  return (
    <section className="card space-y-3">
      <h3 className="section-title">AI food lookup</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Lets you type any food or drink and have Claude estimate its nutrients. Paste an Anthropic
        API key from{' '}
        <span className="font-medium text-slate-600 dark:text-slate-300">
          console.anthropic.com
        </span>
        . Usage is billed to your own account.
      </p>

      <label className="block">
        <span className="text-xs text-slate-500 dark:text-slate-400">API key</span>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          placeholder="sk-ant-…"
          autoComplete="off"
          spellCheck={false}
          className="field mt-1 font-mono text-sm"
        />
      </label>

      <div className="flex gap-2">
        <button type="button" onClick={() => commit(key)} className="btn btn-primary flex-1">
          {saved ? 'Saved ✓' : 'Save key'}
        </button>
        {key && (
          <button type="button" onClick={() => commit('')} className="btn btn-ghost">
            Remove
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        The key is stored on this device and sent only to Anthropic. Anyone who can use this browser
        profile can use the key, so don't add one on a shared computer. Lookup needs an internet
        connection — the rest of the app keeps working offline without it.
      </p>
    </section>
  );
}
