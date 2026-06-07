import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { apiError } from "../api/client";
import { Orders, Shipping } from "../api/endpoints";
import { haptic } from "../components/motion";
import { Button } from "../components/ui";
import { useCart } from "../context/CartContext";
import { colors, font, formatINR, radius, shadow, spacing } from "../theme";
import { CourierOption } from "../types";

export default function CheckoutScreen() {
  const nav = useNavigation<any>();
  const { cart, refresh } = useCart();
  const [form, setForm] = useState({
    ship_full_name: "",
    ship_phone: "",
    ship_line1: "",
    ship_line2: "",
    ship_city: "",
    ship_state: "",
    ship_pincode: "",
  });
  const [payment, setPayment] = useState<"cod" | "prepaid">("cod");
  const [courier, setCourier] = useState<CourierOption | null>(null);
  const [options, setOptions] = useState<CourierOption[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [placing, setPlacing] = useState(false);
  const timer = useRef<any>(null);

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Smart courier serviceability check when pincode is 6 digits (Module 2 display).
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (form.ship_pincode.length === 6) {
      timer.current = setTimeout(checkServiceability, 300);
    } else {
      setCourier(null);
      setOptions([]);
    }
    return () => timer.current && clearTimeout(timer.current);
  }, [form.ship_pincode, payment]);

  async function checkServiceability() {
    setChecking(true);
    try {
      const weight = cart?.item_count || 1;
      const { data } = await Shipping.serviceability(form.ship_pincode, payment === "cod", weight);
      setCourier(data.recommended);
      setOptions(data.options.filter((o) => o.eligible));
      setSelected(data.recommended?.courier_code || null);
    } catch {
      setCourier(null);
    } finally {
      setChecking(false);
    }
  }

  async function placeOrder() {
    const required = ["ship_full_name", "ship_phone", "ship_line1", "ship_city", "ship_state", "ship_pincode"];
    const missing = required.filter((f) => !(form as any)[f]?.trim());
    if (missing.length) {
      Alert.alert("Missing details", "Please fill all required address fields.");
      return;
    }
    setPlacing(true);
    try {
      const { data } = await Orders.checkout({ ...form, payment_method: payment, courier_code: selected || "" });
      await refresh();
      haptic.success();
      nav.replace("OrderDetail", { id: data.id });
    } catch (e) {
      haptic.warning();
      Alert.alert("Checkout failed", apiError(e));
    } finally {
      setPlacing(false);
    }
  }

  const shippingFee = courier?.rate ?? 0;
  const subtotal = Number(cart?.subtotal || 0);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <Text style={styles.section}>Shipping Address</Text>
      <Input placeholder="Full name *" value={form.ship_full_name} onChangeText={set("ship_full_name")} />
      <Input placeholder="Phone *" value={form.ship_phone} onChangeText={set("ship_phone")} keyboardType="phone-pad" />
      <Input placeholder="Address line 1 *" value={form.ship_line1} onChangeText={set("ship_line1")} />
      <Input placeholder="Address line 2" value={form.ship_line2} onChangeText={set("ship_line2")} />
      <View style={styles.row}>
        <Input placeholder="City *" value={form.ship_city} onChangeText={set("ship_city")} style={{ flex: 1 }} />
        <Input placeholder="State *" value={form.ship_state} onChangeText={set("ship_state")} style={{ flex: 1 }} />
      </View>
      <Input placeholder="Pincode * (try 400001)" value={form.ship_pincode} onChangeText={set("ship_pincode")} keyboardType="number-pad" maxLength={6} />

      <Text style={styles.section}>Payment</Text>
      <View style={styles.row}>
        <PayOpt label="Cash on Delivery" icon="cash-outline" active={payment === "cod"} onPress={() => setPayment("cod")} />
        <PayOpt label="Prepaid" icon="card-outline" active={payment === "prepaid"} onPress={() => setPayment("prepaid")} />
      </View>

      {/* Smart courier confidence display */}
      {form.ship_pincode.length === 6 && (
        <View style={styles.courierBox}>
          <View style={styles.courierHead}>
            <Ionicons name="rocket-outline" size={18} color={colors.primary} />
            <Text style={styles.courierTitle}>Smart Courier Select</Text>
            {checking && <Text style={styles.checking}>checking…</Text>}
          </View>
          {courier ? (
            <>
              {options.map((o) => (
                <Pressable
                  key={o.courier_code}
                  style={[styles.courierOpt, selected === o.courier_code && styles.courierOptActive]}
                  onPress={() => setSelected(o.courier_code)}
                >
                  <Ionicons
                    name={selected === o.courier_code ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={colors.primary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courierName}>
                      {o.courier_name}
                      {courier.courier_code === o.courier_code ? "  ⭐ Recommended" : ""}
                    </Text>
                    <Text style={styles.courierMeta}>
                      {o.eta_days}-day delivery · {formatINR(o.rate)}
                      {o.cod_available ? " · COD ✓" : ""}
                    </Text>
                  </View>
                  <Text style={styles.score}>{o.score?.toFixed(0)}</Text>
                </Pressable>
              ))}
            </>
          ) : !checking ? (
            <Text style={styles.notServiceable}>
              No courier serviceable for this pincode / payment combination. Try another pincode.
            </Text>
          ) : null}
        </View>
      )}

      {/* Bill summary */}
      <View style={styles.bill}>
        <BillRow label="Items total" value={formatINR(subtotal)} />
        <BillRow label="Shipping" value={courier ? formatINR(shippingFee) : "—"} />
        <View style={styles.divider} />
        <BillRow label="Grand total" value={formatINR(subtotal + shippingFee)} bold />
      </View>

      <Button title="Place Order" icon="checkmark-circle-outline" onPress={placeOrder} loading={placing} style={{ marginTop: spacing.lg }} />
    </ScrollView>
  );
}

function Input(props: any) {
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}
function PayOpt({ label, icon, active, onPress }: any) {
  return (
    <Pressable style={[styles.payOpt, active && styles.payOptActive]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={active ? colors.primary : colors.textMuted} />
      <Text style={[styles.payText, active && { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}
function BillRow({ label, value, bold }: any) {
  return (
    <View style={styles.billRow}>
      <Text style={[styles.billLabel, bold && { fontWeight: "900", color: colors.text }]}>{label}</Text>
      <Text style={[styles.billValue, bold && { fontSize: font.h3 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: font.h3, fontWeight: "800", color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, color: colors.text, fontSize: font.body },
  row: { flexDirection: "row", gap: spacing.sm },
  payOpt: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: 14, borderWidth: 1.5, borderColor: colors.border },
  payOptActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  payText: { fontWeight: "700", color: colors.textMuted, fontSize: font.small },
  courierBox: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.lg, ...shadow.soft },
  courierHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm },
  courierTitle: { fontWeight: "800", color: colors.text },
  checking: { color: colors.textMuted, fontSize: font.tiny, marginLeft: "auto" },
  courierOpt: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, marginBottom: 6 },
  courierOptActive: { backgroundColor: colors.primaryLight },
  courierName: { fontWeight: "700", color: colors.text, fontSize: font.small },
  courierMeta: { color: colors.textMuted, fontSize: font.tiny, marginTop: 1 },
  score: { fontWeight: "900", color: colors.primary, fontSize: font.body },
  notServiceable: { color: colors.accent, fontSize: font.small, padding: spacing.sm },
  bill: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg, ...shadow.soft },
  billRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  billLabel: { color: colors.textMuted },
  billValue: { fontWeight: "700", color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
});
