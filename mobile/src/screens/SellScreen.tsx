import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { colors, font, radius, spacing } from "../theme";

export default function SellScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  function guard(go: () => void) {
    if (!user) return nav.navigate("Login");
    go();
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Sell on Karbadi</Text>
        <Text style={styles.subtitle}>Reach thousands of buyers across India</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.h }}>
        <Pressable style={styles.card} onPress={() => guard(() => nav.navigate("VehicleForm", {}))}>
          <View style={styles.icon}><Ionicons name="car-outline" size={26} color={colors.accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Sell a Vehicle</Text>
            <Text style={styles.cardSub}>List your car in minutes. Buyers contact you directly.</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable style={styles.card} onPress={() => guard(() => nav.navigate("SellerDashboard"))}>
          <View style={styles.icon}><Ionicons name="pricetag-outline" size={26} color={colors.accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>List Spare Parts</Text>
            <Text style={styles.cardSub}>Become a seller and manage your parts catalogue & orders.</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
          <Text style={styles.noteText}>
            Vehicles are peer-to-peer — anyone can sell. Spare parts require a seller storefront.
          </Text>
        </View>

        <Pressable style={styles.linkRow} onPress={() => guard(() => nav.navigate("MyVehicles"))}>
          <Ionicons name="albums-outline" size={20} color={colors.text} />
          <Text style={styles.linkText}>My vehicle listings</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => guard(() => nav.navigate("MyListings"))}>
          <Ionicons name="cube-outline" size={20} color={colors.text} />
          <Text style={styles.linkText}>My part listings</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: font.h1, fontWeight: "700", color: colors.text },
  subtitle: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  card: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  icon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: font.h3, fontWeight: "700", color: colors.text },
  cardSub: { color: colors.textMuted, fontSize: font.small, marginTop: 2, lineHeight: 19 },
  note: { flexDirection: "row", gap: spacing.sm, backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xs, marginBottom: spacing.lg },
  noteText: { flex: 1, color: colors.accentDark, fontSize: font.small, lineHeight: 19 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  linkText: { flex: 1, color: colors.text, fontWeight: "600", fontSize: font.body },
});
