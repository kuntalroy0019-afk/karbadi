import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Catalog } from "../api/endpoints";
import { PartCard } from "../components/PartCard";
import { EmptyState, Loading } from "../components/ui";
import { colors, font, radius, spacing } from "../theme";
import { Part } from "../types";

const SUGGESTIONS = ["Headlight", "Brake Pad", "Sensor", "Bumper", "Alternator", "Key"];

export default function SearchScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timer = useRef<any>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    timer.current = setTimeout(runSearch, 350);
    return () => timer.current && clearTimeout(timer.current);
  }, [query]);

  async function runSearch() {
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await Catalog.parts({ search: query.trim() });
      setResults(data.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + spacing.sm }}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.input}
          placeholder="Search parts, OEM numbers, vehicles…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <Pressable style={styles.oemBtn} onPress={() => nav.navigate("OemSearch")}>
        <Ionicons name="construct-outline" size={18} color={colors.primary} />
        <Text style={styles.oemBtnText}>Search by vehicle / registration (OEM Finder)</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </Pressable>

      {!searched ? (
        <View style={{ padding: spacing.lg }}>
          <Text style={styles.suggTitle}>Popular searches</Text>
          <View style={styles.suggWrap}>
            {SUGGESTIONS.map((s) => (
              <Pressable key={s} style={styles.suggChip} onPress={() => setQuery(s)}>
                <Text style={styles.suggText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : loading ? (
        <Loading label="Searching…" />
      ) : results.length ? (
        <FlatList
          data={results}
          keyExtractor={(p) => String(p.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}
          contentContainerStyle={{ paddingVertical: spacing.md, gap: spacing.md }}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <PartCard part={item} onPress={() => nav.navigate("PartDetail", { id: item.id, title: item.title })} />
            </View>
          )}
        />
      ) : (
        <EmptyState icon="search-outline" title="No matches" subtitle={`Nothing found for "${query}".`} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface,
    marginHorizontal: spacing.lg, paddingHorizontal: spacing.md, height: 50, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  input: { flex: 1, fontSize: font.body, color: colors.text },
  oemBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primaryLight,
    marginHorizontal: spacing.lg, marginTop: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 12, borderRadius: radius.md,
  },
  oemBtnText: { flex: 1, color: colors.primary, fontWeight: "700", fontSize: font.small },
  suggTitle: { fontWeight: "800", color: colors.text, marginBottom: spacing.md, fontSize: font.h3 },
  suggWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  suggChip: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: colors.border },
  suggText: { color: colors.text, fontWeight: "600" },
});
