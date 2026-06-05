import React, { createContext, useContext, useState, useEffect } from "react";

const DarkModeContext = createContext({ dark: false, toggle: () => {} });

export function DarkModeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("andwell-theme");
      return saved == null ? true : saved === "dark";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("andwell-theme", dark ? "dark" : "light");
      localStorage.removeItem("andwell-dark");
    } catch {}
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);

  const toggle = () => setDark((prev) => !prev);

  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  return useContext(DarkModeContext);
}
