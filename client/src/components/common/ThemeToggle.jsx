import { useEffect, useState, useId } from "react";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("fitsync_theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Animated "classic" sun/moon theme toggle inspired by toggles.dev / Skiper UI.
 * Pure SVG + CSS transitions — no extra dependencies.
 *
 * Light mode: sun with radiating rays
 * Dark mode:  crescent moon (clip-path + scale) with rays fading out
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");
  const clipId = useId();

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
    document.documentElement.classList.toggle("light", initial === "light");
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.classList.toggle("light", next === "light");
    window.localStorage.setItem("fitsync_theme", next);
  }

  const isDark = theme === "dark";
  const duration = 500; // ms

  // Sun rays — 8 lines radiating from center
  const rays = [
    "M12 1.5V4",     // top
    "M19.4 4.6l-1.8 1.8",  // top-right
    "M22.5 12H20",   // right
    "M19.4 19.4l-1.8-1.8", // bottom-right
    "M12 22.5V20",   // bottom
    "M4.6 19.4l1.8-1.8",   // bottom-left
    "M1.5 12H4",     // left
    "M4.6 4.6l1.8 1.8",    // top-left
  ];

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="grid h-9 w-9 place-items-center rounded-full border border-border/40 bg-surface text-muted transition-colors hover:border-primary hover:text-primary cursor-pointer"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Clip-path that carves a crescent in dark mode */}
          <clipPath id={clipId}>
            <path
              d={isDark ? "M0 2h13a1 1 0 0010 10v14H0Z" : "M0 0h25a1 1 0 0010 10v14H0Z"}
              style={{
                transition: `d ${duration}ms ease, translate ${duration}ms ease`,
                transitionDelay: isDark ? `${duration * 0.15}ms` : "0ms",
              }}
            />
          </clipPath>
        </defs>

        <g stroke="currentColor" strokeLinecap="round">
          {/* Center circle — scales up in dark mode */}
          <circle
            cx="12"
            cy="12"
            r="5"
            fill="currentColor"
            clipPath={`url(#${clipId})`}
            style={{
              transformOrigin: "center",
              transition: `transform ${duration}ms ease`,
              transform: isDark ? "scale(1.7)" : "scale(1)",
            }}
          />

          {/* Sun rays — scale + fade out in dark mode */}
          {rays.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              strokeWidth="2"
              strokeLinejoin="round"
              style={{
                transformOrigin: "center",
                transformBox: "view-box",
                transition: `transform ${duration}ms ease, opacity ${duration}ms ease`,
                transitionDelay: isDark ? "0ms" : `${duration * 0.15}ms`,
                transform: isDark ? "scale(0)" : "scale(1)",
                opacity: isDark ? 0 : 1,
              }}
            />
          ))}
        </g>
      </svg>
    </button>
  );
}
