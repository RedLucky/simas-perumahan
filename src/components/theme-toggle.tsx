"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "simas-theme";
type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage once on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
    applyTheme(savedTheme);
    setTimeout(() => {
      setTheme(savedTheme);
      setMounted(true);
    }, 0);
  }, []);

  // Update theme in localStorage & classList when state changes (after mounting)
  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
  }


  // Prevent hydration mismatch
  if (!mounted) {
    return <div className="h-9 w-9 rounded-full bg-[var(--app-surface-2)]" />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300",
        "bg-[var(--app-surface-2)] hover:bg-[var(--app-surface)] hover:shadow-md",
        "border border-[var(--app-border-soft)]"
      )}
      aria-label="Toggle theme"
    >
      <span className={cn(
        "absolute inset-0 flex items-center justify-center transition-all duration-500",
        theme === "dark" ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
      )}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
      </span>
      <span className={cn(
        "absolute inset-0 flex items-center justify-center transition-all duration-500",
        theme === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"
      )}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--app-accent)]"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      </span>
    </button>
  );
}
