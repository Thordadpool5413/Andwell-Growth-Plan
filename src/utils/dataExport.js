import Papa from "papaparse";

export async function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error),
    });
  });
}

export function exportToCSV(data, filename = "export.csv") {
  const csv = Papa.unparse(data);
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export async function exportToJSON(data, filename = "export.json") {
  const json = JSON.stringify(data, null, 2);
  const element = document.createElement("a");
  element.setAttribute("href", "data:application/json;charset=utf-8," + encodeURIComponent(json));
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export async function exportToPDF(htmlContent, filename = "export.pdf") {
  // This requires additional setup - placeholder for implementation
  console.warn("PDF export requires additional setup. Use print-to-PDF for now.");
}

export function generateActivityFeed(changes) {
  return changes.map((change) => ({
    id: `${change.timestamp}-${Math.random()}`,
    timestamp: change.timestamp,
    message: change.message,
    type: change.type, // 'created', 'updated', 'deleted'
    user: change.user || "System",
    details: change.details,
  }));
}

export function createAuditLog(action, details, userId = "user") {
  return {
    timestamp: new Date().toISOString(),
    action,
    details,
    userId,
  };
}

export function parseImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        if (file.name.endsWith(".csv")) {
          Papa.parse(event.target.result, {
            header: true,
            complete: (results) => resolve({ type: "csv", data: results.data }),
            error: reject,
          });
        } else if (file.name.endsWith(".json")) {
          const json = JSON.parse(event.target.result);
          resolve({ type: "json", data: json });
        } else {
          reject(new Error("Unsupported file format"));
        }
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));

    if (file.name.endsWith(".json")) {
      reader.readAsText(file);
    } else {
      reader.readAsText(file);
    }
  });
}
