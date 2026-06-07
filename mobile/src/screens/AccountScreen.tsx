import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, font, radius, spacing } from "../theme";

const ROLE_LABEL: Record<string, string> = { buyer: "Vehicle Owner", seller: "Seller", admin: "Administrator" };

export default function AccountScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const soon = () => Alert.alert("Coming soon", "This will be available in a future update.");

  if (!user) {
    return (
      <View style={[styles.guest, { paddingTop: insets.top + spacing.h }]}>
        <View style={styles.guestAvatar}><Ionicons name="person-outline" size={34} color={colors.accent} /></View>
        <Text style={styles.guestTitle}>Welcome to Karbadi</Text>
        <Text style={styles.guestSub}>Sign in to manage your garage, orders and messages.</Text>
        <Button title="Sign In" onPress={() => nav.navigate("Login")} style={{ alignSelf: "stretch", marginTop: spacing.lg }} />
      </View>
    );
  }

  const isSeller = user.role === "seller" || user.role === "admin";
  type Item = { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean };
  const items: Item[] = [
    { icon: "person-outline", label: "My Profile", onPress: soon },
    { icon: "car-sport-outline", label: "My Garage", onPress: () => nav.navigate("MyVehicles") },
    { icon: "receipt-outline", label: "Orders", onPress: () => nav.navigate("Orders") },
    { icon: "chatbubbles-outline", label: "Messages", onPress: () => nav.navigate("Tabs", { screen: "Messages" }) },
    { icon: "location-outline", label: "Addresses", onPress: soon },
    { icon: "help-buoy-outline", label: "My Inquiries", onPress: () => nav.navigate("Tabs", { screen: "Messages" }) },
    { icon: "bookmark-outline", label: "Saved Vendors", onPress: () => nav.navigate("Vendors") },
    ...(isSeller ? [{ icon: "stats-chart-outline", label: "Seller Dashboard", onPress: () => nav.navigate("SellerDashboard") } as Item] : []),
    { icon: "information-circle-outline", label: "About Us", onPress: soon },
    { icon: "lock-closed-outline", label: "Privacy Policy", onPress: soon },
    { icon: "document-text-outline", label: "Terms & Conditions", onPress: soon },
    { icon: "headset-outline", label: "Contact Support", onPress: soon },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: spacing.h }}>
      {/* dark identity header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.avatar}><Text style={styles.initials}>{(user.first_name || user.username).slice(0, 2).toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{(user.first_name || user.username).toUpperCase()}</Text>
          <Text style={styles.role}>{ROLE_LABEL[user.role] || "Member"}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9DB2A8" />
      </View>

      <View style={styles.menu}>
        {items.map((it, i) => (
          <Pressable key={it.label} style={[styles.row, i < items.length - 1 && styles.divider]} onPress={it.onPress}>
            <Ionicons name={it.icon} size={20} color={colors.text} />
            <Text style={styles.label}>{it.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </Pressable>
        ))}
        <Pressable style={styles.row} onPress={signOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.label, { color: colors.error }]}>Logout</Text>
        </Pressable>
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guest: { flex: 1, alignItems: "center", padding: spacing.xl, backgroundColor: colors.bg },
  guestAvatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  guestTitle: { fontSize: font.h2, fontWeight: "700", color: colors.text },
  guestSub: { color: colors.textMuted, textAlign: "center", marginTop: spacing.sm, lineHeight: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.accent, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  avatar: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: "#ffffff1A", borderWidth: 1, borderColor: "#ffffff33", alignItems: "center", justifyContent: "center" },
  initials: { color: colors.onAccent, fontWeight: "800", fontSize: font.h3 },
  name: { color: colors.onAccent, fontSize: font.h3, fontWeight: "700", letterSpacing: 0.5 },
  role: { color: "#9DB2A8", fontSize: font.small, marginTop: 2 },
  menu: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginHorizontal: spacing.md, marginTop: spacing.lg, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 15 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { flex: 1, color: colors.text, fontSize: font.body, fontWeight: "500" },
  version: { textAlign: "center", color: colors.textFaint, fontSize: font.tiny, marginTop: spacing.xl },
});
