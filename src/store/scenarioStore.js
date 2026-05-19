import { create } from "zustand";
import { DEFAULT_SCENARIO } from "../data/constants.js";

export const useScenarioStore = create((set, get) => ({
  // Current scenario state
  currentScenario: DEFAULT_SCENARIO,
  scenarios: [],
  activeScenarioId: null,

  // Scenario management
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
    set((state) => ({
      scenarios: [...state.scenarios, newScenario],
      activeScenarioId: newScenario.id,
    }));
    return newScenario.id;
  },

  loadScenario: (id) => {
    const state = get();
    const scenario = state.scenarios.find((s) => s.id === id);
    if (scenario) {
      set({
        currentScenario: scenario.data,
        activeScenarioId: id,
      });
    }
  },

  deleteScenario: (id) =>
    set((state) => ({
      scenarios: state.scenarios.filter((s) => s.id !== id),
      activeScenarioId: state.activeScenarioId === id ? null : state.activeScenarioId,
    })),

  updateScenarioMetadata: (id, name, description) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === id ? { ...s, name, description } : s
      ),
    })),

  // Comparison
  compareScenarios: (ids) => {
    const state = get();
    return ids.map((id) =>
      id === "current"
        ? { id: "current", name: "Current", data: state.currentScenario }
        : state.scenarios.find((s) => s.id === id)
    );
  },

  // Reset
  resetToDefault: () =>
    set({
      currentScenario: DEFAULT_SCENARIO,
      activeScenarioId: null,
    }),

  // Import/Export
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
      set({
        currentScenario: data.current || DEFAULT_SCENARIO,
        scenarios: data.scenarios || [],
      });
      return true;
    } catch (error) {
      console.error("Failed to import scenarios:", error);
      return false;
    }
  },

  // Analytics
  getScenarioStats: () => {
    const state = get();
    return {
      totalScenarios: state.scenarios.length,
      hasSavedScenarios: state.scenarios.length > 0,
      activeScenario: state.scenarios.find((s) => s.id === state.activeScenarioId),
    };
  },
}));
