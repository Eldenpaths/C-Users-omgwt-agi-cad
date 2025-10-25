"use client";
import { useEffect, useState } from "react";

export default function useThemeIQ() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("agi-cad:theme") || "system"
  );

  // apply theme
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const dark = theme === "dark" || (theme === "system" && prefersDark);
    root.setAttribute("data-theme", dark ? "blueprint" : "parchment");
    localStorage.setItem("agi-cad:theme", theme);
  }, [theme]);

  // hotkey: Ctrl+Shift+T cycles light → dark → system
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "t") {
        setTheme((t) => (t === "light" ? "dark" : t === "dark" ? "system" : "light"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { theme, setTheme };
}
