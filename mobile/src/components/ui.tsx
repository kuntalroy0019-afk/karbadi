import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

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

export function EmptyState({
  icon = "cube-outline",
  title,
  subtitle,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.center}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "outline" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const isOutline = variant === "outline";
  const bg = isPrimary ? colors.accent : isDanger ? colors.error : "transparent";
  const fg = isPrimary || isDanger ? colors.onAccent : colors.accent;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      scaleTo={0.97}
      hapticStyle={isDanger ? "warning" : "medium"}
      style={[
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.45 : 1 },
        isOutline && { borderWidth: 1.5, borderColor: colors.accent },
        style as any,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 6 }} /> : null}
          <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
        </View>
      )}
    </PressableScale>
  );
}

export function Badge({
  label,
  color = colors.primary,
  bg,
}: {
  label: string;
  color?: string;
  bg?: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bg || color + "1A" }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function ConditionBadge({ condition }: { condition: "new" | "used" }) {
  const isNew = condition === "new";
  return (
    <Badge
      label={isNew ? "NEW" : "USED"}
      color={isNew ? colors.new : colors.used}
    />
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  muted: { color: colors.textMuted, marginTop: spacing.sm, fontSize: font.small, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  emptyIcon: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: font.h3, fontWeight: "700", color: colors.text },
  btn: {
    height: 50, borderRadius: radius.md, alignItems: "center", justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  btnText: { fontWeight: "700", fontSize: font.body },
  badge: {
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: font.tiny, fontWeight: "800", letterSpacing: 0.5 },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: font.h3, fontWeight: "800", color: colors.text },
  action: { color: colors.primary, fontWeight: "700", fontSize: font.small },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadow.card },
});
