import React, { useState } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export default function DataTable({
  columns,
  data,
  sortable = true,
  pagination = true,
  pageSize = 10,
  onRowClick,
  className = "",
}) {
  const { dark } = useDarkMode();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(0);

  const handleSort = (columnKey) => {
    if (!sortable) return;
    setSortConfig((prev) => ({
      key: columnKey,
      direction: prev.key === columnKey && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Sort data
  let sortedData = [...data];
  if (sortConfig.key) {
    sortedData.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Paginate
  let displayData = sortedData;
  const totalPages = Math.ceil(sortedData.length / pageSize);
  if (pagination) {
    const startIdx = currentPage * pageSize;
    displayData = sortedData.slice(startIdx, startIdx + pageSize);
  }

  return (
    <div className={`rounded-2xl border overflow-hidden ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"} ${className}`}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={dark ? "border-b border-slate-700 bg-slate-750" : "border-b border-slate-200 bg-slate-50"}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`
                    px-4 py-3 text-left font-semibold
                    ${sortable && col.sortable !== false ? "cursor-pointer hover:opacity-70" : ""}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {sortable && col.sortable !== false && sortConfig.key === col.key && (
                      sortConfig.direction === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.length > 0 ? (
              displayData.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    border-b transition-colors
                    ${dark
                      ? "border-slate-700 hover:bg-slate-700"
                      : "border-slate-200 hover:bg-slate-50"
                    }
                    ${onRowClick ? "cursor-pointer" : ""}
                  `}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className={`px-4 py-6 text-center text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div
          className={`
            flex items-center justify-between px-4 py-3 border-t
            ${dark ? "border-slate-700 bg-slate-750" : "border-slate-200 bg-slate-50"}
          `}
        >
          <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-600"}`}>
            Page {currentPage + 1} of {totalPages} ({sortedData.length} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className={`p-2 rounded transition-colors ${
                currentPage === 0
                  ? dark
                    ? "opacity-50 cursor-not-allowed"
                    : "opacity-50 cursor-not-allowed"
                  : dark
                    ? "hover:bg-slate-700"
                    : "hover:bg-slate-200"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className={`p-2 rounded transition-colors ${
                currentPage === totalPages - 1
                  ? dark
                    ? "opacity-50 cursor-not-allowed"
                    : "opacity-50 cursor-not-allowed"
                  : dark
                    ? "hover:bg-slate-700"
                    : "hover:bg-slate-200"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
