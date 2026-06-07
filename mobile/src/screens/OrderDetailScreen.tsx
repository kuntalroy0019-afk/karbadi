import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { apiError } from "../api/client";
import { Orders } from "../api/endpoints";
import { Badge, Button, Loading } from "../components/ui";
import { colors, font, formatINR, radius, shadow, spacing } from "../theme";
import { Order } from "../types";

const STATUS_COLOR: Record<string, string> = {
  pending: colors.warning,
  confirmed: colors.primary,
  shipped: "#0EA5E9",
  delivered: colors.success,
  cancelled: colors.accent,
};

export default function OrderDetailScreen({ route }: any) {
  const { id } = route.params;
  const nav = useNavigation<any>();
  const [order, setOrder] = useState<Order | null>(null);

  const load = useCallback(() => {
    Orders.detail(id).then((r) => setOrder(r.data)).catch(() => {});
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!order) return <Loading label="Loading order…" />;

  async function cancel() {
    Alert.alert("Cancel order?", "This cannot be undone.", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, cancel",
        style: "destructive",
        onPress: async () => {
          try {
            const { data } = await Orders.cancel(id);
            setOrder(data);
          } catch (e) {
            Alert.alert("Error", apiError(e));
          }
        },
      },
    ]);
  }

  const canCancel = !["shipped", "delivered", "cancelled"].includes(order.status);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <View style={styles.head}>
        <View>
          <Text style={styles.orderNo}>#{order.order_number}</Text>
          <Text style={styles.date}>{new Date(order.created_at).toLocaleDateString("en-IN")}</Text>
        </View>
        <Badge label={order.status.toUpperCase()} color={STATUS_COLOR[order.status] || colors.primary} />
      </View>

      {order.shipping_warning ? (
        <View style={styles.warn}>
          <Ionicons name="warning-outline" size={16} color={colors.warning} />
          <Text style={styles.warnText}>{order.shipping_warning}</Text>
        </View>
      ) : null}

      {/* Shipment */}
      {order.shipment && (
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="cube-outline" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Shipment</Text>
          </View>
          <Row label="Courier" value={order.shipment.courier_name} />
          <Row label="AWB" value={order.shipment.awb || "—"} />
          <Row label="Est. delivery" value={`${order.shipment.estimated_delivery_days} days`} />
          {order.shipment.selection_reason?.fallback_used ? (
            <Text style={styles.fallback}>↪ fallback courier used (primary unavailable)</Text>
          ) : null}
          <Button
            title="Track Shipment"
            icon="navigate-outline"
            variant="outline"
            onPress={() => nav.navigate("Tracking", { shipmentId: order.shipment!.id })}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      )}

      {/* Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Items</Text>
        {order.items.map((it) => (
          <View key={it.id} style={styles.itemRow}>
            <Text numberOfLines={1} style={styles.itemTitle}>{it.quantity} × {it.title}</Text>
            <Text style={styles.itemPrice}>{formatINR(it.line_total)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <Row label="Items total" value={formatINR(order.items_total)} />
        <Row label="Shipping" value={formatINR(order.shipping_fee)} />
        <Row label="Grand total" value={formatINR(order.grand_total)} bold />
      </View>

      {/* Address */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delivery Address</Text>
        <Text style={styles.addr}>{order.ship_full_name} · {order.ship_phone}</Text>
        <Text style={styles.addr}>{order.ship_line1}{order.ship_line2 ? `, ${order.ship_line2}` : ""}</Text>
        <Text style={styles.addr}>{order.ship_city}, {order.ship_state} - {order.ship_pincode}</Text>
      </View>

      {canCancel && <Button title="Cancel Order" variant="danger" onPress={cancel} />}
    </ScrollView>
  );
}

function Row({ label, value, bold }: any) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontWeight: "900", color: colors.primary, fontSize: font.h3 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  orderNo: { fontSize: font.h2, fontWeight: "900", color: colors.text },
  date: { color: colors.textMuted, fontSize: font.small },
  warn: { flexDirection: "row", gap: 8, backgroundColor: "#FEF3C7", borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  warnText: { color: "#92400E", flex: 1, fontSize: font.small },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.soft },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm },
  cardTitle: { fontWeight: "800", color: colors.text, fontSize: font.h3, marginBottom: spacing.sm },
  fallback: { color: colors.warning, fontSize: font.tiny, marginTop: 4 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  itemTitle: { color: colors.text, flex: 1, marginRight: spacing.sm },
  itemPrice: { fontWeight: "700", color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 3 },
  rowLabel: { color: colors.textMuted },
  rowValue: { fontWeight: "700", color: colors.text },
  addr: { color: colors.textMuted, lineHeight: 20 },
});
