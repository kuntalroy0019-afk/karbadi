import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors, font, radius, shadow, spacing } from "../theme";
import { PressableScale } from "./motion";

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={styles.muted}>{label}</Text> : null}
    </View>
  );
}

export function EmptyState({ icon = "cube-outline", title, subtitle, action }: {
  icon?: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <View style={styles.center}>
      <View style={styles.emptyIcon}><Ionicons name={icon} size={40} color={colors.primary} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
      {action ? <View style={{ marginTop: spacing.lg, alignSelf: "stretch" }}>{action}</View> : null}
    </View>
  );
}

export function Button({ title, onPress, variant = "primary", loading, disabled, icon, style }: {
  title: string; onPress?: () => void; variant?: "primary" | "outline" | "danger" | "success";
  loading?: boolean; disabled?: boolean; icon?: keyof typeof Ionicons.glyphMap; style?: ViewStyle;
}) {
  const bg = variant === "primary" ? colors.accent
    : variant === "danger" ? colors.error
    : variant === "success" ? colors.accent
    : "transparent";
  const fg = variant === "outline" ? colors.accent : colors.onAccent;
  return (
    <PressableScale onPress={onPress} disabled={disabled || loading} scaleTo={0.97}
      hapticStyle={variant === "danger" ? "warning" : "medium"}
      style={[styles.btn, { backgroundColor: bg, opacity: disabled ? 0.45 : 1 },
        variant === "outline" && { borderWidth: 1.5, borderColor: colors.accent }, style as any]}>
      {loading ? <ActivityIndicator color={fg} /> : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 6 }} /> : null}
          <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
        </View>
      )}
    </PressableScale>
  );
}

export function Badge({ label, color = colors.primary }: { label: string; color?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + "1A" }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  muted: { color: colors.textMuted, marginTop: spacing.sm, fontSize: font.small, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  emptyIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  emptyTitle: { fontSize: font.h3, fontWeight: "700", color: colors.text },
  btn: { height: 50, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },
  btnText: { fontWeight: "700", fontSize: font.body },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, alignSelf: "flex-start" },
  badgeText: { fontSize: font.tiny, fontWeight: "800", letterSpacing: 0.5 },
});
