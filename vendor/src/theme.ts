/**
 * Karbadi Seller design system — the operator's console.
 * Same premium language as the buyer app (ivory + deep racing green), but a
 * more "admin dashboard" register (Shopify / Stripe / Linear): dark-green
 * identity surfaces, dense-but-calm metrics, restrained accents.
 */
export const colors = {
  bg: "#F8F6F1",
  surface: "#FFFFFF",
  surfaceAlt: "#F1EEE7",

  text: "#111111",
  textMuted: "#6B6B6B",
  textFaint: "#9A968D",

  border: "#E8E5DF",

  accent: "#234135", // deep racing green
  accentDark: "#192F26",
  accentSoft: "#E7EDEA",
  onAccent: "#F8F6F1",

  error: "#C64B4B",
  warning: "#D89A38",
  star: "#D89A38",

  // legacy aliases kept so existing vendor screens keep compiling
  primary: "#234135",
  primaryDark: "#192F26",
  primaryLight: "#E7EDEA",
  navy: "#192F26",
  accentSoftLegacy: "#E7EDEA",
  danger: "#C64B4B",
  used: "#6B6B6B",
  new: "#234135",
  white: "#FFFFFF",
  shadow: "#000000",
};

export const spacing = { xs: 8, sm: 8, md: 16, lg: 16, xl: 24, xxl: 32, h: 40, hh: 48 };
export const radius = { sm: 12, md: 16, lg: 20, xl: 24, pill: 999 };
export const font = { display: 32, h1: 28, h2: 24, h3: 20, body: 16, small: 14, tiny: 12 };

export const shadow = {
  card: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  soft: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
};

export function formatINR(value: number | string | null | undefined): string {
  const n = Number(value || 0);
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
