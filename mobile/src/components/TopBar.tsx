import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { colors, font, spacing } from "../theme";

export function TopBar({ subtitle }: { subtitle?: string }) {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const { user } = useAuth();

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.bar, { paddingTop: insets.top + 8 }]}
    >
      <View style={styles.row}>
        <View style={styles.brandRow}>
          <Ionicons name="car-sport" size={26} color={colors.white} />
          <View>
            <Text style={styles.brand}>Karbadi</Text>
            <Text style={styles.tagline}>{subtitle || "Every Car, Every Part"}</Text>
          </View>
        </View>
        <View style={styles.icons}>
          <IconBtn name="car-outline" onPress={() => nav.navigate("Vehicles")} />
          <IconBtn name="notifications-outline" dot />
          <IconBtn
            name={user ? "person-circle-outline" : "log-in-outline"}
            onPress={() => (user ? nav.navigate("Inquiries") : nav.navigate("Login"))}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

function IconBtn({
  name,
  onPress,
  dot,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  dot?: boolean;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.iconBtn}>
      <Ionicons name={name} size={22} color={colors.white} />
      {dot ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brand: { color: colors.white, fontSize: font.h2, fontWeight: "900", lineHeight: 22 },
  tagline: { color: "#CFE0FF", fontSize: font.tiny, fontWeight: "600" },
  icons: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  iconBtn: { position: "relative" },
  dot: {
    position: "absolute", top: -2, right: -2, width: 9, height: 9, borderRadius: 5,
    backgroundColor: colors.accent, borderWidth: 1.5, borderColor: colors.primary,
  },
});
