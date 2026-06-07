import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Oem } from "../api/endpoints";
import { PartCard } from "../components/PartCard";
import { EmptyState, Loading, SectionHeader } from "../components/ui";
import { colors, font, formatINR, radius, shadow, spacing } from "../theme";
import { OemPart } from "../types";

const PLACEHOLDER = "https://placehold.co/400x400/E8F0FF/1565FF?text=OEM";

export default function OemPartDetailScreen({ route }: any) {
  const { id } = route.params;
  const nav = useNavigation<any>();
  const [part, setPart] = useState<OemPart | null>(null);

  useEffect(() => {
    Oem.part(id).then((r) => setPart(r.data)).catch(() => {});
  }, [id]);

  if (!part) return <Loading label="Loading OEM part…" />;

  const listings = part.matching_listings || [];

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <View style={styles.head}>
        <Image source={{ uri: part.image || PLACEHOLDER }} style={styles.img} contentFit="contain" />
        <View style={styles.oemTag}>
          <Ionicons name="shield-checkmark" size={14} color={colors.white} />
          <Text style={styles.oemTagText}>GENUINE OEM</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.name}>{part.name}</Text>
        <Text style={styles.oemNo}>OEM Part No: {part.oem_number}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.category}>{part.category_name}</Text>
          {part.mrp && <Text style={styles.mrp}>MRP {formatINR(part.mrp)}</Text>}
        </View>
        {!!part.description && <Text style={styles.desc}>{part.description}</Text>}

        {/* Compatible vehicles */}
        {!!part.compatible_vehicles?.length && (
          <View style={styles.compatBox}>
            <Text style={styles.compatTitle}>Fits these vehicles</Text>
            <View style={styles.compatWrap}>
              {part.compatible_vehicles.map((v) => (
                <View key={v.model_id} style={styles.compatChip}>
                  <Ionicons name="car-outline" size={13} color={colors.primary} />
                  <Text style={styles.compatText}>{v.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Cross-matched seller listings (Module 3) */}
      <SectionHeader title={`Available on Karbadi (${listings.length})`} />
      {listings.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
          {listings.map((p) => (
            <PartCard key={p.id} part={p} width={160} onPress={() => nav.navigate("PartDetail", { id: p.id, title: p.title })} />
          ))}
        </ScrollView>
      ) : (
        <View style={{ padding: spacing.lg }}>
          <EmptyState icon="search-outline" title="No live listings yet" subtitle="No seller currently lists this OEM number. Try an inquiry on a similar part." />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: { backgroundColor: colors.surface, alignItems: "center", paddingVertical: spacing.xl, position: "relative" },
  img: { width: 220, height: 220, backgroundColor: colors.surface },
  oemTag: { position: "absolute", top: spacing.lg, right: spacing.lg, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.success, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  oemTagText: { color: colors.white, fontWeight: "800", fontSize: font.tiny },
  body: { padding: spacing.lg },
  name: { fontSize: font.h2, fontWeight: "900", color: colors.text },
  oemNo: { color: colors.primary, fontWeight: "700", marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm },
  category: { color: colors.textMuted },
  mrp: { fontWeight: "800", color: colors.text },
  desc: { color: colors.textMuted, lineHeight: 20, marginTop: spacing.md },
  compatBox: { marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.soft },
  compatTitle: { fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  compatWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  compatChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primaryLight, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  compatText: { color: colors.primary, fontWeight: "600", fontSize: font.tiny },
  hList: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingVertical: spacing.xs },
});
