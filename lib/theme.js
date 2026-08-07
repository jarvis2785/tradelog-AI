"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
export const THEME_STORAGE_KEY = "tradelog_theme";

// theme-color meta tag needs a literal computed value; browsers don't
// resolve CSS custom properties for it, so these two constants are the
// one unavoidable exception to "no hardcoded colors in the codebase".
export const THEME_META_COLOR = { dark: "#0a0a0a", light: "#f8f9fa" };

export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var theme=(t==='light'||t==='dark')?t:'dark';document.documentElement.setAttribute('data-theme',theme);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof document === "undefined") return "dark";
    return document.documentElement.getAttribute("data-theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_META_COLOR[theme]);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch (e) {
        // ignore storage errors
      }
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
