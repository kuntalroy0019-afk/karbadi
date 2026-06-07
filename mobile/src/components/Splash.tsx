import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { colors, font, spacing } from "../theme";

/**
 * Branded launch screen — quiet, premium. A ring + KARBADI wordmark fade and
 * settle on the ivory canvas. Calls onDone after the intro completes.
 */
export function Splash({ onDone }: { onDone?: () => void }) {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(12)).current;
  const ring = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(rise, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(ring, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
      ]),
      Animated.delay(700),
    ]).start(() => onDone && onDone());
  }, []);

  return (
    <View style={styles.root}>
      <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], alignItems: "center" }}>
        <Animated.View style={[styles.ring, { transform: [{ scale: ring }] }]}>
          <Ionicons name="car-sport-outline" size={34} color={colors.accent} />
        </Animated.View>
        <Text style={styles.brand}>KARBADI</Text>
        <View style={styles.rule} />
        <Text style={styles.tagline}>Every Car, Every Part</Text>
      </Animated.View>

      <Animated.Text style={[styles.footer, { opacity: fade }]}>
        A premium automotive marketplace
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  ring: {
    width: 76, height: 76, borderRadius: 38, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", marginBottom: spacing.md,
  },
  brand: { fontSize: 30, fontWeight: "800", letterSpacing: 6, color: colors.text },
  rule: { width: 40, height: 2, backgroundColor: colors.accent, borderRadius: 2, marginTop: spacing.md },
  tagline: { marginTop: spacing.md, color: colors.textMuted, fontSize: font.small, letterSpacing: 1 },
  footer: { position: "absolute", bottom: 48, color: colors.textFaint, fontSize: font.tiny, letterSpacing: 1 },
});
