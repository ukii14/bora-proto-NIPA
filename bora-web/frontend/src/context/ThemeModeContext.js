import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "themeMode";

const ThemeModeContext = createContext({
  mode: "light",
  toggleMode: () => {},
  setMode: () => {},
});

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "dark" || saved === "light" ? saved : "light";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode: () => setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    [mode]
  );

  return (
    <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeModeContext);
