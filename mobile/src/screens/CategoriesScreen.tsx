import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Auth, Catalog } from "../api/endpoints";
import { TopBar } from "../components/TopBar";
import { Badge, SectionHeader } from "../components/ui";
import { colors, font, radius, shadow, spacing } from "../theme";
import { Brand, Category, SellerProfile } from "../types";

const CAT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  body: "car-sport-outline",
  mechanical: "construct-outline",
  electric: "hardware-chip-outline",
  sensors: "radio-outline",
  accessories: "color-wand-outline",
};

export default function CategoriesScreen() {
  const nav = useNavigation<any>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [oem, setOem] = useState<SellerProfile[]>([]);

  useFocusEffect(
    useCallback(() => {
      Catalog.categories().then((r) => setCategories(r.data)).catch(() => {});
      Catalog.brands({ is_oem: true }).then((r) => setBrands(r.data)).catch(() => {});
      Auth.oemSellers().then((r) => setOem(r.data)).catch(() => {});
    }, [])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar subtitle="Browse categories" />
      <FlatList
        data={categories}
        keyExtractor={(c) => String(c.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}
        contentContainerStyle={{ paddingBottom: spacing.xxl, gap: spacing.md }}
        ListHeaderComponent={<SectionHeader title="Part Categories" />}
        renderItem={({ item }) => (
          <Pressable style={styles.tile} onPress={() => nav.navigate("CategoryParts", { id: item.id, name: item.name })}>
            <View style={styles.tileIcon}>
              <Ionicons name={CAT_ICONS[item.icon] || "cube-outline"} size={28} color={colors.primary} />
            </View>
            <Text style={styles.tileName}>{item.name}</Text>
            <Text style={styles.tileCount}>{item.part_count} parts</Text>
          </Pressable>
        )}
        ListFooterComponent={
          <View>
            <SectionHeader title="OEM Brands" />
            <View style={styles.brandWrap}>
              {brands.map((b) => (
                <View key={b.id} style={styles.brandChip}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                  <Text style={styles.brandText}>{b.name}</Text>
                </View>
              ))}
            </View>
            <SectionHeader title="OEM Sellers" actionLabel="OEM Finder" onAction={() => nav.navigate("OemSearch")} />
            {oem.map((s) => (
              <Pressable key={s.id} style={styles.oemRow} onPress={() => nav.navigate("SellerProfile", { id: s.id, name: s.shop_name })}>
                <View style={styles.oemLogo}>
                  <Ionicons name="storefront" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.oemName}>{s.shop_name}</Text>
                  <Text style={styles.oemCity}>{s.city}, {s.state}</Text>
                </View>
                <Badge label="OEM" color={colors.success} />
              </Pressable>
            ))}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", ...shadow.soft },
  tileIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  tileName: { fontWeight: "800", color: colors.text, textAlign: "center" },
  tileCount: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2 },
  brandWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingHorizontal: spacing.lg },
  brandChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8, ...shadow.soft },
  brandText: { fontWeight: "700", color: colors.text, fontSize: font.small },
  oemRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: radius.md, padding: spacing.md, ...shadow.soft },
  oemLogo: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  oemName: { fontWeight: "800", color: colors.text },
  oemCity: { color: colors.textMuted, fontSize: font.tiny },
});
