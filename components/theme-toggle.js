"use client";

import { useEffect, useState } from "react";

function resolveInitialTheme() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.theme === "dark" ||
    (!("theme" in window.localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
}

export default function ThemeToggle({ solid = false }) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const initialIsDark = resolveInitialTheme();

    document.documentElement.classList.toggle("dark", initialIsDark);
    setIsDark(initialIsDark);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;

    document.documentElement.classList.toggle("dark", nextIsDark);
    window.localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    setIsDark(nextIsDark);
  };

  if (!mounted) {
    return null;
  }

  return (
    <button
      type="button"
      className={`theme-toggle${solid ? " theme-toggle--solid" : ""}`}
      onClick={toggleTheme}
      aria-label="切换明暗主题"
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 4V2M12 22v-2M4 12H2m20 0h-2m-2.34 5.66-1.41-1.41M7.76 7.76 6.34 6.34m11.32 0-1.41 1.42M7.76 16.24l-1.42 1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20.35 15.36A9 9 0 0 1 8.64 3.65 9 9 0 1 0 20.35 15.36Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
