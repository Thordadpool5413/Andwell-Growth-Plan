import { useState, useMemo } from "react";

export function useSortableTable(data, defaultKey, defaultDir = "asc") {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);

  const toggleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "string" ? av.localeCompare(bv) : (av ?? 0) - (bv ?? 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  return { sorted, sortKey, sortDir, toggleSort };
}

export function SortIcon({ active, dir }) {
  if (!active) return <span className="ml-1 opacity-30 text-[10px]">↕</span>;
  return (
    <span className="ml-1 text-[10px] text-blue-400">
      {dir === "asc" ? "↑" : "↓"}
    </span>
  );
}

export function SortTh({ children, sortKey, currentKey, currentDir, onSort, className = "" }) {
  const active = sortKey === currentKey;
  return (
    <th
      className={`cursor-pointer select-none transition-colors hover:opacity-80 ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center">
        {children}
        <SortIcon active={active} dir={currentDir} />
      </span>
    </th>
  );
}
