"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerSnapshot() {
  return "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("pt-theme", next);
    } catch {
      // localStorage unavailable (private mode etc.) — theme just won't persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={className}
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        border: "1.5px solid rgba(255,255,255,0.15)",
        background: "rgba(255,255,255,0.08)",
        color: "white",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {theme === "dark" ? (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.4" />
          <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <line x1="8" y1="0.5" x2="8" y2="2" />
            <line x1="8" y1="14" x2="8" y2="15.5" />
            <line x1="0.5" y1="8" x2="2" y2="8" />
            <line x1="14" y1="8" x2="15.5" y2="8" />
            <line x1="2.6" y1="2.6" x2="3.7" y2="3.7" />
            <line x1="12.3" y1="12.3" x2="13.4" y2="13.4" />
            <line x1="2.6" y1="13.4" x2="3.7" y2="12.3" />
            <line x1="12.3" y1="3.7" x2="13.4" y2="2.6" />
          </g>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M14 9.3A6.3 6.3 0 1 1 6.7 2a5 5 0 0 0 7.3 7.3z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
