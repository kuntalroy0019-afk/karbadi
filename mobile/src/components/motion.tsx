/**
 * Motion primitives — the "feel" layer.
 * Every interactive surface springs under the finger and answers with a light
 * haptic; content fades and rises into place. Durations follow the design
 * system (≈180ms), easing is calm (no bounce/elastic).
 */
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, ViewStyle } from "react-native";

export const haptic = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  select: () => Haptics.selectionAsync().catch(() => {}),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
};

/** Pressable that scales down + gives a light haptic on touch, then springs back. */
export function PressableScale({
  children,
  onPress,
  style,
  scaleTo = 0.96,
  hapticStyle = "light",
  disabled,
  hitSlop,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  scaleTo?: number;
  hapticStyle?: keyof typeof haptic | "none";
  disabled?: boolean;
  hitSlop?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const to = (v: number) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 0 }).start();

  return (
    <Pressable
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => {
        to(scaleTo);
        if (hapticStyle !== "none") haptic[hapticStyle]?.();
      }}
      onPressOut={() => to(1)}
      onPress={onPress}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style as any]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Fades + rises its children in on mount, with an optional stagger delay. */
export function FadeIn({
  children,
  delay = 0,
  offset = 14,
  duration = 320,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  offset?: number;
  duration?: number;
  style?: ViewStyle | ViewStyle[];
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View
      style={[
        { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }] },
        style as any,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Enables smooth automatic layout transitions (Android needs the opt-in). */
export function enableLayoutAnimations() {
  if (Platform.OS === "android") {
    const { UIManager } = require("react-native");
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
  }
}
