import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { apiError } from "../api/client";
import { Store } from "../api/endpoints";
import { Badge, Button, Loading } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, font, radius, shadow, spacing } from "../theme";

interface Logo { uri: string; name: string; type: string }

export default function StorefrontScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState<Logo | null>(null);
  const [existingLogo, setExistingLogo] = useState<string | null>(null);
  const [rating, setRating] = useState<string>("0");
  const [isOem, setIsOem] = useState(false);
  const [form, setForm] = useState({
    shop_name: "", description: "", gstin: "", city: "", state: "", pincode: "",
  });
  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(() => {
    setLoading(true);
    Store.get()
      .then((r) => {
        const p = r.data;
        setForm({
          shop_name: p.shop_name, description: p.description || "", gstin: p.gstin || "",
          city: p.city || "", state: p.state || "", pincode: p.pincode || "",
        });
        setExistingLogo(p.logo);
        setRating(p.rating);
        setIsOem(p.is_oem);
      })
      .catch(() => { /* no storefront yet */ })
      .finally(() => setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function pickLogo() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission needed", "Allow photo access to set a logo.");
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (res.canceled) return;
    const a = res.assets[0];
    setLogo({ uri: a.uri, name: a.fileName || "logo.jpg", type: a.mimeType || "image/jpeg" });
  }

  async function save() {
    if (!form.shop_name.trim()) return Alert.alert("Missing", "Shop name is required.");
    setSaving(true);
    const d = new FormData();
    Object.entries(form).forEach(([k, v]) => d.append(k, v));
    if (logo) d.append("logo", logo as any);
    try {
      await Store.upsert(d);
      await refreshUser();
      Alert.alert("Saved", "Storefront updated.");
      load();
      setLogo(null);
    } catch (e) { Alert.alert("Error", apiError(e)); } finally { setSaving(false); }
  }

  if (loading) return <Loading label="Loading storefront…" />;

  const logoUri = logo?.uri || existingLogo;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable style={styles.logoWrap} onPress={pickLogo}>
          {logoUri
            ? <Image source={{ uri: logoUri }} style={styles.logo} contentFit="cover" />
            : <Ionicons name="storefront" size={34} color={colors.primary} />}
          <View style={styles.logoEdit}><Ionicons name="camera" size={14} color={colors.white} /></View>
        </Pressable>
        <Text style={styles.shopName}>{form.shop_name || "Your storefront"}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}><Ionicons name="star" size={13} color={colors.star} /><Text style={styles.metaText}>{rating}</Text></View>
          {isOem && <Badge label="OEM VERIFIED" color={colors.accent} />}
        </View>
      </View>

      <View style={styles.body}>
        <Label text="Shop name *" />
        <Input value={form.shop_name} onChangeText={set("shop_name")} placeholder="e.g. AutoHub Spares" />
        <Label text="About your shop" />
        <Input value={form.description} onChangeText={set("description")} placeholder="What you sell, specialities…" multiline style={{ minHeight: 80, textAlignVertical: "top" }} />
        <Label text="GSTIN" />
        <Input value={form.gstin} onChangeText={set("gstin")} placeholder="22AAAAA0000A1Z5" autoCapitalize="characters" />
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Label text="City" /><Input value={form.city} onChangeText={set("city")} /></View>
          <View style={{ flex: 1 }}><Label text="State" /><Input value={form.state} onChangeText={set("state")} /></View>
          <View style={{ width: 100 }}><Label text="Pincode" /><Input value={form.pincode} onChangeText={set("pincode")} keyboardType="number-pad" maxLength={6} /></View>
        </View>

        <Button title="Save Storefront" icon="checkmark-circle-outline" onPress={save} loading={saving} style={{ marginTop: spacing.lg }} />

        <View style={styles.accountBox}>
          <Text style={styles.accountTitle}>Account</Text>
          <Text style={styles.accountText}>{user?.username} · {user?.email}</Text>
          <Text style={styles.accountText}>Role: {user?.role?.toUpperCase()} · {user?.is_seller_approved ? "Approved" : "Pending approval"}</Text>
          <Button title="Sign Out" variant="outline" onPress={signOut} style={{ marginTop: spacing.md }} />
        </View>
      </View>
    </ScrollView>
  );
}

const Label = ({ text }: { text: string }) => <Text style={styles.label}>{text}</Text>;
const Input = (props: any) => <TextInput placeholderTextColor={colors.textMuted} {...props} style={[styles.input, props.style]} />;

const styles = StyleSheet.create({
  header: { alignItems: "center", backgroundColor: colors.surface, paddingBottom: spacing.lg, ...shadow.soft },
  logoWrap: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  logo: { width: 84, height: 84, borderRadius: 42 },
  logoEdit: { position: "absolute", bottom: 0, right: 0, backgroundColor: colors.primary, width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.surface },
  shopName: { fontSize: font.h2, fontWeight: "900", color: colors.text, marginTop: spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { color: colors.textMuted, fontWeight: "700" },
  body: { padding: spacing.lg },
  label: { fontWeight: "800", color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, color: colors.text, fontSize: font.body },
  row: { flexDirection: "row", gap: spacing.sm },
  accountBox: { marginTop: spacing.xl, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.soft },
  accountTitle: { fontWeight: "800", color: colors.text, marginBottom: spacing.sm, fontSize: font.h3 },
  accountText: { color: colors.textMuted, marginBottom: 2 },
});
