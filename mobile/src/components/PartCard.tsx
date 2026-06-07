import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, font, radius, shadow, spacing, formatINR } from "../theme";
import { Part } from "../types";
import { Badge, ConditionBadge } from "./ui";

const PLACEHOLDER = "https://placehold.co/300x300/E8F0FF/1565FF?text=Karbadi";

export function PartCard({
  part,
  onPress,
  width,
}: {
  part: Part;
  onPress: () => void;
  width?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, width ? { width } : { flex: 1 }, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: part.primary_image || PLACEHOLDER }}
          style={styles.image}
          contentFit="cover"
          transition={150}
        />
        <View style={styles.badgeRow}>
          <ConditionBadge condition={part.condition} />
        </View>
        {part.discount_percent > 0 && (
          <View style={styles.discount}>
            <Text style={styles.discountText}>{part.discount_percent}% OFF</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.title}>
          {part.title}
        </Text>
        {!!part.oem_part_number && (
          <Text numberOfLines={1} style={styles.oem}>
            OEM: {part.oem_part_number}
          </Text>
        )}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatINR(part.price)}</Text>
          {part.mrp && Number(part.mrp) > Number(part.price) ? (
            <Text style={styles.mrp}>{formatINR(part.mrp)}</Text>
          ) : null}
        </View>
        <View style={styles.sellerRow}>
          <Ionicons name="storefront-outline" size={12} color={colors.textMuted} />
          <Text numberOfLines={1} style={styles.seller}>
            {part.seller_shop}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.soft,
  },
  imageWrap: { position: "relative" },
  image: { width: "100%", aspectRatio: 1, backgroundColor: colors.primaryLight },
  badgeRow: { position: "absolute", top: spacing.sm, left: spacing.sm },
  discount: {
    position: "absolute", top: spacing.sm, right: spacing.sm,
    backgroundColor: colors.accent, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: radius.sm,
  },
  discountText: { color: colors.white, fontSize: font.tiny, fontWeight: "800" },
  body: { padding: spacing.md },
  title: { fontSize: font.small, fontWeight: "700", color: colors.text, minHeight: 36 },
  oem: { fontSize: font.tiny, color: colors.textMuted, marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: spacing.xs, gap: 6 },
  price: { fontSize: font.h3, fontWeight: "800", color: colors.primary },
  mrp: { fontSize: font.tiny, color: colors.textMuted, textDecorationLine: "line-through" },
  sellerRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.xs },
  seller: { fontSize: font.tiny, color: colors.textMuted, flex: 1 },
});
