import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Auth, Catalog } from "../api/endpoints";
import { PartCard } from "../components/PartCard";
import { Button, EmptyState, Loading } from "../components/ui";
import { colors, font, radius, spacing } from "../theme";
import { Part, SellerProfile } from "../types";

export default function SellerProfileScreen({ route }: any) {
  const { id } = route.params;
  const nav = useNavigation<any>();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await Auth.seller(id);
        setSeller(s.data);
        const p = await Catalog.parts({ seller: s.data.user_id });
        setParts(p.data.results);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <Loading label="Loading vendor…" />;
  if (!seller) return <EmptyState icon="storefront-outline" title="Vendor not found" />;

  const about = seller.description || "Trusted auto-parts vendor on Karbadi.";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={parts}
        keyExtractor={(p) => String(p.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.md }}
        contentContainerStyle={{ paddingBottom: 110, gap: spacing.md }}
        ListHeaderComponent={
          <View>
            {/* identity */}
            <View style={styles.identity}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>{seller.is_oem ? "OEM" : seller.shop_name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <Text style={styles.name}>{seller.shop_name}</Text>
              <Text style={styles.handle}>#Karbadi{String(seller.id).padStart(3, "0")}</Text>
              <View style={styles.verified}>
                <Ionicons name="shield-checkmark" size={14} color={colors.accent} />
                <Text style={styles.verifiedText}>{seller.is_oem ? "Verified OEM Seller" : "Verified Seller"}</Text>
              </View>
            </View>

            {/* stats */}
            <View style={styles.stats}>
              <Stat value={`${parts.length}`} label="Listings" />
              <View style={styles.statDivider} />
              <Stat value="98%" label="Response rate" />
              <View style={styles.statDivider} />
              <Stat value={`${seller.rating}`} label="Rating" />
            </View>

            {/* about */}
            <View style={styles.aboutCard}>
              <Text style={styles.aboutTitle}>About</Text>
              <Text style={styles.aboutText} numberOfLines={expanded ? undefined : 2}>{about}</Text>
              <Pressable onPress={() => setExpanded((e) => !e)}>
                <Text style={styles.viewMore}>{expanded ? "View less" : "View more"}</Text>
              </Pressable>
            </View>

            <View style={styles.productsHead}>
              <Text style={styles.productsTitle}>Products ({parts.length})</Text>
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="cube-outline" title="No active listings" />}
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <PartCard part={item} onPress={() => nav.navigate("PartDetail", { id: item.id, title: item.title })} />
          </View>
        )}
      />

      {/* sticky footer */}
      <View style={styles.footer}>
        <Button
          title="Raise Inquiry"
          icon="chatbubble-ellipses-outline"
          onPress={() => parts.length
            ? nav.navigate("PartDetail", { id: parts[0].id, title: parts[0].title })
            : nav.navigate("Tabs", { screen: "Messages" })}
        />
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: "center", paddingTop: spacing.lg, paddingHorizontal: spacing.lg },
  logo: { width: 76, height: 76, borderRadius: radius.lg, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  logoText: { color: colors.accent, fontWeight: "800", fontSize: font.h3, letterSpacing: 1 },
  name: { fontSize: font.h2, fontWeight: "700", color: colors.text },
  handle: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  verified: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: spacing.sm, backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  verifiedText: { color: colors.accent, fontWeight: "700", fontSize: font.small },
  stats: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginHorizontal: spacing.md, marginTop: spacing.lg, paddingVertical: spacing.md },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: font.h3, fontWeight: "800", color: colors.text },
  statLabel: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  aboutCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.lg },
  aboutTitle: { fontWeight: "700", color: colors.text, fontSize: font.body, marginBottom: spacing.sm },
  aboutText: { color: colors.textMuted, lineHeight: 21 },
  viewMore: { color: colors.accent, fontWeight: "700", marginTop: spacing.sm },
  productsHead: { paddingHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm },
  productsTitle: { fontSize: font.h3, fontWeight: "700", color: colors.text },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
