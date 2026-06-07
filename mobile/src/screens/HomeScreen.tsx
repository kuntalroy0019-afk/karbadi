import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Auth, Catalog } from "../api/endpoints";
import { PartCard } from "../components/PartCard";
import { TopBar } from "../components/TopBar";
import { Badge, SectionHeader } from "../components/ui";
import { useCart } from "../context/CartContext";
import { colors, font, radius, shadow, spacing } from "../theme";
import { Category, Part, SellerProfile } from "../types";

const CAT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  body: "car-sport-outline",
  mechanical: "construct-outline",
  electric: "hardware-chip-outline",
  sensors: "radio-outline",
  accessories: "color-wand-outline",
};

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const { add } = useCart();
  const [featured, setFeatured] = useState<Part[]>([]);
  const [bestSellers, setBestSellers] = useState<SellerProfile[]>([]);
  const [oemSellers, setOemSellers] = useState<SellerProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [condition, setCondition] = useState<"new" | "used">("new");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [f, b, o, c] = await Promise.all([
        Catalog.featured(),
        Auth.bestSellers(),
        Auth.oemSellers(),
        Catalog.categories(),
      ]);
      setFeatured(f.data);
      setBestSellers(b.data);
      setOemSellers(o.data);
      setCategories(c.data);
    } catch {
      /* offline-friendly: leave whatever loaded */
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filteredFeatured = featured.filter((p) => p.condition === condition);
  const featuredToShow = filteredFeatured.length ? filteredFeatured : featured;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        {/* Hero banner */}
        <LinearGradient colors={["#0B43C2", "#1565FF"]} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Every car,{"\n"}Every part.</Text>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>India's Auto Parts Marketplace</Text>
            </View>
            <Pressable style={styles.heroCta} onPress={() => nav.navigate("OemSearch")}>
              <Text style={styles.heroCtaText}>Find OEM Parts</Text>
              <Ionicons name="arrow-forward" size={15} color={colors.primary} />
            </Pressable>
          </View>
          <Ionicons name="car-sport" size={92} color="#3D7BFF" style={styles.heroCar} />
        </LinearGradient>

        {/* Quick action tabs */}
        <View style={styles.quickTabs}>
          <QuickTab label="Used Parts" icon="cube-outline" onPress={() => nav.navigate("CategoryParts", { id: 0, name: "Used Parts" })} />
          <QuickTab label="Buy | Sell" icon="swap-horizontal-outline" highlighted onPress={() => nav.navigate("Vehicles")} />
          <QuickTab label="New Parts" icon="sparkles-outline" onPress={() => nav.navigate("CategoryParts", { id: -1, name: "New Parts" })} />
        </View>

        {/* Featured products + new/used toggle */}
        <View style={styles.featuredHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <View style={styles.toggle}>
            <ToggleOpt label="Used" active={condition === "used"} onPress={() => setCondition("used")} />
            <ToggleOpt label="New" active={condition === "new"} onPress={() => setCondition("new")} />
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
          {featuredToShow.map((p) => (
            <View key={p.id} style={{ width: 150 }}>
              <PartCard part={p} width={150} onPress={() => nav.navigate("PartDetail", { id: p.id, title: p.title })} />
              <Pressable style={styles.inquiryBtn} onPress={() => add(p.id, 1)}>
                <Ionicons name="cart-outline" size={14} color={colors.primary} />
                <Text style={styles.inquiryText}>Add to Cart</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        {/* Best Sellers */}
        <SectionHeader title="Best Sellers" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
          {bestSellers.map((s) => (
            <Pressable key={s.id} style={styles.sellerCard} onPress={() => nav.navigate("SellerProfile", { id: s.id, name: s.shop_name })}>
              <View style={styles.sellerLogo}>
                <Ionicons name="storefront" size={26} color={colors.primary} />
              </View>
              <Text numberOfLines={1} style={styles.sellerName}>{s.shop_name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={colors.star} />
                <Text style={styles.ratingText}>{s.rating} · {s.city}</Text>
              </View>
              <View style={styles.visitBtn}>
                <Text style={styles.visitText}>Visit Profile</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* OEM Sellers */}
        <SectionHeader title="OEM Sellers" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
          {oemSellers.map((s) => (
            <Pressable key={s.id} style={styles.oemCard} onPress={() => nav.navigate("SellerProfile", { id: s.id, name: s.shop_name })}>
              <View style={styles.oemLogo}>
                <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
              </View>
              <Text numberOfLines={1} style={styles.oemName}>{s.shop_name}</Text>
              <Badge label="OEM" color={colors.success} />
            </Pressable>
          ))}
        </ScrollView>

        {/* Categories */}
        <SectionHeader title="Shop by Category" actionLabel="See all" onAction={() => nav.navigate("Categories")} />
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          {categories.map((c) => (
            <Pressable key={c.id} style={styles.catBar} onPress={() => nav.navigate("CategoryParts", { id: c.id, name: c.name })}>
              <Text style={styles.catBarText}>{c.name}</Text>
              <View style={styles.catBarIcon}>
                <Ionicons name={CAT_ICONS[c.icon] || "cube-outline"} size={20} color={colors.white} />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function QuickTab({ label, icon, onPress, highlighted }: any) {
  return (
    <Pressable
      style={[styles.quickTab, highlighted && { backgroundColor: colors.primary }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={highlighted ? colors.white : colors.primary} />
      <Text style={[styles.quickTabText, highlighted && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

function ToggleOpt({ label, active, onPress }: any) {
  return (
    <Pressable style={[styles.toggleOpt, active && styles.toggleOptActive]} onPress={onPress}>
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    margin: spacing.lg, borderRadius: radius.xl, padding: spacing.lg, flexDirection: "row",
    overflow: "hidden", minHeight: 150, ...shadow.card,
  },
  heroTitle: { color: colors.white, fontSize: 24, fontWeight: "900", lineHeight: 28 },
  heroPill: { backgroundColor: "#ffffff22", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, marginTop: spacing.sm },
  heroPillText: { color: colors.white, fontSize: font.tiny, fontWeight: "700" },
  heroCta: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.white, alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, marginTop: spacing.md },
  heroCtaText: { color: colors.primary, fontWeight: "800", fontSize: font.small },
  heroCar: { position: "absolute", right: -6, bottom: -10, opacity: 0.6 },
  quickTabs: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg },
  quickTab: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: spacing.md,
    alignItems: "center", gap: 4, ...shadow.soft,
  },
  quickTabText: { color: colors.primary, fontWeight: "700", fontSize: font.small },
  featuredHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: font.h3, fontWeight: "800", color: colors.text },
  toggle: { flexDirection: "row", backgroundColor: colors.primaryLight, borderRadius: radius.pill, padding: 3 },
  toggleOpt: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: radius.pill },
  toggleOptActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: font.small, fontWeight: "700", color: colors.primary },
  toggleTextActive: { color: colors.white },
  hList: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingVertical: spacing.xs },
  inquiryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.sm, paddingVertical: 7, marginTop: 6,
  },
  inquiryText: { color: colors.primary, fontWeight: "700", fontSize: font.tiny },
  sellerCard: { width: 140, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.soft },
  sellerLogo: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  sellerName: { fontWeight: "800", color: colors.text, fontSize: font.small },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  ratingText: { color: colors.textMuted, fontSize: font.tiny },
  visitBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 7, alignItems: "center", marginTop: spacing.sm },
  visitText: { color: colors.white, fontWeight: "700", fontSize: font.tiny },
  oemCard: { width: 110, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, alignItems: "center", gap: 6, ...shadow.soft },
  oemLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  oemName: { fontWeight: "700", color: colors.text, fontSize: font.tiny, textAlign: "center" },
  catBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg, ...shadow.soft,
  },
  catBarText: { color: colors.white, fontWeight: "800", fontSize: font.body },
  catBarIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: "#ffffff22", alignItems: "center", justifyContent: "center" },
});
