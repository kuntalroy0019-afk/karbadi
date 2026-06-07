import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Catalog, Orders } from "../api/endpoints";
import { Loading } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, font, formatINR, radius, shadow, spacing } from "../theme";
import { Order, Part } from "../types";

export default function DashboardScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [listings, setListings] = useState<Part[]>([]);
  const [sales, setSales] = useState<Order[]>([]);
  const [openInq, setOpenInq] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [l, s, inq] = await Promise.all([Catalog.myListings(), Orders.sales(), Orders.inquiries()]);
      setListings(l.data.results);
      setSales(s.data.results);
      setOpenInq(inq.data.results.filter((i) => i.status === "open" && i.seller === user?.id).length);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) return <Loading label="Loading dashboard…" />;

  const revenue = sales.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.items_total || 0), 0);
  const pending = sales.filter((o) => ["pending", "confirmed", "packed"].includes(o.status)).length;
  const active = listings.filter((p) => p.is_active).length;
  const lowStock = listings.filter((p) => p.is_active && p.stock <= 2).length;
  const shopName = user?.seller_profile?.shop_name;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={[colors.navy, colors.primary]} style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.hi}>Welcome back</Text>
        <Text style={styles.shop}>{shopName || user?.username}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>

        {!user?.seller_profile && (
          <Pressable style={styles.setupBanner} onPress={() => nav.navigate("Store")}>
            <Ionicons name="storefront-outline" size={22} color={colors.white} />
            <Text style={styles.setupText}>Set up your storefront to start selling →</Text>
          </Pressable>
        )}

        <View style={styles.kpiGrid}>
          <Kpi icon="cash-outline" label="Revenue" value={formatINR(revenue)} tint={colors.accent} />
          <Kpi icon="receipt-outline" label="Total sales" value={`${sales.length}`} />
          <Kpi icon="cube-outline" label="Active listings" value={`${active}`} />
          <Kpi icon="time-outline" label="Pending" value={`${pending}`} tint={pending ? colors.warning : colors.primary} />
        </View>

        <View style={styles.alertRow}>
          <Alert icon="chatbubbles-outline" n={openInq} label="Open inquiries" onPress={() => nav.navigate("Inquiries")} />
          <Alert icon="warning-outline" n={lowStock} label="Low stock" tint={colors.danger} onPress={() => nav.navigate("Listings")} />
        </View>

        <View style={styles.actions}>
          <Action icon="add-circle" label="Add Listing" primary onPress={() => nav.navigate("PartForm", {})} />
          <Action icon="pricetags-outline" label="My Listings" onPress={() => nav.navigate("Listings")} />
          <Action icon="receipt-outline" label="Sales" onPress={() => nav.navigate("Orders")} />
          <Action icon="storefront-outline" label="Storefront" onPress={() => nav.navigate("Store")} />
        </View>

        <Text style={styles.sectionTitle}>Recent Sales</Text>
        {sales.slice(0, 5).map((o) => (
          <Pressable key={o.id} style={styles.row} onPress={() => nav.navigate("OrderDetail", { id: o.id })}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>#{o.order_number}</Text>
              <Text style={styles.rowSub}>{o.ship_city} · {o.status}</Text>
            </View>
            <Text style={styles.rowAmount}>{formatINR(o.grand_total)}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        ))}
        {sales.length === 0 && <Text style={styles.empty}>No sales yet. Add listings to get discovered.</Text>}
      </ScrollView>
    </View>
  );
}

function Kpi({ icon, label, value, tint = colors.primary }: any) {
  return (
    <View style={styles.kpi}>
      <Ionicons name={icon} size={20} color={tint} />
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}
function Alert({ icon, n, label, tint = colors.primary, onPress }: any) {
  return (
    <Pressable style={styles.alert} onPress={onPress}>
      <Ionicons name={icon} size={20} color={tint} />
      <Text style={styles.alertN}>{n}</Text>
      <Text style={styles.alertLabel}>{label}</Text>
    </Pressable>
  );
}
function Action({ icon, label, onPress, primary }: any) {
  return (
    <Pressable style={[styles.action, primary && { backgroundColor: colors.primary }]} onPress={onPress}>
      <Ionicons name={icon} size={24} color={primary ? colors.white : colors.primary} />
      <Text style={[styles.actionLabel, primary && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.xl, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  hi: { color: "#BBD0FF", fontWeight: "600" },
  shop: { color: colors.white, fontSize: font.h1, fontWeight: "900", marginTop: 2 },
  setupBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.accent, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg },
  setupText: { color: colors.white, fontWeight: "700", flex: 1 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  kpi: { width: "47.5%", backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.soft },
  kpiValue: { fontSize: font.h2, fontWeight: "900", color: colors.text, marginTop: spacing.sm },
  kpiLabel: { color: colors.textMuted, fontSize: font.tiny },
  alertRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  alert: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.soft },
  alertN: { fontWeight: "900", color: colors.text, fontSize: font.h3 },
  alertLabel: { color: colors.textMuted, fontSize: font.tiny, flex: 1 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg },
  action: { width: "47.5%", flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.soft },
  actionLabel: { fontWeight: "700", color: colors.text, fontSize: font.small },
  sectionTitle: { fontWeight: "800", color: colors.text, fontSize: font.h3, marginTop: spacing.xl, marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadow.soft },
  rowTitle: { fontWeight: "800", color: colors.text },
  rowSub: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2, textTransform: "capitalize" },
  rowAmount: { fontWeight: "900", color: colors.primary },
  empty: { color: colors.textMuted, paddingVertical: spacing.md },
});
