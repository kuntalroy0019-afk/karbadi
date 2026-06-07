/** Karbadi Seller design system — a distinct, business-grade look that still
 *  belongs to the Karbadi family (blue primary) with a deep-navy "partner"
 *  header and an emerald accent for earnings/positive metrics. */
export const colors = {
  primary: "#1565FF",
  primaryDark: "#0B2C6B",   // deep navy — distinguishes the seller app
  primaryLight: "#E8F0FF",
  navy: "#0B1F47",
  accent: "#10B981",        // emerald — money / positive
  accentSoft: "#D1FAE5",
  danger: "#EF4444",
  warning: "#F59E0B",
  bg: "#F3F5FA",
  surface: "#FFFFFF",
  text: "#0F1B33",
  textMuted: "#6B7790",
  border: "#E4E8F0",
  star: "#FFB400",
  used: "#7C3AED",
  new: "#16A34A",
  white: "#FFFFFF",
  shadow: "#0B1F47",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };
export const font = { h1: 26, h2: 20, h3: 17, body: 15, small: 13, tiny: 11 };

export const shadow = {
  card: {
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 3,
  },
  soft: {
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
};

export function formatINR(value: number | string | null | undefined): string {
  const n = Number(value || 0);
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
