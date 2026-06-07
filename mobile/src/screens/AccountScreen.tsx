import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, font, radius, spacing } from "../theme";

type Item = { icon: keyof typeof Ionicons.glyphMap; label: string; to: string; params?: any };

export default function AccountScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <View style={[styles.guest, { paddingTop: insets.top + spacing.h }]}>
        <View style={styles.avatarLg}><Ionicons name="person-outline" size={34} color={colors.accent} /></View>
        <Text style={styles.guestTitle}>Welcome to Karbadi</Text>
        <Text style={styles.guestSub}>Sign in to manage orders, messages and your garage.</Text>
        <Button title="Sign In" onPress={() => nav.navigate("Login")} style={{ alignSelf: "stretch", marginTop: spacing.lg }} />
      </View>
    );
  }

  const isSeller = user.role === "seller" || user.role === "admin";
  const groups: { title: string; items: Item[] }[] = [
    {
      title: "Shopping",
      items: [
        { icon: "bag-outline", label: "My Cart", to: "Cart" },
        { icon: "receipt-outline", label: "Orders", to: "Orders" },
        { icon: "chatbubbles-outline", label: "Messages", to: "Tabs", params: { screen: "Messages" } },
      ],
    },
    {
      title: "Garage",
      items: [
        { icon: "car-outline", label: "My Vehicle Listings", to: "MyVehicles" },
        { icon: "cube-outline", label: "My Part Listings", to: "MyListings" },
        ...(isSeller ? [{ icon: "stats-chart-outline", label: "Seller Dashboard", to: "SellerDashboard" } as Item] : []),
      ],
    },
    {
      title: "More",
      items: [
        { icon: "storefront-outline", label: "Browse Vendors", to: "Vendors" },
        { icon: "shield-checkmark-outline", label: "Help & Support", to: "Tabs", params: { screen: "Messages" } },
      ],
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: spacing.h }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.avatar}><Text style={styles.initials}>{(user.first_name || user.username).slice(0, 2).toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user.first_name || user.username}</Text>
          <Text style={styles.email}>{user.email || user.username}</Text>
          <View style={styles.roleTag}><Text style={styles.roleText}>{user.role.toUpperCase()}</Text></View>
        </View>
      </View>

      {groups.map((g) => (
        <View key={g.title} style={styles.group}>
          <Text style={styles.groupTitle}>{g.title}</Text>
          <View style={styles.card}>
            {g.items.map((it, i) => (
              <Pressable
                key={it.label}
                style={[styles.row, i < g.items.length - 1 && styles.rowDivider]}
                onPress={() => nav.navigate(it.to, it.params)}
              >
                <Ionicons name={it.icon} size={20} color={colors.text} />
                <Text style={styles.rowLabel}>{it.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.sm }}>
        <Button title="Sign Out" variant="outline" onPress={signOut} />
      </View>
      <Text style={styles.version}>Karbadi · v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guest: { flex: 1, alignItems: "center", padding: spacing.xl, backgroundColor: colors.bg },
  avatarLg: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  guestTitle: { fontSize: font.h2, fontWeight: "700", color: colors.text },
  guestSub: { color: colors.textMuted, textAlign: "center", marginTop: spacing.sm, lineHeight: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  initials: { color: colors.onAccent, fontWeight: "800", fontSize: font.h3 },
  name: { fontSize: font.h2, fontWeight: "700", color: colors.text },
  email: { color: colors.textMuted, fontSize: font.small, marginTop: 1 },
  roleTag: { alignSelf: "flex-start", backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 2, marginTop: 6 },
  roleText: { color: colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  group: { paddingHorizontal: spacing.md, marginTop: spacing.lg },
  groupTitle: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { flex: 1, color: colors.text, fontSize: font.body, fontWeight: "500" },
  version: { textAlign: "center", color: colors.textFaint, fontSize: font.tiny, marginTop: spacing.xl },
});
