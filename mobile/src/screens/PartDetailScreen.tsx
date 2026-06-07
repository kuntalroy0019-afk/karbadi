import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { apiError } from "../api/client";
import { Catalog, Orders } from "../api/endpoints";
import { haptic } from "../components/motion";
import { Button, ConditionBadge, Loading } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { colors, font, formatINR, radius, shadow, spacing } from "../theme";
import { Part } from "../types";

const PLACEHOLDER = "https://placehold.co/600x600/E8F0FF/1565FF?text=Karbadi";

export default function PartDetailScreen({ route }: any) {
  const { id } = route.params;
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const { add } = useCart();
  const [part, setPart] = useState<Part | null>(null);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [showInquiry, setShowInquiry] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Catalog.part(id).then((r) => setPart(r.data)).catch(() => {});
  }, [id]);

  if (!part) return <Loading label="Loading part…" />;

  const images = part.images?.length ? part.images.map((i) => i.image) : [part.primary_image || PLACEHOLDER];

  async function addToCart() {
    if (!user) return promptLogin();
    try {
      await add(part!.id, qty);
      haptic.success();
      Alert.alert("Added to cart", `${qty} × ${part!.title}`);
    } catch (e) {
      haptic.warning();
      Alert.alert("Error", apiError(e));
    }
  }

  function promptLogin() {
    Alert.alert("Sign in required", "Please sign in to continue.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign In", onPress: () => nav.navigate("Login") },
    ]);
  }

  async function sendInquiry() {
    if (!user) return promptLogin();
    try {
      await Orders.createInquiry({ part: part!.id, message });
      setShowInquiry(false);
      setMessage("");
      Alert.alert("Inquiry sent", "The seller will get back to you.");
    } catch (e) {
      Alert.alert("Error", apiError(e));
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View>
          <Image source={{ uri: images[active] }} style={styles.hero} contentFit="cover" transition={150} />
          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
              {images.map((img, i) => (
                <Pressable key={i} onPress={() => setActive(i)}>
                  <Image source={{ uri: img }} style={[styles.thumb, active === i && styles.thumbActive]} />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.rowBetween}>
            <ConditionBadge condition={part.condition} />
            {part.discount_percent > 0 && (
              <Text style={styles.save}>Save {part.discount_percent}%</Text>
            )}
          </View>
          <Text style={styles.title}>{part.title}</Text>
          {!!part.oem_part_number && <Text style={styles.oem}>OEM Part No: {part.oem_part_number}</Text>}

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatINR(part.price)}</Text>
            {part.mrp && Number(part.mrp) > Number(part.price) ? (
              <Text style={styles.mrp}>{formatINR(part.mrp)}</Text>
            ) : null}
            <View style={{ flex: 1 }} />
            <Text style={[styles.stock, { color: part.stock > 0 ? colors.success : colors.accent }]}>
              {part.stock > 0 ? `${part.stock} in stock` : "Out of stock"}
            </Text>
          </View>

          {/* Seller */}
          <Pressable
            style={styles.sellerCard}
            onPress={() => part.seller_profile && nav.navigate("SellerProfile", { id: part.seller_profile.id, name: part.seller_shop })}
          >
            <View style={styles.sellerLogo}>
              <Ionicons name="storefront" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName}>{part.seller_shop}</Text>
              {part.seller_profile && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color={colors.star} />
                  <Text style={styles.ratingText}>
                    {part.seller_profile.rating} · {part.seller_profile.city}
                  </Text>
                  {part.seller_profile.is_oem && <Text style={styles.oemTag}>OEM</Text>}
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          {!!part.compatible_vehicles && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Compatible Vehicles</Text>
              <Text style={styles.infoText}>{part.compatible_vehicles}</Text>
            </View>
          )}
          {!!part.description && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoText}>{part.description}</Text>
            </View>
          )}

          {/* Quantity */}
          <View style={styles.qtyRow}>
            <Text style={styles.infoLabel}>Quantity</Text>
            <View style={styles.stepper}>
              <Pressable style={styles.stepBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
                <Ionicons name="remove" size={18} color={colors.primary} />
              </Pressable>
              <Text style={styles.qtyText}>{qty}</Text>
              <Pressable style={styles.stepBtn} onPress={() => setQty((q) => q + 1)}>
                <Ionicons name="add" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </View>

          {showInquiry && (
            <View style={styles.inquiryBox}>
              <TextInput
                style={styles.inquiryInput}
                placeholder="Ask the seller a question…"
                placeholderTextColor={colors.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <Button title="Send Inquiry" onPress={sendInquiry} disabled={!message.trim()} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky action bar */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.inquiryBtn} onPress={() => setShowInquiry((s) => !s)}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
          <Text style={styles.inquiryBtnText}>Inquiry</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Button title="Add to Cart" icon="cart-outline" onPress={addToCart} disabled={part.stock <= 0} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", height: 300, backgroundColor: colors.primaryLight },
  thumbs: { padding: spacing.md, gap: spacing.sm },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.primaryLight },
  thumbActive: { borderWidth: 2, borderColor: colors.primary },
  body: { padding: spacing.lg },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  save: { color: colors.accent, fontWeight: "800" },
  title: { fontSize: font.h2, fontWeight: "900", color: colors.text, marginTop: spacing.sm },
  oem: { color: colors.textMuted, marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: spacing.md },
  price: { fontSize: 28, fontWeight: "900", color: colors.primary },
  mrp: { fontSize: font.body, color: colors.textMuted, textDecorationLine: "line-through" },
  stock: { fontWeight: "700", fontSize: font.small },
  sellerCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg, ...shadow.soft },
  sellerLogo: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  sellerName: { fontWeight: "800", color: colors.text },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  ratingText: { color: colors.textMuted, fontSize: font.tiny },
  oemTag: { color: colors.success, fontSize: font.tiny, fontWeight: "800", marginLeft: 6 },
  infoBlock: { marginTop: spacing.lg },
  infoLabel: { fontWeight: "800", color: colors.text, marginBottom: 4 },
  infoText: { color: colors.textMuted, lineHeight: 20 },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.lg },
  stepper: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.md, ...shadow.soft },
  stepBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  qtyText: { width: 36, textAlign: "center", fontWeight: "800", fontSize: font.body, color: colors.text },
  inquiryBox: { marginTop: spacing.lg, gap: spacing.sm },
  inquiryInput: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, minHeight: 80, textAlignVertical: "top", borderWidth: 1, borderColor: colors.border, color: colors.text },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: spacing.md, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  inquiryBtn: { width: 90, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.primary, alignItems: "center", justifyContent: "center", gap: 2 },
  inquiryBtnText: { color: colors.primary, fontWeight: "700", fontSize: font.tiny },
});
