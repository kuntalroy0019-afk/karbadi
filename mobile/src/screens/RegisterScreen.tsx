import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { apiError } from "../api/client";
import { Button } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, font, radius, spacing } from "../theme";
import { Field } from "./LoginScreen";

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    phone: "",
    role: "buyer" as "buyer" | "seller",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onRegister() {
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigation.navigate("Tabs");
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Join Karbadi</Text>
      <Text style={styles.subtitle}>Buy parts, sell parts, or both.</Text>

      <View style={styles.roleRow}>
        {(["buyer", "seller"] as const).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleChip, form.role === r && styles.roleChipActive]}
            onPress={() => set("role")(r)}
          >
            <Text style={[styles.roleText, form.role === r && styles.roleTextActive]}>
              {r === "buyer" ? "I want to buy" : "I want to sell"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Field icon="person-outline" placeholder="Username" value={form.username} onChangeText={set("username")} autoCapitalize="none" />
      <Field icon="happy-outline" placeholder="Full name" value={form.first_name} onChangeText={set("first_name")} />
      <Field icon="mail-outline" placeholder="Email" value={form.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" />
      <Field icon="call-outline" placeholder="Phone" value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
      <Field icon="lock-closed-outline" placeholder="Password (min 6 chars)" value={form.password} onChangeText={set("password")} secureTextEntry />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Create Account" onPress={onRegister} loading={loading} style={{ marginTop: spacing.md }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: { padding: spacing.xl },
  title: { fontSize: font.h1, fontWeight: "900", color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: 4, marginBottom: spacing.lg },
  roleRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  roleChip: {
    flex: 1, height: 46, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    alignItems: "center", justifyContent: "center", backgroundColor: colors.surface,
  },
  roleChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  roleText: { color: colors.textMuted, fontWeight: "700" },
  roleTextActive: { color: colors.primary },
  error: { color: colors.accent, marginTop: spacing.sm, fontWeight: "600" },
});
