import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { apiError } from "../api/client";
import { Catalog } from "../api/endpoints";
import { Button, Loading } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, font, radius, spacing } from "../theme";

interface Pick { uri: string; name: string; type: string }
const FUELS = ["petrol", "diesel", "cng", "electric", "hybrid"] as const;

export default function VehicleFormScreen({ route }: any) {
  const editId: number | undefined = route.params?.id;
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<Pick[]>([]);
  const [existing, setExisting] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "", model_name: "", year: "", fuel_type: "petrol" as (typeof FUELS)[number],
    km_driven: "", owners: "1", price: "", city: "", registration_number: "", description: "",
  });
  const set = (k: string) => (v: any) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (editId) {
      Catalog.vehicle(editId).then((r) => {
        const v = r.data;
        setForm({
          title: v.title, model_name: v.model_name, year: String(v.year),
          fuel_type: v.fuel_type as any, km_driven: String(v.km_driven),
          owners: String(v.owners), price: String(v.price), city: v.city || "",
          registration_number: v.registration_number || "", description: v.description || "",
        });
        setExisting((v.images || []).map((i) => i.image));
      }).finally(() => setLoading(false));
    }
  }, [editId]);

  async function pick() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission needed", "Allow photo access to add images.");
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7, allowsMultipleSelection: true, selectionLimit: 6 });
    if (res.canceled) return;
    setImages((cur) => [...cur, ...res.assets.map((a, i) => ({
      uri: a.uri, name: a.fileName || `car_${i}.jpg`, type: a.mimeType || "image/jpeg",
    }))]);
  }

  async function save() {
    if (!user) { nav.navigate("Login"); return; }
    if (!form.title.trim() || !form.model_name.trim() || !form.year || !form.price)
      return Alert.alert("Missing fields", "Title, model, year and price are required.");
    setSaving(true);
    const d = new FormData();
    d.append("title", form.title); d.append("model_name", form.model_name);
    d.append("year", form.year); d.append("fuel_type", form.fuel_type);
    d.append("km_driven", form.km_driven || "0"); d.append("owners", form.owners || "1");
    d.append("price", form.price); d.append("city", form.city);
    d.append("registration_number", form.registration_number);
    d.append("description", form.description);
    images.forEach((img) => d.append("uploaded_images", img as any));
    try {
      const res = editId ? await Catalog.updateVehicle(editId, d) : await Catalog.createVehicle(d);
      Alert.alert("Done", `Your vehicle is ${editId ? "updated" : "listed"} for sale.`);
      nav.replace("VehicleDetail", { id: res.data.id, title: res.data.title });
    } catch (e) { Alert.alert("Error", apiError(e)); } finally { setSaving(false); }
  }

  if (loading) return <Loading label="Loading…" />;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <Text style={styles.intro}>List your vehicle for sale on Karbadi. Buyers contact you directly.</Text>

      <Label text="Photos" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imgRow}>
        {existing.map((uri) => <Image key={uri} source={{ uri }} style={styles.thumb} contentFit="cover" />)}
        {images.map((img, i) => (
          <View key={i}>
            <Image source={{ uri: img.uri }} style={styles.thumb} contentFit="cover" />
            <Pressable style={styles.remove} onPress={() => setImages((c) => c.filter((_, idx) => idx !== i))}>
              <Ionicons name="close" size={12} color={colors.white} />
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.addImg} onPress={pick}>
          <Ionicons name="camera-outline" size={26} color={colors.primary} />
          <Text style={styles.addImgText}>Add</Text>
        </Pressable>
      </ScrollView>

      <Label text="Listing title *" />
      <Input value={form.title} onChangeText={set("title")} placeholder="e.g. 2019 Maruti Swift VXI" />
      <View style={styles.row}>
        <View style={{ flex: 2 }}><Label text="Model *" /><Input value={form.model_name} onChangeText={set("model_name")} placeholder="Swift" /></View>
        <View style={{ flex: 1 }}><Label text="Year *" /><Input value={form.year} onChangeText={set("year")} keyboardType="number-pad" maxLength={4} placeholder="2019" /></View>
      </View>

      <Label text="Fuel type" />
      <View style={styles.chips}>
        {FUELS.map((f) => (
          <Pressable key={f} style={[styles.chip, form.fuel_type === f && styles.chipActive]} onPress={() => set("fuel_type")(f)}>
            <Text style={[styles.chipText, form.fuel_type === f && styles.chipTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}><Label text="KM driven" /><Input value={form.km_driven} onChangeText={set("km_driven")} keyboardType="number-pad" placeholder="30000" /></View>
        <View style={{ width: 90 }}><Label text="Owners" /><Input value={form.owners} onChangeText={set("owners")} keyboardType="number-pad" /></View>
        <View style={{ flex: 1 }}><Label text="Price (₹) *" /><Input value={form.price} onChangeText={set("price")} keyboardType="number-pad" placeholder="450000" /></View>
      </View>

      <Label text="City" />
      <Input value={form.city} onChangeText={set("city")} placeholder="Mumbai" />
      <Label text="Registration number" />
      <Input value={form.registration_number} onChangeText={set("registration_number")} placeholder="MH12AB1234" autoCapitalize="characters" />
      <Label text="Description" />
      <Input value={form.description} onChangeText={set("description")} placeholder="Service history, condition, reason for sale…" multiline style={{ minHeight: 90, textAlignVertical: "top" }} />

      <Button title={editId ? "Update Listing" : "List Vehicle for Sale"} icon="pricetag-outline" onPress={save} loading={saving} style={{ marginTop: spacing.lg }} />
    </ScrollView>
  );
}

const Label = ({ text }: { text: string }) => <Text style={styles.label}>{text}</Text>;
const Input = (props: any) => <TextInput placeholderTextColor={colors.textMuted} {...props} style={[styles.input, props.style]} />;

const styles = StyleSheet.create({
  intro: { color: colors.textMuted, lineHeight: 20, marginBottom: spacing.sm },
  label: { fontWeight: "800", color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, color: colors.text, fontSize: font.body },
  imgRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  thumb: { width: 88, height: 66, borderRadius: radius.md, backgroundColor: colors.primaryLight },
  remove: { position: "absolute", top: -4, right: -4, backgroundColor: colors.accent, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  addImg: { width: 88, height: 66, borderRadius: radius.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.primary, alignItems: "center", justifyContent: "center" },
  addImgText: { color: colors.primary, fontSize: font.tiny, fontWeight: "700" },
  row: { flexDirection: "row", gap: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600", textTransform: "capitalize" },
  chipTextActive: { color: colors.white },
});
