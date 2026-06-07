import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, font, radius, spacing } from "../theme";

type Item = { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; soon?: boolean };

export default function MoreScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const shop = user?.seller_profile?.shop_name;
  const soon = () => Alert.alert("Coming soon", "This will be available in a future update.");

  const groups: { items: Item[] }[] = [
    {
      items: [
        { icon: "person-outline", label: "My Storefront", onPress: () => nav.navigate("Storefront") },
        { icon: "pricetags-outline", label: "My Listings", onPress: () => nav.navigate("Tabs", { screen: "Listings" }) },
        { icon: "receipt-outline", label: "My Orders", onPress: () => nav.navigate("Tabs", { screen: "Orders" }) },
        { icon: "chatbubbles-outline", label: "Inquiries", onPress: () => nav.navigate("Tabs", { screen: "Inquiries" }) },
      ],
    },
    {
      items: [
        { icon: "card-outline", label: "Payments & Payouts", onPress: soon, soon: true },
        { icon: "notifications-outline", label: "Notifications", onPress: soon, soon: true },
        { icon: "settings-outline", label: "Settings", onPress: soon, soon: true },
        { icon: "help-circle-outline", label: "Help & Support", onPress: soon, soon: true },
      ],
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: spacing.h }}>
      {/* dark identity header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.logo}><Text style={styles.initials}>{(shop || user?.username || "KB").slice(0, 2).toUpperCase()}</Text></View>
        <Text style={styles.shop}>{shop || user?.username}</Text>
        <View style={styles.verifiedRow}>
          <Ionicons name="shield-checkmark" size={13} color="#9DB2A8" />
          <Text style={styles.verified}>{user?.is_seller_approved ? "Verified Seller" : "Pending approval"}</Text>
        </View>
      </View>

      {groups.map((g, gi) => (
        <View key={gi} style={styles.card}>
          {g.items.map((it, i) => (
            <Pressable key={it.label} style={[styles.row, i < g.items.length - 1 && styles.divider]} onPress={it.onPress}>
              <Ionicons name={it.icon} size={20} color={colors.text} />
              <Text style={styles.label}>{it.label}</Text>
              {it.soon && <Text style={styles.soon}>Soon</Text>}
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Pressable>
          ))}
        </View>
      ))}

      <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.sm }}>
        <Button title="Logout" variant="outline" onPress={signOut} />
      </View>
      <Text style={styles.version}>Karbadi Seller · v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.accent, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  logo: { width: 60, height: 60, borderRadius: radius.md, backgroundColor: "#ffffff1A", borderWidth: 1, borderColor: "#ffffff33", alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  initials: { color: colors.onAccent, fontWeight: "800", fontSize: font.h3 },
  shop: { color: colors.onAccent, fontSize: font.h2, fontWeight: "700" },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  verified: { color: "#9DB2A8", fontSize: font.small },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginHorizontal: spacing.md, marginTop: spacing.md, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { flex: 1, color: colors.text, fontSize: font.body, fontWeight: "500" },
  soon: { color: colors.textFaint, fontSize: font.tiny, fontWeight: "700", marginRight: 6 },
  version: { textAlign: "center", color: colors.textFaint, fontSize: font.tiny, marginTop: spacing.xl },
});
