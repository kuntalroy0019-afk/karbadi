import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { colors, font, spacing } from "../theme";

/** Vendor launch screen — dark, confident. "Powering every part of the road." */
export function Splash({ onDone }: { onDone?: () => void }) {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 440, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(rise, { toValue: 0, duration: 440, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.delay(750),
    ]).start(() => onDone && onDone());
  }, []);

  return (
    <View style={styles.root}>
      <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
        <View style={styles.badge}>
          <Ionicons name="storefront-outline" size={26} color={colors.onAccent} />
        </View>
        <Text style={styles.brand}>KARBADI</Text>
        <Text style={styles.kicker}>SELLER</Text>
        <Text style={styles.headline}>Powering every{"\n"}part of the road.</Text>
        <View style={styles.rule} />
        <Text style={styles.tagline}>Buyers trust you. We back your business.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: colors.accent, padding: spacing.xl, justifyContent: "center" },
  badge: { width: 60, height: 60, borderRadius: 16, borderWidth: 1.5, borderColor: "#ffffff33", alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
  brand: { color: colors.onAccent, fontSize: 30, fontWeight: "800", letterSpacing: 5 },
  kicker: { color: "#9DB2A8", marginTop: 2, fontSize: font.small, fontWeight: "700", letterSpacing: 6 },
  headline: { color: colors.onAccent, fontSize: font.h1, fontWeight: "700", lineHeight: 36, marginTop: spacing.xl },
  rule: { width: 44, height: 2, backgroundColor: "#ffffff55", borderRadius: 2, marginTop: spacing.xl },
  tagline: { color: "#B9C7C0", fontSize: font.small, marginTop: spacing.md },
});
