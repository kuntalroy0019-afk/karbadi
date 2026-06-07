import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Orders } from "../api/endpoints";
import { Badge, Loading } from "../components/ui";
import { colors, font, formatINR, radius, shadow, spacing } from "../theme";
import { Order } from "../types";

const SC: Record<string, string> = {
  pending: colors.warning, confirmed: colors.primary, shipped: "#0EA5E9",
  delivered: colors.accent, cancelled: colors.danger,
};

export default function OrderDetailScreen({ route }: any) {
  const { id } = route.params;
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => { Orders.detail(id).then((r) => setOrder(r.data)).catch(() => {}); }, [id]);
  if (!order) return <Loading label="Loading order…" />;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <View style={styles.head}>
        <View>
          <Text style={styles.orderNo}>#{order.order_number}</Text>
          <Text style={styles.date}>{new Date(order.created_at).toLocaleString("en-IN")}</Text>
        </View>
        <Badge label={order.status.toUpperCase()} color={SC[order.status] || colors.primary} />
      </View>

      {order.shipment && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shipment</Text>
          <Row label="Courier" value={order.shipment.courier_name} />
          <Row label="AWB" value={order.shipment.awb || "—"} />
          <Row label="Status" value={order.shipment.status} />
          <Row label="Est. delivery" value={`${order.shipment.estimated_delivery_days} days`} />
        </View>
      )}

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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ship to</Text>
        <Text style={styles.addr}>{order.ship_full_name} · {order.ship_phone}</Text>
        <Text style={styles.addr}>{order.ship_line1}{order.ship_line2 ? `, ${order.ship_line2}` : ""}</Text>
        <Text style={styles.addr}>{order.ship_city}, {order.ship_state} - {order.ship_pincode}</Text>
        <Text style={styles.pay}><Ionicons name="card-outline" size={13} color={colors.textMuted} /> {order.payment_method.toUpperCase()} · {order.is_paid ? "Paid" : "Unpaid"}</Text>
      </View>
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
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.soft },
  cardTitle: { fontWeight: "800", color: colors.text, fontSize: font.h3, marginBottom: spacing.sm },
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  itemTitle: { color: colors.text, flex: 1, marginRight: spacing.sm },
  itemPrice: { fontWeight: "700", color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 3 },
  rowLabel: { color: colors.textMuted },
  rowValue: { fontWeight: "700", color: colors.text },
  addr: { color: colors.textMuted, lineHeight: 20 },
  pay: { color: colors.textMuted, marginTop: spacing.sm },
});
