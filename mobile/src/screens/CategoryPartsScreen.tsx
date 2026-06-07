import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { Catalog } from "../api/endpoints";
import { PartCard } from "../components/PartCard";
import { EmptyState, Loading } from "../components/ui";
import { colors, spacing } from "../theme";
import { Part } from "../types";

export default function CategoryPartsScreen({ route }: any) {
  const { id, name } = route.params;
  const nav = useNavigation<any>();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // id 0 => all used parts, id -1 => all new parts, else category id
    const params: Record<string, any> = {};
    if (id === 0) params.condition = "used";
    else if (id === -1) params.condition = "new";
    else params.category = id;

    Catalog.parts(params)
      .then((r) => setParts(r.data.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading label="Loading parts…" />;
  if (!parts.length)
    return <EmptyState icon="cube-outline" title="No parts here yet" subtitle={`No listings in ${name}.`} />;

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={parts}
      keyExtractor={(p) => String(p.id)}
      numColumns={2}
      columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}
      contentContainerStyle={{ paddingVertical: spacing.lg, gap: spacing.md }}
      renderItem={({ item }) => (
        <View style={{ flex: 1 }}>
          <PartCard part={item} onPress={() => nav.navigate("PartDetail", { id: item.id, title: item.title })} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({});
