"use client";

import { useEffect } from "react";
import { useOrganization } from "@/hooks/use-organization";

const DEFAULT_GOLD = "#D4A574";
const DEFAULT_PINK = "#E8B4B8";

function generateLightVariant(hex: string, isDark: boolean): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);

  if (isDark) {
    return `rgba(${r}, ${g}, ${b}, 0.15)`;
  }
  const blend = 0.9;
  const newR = Math.round(r + (255 - r) * blend);
  const newG = Math.round(g + (255 - g) * blend);
  const newB = Math.round(b + (255 - b) * blend);
  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}

export function OrgThemeProvider() {
  const { organization } = useOrganization();

  const accentGold =
    (organization as unknown as { accentColor?: string })?.accentColor || DEFAULT_GOLD;
  const accentPink =
    (organization as unknown as { accentColorAlt?: string })?.accentColorAlt || DEFAULT_PINK;
  const isDark = (organization as unknown as { darkMode?: boolean })?.darkMode ?? false;

  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }

    root.style.setProperty("--accent-gold", accentGold);
    root.style.setProperty("--accent-pink", accentPink);
    root.style.setProperty("--accent-gold-light", generateLightVariant(accentGold, isDark));
    root.style.setProperty("--accent-pink-light", generateLightVariant(accentPink, isDark));

    try {
      const prefs = { accentGold, accentPink, darkMode: isDark };
      localStorage.setItem("sahabatkreator-appearance", JSON.stringify(prefs));
    } catch {
      /* Ignore storage errors */
    }
  }, [accentGold, accentPink, isDark]);

  return null;
}
