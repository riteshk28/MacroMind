import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export interface FoodItem {
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  micronutrients?: Record<string, string>;
}

export interface LoggedMeal {
  id: string;
  timestamp: string | number;
  mealType: MealType;
  items: FoodItem[];
  totalCalories: number;
  rawText: string;
}

export interface WeightLog {
  id: string;
  timestamp: string | number;
  weight: number;
}

export interface Profile {
  age: number;
  gender: 'male' | 'female';
  height: number;
  weight: number;
  activityLevel: number;
  targetPace: string;
  dietPreference: string;
  activityNotes: string;
}

interface AppState {
  logs: LoggedMeal[];
  setLogs: (logs: LoggedMeal[]) => void;
  addLog: (log: LoggedMeal) => void;
  deleteLog: (id: string) => void;
  weightLogs: WeightLog[];
  setWeightLogs: (logs: WeightLog[]) => void;
  addWeightLog: (log: WeightLog) => void;
  deleteWeightLog: (id: string) => void;
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  setGoals: (goals: AppState['goals']) => void;
  profile: Profile;
  setProfile: (profile: Partial<Profile>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      logs: [],
      setLogs: (logs) => set({ logs }),
      addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
      deleteLog: (id) => set((state) => ({ logs: state.logs.filter((l) => l.id !== id) })),
      weightLogs: [],
      setWeightLogs: (logs) => set({ weightLogs: logs }),
      addWeightLog: (log) => set((state) => ({ weightLogs: [...state.weightLogs, log] })),
      deleteWeightLog: (id) => set((state) => ({ weightLogs: state.weightLogs.filter((l) => l.id !== id) })),
      goals: {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 65,
      },
      setGoals: (goals) => set({ goals }),
      profile: {
        age: 30,
        gender: 'male',
        height: 175,
        weight: 70,
        activityLevel: 1.2,
        targetPace: 'maintain',
        dietPreference: 'balanced',
        activityNotes: ''
      },
      setProfile: (profile) => set((state) => ({ profile: { ...state.profile, ...profile } }))
    }),
    {
      name: 'nutrivoice-db',
    }
  )
);
