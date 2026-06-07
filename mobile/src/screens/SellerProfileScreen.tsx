import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { Auth, Catalog } from "../api/endpoints";
import { PartCard } from "../components/PartCard";
import { Badge, EmptyState, Loading } from "../components/ui";
import { colors, font, radius, spacing } from "../theme";
import { Part, SellerProfile } from "../types";

export default function SellerProfileScreen({ route }: any) {
  const { id } = route.params;
  const nav = useNavigation<any>();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const s = await Auth.seller(id);
        setSeller(s.data);
        // Fetch this seller's listings server-side by their user id.
        const p = await Catalog.parts({ seller: s.data.user_id });
        setParts(p.data.results);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Loading label="Loading seller…" />;
  if (!seller) return <EmptyState icon="storefront-outline" title="Seller not found" />;

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={parts}
      keyExtractor={(p) => String(p.id)}
      numColumns={2}
      columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}
      contentContainerStyle={{ paddingBottom: spacing.xxl, gap: spacing.md }}
      ListHeaderComponent={
        <View>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
            <View style={styles.logo}>
              <Ionicons name="storefront" size={34} color={colors.primary} />
            </View>
            <Text style={styles.shopName}>{seller.shop_name}</Text>
            <Text style={styles.location}>
              <Ionicons name="location-outline" size={13} color="#CFE0FF" /> {seller.city}, {seller.state}
            </Text>
            <View style={styles.statsRow}>
              <Stat icon="star" value={`${seller.rating}`} label={`${seller.rating_count} reviews`} />
              <Stat icon="cube" value={`${parts.length}`} label="Listings" />
              {seller.is_oem && <Stat icon="shield-checkmark" value="OEM" label="Verified" />}
            </View>
          </LinearGradient>
          {!!seller.description && <Text style={styles.desc}>{seller.description}</Text>}
          <Text style={styles.listingsTitle}>Listings</Text>
        </View>
      }
      ListEmptyComponent={<EmptyState icon="cube-outline" title="No active listings" />}
      renderItem={({ item }) => (
        <View style={{ flex: 1 }}>
          <PartCard part={item} onPress={() => nav.navigate("PartDetail", { id: item.id, title: item.title })} />
        </View>
      )}
    />
  );
}

function Stat({ icon, value, label }: any) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={16} color={colors.white} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  logo: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  shopName: { color: colors.white, fontSize: font.h2, fontWeight: "900" },
  location: { color: "#CFE0FF", marginTop: 4, fontSize: font.small },
  statsRow: { flexDirection: "row", gap: spacing.xl, marginTop: spacing.lg },
  stat: { alignItems: "center" },
  statValue: { color: colors.white, fontWeight: "900", fontSize: font.h3, marginTop: 2 },
  statLabel: { color: "#CFE0FF", fontSize: font.tiny },
  desc: { color: colors.textMuted, padding: spacing.lg, lineHeight: 20 },
  listingsTitle: { fontSize: font.h3, fontWeight: "800", color: colors.text, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
});
