import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Auth } from "../api/endpoints";
import { EmptyState, Loading } from "../components/ui";
import { colors, font, radius, spacing } from "../theme";
import { SellerProfile } from "../types";

export default function VendorsScreen() {
  const nav = useNavigation<any>();
  const [vendors, setVendors] = useState<SellerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Auth.sellers().then((r) => setVendors(r.data.results)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Loading vendors…" />;

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={vendors}
      keyExtractor={(v) => String(v.id)}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      ListEmptyComponent={<EmptyState icon="storefront-outline" title="No vendors yet" />}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => nav.navigate("SellerProfile", { id: item.id, name: item.shop_name })}>
          <View style={styles.logo}><Text style={styles.initials}>{item.shop_name.slice(0, 2).toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.shop_name}</Text>
            <Text style={styles.loc}>{item.city}{item.state ? `, ${item.state}` : ""}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="star" size={12} color={colors.star} />
              <Text style={styles.meta}>{item.rating} ({item.rating_count})</Text>
              {item.is_oem && (
                <View style={styles.oemTag}><Ionicons name="shield-checkmark" size={11} color={colors.accent} /><Text style={styles.oemText}>OEM Verified</Text></View>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  logo: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  initials: { color: colors.accent, fontWeight: "800", fontSize: font.body },
  name: { fontWeight: "700", color: colors.text, fontSize: font.body },
  loc: { color: colors.textMuted, fontSize: font.tiny, marginTop: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  meta: { color: colors.textMuted, fontSize: font.tiny },
  oemTag: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 4 },
  oemText: { color: colors.accent, fontSize: 10, fontWeight: "700" },
});
