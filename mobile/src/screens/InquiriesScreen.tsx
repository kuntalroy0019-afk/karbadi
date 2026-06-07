import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { apiError } from "../api/client";
import { Orders } from "../api/endpoints";
import { Badge, Button, EmptyState, Loading } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, font, radius, shadow, spacing } from "../theme";
import { Inquiry } from "../types";

export default function InquiriesScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyFor, setReplyFor] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const isSeller = user?.role === "seller" || user?.role === "admin";

  const load = useCallback(() => {
    setLoading(true);
    Orders.inquiries()
      .then((r) => setInquiries(r.data.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function sendReply(id: number) {
    setSending(true);
    try {
      await Orders.replyInquiry(id, replyText);
      setReplyFor(null);
      setReplyText("");
      load();
    } catch (e) {
      Alert.alert("Error", apiError(e));
    } finally {
      setSending(false);
    }
  }

  if (loading) return <Loading label="Loading…" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Profile header */}
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={28} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user?.first_name || user?.username}</Text>
          <Text style={styles.role}>{user?.role?.toUpperCase()} · {user?.email}</Text>
        </View>
        <Button title="Sign Out" variant="outline" onPress={() => { signOut(); navigation.navigate("Tabs"); }} style={{ width: 110, height: 40 }} />
      </View>

      {isSeller && (
        <Pressable style={styles.sellerCta} onPress={() => navigation.navigate("SellerDashboard")}>
          <Ionicons name="storefront" size={20} color={colors.white} />
          <Text style={styles.sellerCtaText}>Open Seller Dashboard</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.white} />
        </Pressable>
      )}

      <Text style={styles.heading}>Inquiries</Text>
      <FlatList
        data={inquiries}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}
        ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title="No inquiries yet" subtitle="Questions to/from sellers appear here." />}
        renderItem={({ item }) => {
          const iAmSeller = item.seller === user?.id;
          const canReply = iAmSeller && item.status !== "answered";
          return (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text numberOfLines={1} style={styles.subject}>{item.part_title || "Vehicle inquiry"}</Text>
                <Badge label={item.status.toUpperCase()} color={item.status === "answered" ? colors.success : colors.warning} />
              </View>
              <Text style={styles.who}>{iAmSeller ? `From ${item.buyer_name}` : "You asked"}</Text>
              <Text style={styles.msg}>{item.message}</Text>
              {!!item.reply && <Text style={styles.reply}>Seller: {item.reply}</Text>}

              {canReply && replyFor !== item.id && (
                <Pressable style={styles.replyBtn} onPress={() => { setReplyFor(item.id); setReplyText(""); }}>
                  <Ionicons name="arrow-undo-outline" size={16} color={colors.primary} />
                  <Text style={styles.replyBtnText}>Reply</Text>
                </Pressable>
              )}
              {canReply && replyFor === item.id && (
                <View style={styles.replyBox}>
                  <TextInput
                    style={styles.replyInput}
                    placeholder="Type your reply…"
                    placeholderTextColor={colors.textMuted}
                    value={replyText}
                    onChangeText={setReplyText}
                    multiline
                  />
                  <Button title="Send Reply" onPress={() => sendReply(item.id)} loading={sending} disabled={!replyText.trim()} />
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, padding: spacing.lg, ...shadow.soft },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  name: { fontWeight: "900", color: colors.text, fontSize: font.h3 },
  role: { color: colors.textMuted, fontSize: font.tiny },
  sellerCta: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.primary, marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md },
  sellerCtaText: { flex: 1, color: colors.white, fontWeight: "800" },
  heading: { fontSize: font.h2, fontWeight: "900", color: colors.text, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.soft },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  subject: { fontWeight: "800", color: colors.text, flex: 1, marginRight: spacing.sm },
  who: { color: colors.textMuted, fontSize: font.tiny, marginBottom: spacing.xs },
  msg: { color: colors.text, lineHeight: 19 },
  reply: { color: colors.primary, lineHeight: 19, marginTop: spacing.sm, backgroundColor: colors.primaryLight, padding: spacing.sm, borderRadius: radius.sm },
  replyBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm, alignSelf: "flex-start" },
  replyBtnText: { color: colors.primary, fontWeight: "700" },
  replyBox: { marginTop: spacing.sm, gap: spacing.sm },
  replyInput: { backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.md, minHeight: 70, textAlignVertical: "top", borderWidth: 1, borderColor: colors.border, color: colors.text },
});
