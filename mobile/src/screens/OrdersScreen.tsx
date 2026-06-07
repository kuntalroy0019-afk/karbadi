import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Orders } from "../api/endpoints";
import { Badge, Button, EmptyState, Loading } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, font, formatINR, radius, shadow, spacing } from "../theme";
import { Order } from "../types";

const STATUS_COLOR: Record<string, string> = {
  pending: colors.warning,
  confirmed: colors.primary,
  packed: colors.primary,
  shipped: "#0EA5E9",
  delivered: colors.success,
  cancelled: colors.accent,
};

export default function OrdersScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      Orders.list()
        .then((r) => setOrders(r.data.results))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [user])
  );

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <EmptyState icon="receipt-outline" title="Track your orders" subtitle="Sign in to see your order history." />
        <View style={{ padding: spacing.lg }}>
          <Button title="Sign In" onPress={() => nav.navigate("Login")} />
        </View>
      </View>
    );
  }

  if (loading) return <Loading label="Loading orders…" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + spacing.sm }}>
      <Text style={styles.heading}>My Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="No orders yet" subtitle="Your orders will appear here." />}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => nav.navigate("OrderDetail", { id: item.id })}>
            <View style={styles.cardHead}>
              <Text style={styles.orderNo}>#{item.order_number}</Text>
              <Badge label={item.status.toUpperCase()} color={STATUS_COLOR[item.status] || colors.primary} />
            </View>
            <Text style={styles.items}>{item.items.length} item(s) · {item.payment_method.toUpperCase()}</Text>
            <View style={styles.cardFoot}>
              <Text style={styles.total}>{formatINR(item.grand_total)}</Text>
              {item.shipment && (
                <View style={styles.courier}>
                  <Ionicons name="cube-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.courierText}>{item.shipment.courier_name}</Text>
                </View>
              )}
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
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNo: { fontWeight: "900", color: colors.text, fontSize: font.body },
  items: { color: colors.textMuted, marginTop: 4, fontSize: font.small },
  cardFoot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  total: { fontWeight: "900", color: colors.primary, fontSize: font.h3 },
  courier: { flexDirection: "row", alignItems: "center", gap: 4 },
  courierText: { color: colors.textMuted, fontSize: font.tiny },
});
