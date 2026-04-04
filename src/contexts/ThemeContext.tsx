import { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "auto" | "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "auto",
  setMode: () => {},
  isDark: true,
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem("theme") as ThemeMode) || "auto";
  });
  const [systemDark, setSystemDark] = useState(getSystemDark);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isDark = mode === "dark" || (mode === "auto" && systemDark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);

    const themeColor = isDark ? "#0c0a09" : "#fafaf9";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", themeColor);
  }, [isDark]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem("theme", m);
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
