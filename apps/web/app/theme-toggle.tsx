"use client";

import { MoonStar, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function preferredTheme(): Theme {
  const stored = window.localStorage.getItem("contextbridge-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initial = preferredTheme();
    document.documentElement.dataset.theme = initial;
    setTheme(initial);
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("contextbridge-theme", next);
    setTheme(next);
  }

  const nextTheme = theme === "dark" ? "light" : "dark";
  return <button className="icon-button" type="button" onClick={toggleTheme} aria-label={`Switch to ${nextTheme} mode`} title={`Switch to ${nextTheme} mode`}>
    {theme === "dark" ? <Sun size={17}/> : <MoonStar size={17}/>}
  </button>;
}
