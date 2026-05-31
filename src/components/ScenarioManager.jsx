import React, { useState } from "react";
import { useScenarioStore } from "../store/scenarioStore.js";
import { useDarkMode } from "./DarkModeContext.jsx";
import Button from "./Button.jsx";
import Modal from "./Modal.jsx";
import { Save, Download, Upload, Trash2, Edit2 } from "lucide-react";

export default function ScenarioManager() {
  const { dark } = useDarkMode();
  const {
    scenarios,
    activeScenarioId,
    saveScenario,
    loadScenario,
    deleteScenario,
    updateScenarioMetadata,
    exportScenarios,
    importScenarios,
  } = useScenarioStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState(null);

  const handleSaveScenario = () => {
    if (newName.trim()) {
      if (editingId) {
        updateScenarioMetadata(editingId, newName, newDescription);
        setEditingId(null);
      } else {
        saveScenario(newName, newDescription);
      }
      setNewName("");
      setNewDescription("");
      setIsCreateModalOpen(false);
    }
  };

  const handleExport = () => {
    const data = exportScenarios();
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(data));
    element.setAttribute("download", `andwell-scenarios-${Date.now()}.json`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          importScenarios(event.target.result);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingId(null);
            setNewName("");
            setNewDescription("");
            setIsCreateModalOpen(true);
          }}
          icon={<Save className="h-4 w-4" />}
        >
          Save Scenario
        </Button>

        {scenarios.length > 0 && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsListOpen(!isListOpen)}
            >
              Saved ({scenarios.length})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              icon={<Download className="h-4 w-4" />}
            >
              Export
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleImport}
          icon={<Upload className="h-4 w-4" />}
        >
          Import
        </Button>
      </div>

      {/* Scenario List */}
      {isListOpen && scenarios.length > 0 && (
        <div
          className={`
            rounded-2xl border p-4 space-y-2 max-h-64 overflow-y-auto animate-slide-in
            ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}
          `}
        >
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`
                flex items-center justify-between p-3 rounded-lg border
                ${
                  activeScenarioId === scenario.id
                    ? dark
                      ? "border-blue-500 bg-blue-950/50"
                      : "border-blue-500 bg-blue-50"
                    : dark
                      ? "border-slate-600 bg-slate-700 hover:bg-slate-650"
                      : "border-slate-300 bg-white hover:bg-slate-50"
                }
              `}
            >
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => loadScenario(scenario.id)}
                  className="block text-left"
                >
                  <p className={`font-semibold text-sm ${dark ? "text-white" : "text-slate-900"}`}>
                    {scenario.name}
                  </p>
                  <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                    {scenario.description}
                  </p>
                  <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
                    {new Date(scenario.createdAt).toLocaleDateString()}
                  </p>
                </button>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditingId(scenario.id);
                    setNewName(scenario.name);
                    setNewDescription(scenario.description);
                    setIsCreateModalOpen(true);
                  }}
                  className="p-1 hover:opacity-70"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteScenario(scenario.id)}
                  className="p-1 hover:opacity-70 text-error-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingId ? "Edit Scenario" : "Save Scenario"}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className={`text-sm font-semibold ${dark ? "text-slate-200" : "text-slate-700"}`}>
              Name *
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Conservative Growth"
              className={`
                mt-2 w-full px-3 py-2 rounded-lg border
                ${dark
                  ? "border-slate-600 bg-slate-700 text-white"
                  : "border-slate-300 bg-white text-slate-900"}
              `}
            />
          </div>
          <div>
            <label className={`text-sm font-semibold ${dark ? "text-slate-200" : "text-slate-700"}`}>
              Description
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Add notes about this scenario..."
              rows="3"
              className={`
                mt-2 w-full px-3 py-2 rounded-lg border
                ${dark
                  ? "border-slate-600 bg-slate-700 text-white"
                  : "border-slate-300 bg-white text-slate-900"}
              `}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveScenario}
              disabled={!newName.trim()}
            >
              {editingId ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
