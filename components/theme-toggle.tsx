"use client";

import { useTheme } from "next-themes";
import { MoonStar, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const isDark = resolvedTheme === "dark";
  const label = !hydrated
    ? "Toggle color theme"
    : isDark
      ? "Switch to light mode"
      : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className="border-ink/15 text-ink/70 hover:bg-ink/5 focus-visible:outline-forest grid size-10 place-items-center rounded-lg border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {hydrated && isDark ? (
        <Sun aria-hidden="true" size={17} />
      ) : (
        <MoonStar aria-hidden="true" size={17} />
      )}
    </button>
  );
}
