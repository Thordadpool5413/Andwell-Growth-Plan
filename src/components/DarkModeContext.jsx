import React, { createContext, useContext, useState, useEffect } from "react";

const DarkModeContext = createContext({ dark: false, toggle: () => {} });

export function DarkModeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("andwell-dark") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try { localStorage.setItem("andwell-dark", dark); } catch {}
    document.documentElement.classList.toggle("dark", dark);
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
