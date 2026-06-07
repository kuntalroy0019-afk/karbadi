import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Catalog } from "../api/endpoints";
import { EmptyState, Loading } from "../components/ui";
import { colors, font, formatINR, radius, shadow, spacing } from "../theme";
import { VehicleListing } from "../types";

const PLACEHOLDER = "https://placehold.co/600x400/E8F0FF/1565FF?text=Vehicle";

export default function VehiclesScreen() {
  const nav = useNavigation<any>();
  const [vehicles, setVehicles] = useState<VehicleListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Catalog.vehicles()
      .then((r) => setVehicles(r.data.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Loading vehicles…" />;

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={vehicles}
      keyExtractor={(v) => String(v.id)}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      ListEmptyComponent={<EmptyState icon="car-outline" title="No vehicles listed" />}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => nav.navigate("VehicleDetail", { id: item.id, title: item.title })}>
          <Image source={{ uri: item.primary_image || PLACEHOLDER }} style={styles.img} contentFit="cover" />
          <View style={styles.body}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.specRow}>
              <Spec icon="speedometer-outline" text={`${item.km_driven.toLocaleString("en-IN")} km`} />
              <Spec icon="water-outline" text={item.fuel_type} />
              <Spec icon="person-outline" text={`${item.owners} owner`} />
            </View>
            <View style={styles.foot}>
              <Text style={styles.price}>{formatINR(item.price)}</Text>
              <Text style={styles.city}><Ionicons name="location-outline" size={12} color={colors.textMuted} /> {item.city}</Text>
            </View>
          </View>
        </Pressable>
      )}
    />
  );
}

function Spec({ icon, text }: any) {
  return (
    <View style={styles.spec}>
      <Ionicons name={icon} size={13} color={colors.primary} />
      <Text style={styles.specText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: "hidden", ...shadow.soft },
  img: { width: "100%", height: 170, backgroundColor: colors.primaryLight },
  body: { padding: spacing.md },
  title: { fontWeight: "900", color: colors.text, fontSize: font.h3 },
  specRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  spec: { flexDirection: "row", alignItems: "center", gap: 4 },
  specText: { color: colors.textMuted, fontSize: font.tiny, textTransform: "capitalize" },
  foot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  price: { fontWeight: "900", color: colors.primary, fontSize: font.h2 },
  city: { color: colors.textMuted, fontSize: font.small },
});
