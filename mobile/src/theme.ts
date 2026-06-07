/**
 * Karbadi design system — "A premium automotive operating system."
 * Editorial commerce · quiet luxury · Scandinavian minimalism.
 * Warm ivory canvas, a single deep racing-green accent, calm neutrals.
 */
export const colors = {
  // Canvas & surfaces
  bg: "#F8F6F1", // warm ivory
  surface: "#FFFFFF",
  surfaceAlt: "#F1EEE7", // subtle tinted surface

  // Text
  text: "#111111",
  textMuted: "#6B6B6B",
  textFaint: "#9A968D",

  // Lines
  border: "#E8E5DF",

  // Single accent — CTA / active / success / highlight ONLY
  accent: "#234135", // deep racing green
  accentDark: "#192F26",
  accentSoft: "#E7EDEA", // tinted green wash
  onAccent: "#F8F6F1",

  // States
  error: "#C64B4B",
  warning: "#D89A38",
  star: "#D89A38",

  // Legacy aliases (kept so existing screens keep compiling; mapped to the new palette)
  primary: "#234135",
  primaryDark: "#192F26",
  primaryLight: "#E7EDEA",
  success: "#234135",
  used: "#6B6B6B",
  new: "#234135",
  white: "#FFFFFF",
  shadow: "#000000",
};

// Strict 8pt grid
export const spacing = { xs: 8, sm: 8, md: 16, lg: 16, xl: 24, xxl: 32, h: 40, hh: 48 };

export const radius = { sm: 12, md: 16, lg: 20, xl: 24, pill: 999 };

export const font = {
  display: 32,
  h1: 28,
  h2: 24,
  h3: 20,
  body: 16,
  small: 14,
  tiny: 12,
};

// One subtle shadow only — no floating-card chaos.
export const shadow = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
};

export function formatINR(value: number | string | null | undefined): string {
  const n = Number(value || 0);
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
