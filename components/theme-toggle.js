"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

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
  const transitionTimerRef = useRef(null);
  const transitionTokenRef = useRef(0);

  useEffect(() => {
    const initialIsDark = resolveInitialTheme();

    document.documentElement.classList.toggle("dark", initialIsDark);
    setIsDark(initialIsDark);
    setMounted(true);

    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const toggleTheme = (event) => {
    const root = document.documentElement;
    const nextIsDark = !isDark;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canUseViewTransition =
      typeof document.startViewTransition === "function" && !prefersReducedMotion;
    const toggleRect = event.currentTarget.getBoundingClientRect();
    const centerX = toggleRect.left + toggleRect.width / 2;
    const centerY = toggleRect.top + toggleRect.height / 2;
    const endRadius = Math.hypot(
      Math.max(centerX, window.innerWidth - centerX),
      Math.max(centerY, window.innerHeight - centerY),
    );
    const transitionToken = transitionTokenRef.current + 1;

    transitionTokenRef.current = transitionToken;

    const applyTheme = () => {
      root.classList.toggle("dark", nextIsDark);
      window.localStorage.setItem("theme", nextIsDark ? "dark" : "light");
      flushSync(() => {
        setIsDark(nextIsDark);
      });
    };

    const clearThemeTransitionClass = () => {
      if (transitionTokenRef.current !== transitionToken) {
        return;
      }

      root.classList.remove("theme-switching");
    };

    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }

    if (!canUseViewTransition) {
      root.classList.add("theme-switching");
      applyTheme();
      transitionTimerRef.current = window.setTimeout(clearThemeTransitionClass, 520);
      return;
    }

    const transition = document.startViewTransition(() => {
      applyTheme();
    });

    transition.ready
      .then(() => {
        const clipPath = [
          `circle(0px at ${centerX}px ${centerY}px)`,
          `circle(${endRadius}px at ${centerX}px ${centerY}px)`,
        ];

        document.documentElement.animate(
          {
            clipPath,
          },
          {
            duration: 560,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {
        clearThemeTransitionClass();
      });

    transition.finished.finally(() => {
      clearThemeTransitionClass();
    });
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
