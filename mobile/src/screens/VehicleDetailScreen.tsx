import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from "react-native";

import { Catalog, Orders } from "../api/endpoints";
import { Button, Loading } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, font, formatINR, radius, shadow, spacing } from "../theme";
import { VehicleListing } from "../types";

const PLACEHOLDER = "https://placehold.co/600x400/E8F0FF/1565FF?text=Vehicle";

export default function VehicleDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const { user } = useAuth();
  const [v, setV] = useState<VehicleListing | null>(null);

  useEffect(() => {
    Catalog.vehicle(id).then((r) => setV(r.data)).catch(() => {});
  }, [id]);

  if (!v) return <Loading label="Loading vehicle…" />;

  async function inquire() {
    if (!user) {
      navigation.navigate("Login");
      return;
    }
    try {
      await Orders.createInquiry({ vehicle: v!.id, message: `I'm interested in ${v!.title}. Is it still available?` });
      Alert.alert("Inquiry sent", "The seller will contact you soon.");
    } catch {
      Alert.alert("Error", "Could not send inquiry.");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Image source={{ uri: v.primary_image || PLACEHOLDER }} style={styles.hero} contentFit="cover" />
        <View style={styles.body}>
          <Text style={styles.title}>{v.title}</Text>
          <Text style={styles.price}>{formatINR(v.price)}</Text>

          <View style={styles.specGrid}>
            <SpecBox icon="calendar-outline" label="Year" value={`${v.year}`} />
            <SpecBox icon="speedometer-outline" label="Driven" value={`${v.km_driven.toLocaleString("en-IN")} km`} />
            <SpecBox icon="water-outline" label="Fuel" value={v.fuel_type} />
            <SpecBox icon="person-outline" label="Owners" value={`${v.owners}`} />
            <SpecBox icon="business-outline" label="Brand" value={v.brand_name || "—"} />
            <SpecBox icon="location-outline" label="City" value={v.city || "—"} />
          </View>

          {!!v.description && (
            <View style={styles.descBox}>
              <Text style={styles.descTitle}>Description</Text>
              <Text style={styles.desc}>{v.description}</Text>
            </View>
          )}

          {!!v.registration_number && (
            <Text style={styles.reg}>Reg. No: {v.registration_number}</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.bar}>
        {!!v.seller_phone && (
          <Button title="Call" icon="call-outline" variant="outline" onPress={() => Linking.openURL(`tel:${v.seller_phone}`)} style={{ width: 110 }} />
        )}
        <View style={{ flex: 1 }}>
          <Button title="Send Inquiry" icon="chatbubble-ellipses-outline" onPress={inquire} />
        </View>
      </View>
    </View>
  );
}

function SpecBox({ icon, label, value }: any) {
  return (
    <View style={styles.specBox}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.specValue}>{value}</Text>
      <Text style={styles.specLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", height: 240, backgroundColor: colors.primaryLight },
  body: { padding: spacing.lg },
  title: { fontSize: font.h2, fontWeight: "900", color: colors.text },
  price: { fontSize: 26, fontWeight: "900", color: colors.primary, marginTop: 4 },
  specGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg },
  specBox: { width: "31%", backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, alignItems: "center", ...shadow.soft },
  specValue: { fontWeight: "800", color: colors.text, marginTop: 4, textTransform: "capitalize" },
  specLabel: { color: colors.textMuted, fontSize: font.tiny },
  descBox: { marginTop: spacing.lg },
  descTitle: { fontWeight: "800", color: colors.text, marginBottom: 4 },
  desc: { color: colors.textMuted, lineHeight: 20 },
  reg: { color: colors.textMuted, marginTop: spacing.md },
  bar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: spacing.md, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
