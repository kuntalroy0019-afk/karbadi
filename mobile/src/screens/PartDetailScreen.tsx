import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { apiError } from "../api/client";
import { Catalog, Orders } from "../api/endpoints";
import { haptic } from "../components/motion";
import { Button, Loading } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { colors, font, formatINR, radius, shadow, spacing } from "../theme";
import { Part } from "../types";

const PLACEHOLDER = "https://placehold.co/600x600/EFEDE7/234135?text=Karbadi";
const W = Dimensions.get("window").width;

export default function PartDetailScreen({ route }: any) {
  const { id } = route.params;
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const { add } = useCart();
  const [part, setPart] = useState<Part | null>(null);
  const [active, setActive] = useState(0);
  const [showInquiry, setShowInquiry] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Catalog.part(id).then((r) => setPart(r.data)).catch(() => {});
  }, [id]);

  if (!part) return <Loading label="Loading part…" />;

  const images = part.images?.length ? part.images.map((i) => i.image) : [part.primary_image || PLACEHOLDER];
  const compat = (part.compatible_vehicles || "").split(",").map((s) => s.trim()).filter(Boolean);
  const isOem = !!part.seller_profile?.is_oem || !!part.oem_part_number;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setActive(Math.round(e.nativeEvent.contentOffset.x / (W - spacing.md * 2)));

  function promptLogin() {
    Alert.alert("Sign in required", "Please sign in to continue.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign In", onPress: () => nav.navigate("Login") },
    ]);
  }
  async function addToCart() {
    if (!user) return promptLogin();
    try { await add(part!.id, 1); haptic.success(); Alert.alert("Added to cart", part!.title); }
    catch (e) { haptic.warning(); Alert.alert("Error", apiError(e)); }
  }
  async function sendInquiry() {
    if (!user) return promptLogin();
    try {
      await Orders.createInquiry({ part: part!.id, message: message || `Is "${part!.title}" available?` });
      haptic.success(); setShowInquiry(false); setMessage("");
      Alert.alert("Inquiry sent", "The vendor will respond in Messages.");
    } catch (e) { haptic.warning(); Alert.alert("Error", apiError(e)); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Gallery */}
        <View style={styles.gallery}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
            {images.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.heroImg} contentFit="cover" transition={150} />
            ))}
          </ScrollView>
          <View style={styles.counter}><Text style={styles.counterText}>{active + 1}/{images.length}</Text></View>
        </View>

        {/* Title + price */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{part.title}</Text>
          <Text style={styles.price}>{formatINR(part.price)}</Text>
        </View>
        <View style={styles.badgeRow}>
          {isOem && (
            <View style={[styles.badge, styles.badgeOem]}>
              <Ionicons name="shield-checkmark" size={12} color={colors.accent} />
              <Text style={styles.badgeOemText}>OEM Verified</Text>
            </View>
          )}
          <View style={[styles.badge, styles.badgeNeutral]}>
            <Text style={styles.badgeNeutralText}>{part.condition === "new" ? "New" : "Used"}</Text>
          </View>
          {part.mrp && Number(part.mrp) > Number(part.price) ? (
            <Text style={styles.mrp}>{formatINR(part.mrp)}</Text>
          ) : null}
        </View>

        {/* Vendor */}
        <Pressable
          style={styles.vendor}
          onPress={() => part.seller_profile && nav.navigate("SellerProfile", { id: part.seller_profile.id, name: part.seller_shop })}
        >
          <View style={styles.vendorLogo}><Text style={styles.vendorInitials}>{part.seller_shop.slice(0, 2).toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vendorName}>{part.seller_shop}</Text>
            <View style={styles.vendorMeta}>
              <Ionicons name="star" size={12} color={colors.star} />
              <Text style={styles.vendorMetaText}>{part.seller_profile?.rating || "—"} · {part.seller_profile?.city || ""}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </Pressable>

        {/* Compatibility */}
        {(compat.length > 0 || !!part.oem_part_number) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Compatible with</Text>
            {compat.length > 0 ? (
              <View style={styles.chips}>
                {compat.map((c) => <View key={c} style={styles.chip}><Text style={styles.chipText}>{c}</Text></View>)}
              </View>
            ) : <Text style={styles.muted}>Universal / see description</Text>}
          </View>
        )}

        {/* Part details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Part Details</Text>
          <Row label="Condition" value={part.condition === "new" ? "New" : "Used"} />
          {!!part.oem_part_number && <Row label="OEM Part No." value={part.oem_part_number} />}
          {!!part.brand?.name && <Row label="Brand" value={part.brand.name} />}
          {!!part.category_name && <Row label="Category" value={part.category_name} />}
          <Row label="Availability" value={part.stock > 0 ? `${part.stock} in stock` : "Out of stock"} highlight={part.stock > 0} />
        </View>

        {!!part.description && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.desc}>{part.description}</Text>
          </View>
        )}

        {showInquiry && (
          <View style={styles.inquiryBox}>
            <TextInput style={styles.inquiryInput} placeholder="Ask the vendor a question…" placeholderTextColor={colors.textFaint} value={message} onChangeText={setMessage} multiline />
            <Button title="Send" onPress={sendInquiry} />
          </View>
        )}
      </ScrollView>

      {/* Sticky footer — Send Inquiry is the core action */}
      <View style={styles.footer}>
        <Pressable style={styles.cartBtn} onPress={addToCart} disabled={part.stock <= 0}>
          <Ionicons name="bag-add-outline" size={22} color={part.stock > 0 ? colors.accent : colors.textFaint} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Button title="Send Inquiry" icon="chatbubble-ellipses-outline" onPress={() => (user ? setShowInquiry((s) => !s) : promptLogin())} />
        </View>
      </View>
    </View>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && { color: colors.accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gallery: { borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surfaceAlt },
  heroImg: { width: W - spacing.md * 2, height: 260 },
  counter: { position: "absolute", right: spacing.md, bottom: spacing.md, backgroundColor: "#000000AA", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  counterText: { color: "#fff", fontSize: font.tiny, fontWeight: "700" },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md, marginTop: spacing.lg },
  title: { flex: 1, fontSize: font.h2, fontWeight: "700", color: colors.text },
  price: { fontSize: font.h2, fontWeight: "800", color: colors.accent },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeOem: { backgroundColor: colors.accentSoft },
  badgeOemText: { color: colors.accent, fontWeight: "700", fontSize: font.tiny },
  badgeNeutral: { backgroundColor: colors.surfaceAlt },
  badgeNeutralText: { color: colors.textMuted, fontWeight: "700", fontSize: font.tiny },
  mrp: { color: colors.textFaint, fontSize: font.small, textDecorationLine: "line-through", marginLeft: 4 },
  vendor: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginTop: spacing.lg },
  vendorLogo: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  vendorInitials: { color: colors.accent, fontWeight: "800" },
  vendorName: { fontWeight: "700", color: colors.text },
  vendorMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  vendorMetaText: { color: colors.textMuted, fontSize: font.tiny },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md },
  cardTitle: { fontWeight: "700", color: colors.text, fontSize: font.body, marginBottom: spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { color: colors.text, fontWeight: "600", fontSize: font.small },
  muted: { color: colors.textMuted },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderTopWidth: 1, borderTopColor: colors.border },
  detailLabel: { color: colors.textMuted },
  detailValue: { color: colors.text, fontWeight: "600" },
  desc: { color: colors.textMuted, lineHeight: 22 },
  inquiryBox: { marginTop: spacing.md, gap: spacing.sm },
  inquiryInput: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, minHeight: 80, textAlignVertical: "top", borderWidth: 1, borderColor: colors.border, color: colors.text },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  cartBtn: { width: 56, height: 50, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
});
