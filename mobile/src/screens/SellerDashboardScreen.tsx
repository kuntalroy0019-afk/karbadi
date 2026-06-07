import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Catalog, Orders } from "../api/endpoints";
import { EmptyState, Loading } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, font, formatINR, radius, shadow, spacing } from "../theme";
import { Order, Part } from "../types";

export default function SellerDashboardScreen() {
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const [listings, setListings] = useState<Part[]>([]);
  const [sales, setSales] = useState<Order[]>([]);
  const [openInquiries, setOpenInquiries] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [l, s, inq] = await Promise.all([
        Catalog.myListings(),
        Orders.sales(),
        Orders.inquiries(),
      ]);
      setListings(l.data.results);
      setSales(s.data.results);
      setOpenInquiries(inq.data.results.filter((i) => i.status === "open" && i.seller === user?.id).length);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  if (!user || (user.role !== "seller" && user.role !== "admin")) {
    return <EmptyState icon="storefront-outline" title="Not a seller yet"
      subtitle="Create a storefront to start selling on Karbadi." />;
  }
  if (loading) return <Loading label="Loading dashboard…" />;

  const revenue = sales
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.items_total || 0), 0);
  const activeCount = listings.filter((p) => p.is_active).length;
  const pendingSales = sales.filter((o) => ["pending", "confirmed", "packed"].includes(o.status)).length;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <Text style={styles.shopName}>{user.seller_profile?.shop_name || user.username}</Text>
        <Text style={styles.sub}>Seller Dashboard</Text>
      </LinearGradient>

      {/* KPI cards */}
      <View style={styles.kpiGrid}>
        <Kpi icon="cash-outline" label="Revenue" value={formatINR(revenue)} />
        <Kpi icon="receipt-outline" label="Sales" value={`${sales.length}`} />
        <Kpi icon="cube-outline" label="Active listings" value={`${activeCount}`} />
        <Kpi icon="time-outline" label="Pending sales" value={`${pendingSales}`} accent={pendingSales > 0} />
      </View>

      {/* Quick actions */}
      <View style={styles.actions}>
        <Action icon="add-circle" label="Add Listing" onPress={() => nav.navigate("PartForm", {})} primary />
        <Action icon="pricetags-outline" label="My Listings" onPress={() => nav.navigate("MyListings")} />
        <Action icon="receipt-outline" label="Sales" onPress={() => nav.navigate("Sales")} />
        <Action icon="chatbubbles-outline" label="Inquiries" badge={openInquiries} onPress={() => nav.navigate("Inquiries")} />
      </View>

      {/* Recent listings */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recent Listings</Text>
          <Pressable onPress={() => nav.navigate("MyListings")}>
            <Text style={styles.link}>Manage all</Text>
          </Pressable>
        </View>
        {listings.slice(0, 4).map((p) => (
          <Pressable key={p.id} style={styles.row} onPress={() => nav.navigate("PartForm", { id: p.id })}>
            <View style={[styles.dot, { backgroundColor: p.is_active ? colors.success : colors.textMuted }]} />
            <Text numberOfLines={1} style={styles.rowTitle}>{p.title}</Text>
            <Text style={styles.rowPrice}>{formatINR(p.price)}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        ))}
        {listings.length === 0 && (
          <Text style={styles.empty}>No listings yet. Tap “Add Listing” to create your first.</Text>
        )}
      </View>
    </ScrollView>
  );
}

function Kpi({ icon, label, value, accent }: any) {
  return (
    <View style={styles.kpi}>
      <Ionicons name={icon} size={20} color={accent ? colors.accent : colors.primary} />
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function Action({ icon, label, onPress, primary, badge }: any) {
  return (
    <Pressable style={[styles.action, primary && { backgroundColor: colors.primary }]} onPress={onPress}>
      <View>
        <Ionicons name={icon} size={24} color={primary ? colors.white : colors.primary} />
        {badge > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>}
      </View>
      <Text style={[styles.actionLabel, primary && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.xl, paddingTop: spacing.xl },
  shopName: { color: colors.white, fontSize: font.h1, fontWeight: "900" },
  sub: { color: "#CFE0FF", marginTop: 2, fontWeight: "600" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, padding: spacing.lg },
  kpi: { width: "47.5%", backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.soft },
  kpiValue: { fontSize: font.h2, fontWeight: "900", color: colors.text, marginTop: spacing.sm },
  kpiLabel: { color: colors.textMuted, fontSize: font.tiny },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingHorizontal: spacing.lg },
  action: { width: "47.5%", flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.soft },
  actionLabel: { fontWeight: "700", color: colors.text, fontSize: font.small },
  badge: { position: "absolute", top: -6, right: -8, backgroundColor: colors.accent, minWidth: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: "800" },
  section: { margin: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.soft },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  sectionTitle: { fontWeight: "800", color: colors.text, fontSize: font.h3 },
  link: { color: colors.primary, fontWeight: "700", fontSize: font.small },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowTitle: { flex: 1, color: colors.text, fontWeight: "600" },
  rowPrice: { color: colors.primary, fontWeight: "800" },
  empty: { color: colors.textMuted, paddingVertical: spacing.sm },
});
