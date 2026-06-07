import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { apiError } from "../api/client";
import { Catalog } from "../api/endpoints";
import { Badge, Button, EmptyState, Loading } from "../components/ui";
import { colors, font, formatINR, radius, shadow, spacing } from "../theme";
import { VehicleListing } from "../types";

const PH = "https://placehold.co/300x200/E8F0FF/1565FF?text=Karbadi";

export default function MyVehiclesScreen() {
  const nav = useNavigation<any>();
  const [items, setItems] = useState<VehicleListing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    Catalog.myVehicles().then((r) => setItems(r.data.results)).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  function confirmDelete(v: VehicleListing) {
    Alert.alert("Remove listing?", `“${v.title}” will be deleted.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await Catalog.deleteVehicle(v.id); setItems((p) => p.filter((x) => x.id !== v.id)); }
        catch (e) { Alert.alert("Error", apiError(e)); }
      } },
    ]);
  }

  if (loading) return <Loading label="Loading your vehicles…" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={items}
        keyExtractor={(v) => String(v.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 90 }}
        ListEmptyComponent={<EmptyState icon="car-outline" title="No vehicles listed" subtitle="Tap “Sell a Vehicle” to post your car." />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.primary_image || PH }} style={styles.img} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text numberOfLines={1} style={styles.title}>{item.title}</Text>
                {item.is_sold && <Badge label="SOLD" color={colors.accent} />}
              </View>
              <Text style={styles.price}>{formatINR(item.price)} · {item.year} · {item.km_driven.toLocaleString("en-IN")} km</Text>
              <View style={styles.actionsRow}>
                <Pressable style={styles.act} onPress={() => nav.navigate("VehicleForm", { id: item.id })}>
                  <Ionicons name="create-outline" size={16} color={colors.primary} /><Text style={styles.actText}>Edit</Text>
                </Pressable>
                <Pressable style={styles.act} onPress={() => nav.navigate("VehicleDetail", { id: item.id, title: item.title })}>
                  <Ionicons name="eye-outline" size={16} color={colors.primary} /><Text style={styles.actText}>View</Text>
                </Pressable>
                <Pressable style={styles.act} onPress={() => confirmDelete(item)}>
                  <Ionicons name="trash-outline" size={16} color={colors.accent} /><Text style={[styles.actText, { color: colors.accent }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
      <View style={styles.fab}>
        <Button title="Sell a Vehicle" icon="add" onPress={() => nav.navigate("VehicleForm", {})} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.soft },
  img: { width: 96, height: 72, borderRadius: radius.md, backgroundColor: colors.primaryLight },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  title: { fontWeight: "800", color: colors.text, flex: 1 },
  price: { color: colors.textMuted, marginTop: 2, fontSize: font.small },
  actionsRow: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.sm },
  act: { flexDirection: "row", alignItems: "center", gap: 4 },
  actText: { fontWeight: "700", color: colors.primary, fontSize: font.small },
  fab: { position: "absolute", bottom: 0, left: 0, right: 0, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
