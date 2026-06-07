import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { apiError } from "../api/client";
import { Button } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, font, radius, spacing } from "../theme";

export default function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("buyer");
  const [password, setPassword] = useState("buyer12345");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onLogin() {
    setError("");
    setLoading(true);
    try {
      await signIn(username.trim(), password);
      navigation.goBack();
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={[styles.hero, { paddingTop: insets.top + 30 }]}>
        <View style={styles.logoRow}>
          <Ionicons name="car-sport" size={34} color={colors.white} />
          <Text style={styles.brand}>Karbadi</Text>
        </View>
        <Text style={styles.tagline}>Every Car, Every Part</Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to source new & used auto parts.</Text>

          <Field icon="person-outline" placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <Field icon="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Sign In" onPress={onLogin} loading={loading} style={{ marginTop: spacing.md }} />

          <TouchableOpacity style={styles.skip} onPress={() => navigation.goBack()}>
            <Text style={styles.skipText}>Continue browsing as guest</Text>
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.muted}>New to Karbadi? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.link}>Create account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Demo logins</Text>
            <Text style={styles.demoText}>buyer / buyer12345</Text>
            <Text style={styles.demoText}>autohub / seller12345  (seller)</Text>
            <Text style={styles.demoText}>admin / admin12345</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function Field({
  icon,
  ...props
}: { icon: keyof typeof Ionicons.glyphMap } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingBottom: 36, paddingHorizontal: spacing.xl, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brand: { color: colors.white, fontSize: 30, fontWeight: "900" },
  tagline: { color: "#CFE0FF", fontSize: font.body, marginTop: 4, fontWeight: "600" },
  form: { padding: spacing.xl },
  title: { fontSize: font.h1, fontWeight: "900", color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: 4, marginBottom: spacing.lg },
  field: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface,
    borderRadius: radius.md, paddingHorizontal: spacing.md, height: 52, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  input: { flex: 1, fontSize: font.body, color: colors.text },
  error: { color: colors.accent, marginBottom: spacing.sm, fontWeight: "600" },
  skip: { alignItems: "center", marginTop: spacing.md },
  skipText: { color: colors.textMuted, fontWeight: "600" },
  registerRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  muted: { color: colors.textMuted },
  link: { color: colors.primary, fontWeight: "800" },
  demoBox: { marginTop: spacing.xl, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md },
  demoTitle: { fontWeight: "800", color: colors.primaryDark, marginBottom: 4 },
  demoText: { color: colors.primaryDark, fontSize: font.small },
});
