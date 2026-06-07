/** Karbadi design system — "Every Car, Every Part". */
export const colors = {
  primary: "#1565FF",      // Karbadi brand blue
  primaryDark: "#0B43C2",
  primaryLight: "#E8F0FF",
  accent: "#FF4D4D",       // help-desk red / alerts
  bg: "#F4F6FB",
  surface: "#FFFFFF",
  text: "#0F1B33",
  textMuted: "#6B7790",
  border: "#E4E8F0",
  success: "#16A34A",
  warning: "#F59E0B",
  star: "#FFB400",
  used: "#7C3AED",
  new: "#16A34A",
  white: "#FFFFFF",
  shadow: "#0F1B33",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const font = {
  h1: 26,
  h2: 20,
  h3: 17,
  body: 15,
  small: 13,
  tiny: 11,
};

export const shadow = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
};

/** Format paise/rupee amounts as ₹ with Indian grouping. */
export function formatINR(value: number | string | null | undefined): string {
  const n = Number(value || 0);
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
