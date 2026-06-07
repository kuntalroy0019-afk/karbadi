import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Shipping } from "../api/endpoints";
import { Button, Loading } from "../components/ui";
import { colors, font, formatINR, radius, shadow, spacing } from "../theme";
import { Shipment } from "../types";

const STEP_LABELS: Record<string, string> = {
  created: "Order Booked",
  pickup_scheduled: "Pickup Scheduled",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  failed: "Delivery Failed",
  cancelled: "Cancelled",
};

export default function TrackingScreen({ route }: any) {
  const { shipmentId } = route.params;
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Shipping.shipment(shipmentId).then((r) => setShipment(r.data)).catch(() => {});
  }, [shipmentId]);

  async function pullLatest() {
    setRefreshing(true);
    try {
      const { data } = await Shipping.track(shipmentId);
      setShipment(data);
    } finally {
      setRefreshing(false);
    }
  }

  if (!shipment) return <Loading label="Loading tracking…" />;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <View style={styles.card}>
        <View style={styles.headRow}>
          <View style={styles.courierLogo}>
            <Ionicons name="cube" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.courier}>{shipment.courier_name}</Text>
            <Text style={styles.awb}>AWB: {shipment.awb}</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{STEP_LABELS[shipment.status] || shipment.status}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Meta icon="time-outline" label={`${shipment.estimated_delivery_days}-day ETA`} />
          <Meta icon="pricetag-outline" label={formatINR(shipment.shipping_charge)} />
        </View>
      </View>

      {/* Selection reason (smart engine transparency) */}
      {shipment.selection_reason?.score != null && (
        <View style={styles.reasonCard}>
          <Text style={styles.reasonTitle}>Why this courier?</Text>
          <Text style={styles.reasonText}>
            Chosen by Smart Courier Select with a score of {Number(shipment.selection_reason.score).toFixed(0)}.
            {shipment.selection_reason.fallback_used ? " (fallback applied)" : ""}
          </Text>
        </View>
      )}

      <Text style={styles.timelineTitle}>Tracking Timeline</Text>
      <View style={styles.timeline}>
        {shipment.events.length === 0 ? (
          <Text style={styles.noEvents}>No tracking events yet. Pull latest below.</Text>
        ) : (
          shipment.events.map((ev, i) => (
            <View key={ev.id} style={styles.event}>
              <View style={styles.dotCol}>
                <View style={[styles.dot, i === 0 && styles.dotActive]} />
                {i < shipment.events.length - 1 && <View style={styles.line} />}
              </View>
              <View style={styles.eventBody}>
                <Text style={styles.eventStatus}>{STEP_LABELS[ev.status] || ev.status}</Text>
                {!!ev.location && <Text style={styles.eventLoc}>{ev.location}</Text>}
                <Text style={styles.eventTime}>{new Date(ev.timestamp).toLocaleString("en-IN")}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <Button title="Pull Latest Status" icon="refresh-outline" variant="outline" onPress={pullLatest} loading={refreshing} />
    </ScrollView>
  );
}

function Meta({ icon, label }: any) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={15} color={colors.textMuted} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.soft },
  headRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  courierLogo: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  courier: { fontWeight: "900", color: colors.text, fontSize: font.body },
  awb: { color: colors.textMuted, fontSize: font.small },
  statusPill: { backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  statusText: { color: colors.primary, fontWeight: "800", fontSize: font.tiny },
  metaRow: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.md },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: colors.textMuted, fontSize: font.small },
  reasonCard: { backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  reasonTitle: { fontWeight: "800", color: colors.primaryDark, marginBottom: 2 },
  reasonText: { color: colors.primaryDark, fontSize: font.small, lineHeight: 18 },
  timelineTitle: { fontWeight: "800", color: colors.text, fontSize: font.h3, marginTop: spacing.lg, marginBottom: spacing.md },
  timeline: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.soft },
  noEvents: { color: colors.textMuted, textAlign: "center", paddingVertical: spacing.lg },
  event: { flexDirection: "row", gap: spacing.md },
  dotCol: { alignItems: "center", width: 16 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.border, marginTop: 2 },
  dotActive: { backgroundColor: colors.primary },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
  eventBody: { flex: 1, paddingBottom: spacing.lg },
  eventStatus: { fontWeight: "800", color: colors.text },
  eventLoc: { color: colors.textMuted, fontSize: font.small },
  eventTime: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2 },
});
