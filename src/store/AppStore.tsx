import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import seedFoods from '../data/foods.json';
import { SNOOZE_DAYS } from '../lib/constants';
import { addDays, newId, today } from '../lib/dates';
import { computeFocusAlerts, type FocusAlert } from '../lib/focus';
import { allProgress, dailyTotals, overallPercent, resolveFoods } from '../lib/nutrition';
import { loadData, saveData } from '../lib/storage';
import type {
  AppData,
  FoodItem,
  FoodLogEntry,
  NutrientKey,
  NutrientProgress,
  SleepEntry,
  UserSettings,
  WaterEntry,
  WeightEntry,
} from '../lib/types';

const SEED_FOODS = seedFoods as FoodItem[];

interface AppStore {
  data: AppData;
  settings: UserSettings;
  foods: FoodItem[];
  date: string;
  totals: Record<NutrientKey, number>;
  progress: NutrientProgress[];
  progressByKey: Record<NutrientKey, NutrientProgress>;
  overall: number;
  focusAlerts: FocusAlert[];

  updateSettings: (patch: Partial<UserSettings>) => void;
  logFood: (foodItemId: string, servings: number, date?: string) => void;
  updateFoodEntry: (id: string, servings: number) => void;
  removeFoodEntry: (id: string) => void;
  addCustomFood: (food: Omit<FoodItem, 'id' | 'custom'>) => FoodItem;
  editFoodNutrients: (foodId: string, nutrients: Partial<Record<NutrientKey, number>>) => void;
  addWater: (amountMl: number, date?: string) => void;
  removeWater: (id: string) => void;
  logSleep: (entry: Omit<SleepEntry, 'id'>) => void;
  removeSleep: (id: string) => void;
  logWeight: (weightKg: number, date?: string) => void;
  removeWeight: (id: string) => void;
  snoozeAlert: (key: NutrientKey) => void;
  resetDay: (date?: string) => void;
  resetAll: () => void;
  exportCsv: () => string;
}

const StoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());
  const [date, setDate] = useState<string>(() => today());

  useEffect(() => {
    saveData(data);
  }, [data]);

  // Roll the "today" date over if the app is left open past midnight.
  useEffect(() => {
    const tick = setInterval(() => {
      const current = today();
      setDate((prev) => (prev === current ? prev : current));
    }, 60_000);
    return () => clearInterval(tick);
  }, []);

  const foods = useMemo(() => resolveFoods(SEED_FOODS, data), [data]);
  const totals = useMemo(() => dailyTotals(data, foods, date), [data, foods, date]);
  const progress = useMemo(() => allProgress(totals, data.settings), [totals, data.settings]);
  const progressByKey = useMemo(
    () => Object.fromEntries(progress.map((p) => [p.target.key, p])),
    [progress],
  );
  const overall = useMemo(() => overallPercent(progress), [progress]);
  const focusAlerts = useMemo(
    () => computeFocusAlerts(data, foods, data.settings),
    [data, foods],
  );

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const logFood = useCallback((foodItemId: string, servings: number, forDate?: string) => {
    const entry: FoodLogEntry = {
      id: newId(),
      date: forDate ?? today(),
      foodItemId,
      servings,
      loggedAt: Date.now(),
    };
    setData((d) => ({ ...d, foodLog: [...d.foodLog, entry] }));
  }, []);

  const updateFoodEntry = useCallback((id: string, servings: number) => {
    setData((d) => ({
      ...d,
      foodLog: d.foodLog.map((e) => (e.id === id ? { ...e, servings } : e)),
    }));
  }, []);

  const removeFoodEntry = useCallback((id: string) => {
    setData((d) => ({ ...d, foodLog: d.foodLog.filter((e) => e.id !== id) }));
  }, []);

  const addCustomFood = useCallback((food: Omit<FoodItem, 'id' | 'custom'>) => {
    const created: FoodItem = { ...food, id: `custom-${newId()}`, custom: true };
    setData((d) => ({ ...d, customFoods: [...d.customFoods, created] }));
    return created;
  }, []);

  const editFoodNutrients = useCallback(
    (foodId: string, nutrients: Partial<Record<NutrientKey, number>>) => {
      setData((d) => {
        if (d.customFoods.some((f) => f.id === foodId)) {
          return {
            ...d,
            customFoods: d.customFoods.map((f) =>
              f.id === foodId ? { ...f, nutrients: { ...f.nutrients, ...nutrients } } : f,
            ),
          };
        }
        return {
          ...d,
          foodOverrides: {
            ...d.foodOverrides,
            [foodId]: { ...(d.foodOverrides[foodId] ?? {}), ...nutrients },
          },
        };
      });
    },
    [],
  );

  const addWater = useCallback((amountMl: number, forDate?: string) => {
    const entry: WaterEntry = {
      id: newId(),
      date: forDate ?? today(),
      amountMl,
      loggedAt: Date.now(),
    };
    setData((d) => ({ ...d, waterLog: [...d.waterLog, entry] }));
  }, []);

  const removeWater = useCallback((id: string) => {
    setData((d) => ({ ...d, waterLog: d.waterLog.filter((w) => w.id !== id) }));
  }, []);

  const logSleep = useCallback((entry: Omit<SleepEntry, 'id'>) => {
    setData((d) => {
      const withoutSameDate = d.sleepLog.filter((s) => s.date !== entry.date);
      const created: SleepEntry = { ...entry, id: newId() };
      return {
        ...d,
        sleepLog: [...withoutSameDate, created].sort((a, b) => a.date.localeCompare(b.date)),
      };
    });
  }, []);

  const removeSleep = useCallback((id: string) => {
    setData((d) => ({ ...d, sleepLog: d.sleepLog.filter((s) => s.id !== id) }));
  }, []);

  const logWeight = useCallback((weightKg: number, forDate?: string) => {
    const entryDate = forDate ?? today();
    setData((d) => {
      const created: WeightEntry = { id: newId(), date: entryDate, weightKg };
      const withoutSameDate = d.weightLog.filter((w) => w.date !== entryDate);
      const weightLog = [...withoutSameDate, created].sort((a, b) => a.date.localeCompare(b.date));
      const latest = weightLog[weightLog.length - 1];
      // The newest weight feeds the protein calculator.
      return { ...d, weightLog, settings: { ...d.settings, currentWeightKg: latest.weightKg } };
    });
  }, []);

  const removeWeight = useCallback((id: string) => {
    setData((d) => {
      const weightLog = d.weightLog.filter((w) => w.id !== id);
      const latest = weightLog[weightLog.length - 1];
      return {
        ...d,
        weightLog,
        settings: latest ? { ...d.settings, currentWeightKg: latest.weightKg } : d.settings,
      };
    });
  }, []);

  const snoozeAlert = useCallback((key: NutrientKey) => {
    setData((d) => ({
      ...d,
      settings: {
        ...d.settings,
        snoozedAlerts: { ...d.settings.snoozedAlerts, [key]: addDays(today(), SNOOZE_DAYS) },
      },
    }));
  }, []);

  const resetDay = useCallback((forDate?: string) => {
    const target = forDate ?? today();
    setData((d) => ({
      ...d,
      foodLog: d.foodLog.filter((e) => e.date !== target),
      waterLog: d.waterLog.filter((w) => w.date !== target),
    }));
  }, []);

  const resetAll = useCallback(() => {
    setData((d) => ({
      settings: d.settings,
      customFoods: [],
      foodOverrides: {},
      foodLog: [],
      sleepLog: [],
      weightLog: [],
      waterLog: [],
    }));
  }, []);

  const exportCsv = useCallback(() => {
    const rows: string[][] = [['type', 'date', 'item', 'amount', 'unit', 'notes']];
    const foodName = new Map(foods.map((f) => [f.id, f.name]));
    for (const e of data.foodLog) {
      rows.push(['food', e.date, foodName.get(e.foodItemId) ?? e.foodItemId, String(e.servings), 'servings', '']);
    }
    for (const w of data.waterLog) rows.push(['water', w.date, 'Water', String(w.amountMl), 'ml', '']);
    for (const s of data.sleepLog) {
      rows.push(['sleep', s.date, 'Sleep', String(s.hours), 'hours', s.notes ?? '']);
    }
    for (const w of data.weightLog) rows.push(['weight', w.date, 'Weight', String(w.weightKg), 'kg', '']);
    return rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }, [data, foods]);

  const value: AppStore = {
    data,
    settings: data.settings,
    foods,
    date,
    totals,
    progress,
    progressByKey,
    overall,
    focusAlerts,
    updateSettings,
    logFood,
    updateFoodEntry,
    removeFoodEntry,
    addCustomFood,
    editFoodNutrients,
    addWater,
    removeWater,
    logSleep,
    removeSleep,
    logWeight,
    removeWeight,
    snoozeAlert,
    resetDay,
    resetAll,
    exportCsv,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): AppStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside AppStoreProvider');
  return ctx;
}
