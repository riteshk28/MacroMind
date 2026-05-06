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

interface AppState {
  logs: LoggedMeal[];
  setLogs: (logs: LoggedMeal[]) => void;
  addLog: (log: LoggedMeal) => void;
  deleteLog: (id: string) => void;
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  setGoals: (goals: AppState['goals']) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      logs: [],
      setLogs: (logs) => set({ logs }),
      addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
      deleteLog: (id) => set((state) => ({ logs: state.logs.filter((l) => l.id !== id) })),
      goals: {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 65,
      },
      setGoals: (goals) => set({ goals }),
    }),
    {
      name: 'nutrivoice-db',
    }
  )
);
