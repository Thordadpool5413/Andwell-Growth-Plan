import { create } from "zustand";
import { DEFAULT_SCENARIO } from "../data/constants.js";

const STORAGE_KEY = "andwell_saved_scenarios";

function cloneScenario(scenario) {
  return JSON.parse(JSON.stringify(scenario || DEFAULT_SCENARIO));
}

function scenariosMatch(left, right) {
  return JSON.stringify(left || DEFAULT_SCENARIO) === JSON.stringify(right || DEFAULT_SCENARIO);
}

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
  currentScenario: cloneScenario(DEFAULT_SCENARIO),
  scenarios: loadSaved(),
  activeScenarioId: null,

  updateScenario: (updates) =>
    set((state) => ({
      currentScenario: { ...state.currentScenario, ...updates },
    })),

  setCurrentScenario: (scenario, options = {}) =>
    set((state) => {
      const nextScenario = cloneScenario(scenario);
      const activeScenario = state.scenarios.find((entry) => entry.id === state.activeScenarioId);
      const keepActive = options.clearActiveIfChanged
        ? scenariosMatch(activeScenario?.data, nextScenario)
        : true;
      return {
        currentScenario: nextScenario,
        activeScenarioId: keepActive ? state.activeScenarioId : null,
      };
    }),

  saveScenario: (name, descriptionOrData = "", maybeDescription = "") => {
    const state = get();
    const scenarioData = descriptionOrData && typeof descriptionOrData === "object" && !Array.isArray(descriptionOrData)
      ? cloneScenario(descriptionOrData)
      : cloneScenario(state.currentScenario);
    const description = typeof descriptionOrData === "string" ? descriptionOrData : maybeDescription;
    const newScenario = {
      id: Date.now().toString(),
      name,
      description,
      data: scenarioData,
      createdAt: new Date().toISOString(),
    };
    const next = [...state.scenarios, newScenario];
    persistSaved(next);
    set({ scenarios: next, currentScenario: cloneScenario(newScenario.data), activeScenarioId: newScenario.id });
    return newScenario.id;
  },

  loadScenario: (id) => {
    const state = get();
    const scenario = state.scenarios.find((s) => s.id === id);
    if (scenario) {
      set({ currentScenario: cloneScenario(scenario.data), activeScenarioId: id });
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
    set((state) => {
      const next = state.scenarios.map((s) =>
        s.id === id ? { ...s, name, description } : s
      );
      persistSaved(next);
      return { scenarios: next };
    }),

  compareScenarios: (ids) => {
    const state = get();
    return ids.map((id) =>
      id === "current"
        ? { id: "current", name: "Current", data: state.currentScenario }
        : state.scenarios.find((s) => s.id === id)
    );
  },

  resetToDefault: () =>
    set({ currentScenario: cloneScenario(DEFAULT_SCENARIO), activeScenarioId: null }),

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
      set({ currentScenario: cloneScenario(data.current || DEFAULT_SCENARIO), scenarios: next, activeScenarioId: null });
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
