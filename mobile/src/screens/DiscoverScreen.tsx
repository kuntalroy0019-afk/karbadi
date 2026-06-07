import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Catalog } from "../api/endpoints";
import { colors, font, radius, spacing } from "../theme";
import { Category } from "../types";

const CAT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  body: "car-outline",
  mechanical: "construct-outline",
  electric: "flash-outline",
  sensors: "radio-outline",
  accessories: "color-wand-outline",
};

export default function DiscoverScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<Category[]>([]);

  useFocusEffect(useCallback(() => {
    Catalog.categories().then((r) => setCategories(r.data)).catch(() => {});
  }, []));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>How would you like to search?</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.h }} showsVerticalScrollIndicator={false}>
        {/* Search by Vehicle */}
        <Pressable style={styles.bigCard} onPress={() => nav.navigate("OemSearch")}>
          <View style={styles.bigIcon}><Ionicons name="car-sport-outline" size={26} color={colors.accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bigTitle}>Search by Vehicle</Text>
            <Text style={styles.bigSub}>Find parts that fit your make, model & year — or your registration number</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.textMuted} />
        </Pressable>

        {/* Search by Part */}
        <Pressable style={styles.bigCard} onPress={() => nav.navigate("PartSearch")}>
          <View style={styles.bigIcon}><Ionicons name="cube-outline" size={26} color={colors.accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bigTitle}>Search by Part</Text>
            <Text style={styles.bigSub}>Search using a part name or OEM number</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <Text style={styles.section}>Browse Categories</Text>
        <View style={styles.grid}>
          {categories.map((c) => (
            <Pressable key={c.id} style={styles.catCard} onPress={() => nav.navigate("CategoryParts", { id: c.id, name: c.name })}>
              <View style={styles.catIcon}><Ionicons name={CAT_ICONS[c.icon] || "cube-outline"} size={22} color={colors.accent} /></View>
              <Text style={styles.catTitle}>{c.name}</Text>
              <Text style={styles.catCount}>{c.part_count} parts</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: font.h1, fontWeight: "700", color: colors.text },
  subtitle: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  bigCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  bigIcon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  bigTitle: { fontSize: font.h3, fontWeight: "700", color: colors.text },
  bigSub: { color: colors.textMuted, fontSize: font.small, marginTop: 2, lineHeight: 19 },
  section: { fontSize: font.h3, fontWeight: "700", color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: spacing.md },
  catCard: { width: "47.5%", backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  catIcon: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  catTitle: { fontSize: font.body, fontWeight: "700", color: colors.text },
  catCount: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2 },
});
