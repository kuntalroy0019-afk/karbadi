import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { apiError } from "../api/client";
import { Button } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, font, radius, spacing } from "../theme";

export function Field({ icon, ...props }: { icon: keyof typeof Ionicons.glyphMap } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <TextInput placeholderTextColor={colors.textMuted} style={styles.input} {...props} />
    </View>
  );
}

export default function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("autohub");
  const [password, setPassword] = useState("seller12345");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onLogin() {
    setError(""); setLoading(true);
    try {
      await signIn(username.trim(), password);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={[colors.navy, colors.primary]} style={[styles.hero, { paddingTop: insets.top + 40 }]}>
        <View style={styles.logoRow}>
          <Ionicons name="storefront" size={32} color={colors.white} />
          <View>
            <Text style={styles.brand}>Karbadi <Text style={{ color: colors.accent }}>Seller</Text></Text>
            <Text style={styles.tagline}>Grow your auto-parts business</Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Seller sign in</Text>
          <Text style={styles.subtitle}>Manage listings, orders & inquiries.</Text>

          <Field icon="person-outline" placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <Field icon="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Sign In" onPress={onLogin} loading={loading} style={{ marginTop: spacing.md }} />

          <View style={styles.registerRow}>
            <Text style={styles.muted}>New seller? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.link}>Create a seller account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Demo seller logins</Text>
            <Text style={styles.demoText}>autohub / seller12345</Text>
            <Text style={styles.demoText}>partszone / seller12345</Text>
            <Text style={styles.demoText}>kiaoem / seller12345</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingBottom: 36, paddingHorizontal: spacing.xl, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  brand: { color: colors.white, fontSize: 26, fontWeight: "900" },
  tagline: { color: "#BBD0FF", fontSize: font.small, fontWeight: "600" },
  form: { padding: spacing.xl },
  title: { fontSize: font.h1, fontWeight: "900", color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: 4, marginBottom: spacing.lg },
  field: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 52, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, fontSize: font.body, color: colors.text },
  error: { color: colors.danger, marginBottom: spacing.sm, fontWeight: "600" },
  registerRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  muted: { color: colors.textMuted },
  link: { color: colors.primary, fontWeight: "800" },
  demoBox: { marginTop: spacing.xl, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md },
  demoTitle: { fontWeight: "800", color: colors.primaryDark, marginBottom: 4 },
  demoText: { color: colors.primaryDark, fontSize: font.small },
});
