import React, { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

import { apiError } from "../api/client";
import { Button } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, font, spacing } from "../theme";
import { Field } from "./LoginScreen";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "", first_name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onRegister() {
    setError(""); setLoading(true);
    try {
      await register(form); // role forced to seller in AuthContext
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Become a Karbadi seller</Text>
      <Text style={styles.subtitle}>Create your account, then set up your storefront.</Text>

      <Field icon="person-outline" placeholder="Username" value={form.username} onChangeText={set("username")} autoCapitalize="none" />
      <Field icon="happy-outline" placeholder="Your name" value={form.first_name} onChangeText={set("first_name")} />
      <Field icon="mail-outline" placeholder="Email" value={form.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" />
      <Field icon="call-outline" placeholder="Phone" value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
      <Field icon="lock-closed-outline" placeholder="Password (min 6 chars)" value={form.password} onChangeText={set("password")} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Create Seller Account" onPress={onRegister} loading={loading} style={{ marginTop: spacing.md }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: { padding: spacing.xl },
  title: { fontSize: font.h1, fontWeight: "900", color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: 4, marginBottom: spacing.lg },
  error: { color: colors.danger, marginTop: spacing.sm, fontWeight: "600" },
});
