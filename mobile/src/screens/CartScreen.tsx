import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback } from "react";
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { haptic } from "../components/motion";
import { Button, EmptyState } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { colors, font, formatINR, radius, shadow, spacing } from "../theme";

const PLACEHOLDER = "https://placehold.co/200x200/E8F0FF/1565FF?text=Karbadi";

export default function CartScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { cart, refresh, setQty, remove } = useCart();

  const animQty = (id: number, q: number) => { haptic.light(); setQty(id, q); };
  const animRemove = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    haptic.medium();
    remove(id);
  };

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <EmptyState icon="cart-outline" title="Your cart awaits" subtitle="Sign in to add parts and check out." />
        <View style={{ padding: spacing.lg }}>
          <Button title="Sign In" onPress={() => nav.navigate("Login")} />
        </View>
      </View>
    );
  }

  const items = cart?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + spacing.sm }}>
      <Text style={styles.heading}>My Cart</Text>
      {items.length === 0 ? (
        <EmptyState icon="cart-outline" title="Cart is empty" subtitle="Browse parts and add them here." />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 200 }}>
            {items.map((item) => (
              <View key={item.id} style={styles.card}>
                <Image source={{ uri: item.part_detail.primary_image || PLACEHOLDER }} style={styles.img} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={2} style={styles.title}>{item.part_detail.title}</Text>
                  <Text style={styles.price}>{formatINR(item.part_detail.price)}</Text>
                  <View style={styles.stepper}>
                    <Pressable style={styles.stepBtn} onPress={() => animQty(item.id, item.quantity - 1)}>
                      <Ionicons name="remove" size={16} color={colors.primary} />
                    </Pressable>
                    <Text style={styles.qty}>{item.quantity}</Text>
                    <Pressable style={styles.stepBtn} onPress={() => animQty(item.id, item.quantity + 1)}>
                      <Ionicons name="add" size={16} color={colors.primary} />
                    </Pressable>
                    <View style={{ flex: 1 }} />
                    <Pressable onPress={() => animRemove(item.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={20} color={colors.accent} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({cart?.item_count} items)</Text>
              <Text style={styles.summaryValue}>{formatINR(cart?.subtotal)}</Text>
            </View>
            <Text style={styles.note}>Shipping calculated at checkout via smart courier select.</Text>
            <Button title="Proceed to Checkout" icon="arrow-forward" onPress={() => nav.navigate("Checkout")} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: font.h1, fontWeight: "900", color: colors.text, paddingHorizontal: spacing.lg },
  card: { flexDirection: "row", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.soft },
  img: { width: 80, height: 80, borderRadius: radius.md, backgroundColor: colors.primaryLight },
  title: { fontWeight: "700", color: colors.text, fontSize: font.small },
  price: { color: colors.primary, fontWeight: "800", marginTop: 2 },
  stepper: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, gap: spacing.sm },
  stepBtn: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  qty: { fontWeight: "800", color: colors.text, minWidth: 20, textAlign: "center" },
  summary: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, padding: spacing.lg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, ...shadow.card, gap: spacing.sm },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { color: colors.textMuted, fontWeight: "600" },
  summaryValue: { fontSize: font.h2, fontWeight: "900", color: colors.text },
  note: { color: colors.textMuted, fontSize: font.tiny, marginBottom: spacing.sm },
});
