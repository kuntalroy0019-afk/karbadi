import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Catalog, Orders } from "../api/endpoints";
import { Loading } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, font, formatINR, radius, shadow, spacing } from "../theme";
import { Order, Part } from "../types";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

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
  const shop = user?.seller_profile?.shop_name || user?.username;
  const rating = user?.seller_profile?.rating || "—";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.topbar, { paddingTop: insets.top + spacing.sm }]}>
        <View>
          <Text style={styles.hi}>{greeting()},</Text>
          <Text style={styles.shop}>{shop}</Text>
        </View>
        <Pressable hitSlop={8} onPress={() => nav.navigate("Tabs", { screen: "Inquiries" })}>
          <Ionicons name="notifications-outline" size={23} color={colors.text} />
          {openInq > 0 && <View style={styles.bell}><Text style={styles.bellText}>{openInq}</Text></View>}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.h }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}>

        {/* dark identity card */}
        <View style={styles.identity}>
          <View style={styles.idRow}>
            <View style={styles.idLogo}><Text style={styles.idInitials}>{(shop || "KB").slice(0, 2).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.idName}>{shop}</Text>
              <View style={styles.idVerified}>
                <Ionicons name="shield-checkmark" size={12} color="#9DB2A8" />
                <Text style={styles.idVerifiedText}>Verified Seller</Text>
              </View>
            </View>
          </View>
          <View style={styles.idStats}>
            <IdStat icon="star" value={`${rating}`} label="Rating" />
            <View style={styles.idDivider} />
            <IdStat value="98%" label="Response" />
            <View style={styles.idDivider} />
            <IdStat value={`${sales.length}`} label="Orders" />
          </View>
        </View>

        <Text style={styles.section}>Today's Overview</Text>
        <View style={styles.metricGrid}>
          <Metric icon="chatbubble-ellipses-outline" value={`${openInq}`} label="New Inquiries" />
          <Metric icon="cube-outline" value={`${listings.filter((p) => p.is_active).length}`} label="Active Listings" />
          <Metric icon="time-outline" value={`${pending}`} label="Pending Orders" />
          <Metric icon="cash-outline" value={formatINR(revenue)} label="Total Sales" />
        </View>

        <Text style={styles.section}>Quick Actions</Text>
        <View style={styles.actions}>
          <Action icon="add" label="Add Part" primary onPress={() => nav.navigate("PartForm", {})} />
          <Action icon="pricetags-outline" label="My Listings" onPress={() => nav.navigate("Tabs", { screen: "Listings" })} />
          <Action icon="receipt-outline" label="Orders" onPress={() => nav.navigate("Tabs", { screen: "Orders" })} />
          <Action icon="chatbubbles-outline" label="Inquiries" onPress={() => nav.navigate("Tabs", { screen: "Inquiries" })} />
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.section}>Recent Sales</Text>
          <Pressable onPress={() => nav.navigate("Tabs", { screen: "Orders" })}><Text style={styles.link}>View all</Text></Pressable>
        </View>
        {sales.slice(0, 5).map((o) => (
          <Pressable key={o.id} style={styles.saleRow} onPress={() => nav.navigate("OrderDetail", { id: o.id })}>
            <View style={{ flex: 1 }}>
              <Text style={styles.saleNo}>#{o.order_number}</Text>
              <Text style={styles.saleSub}>{o.ship_city} · {o.status}</Text>
            </View>
            <Text style={styles.saleAmt}>{formatINR(o.grand_total)}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
          </Pressable>
        ))}
        {sales.length === 0 && <Text style={styles.empty}>No sales yet — add listings to get discovered.</Text>}
      </ScrollView>
    </View>
  );
}

function IdStat({ icon, value, label }: any) {
  return (
    <View style={styles.idStat}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        {icon && <Ionicons name={icon} size={13} color={colors.star} />}
        <Text style={styles.idStatValue}>{value}</Text>
      </View>
      <Text style={styles.idStatLabel}>{label}</Text>
    </View>
  );
}
function Metric({ icon, value, label }: any) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}
function Action({ icon, label, onPress, primary }: any) {
  return (
    <Pressable style={[styles.action, primary && { backgroundColor: colors.accent, borderColor: colors.accent }]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={primary ? colors.onAccent : colors.accent} />
      <Text style={[styles.actionLabel, primary && { color: colors.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  hi: { color: colors.textMuted, fontSize: font.small },
  shop: { color: colors.text, fontSize: font.h2, fontWeight: "700" },
  bell: { position: "absolute", top: -6, right: -8, backgroundColor: colors.accent, minWidth: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  bellText: { color: colors.onAccent, fontSize: 9, fontWeight: "800" },
  identity: { backgroundColor: colors.accent, borderRadius: radius.xl, padding: spacing.lg },
  idRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  idLogo: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: "#ffffff1A", borderWidth: 1, borderColor: "#ffffff33", alignItems: "center", justifyContent: "center" },
  idInitials: { color: colors.onAccent, fontWeight: "800", fontSize: font.body },
  idName: { color: colors.onAccent, fontSize: font.h3, fontWeight: "700" },
  idVerified: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  idVerifiedText: { color: "#9DB2A8", fontSize: font.tiny },
  idStats: { flexDirection: "row", alignItems: "center", marginTop: spacing.lg },
  idStat: { flex: 1, alignItems: "center" },
  idStatValue: { color: colors.onAccent, fontWeight: "800", fontSize: font.h3 },
  idStatLabel: { color: "#9DB2A8", fontSize: font.tiny, marginTop: 2 },
  idDivider: { width: 1, height: 28, backgroundColor: "#ffffff22" },
  section: { fontSize: font.h3, fontWeight: "700", color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  link: { color: colors.accent, fontWeight: "600", fontSize: font.small },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  metric: { width: "47.5%", backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  metricValue: { fontSize: font.h2, fontWeight: "800", color: colors.text, marginTop: spacing.sm },
  metricLabel: { color: colors.textMuted, fontSize: font.tiny },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  action: { width: "47.5%", flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  actionLabel: { fontWeight: "700", color: colors.text, fontSize: font.small },
  saleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  saleNo: { fontWeight: "700", color: colors.text },
  saleSub: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2, textTransform: "capitalize" },
  saleAmt: { fontWeight: "800", color: colors.accent },
  empty: { color: colors.textMuted, paddingVertical: spacing.md },
});
