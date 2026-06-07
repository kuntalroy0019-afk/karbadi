import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { apiError } from "../api/client";
import { Catalog } from "../api/endpoints";
import { Button, Loading } from "../components/ui";
import { colors, font, radius, shadow, spacing } from "../theme";
import { Category } from "../types";

interface PickedImage { uri: string; name: string; type: string }

export default function PartFormScreen({ route }: any) {
  const editId: number | undefined = route.params?.id;
  const nav = useNavigation<any>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<PickedImage[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", category: 0, condition: "new" as "new" | "used",
    oem_part_number: "", price: "", mrp: "", stock: "1", compatible_vehicles: "",
  });

  const set = (k: string) => (v: any) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    Catalog.categories().then((r) => {
      setCategories(r.data);
      if (!editId && r.data.length) set("category")(r.data[0].id);
    });
    if (editId) {
      Catalog.part(editId).then((r) => {
        const p = r.data;
        setForm({
          title: p.title, description: p.description || "",
          category: p.category ?? 0,
          condition: p.condition, oem_part_number: p.oem_part_number || "",
          price: String(p.price), mrp: p.mrp ? String(p.mrp) : "",
          stock: String(p.stock), compatible_vehicles: p.compatible_vehicles || "",
        });
        setExistingImages((p.images || []).map((i) => i.image));
      }).finally(() => setLoading(false));
    }
  }, [editId]);

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to add images.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], quality: 0.7, allowsMultipleSelection: true, selectionLimit: 5,
    });
    if (res.canceled) return;
    const picked = res.assets.map((a, i) => ({
      uri: a.uri,
      name: a.fileName || `photo_${Date.now()}_${i}.jpg`,
      type: a.mimeType || "image/jpeg",
    }));
    setImages((cur) => [...cur, ...picked]);
  }

  async function save() {
    if (!form.title.trim() || !form.price || !form.category) {
      Alert.alert("Missing fields", "Title, category and price are required.");
      return;
    }
    setSaving(true);
    const data = new FormData();
    data.append("title", form.title);
    data.append("description", form.description);
    data.append("category", String(form.category));
    data.append("condition", form.condition);
    data.append("oem_part_number", form.oem_part_number);
    data.append("price", form.price);
    if (form.mrp) data.append("mrp", form.mrp);
    data.append("stock", form.stock || "1");
    data.append("compatible_vehicles", form.compatible_vehicles);
    images.forEach((img) => data.append("uploaded_images", img as any));

    try {
      if (editId) await Catalog.updatePart(editId, data);
      else await Catalog.createPart(data);
      Alert.alert("Saved", `Listing ${editId ? "updated" : "created"}.`);
      nav.goBack();
    } catch (e) {
      Alert.alert("Error", apiError(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading label="Loading…" />;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <Label text="Photos" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imgRow}>
        {existingImages.map((uri) => (
          <Image key={uri} source={{ uri }} style={styles.thumb} contentFit="cover" />
        ))}
        {images.map((img, i) => (
          <View key={i}>
            <Image source={{ uri: img.uri }} style={styles.thumb} contentFit="cover" />
            <Pressable style={styles.remove} onPress={() => setImages((c) => c.filter((_, idx) => idx !== i))}>
              <Ionicons name="close" size={12} color={colors.white} />
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.addImg} onPress={pickImage}>
          <Ionicons name="camera-outline" size={26} color={colors.primary} />
          <Text style={styles.addImgText}>Add</Text>
        </Pressable>
      </ScrollView>

      <Label text="Title *" />
      <Input value={form.title} onChangeText={set("title")} placeholder="e.g. LED Headlight Assembly" />

      <Label text="Condition" />
      <View style={styles.segment}>
        {(["new", "used"] as const).map((c) => (
          <Pressable key={c} style={[styles.seg, form.condition === c && styles.segActive]} onPress={() => set("condition")(c)}>
            <Text style={[styles.segText, form.condition === c && styles.segTextActive]}>{c === "new" ? "New" : "Used"}</Text>
          </Pressable>
        ))}
      </View>

      <Label text="Category *" />
      <View style={styles.chips}>
        {categories.map((c) => (
          <Pressable key={c.id} style={[styles.chip, form.category === c.id && styles.chipActive]} onPress={() => set("category")(c.id)}>
            <Text style={[styles.chipText, form.category === c.id && styles.chipTextActive]}>{c.name}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}><Label text="Price (₹) *" /><Input value={form.price} onChangeText={set("price")} keyboardType="numeric" placeholder="0" /></View>
        <View style={{ flex: 1 }}><Label text="MRP (₹)" /><Input value={form.mrp} onChangeText={set("mrp")} keyboardType="numeric" placeholder="0" /></View>
        <View style={{ width: 90 }}><Label text="Stock" /><Input value={form.stock} onChangeText={set("stock")} keyboardType="numeric" /></View>
      </View>

      <Label text="OEM Part Number" />
      <Input value={form.oem_part_number} onChangeText={set("oem_part_number")} placeholder="Helps OEM cross-match" autoCapitalize="characters" />

      <Label text="Compatible Vehicles" />
      <Input value={form.compatible_vehicles} onChangeText={set("compatible_vehicles")} placeholder="e.g. Swift 2015-2020, Baleno" />

      <Label text="Description" />
      <Input value={form.description} onChangeText={set("description")} placeholder="Condition, warranty, notes…" multiline style={{ minHeight: 90, textAlignVertical: "top" }} />

      <Button title={editId ? "Update Listing" : "Publish Listing"} icon="checkmark-circle-outline" onPress={save} loading={saving} style={{ marginTop: spacing.lg }} />
    </ScrollView>
  );
}

const Label = ({ text }: { text: string }) => <Text style={styles.label}>{text}</Text>;
const Input = (props: any) => (
  <TextInput placeholderTextColor={colors.textMuted} {...props} style={[styles.input, props.style]} />
);

const styles = StyleSheet.create({
  label: { fontWeight: "800", color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, color: colors.text, fontSize: font.body },
  imgRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  thumb: { width: 76, height: 76, borderRadius: radius.md, backgroundColor: colors.primaryLight },
  remove: { position: "absolute", top: -4, right: -4, backgroundColor: colors.accent, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  addImg: { width: 76, height: 76, borderRadius: radius.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.primary, alignItems: "center", justifyContent: "center" },
  addImgText: { color: colors.primary, fontSize: font.tiny, fontWeight: "700" },
  segment: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.md, padding: 4, borderWidth: 1, borderColor: colors.border },
  seg: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radius.sm },
  segActive: { backgroundColor: colors.primary },
  segText: { fontWeight: "700", color: colors.textMuted },
  segTextActive: { color: colors.white },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600" },
  chipTextActive: { color: colors.white },
  row: { flexDirection: "row", gap: spacing.sm },
});
