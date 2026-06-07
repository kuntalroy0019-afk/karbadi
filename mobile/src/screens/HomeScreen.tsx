import { Ionicons } from "@expo/vector-icons";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Auth, Catalog } from "../api/endpoints";
import { PartCard } from "../components/PartCard";
import { FadeIn, PressableScale, haptic } from "../components/motion";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { colors, font, radius, shadow, spacing } from "../theme";
import { Category, Part, SellerProfile } from "../types";

const CAT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  body: "car-outline",
  mechanical: "construct-outline",
  electric: "flash-outline",
  sensors: "radio-outline",
  accessories: "color-wand-outline",
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { count } = useCart();
  const [featured, setFeatured] = useState<Part[]>([]);
  const [vendors, setVendors] = useState<SellerProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recent, setRecent] = useState<Part[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [f, v, c, r] = await Promise.all([
        Catalog.featured(),
        Auth.oemSellers(),
        Catalog.categories(),
        Catalog.parts({ ordering: "-created_at" }),
      ]);
      setFeatured(f.data);
      setVendors(v.data);
      setCategories(c.data);
      setRecent(r.data.results.slice(0, 6));
    } catch {
      /* offline-friendly */
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const name = user?.first_name || user?.username || "there";

  const actions = [
    { key: "parts", title: "Find Parts", sub: "Search millions of auto parts", icon: "search-outline", onPress: () => nav.navigate("Tabs", { screen: "Discover" }) },
    { key: "vendors", title: "Browse Vendors", sub: "Explore verified sellers", icon: "storefront-outline", onPress: () => nav.navigate("Vendors") },
    { key: "sell", title: "Sell Vehicle", sub: "List your vehicle instantly", icon: "car-outline", onPress: () => nav.navigate("VehicleForm", {}) },
    { key: "list", title: "List Part", sub: "Sell spare parts easily", icon: "pricetag-outline", onPress: () => nav.navigate("SellerDashboard") },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.brand}>KARBADI</Text>
        <View style={styles.headerIcons}>
          <Pressable hitSlop={8} onPress={() => nav.navigate("Cart")}>
            <Ionicons name="bag-outline" size={23} color={colors.text} />
            {count > 0 && <View style={styles.dot}><Text style={styles.dotText}>{count > 9 ? "9+" : count}</Text></View>}
          </Pressable>
          <Pressable hitSlop={8} onPress={() => nav.navigate("Tabs", { screen: "Messages" })}>
            <Ionicons name="notifications-outline" size={23} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.h }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Greeting */}
        <FadeIn style={styles.greet} delay={40}>
          <Text style={styles.hi}>{greeting()}, {name}</Text>
          <Text style={styles.headline}>What are you{"\n"}looking for today?</Text>
        </FadeIn>

        {/* 2x2 action grid */}
        <View style={styles.grid}>
          {actions.map((a, i) => (
            <FadeIn key={a.key} delay={80 + i * 60} style={{ width: "47.5%" }}>
              <PressableScale style={styles.actionCard} onPress={a.onPress}>
                <View style={styles.actionIcon}>
                  <Ionicons name={a.icon as any} size={22} color={colors.accent} />
                </View>
                <Text style={styles.actionTitle}>{a.title}</Text>
                <Text style={styles.actionSub}>{a.sub}</Text>
              </PressableScale>
            </FadeIn>
          ))}
        </View>

        {/* Trust banner */}
        <FadeIn delay={340}>
          <PressableScale style={styles.trust} onPress={() => nav.navigate("Vendors")} hapticStyle="medium">
            <View>
              <Text style={styles.trustTitle}>Trusted by 50,000+</Text>
              <Text style={styles.trustSub}>Buyers & Sellers across India</Text>
            </View>
            <View style={styles.trustArrow}>
              <Ionicons name="arrow-forward" size={18} color={colors.onAccent} />
            </View>
          </PressableScale>
        </FadeIn>

        {/* Featured vendors */}
        <SectionHeader title="Featured Vendors" actionLabel="See all" onAction={() => nav.navigate("Vendors")} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
          {vendors.map((v) => (
            <PressableScale key={v.id} style={styles.vendorCard} hapticStyle="light" onPress={() => nav.navigate("SellerProfile", { id: v.id, name: v.shop_name })}>
              <View style={styles.vendorLogo}>
                <Text style={styles.vendorInitials}>{v.shop_name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <Text numberOfLines={1} style={styles.vendorName}>{v.shop_name}</Text>
              <View style={styles.vendorMeta}>
                <Ionicons name="shield-checkmark" size={12} color={colors.accent} />
                <Text style={styles.vendorMetaText}>Verified · {v.rating}</Text>
              </View>
            </PressableScale>
          ))}
        </ScrollView>

        {/* Categories */}
        <SectionHeader title="Popular Categories" actionLabel="All" onAction={() => nav.navigate("Tabs", { screen: "Discover" })} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
          {categories.map((c) => (
            <PressableScale key={c.id} style={styles.catChip} hapticStyle="select" onPress={() => nav.navigate("CategoryParts", { id: c.id, name: c.name })}>
              <Ionicons name={CAT_ICONS[c.icon] || "cube-outline"} size={18} color={colors.text} />
              <Text style={styles.catText}>{c.name}</Text>
            </PressableScale>
          ))}
        </ScrollView>

        {/* Recent listings */}
        <SectionHeader title="Recent Listings" />
        <View style={styles.recentGrid}>
          {recent.map((p) => (
            <View key={p.id} style={{ width: "47%" }}>
              <PartCard part={p} onPress={() => nav.navigate("PartDetail", { id: p.id, title: p.title })} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}><Text style={styles.sectionAction}>{actionLabel}</Text></Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.bg,
  },
  brand: { fontSize: font.h3, fontWeight: "800", letterSpacing: 3, color: colors.text },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  dot: { position: "absolute", top: -6, right: -8, backgroundColor: colors.accent, minWidth: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  dotText: { color: colors.onAccent, fontSize: 9, fontWeight: "800" },
  greet: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.lg },
  hi: { color: colors.textMuted, fontSize: font.body, marginBottom: spacing.xs },
  headline: { color: colors.text, fontSize: font.display, fontWeight: "700", lineHeight: 38 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: spacing.md, gap: spacing.md },
  actionCard: {
    width: "100%", backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, minHeight: 116, justifyContent: "space-between",
  },
  actionIcon: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  actionTitle: { fontSize: font.body, fontWeight: "700", color: colors.text, marginTop: spacing.md },
  actionSub: { fontSize: font.tiny, color: colors.textMuted, marginTop: 2 },
  trust: {
    margin: spacing.md, backgroundColor: colors.accent, borderRadius: radius.lg, padding: spacing.lg,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  trustTitle: { color: colors.onAccent, fontSize: font.h3, fontWeight: "700" },
  trustSub: { color: "#B9C7C0", fontSize: font.small, marginTop: 2 },
  trustArrow: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ffffff22", alignItems: "center", justifyContent: "center" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { fontSize: font.h3, fontWeight: "700", color: colors.text },
  sectionAction: { color: colors.accent, fontWeight: "600", fontSize: font.small },
  hList: { paddingHorizontal: spacing.md, gap: spacing.md, paddingVertical: spacing.xs },
  vendorCard: { width: 150, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  vendorLogo: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  vendorInitials: { color: colors.accent, fontWeight: "800", fontSize: font.body },
  vendorName: { fontWeight: "700", color: colors.text, fontSize: font.small },
  vendorMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  vendorMetaText: { color: colors.textMuted, fontSize: font.tiny },
  catChip: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10 },
  catText: { color: colors.text, fontWeight: "600", fontSize: font.small },
  recentGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: spacing.md, gap: spacing.md },
});
