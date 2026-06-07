import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { apiError } from "../api/client";
import { Catalog } from "../api/endpoints";
import { Button, ConditionBadge, EmptyState, Loading } from "../components/ui";
import { colors, font, formatINR, radius, shadow, spacing } from "../theme";
import { Part } from "../types";

const PLACEHOLDER = "https://placehold.co/200x200/E8F0FF/1565FF?text=Karbadi";

export default function MyListingsScreen() {
  const nav = useNavigation<any>();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    Catalog.myListings()
      .then((r) => setParts(r.data.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function toggleActive(part: Part) {
    const form = new FormData();
    form.append("is_active", String(!part.is_active));
    try {
      await Catalog.updatePart(part.id, form);
      load();
    } catch (e) {
      Alert.alert("Error", apiError(e));
    }
  }

  function confirmDelete(part: Part) {
    Alert.alert("Delete listing?", `“${part.title}” will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await Catalog.deletePart(part.id);
            setParts((p) => p.filter((x) => x.id !== part.id));
          } catch (e) {
            Alert.alert("Error", apiError(e));
          }
        },
      },
    ]);
  }

  if (loading) return <Loading label="Loading your listings…" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={parts}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 90 }}
        ListEmptyComponent={<EmptyState icon="cube-outline" title="No listings yet" subtitle="Add your first part to start selling." />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.primary_image || PLACEHOLDER }} style={styles.img} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text numberOfLines={1} style={styles.title}>{item.title}</Text>
                <ConditionBadge condition={item.condition} />
              </View>
              <Text style={styles.price}>{formatINR(item.price)} · {item.stock} in stock</Text>
              <View style={styles.actionsRow}>
                <Pressable style={styles.act} onPress={() => nav.navigate("PartForm", { id: item.id })}>
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                  <Text style={styles.actText}>Edit</Text>
                </Pressable>
                <Pressable style={styles.act} onPress={() => toggleActive(item)}>
                  <Ionicons name={item.is_active ? "eye-outline" : "eye-off-outline"} size={16} color={item.is_active ? colors.success : colors.textMuted} />
                  <Text style={[styles.actText, { color: item.is_active ? colors.success : colors.textMuted }]}>
                    {item.is_active ? "Active" : "Hidden"}
                  </Text>
                </Pressable>
                <Pressable style={styles.act} onPress={() => confirmDelete(item)}>
                  <Ionicons name="trash-outline" size={16} color={colors.accent} />
                  <Text style={[styles.actText, { color: colors.accent }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
      <View style={styles.fabWrap}>
        <Button title="Add New Listing" icon="add" onPress={() => nav.navigate("PartForm", {})} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.soft },
  img: { width: 76, height: 76, borderRadius: radius.md, backgroundColor: colors.primaryLight },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  title: { fontWeight: "800", color: colors.text, flex: 1 },
  price: { color: colors.textMuted, marginTop: 2, fontSize: font.small },
  actionsRow: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.sm },
  act: { flexDirection: "row", alignItems: "center", gap: 4 },
  actText: { fontWeight: "700", color: colors.primary, fontSize: font.small },
  fabWrap: { position: "absolute", bottom: 0, left: 0, right: 0, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
