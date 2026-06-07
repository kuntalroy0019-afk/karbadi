import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Orders } from "../api/endpoints";
import { Badge, EmptyState, Loading } from "../components/ui";
import { colors, font, formatINR, radius, shadow, spacing } from "../theme";
import { Order } from "../types";

const SC: Record<string, string> = {
  pending: colors.warning, confirmed: colors.primary, packed: colors.primary,
  shipped: "#0EA5E9", delivered: colors.accent, cancelled: colors.danger,
};

export default function SalesScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    Orders.sales().then((r) => setOrders(r.data.results)).catch(() => {}).finally(() => setLoading(false));
  }, []));

  if (loading) return <Loading label="Loading sales…" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + spacing.sm }}>
      <Text style={styles.heading}>Sales</Text>
      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="No sales yet" subtitle="Orders containing your parts appear here." />}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => nav.navigate("OrderDetail", { id: item.id })}>
            <View style={styles.head}>
              <Text style={styles.orderNo}>#{item.order_number}</Text>
              <Badge label={item.status.toUpperCase()} color={SC[item.status] || colors.primary} />
            </View>
            <Text style={styles.buyer}><Ionicons name="person-outline" size={12} color={colors.textMuted} /> {item.ship_full_name} · {item.ship_city} - {item.ship_pincode}</Text>
            <Text style={styles.items}>{item.items.length} item(s) · {item.payment_method.toUpperCase()}</Text>
            <View style={styles.foot}>
              <Text style={styles.total}>{formatINR(item.grand_total)}</Text>
              {item.shipment && <Text style={styles.courier}><Ionicons name="cube-outline" size={12} color={colors.textMuted} /> {item.shipment.courier_name} · {item.shipment.awb || "—"}</Text>}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: font.h1, fontWeight: "900", color: colors.text, paddingHorizontal: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.soft },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNo: { fontWeight: "900", color: colors.text, fontSize: font.body },
  buyer: { color: colors.textMuted, fontSize: font.small, marginTop: 6 },
  items: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2 },
  foot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  total: { fontWeight: "900", color: colors.primary, fontSize: font.h3 },
  courier: { color: colors.textMuted, fontSize: font.tiny },
});
