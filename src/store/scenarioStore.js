import { create } from "zustand";
import { DEFAULT_SCENARIO } from "../data/constants.js";

const STORAGE_KEY = "andwell_saved_scenarios";

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSaved(scenarios) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  } catch {}
}

export const useScenarioStore = create((set, get) => ({
  currentScenario: DEFAULT_SCENARIO,
  scenarios: loadSaved(),
  activeScenarioId: null,

  updateScenario: (updates) =>
    set((state) => ({
      currentScenario: { ...state.currentScenario, ...updates },
    })),

  saveScenario: (name, description = "") => {
    const state = get();
    const newScenario = {
      id: Date.now().toString(),
      name,
      description,
      data: state.currentScenario,
      createdAt: new Date().toISOString(),
    };
    const next = [...state.scenarios, newScenario];
    persistSaved(next);
    set({ scenarios: next, activeScenarioId: newScenario.id });
    return newScenario.id;
  },

  loadScenario: (id) => {
    const state = get();
    const scenario = state.scenarios.find((s) => s.id === id);
    if (scenario) {
      set({ currentScenario: scenario.data, activeScenarioId: id });
    }
  },

  deleteScenario: (id) => {
    const state = get();
    const next = state.scenarios.filter((s) => s.id !== id);
    persistSaved(next);
    set({
      scenarios: next,
      activeScenarioId: state.activeScenarioId === id ? null : state.activeScenarioId,
    });
  },

  updateScenarioMetadata: (id, name, description) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === id ? { ...s, name, description } : s
      ),
    })),

  compareScenarios: (ids) => {
    const state = get();
    return ids.map((id) =>
      id === "current"
        ? { id: "current", name: "Current", data: state.currentScenario }
        : state.scenarios.find((s) => s.id === id)
    );
  },

  resetToDefault: () =>
    set({ currentScenario: DEFAULT_SCENARIO, activeScenarioId: null }),

  exportScenarios: () => {
    const state = get();
    return JSON.stringify({
      current: state.currentScenario,
      scenarios: state.scenarios,
      exportDate: new Date().toISOString(),
    });
  },

  importScenarios: (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      const next = data.scenarios || [];
      persistSaved(next);
      set({ currentScenario: data.current || DEFAULT_SCENARIO, scenarios: next });
      return true;
    } catch {
      return false;
    }
  },

  getScenarioStats: () => {
    const state = get();
    return {
      totalScenarios: state.scenarios.length,
      hasSavedScenarios: state.scenarios.length > 0,
      activeScenario: state.scenarios.find((s) => s.id === state.activeScenarioId),
    };
  },
}));
