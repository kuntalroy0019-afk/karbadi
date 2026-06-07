import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Oem } from "../api/endpoints";
import { colors, font, radius, shadow, spacing } from "../theme";
import { OemPart, VehicleMake, VehicleModel } from "../types";

type Mode = "vehicle" | "registration" | "number";

export default function OemSearchScreen() {
  const nav = useNavigation<any>();
  const [mode, setMode] = useState<Mode>("vehicle");

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.tabs}>
        <Tab label="By Vehicle" active={mode === "vehicle"} onPress={() => setMode("vehicle")} />
        <Tab label="By Reg. No." active={mode === "registration"} onPress={() => setMode("registration")} />
        <Tab label="Part No." active={mode === "number"} onPress={() => setMode("number")} />
      </View>
      {mode === "vehicle" && <ByVehicle nav={nav} />}
      {mode === "registration" && <ByRegistration nav={nav} />}
      {mode === "number" && <ByNumber nav={nav} />}
    </View>
  );
}

function Tab({ label, active, onPress }: any) {
  return (
    <Pressable style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

// --- Make -> Model -> Year drill-down -----------------------------------
function ByVehicle({ nav }: any) {
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [make, setMake] = useState<VehicleMake | null>(null);
  const [model, setModel] = useState<VehicleModel | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [parts, setParts] = useState<OemPart[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Oem.makes().then((r) => setMakes(r.data)).catch(() => {});
  }, []);

  async function pickMake(m: VehicleMake) {
    setMake(m); setModel(null); setYear(null); setParts([]);
    const r = await Oem.models(m.id);
    setModels(r.data);
  }
  async function pickModel(m: VehicleModel) {
    setModel(m); setYear(null);
    loadParts(m.id);
  }
  async function loadParts(modelId: number) {
    setLoading(true);
    try {
      const r = await Oem.byVehicle(modelId);
      setParts(r.data.results);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
      <Step n={1} label="Select Make" done={!!make} />
      <View style={styles.chipWrap}>
        {makes.map((m) => (
          <Pressable key={m.id} style={[styles.chip, make?.id === m.id && styles.chipActive]} onPress={() => pickMake(m)}>
            <Text style={[styles.chipText, make?.id === m.id && styles.chipTextActive]}>{m.name}</Text>
          </Pressable>
        ))}
      </View>

      {make && (
        <>
          <Step n={2} label="Select Model" done={!!model} />
          <View style={styles.chipWrap}>
            {models.map((m) => (
              <Pressable key={m.id} style={[styles.chip, model?.id === m.id && styles.chipActive]} onPress={() => pickModel(m)}>
                <Text style={[styles.chipText, model?.id === m.id && styles.chipTextActive]}>{m.name}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {model && (
        <>
          <Step n={3} label="Select Year (optional)" done={!!year} />
          <View style={styles.chipWrap}>
            {model.years.slice(0, 12).map((y) => (
              <Pressable key={y} style={[styles.chip, year === y && styles.chipActive]} onPress={() => setYear(y)}>
                <Text style={[styles.chipText, year === y && styles.chipTextActive]}>{y}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {model && (
        <>
          <Step n={4} label={`OEM Parts for ${make?.name} ${model.name}`} done />
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : (
            parts.map((p) => <OemRow key={p.id} part={p} onPress={() => nav.navigate("OemPartDetail", { id: p.id, oem_number: p.oem_number })} />)
          )}
          {!loading && !parts.length && <Text style={styles.empty}>No OEM parts catalogued for this model yet.</Text>}
        </>
      )}
    </ScrollView>
  );
}

// --- Registration number lookup -----------------------------------------
function ByRegistration({ nav }: any) {
  const [reg, setReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function lookup() {
    setLoading(true); setError(""); setResult(null);
    try {
      const { data } = await Oem.lookupRegistration(reg.trim());
      setResult(data);
    } catch {
      setError("Could not resolve this registration number. Try MH12AB1234, DL3C…, KA01…");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.help}>Enter your vehicle registration number to auto-detect the model and see compatible OEM parts.</Text>
      <View style={styles.regBox}>
        <TextInput
          style={styles.regInput}
          placeholder="e.g. MH12AB1234"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          value={reg}
          onChangeText={setReg}
        />
        <Pressable style={styles.regBtn} onPress={lookup} disabled={loading || !reg.trim()}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Ionicons name="search" size={20} color={colors.white} />}
        </Pressable>
      </View>
      {error ? <Text style={styles.empty}>{error}</Text> : null}

      {result && (
        <View>
          <View style={styles.vehicleCard}>
            <Ionicons name="car-sport" size={28} color={colors.primary} />
            <View>
              <Text style={styles.vehicleName}>{result.make} {result.model}</Text>
              <Text style={styles.vehicleMeta}>{result.year || "—"} · {result.fuel_type || "—"}</Text>
            </View>
          </View>
          <Text style={styles.resultsTitle}>Compatible OEM Parts ({result.parts.length})</Text>
          {result.parts.map((p: OemPart) => (
            <OemRow key={p.id} part={p} onPress={() => nav.navigate("OemPartDetail", { id: p.id, oem_number: p.oem_number })} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// --- Part number / name search ------------------------------------------
function ByNumber({ nav }: any) {
  const [q, setQ] = useState("");
  const [parts, setParts] = useState<OemPart[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const { data } = await Oem.parts({ search: q.trim() });
      setParts(data.results);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.regBox, { margin: spacing.lg }]}>
        <TextInput
          style={styles.regInput}
          placeholder="OEM number or part name…"
          placeholderTextColor={colors.textMuted}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={search}
          returnKeyType="search"
        />
        <Pressable style={styles.regBtn} onPress={search}>
          <Ionicons name="search" size={20} color={colors.white} />
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <FlatList
          data={parts}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          renderItem={({ item }) => (
            <OemRow part={item} onPress={() => nav.navigate("OemPartDetail", { id: item.id, oem_number: item.oem_number })} />
          )}
        />
      )}
    </View>
  );
}

function OemRow({ part, onPress }: { part: OemPart; onPress: () => void }) {
  return (
    <Pressable style={styles.oemRow} onPress={onPress}>
      <View style={styles.oemIcon}>
        <Ionicons name="cube-outline" size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.oemName}>{part.name}</Text>
        <Text style={styles.oemNo}>OEM: {part.oem_number} · {part.category_name}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function Step({ n, label, done }: { n: number; label: string; done?: boolean }) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepNum, done && { backgroundColor: colors.success }]}>
        {done ? <Ionicons name="checkmark" size={14} color={colors.white} /> : <Text style={styles.stepNumText}>{n}</Text>}
      </View>
      <Text style={styles.stepLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radius.md, padding: 4, ...shadow.soft },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontWeight: "700", color: colors.textMuted, fontSize: font.small },
  tabTextActive: { color: colors.white },
  step: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.lg, marginBottom: spacing.sm },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: colors.white, fontWeight: "800", fontSize: font.tiny },
  stepLabel: { fontWeight: "800", color: colors.text },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600" },
  chipTextActive: { color: colors.white },
  help: { color: colors.textMuted, lineHeight: 20, marginBottom: spacing.md },
  regBox: { flexDirection: "row", gap: spacing.sm },
  regInput: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 52, borderWidth: 1, borderColor: colors.border, fontSize: font.body, color: colors.text, letterSpacing: 1 },
  regBtn: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.lg },
  vehicleCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.primaryLight, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg },
  vehicleName: { fontWeight: "900", color: colors.text, fontSize: font.h3 },
  vehicleMeta: { color: colors.textMuted },
  resultsTitle: { fontWeight: "800", color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  oemRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadow.soft },
  oemIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  oemName: { fontWeight: "800", color: colors.text },
  oemNo: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2 },
});
