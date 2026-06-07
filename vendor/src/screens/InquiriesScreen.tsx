import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { apiError } from "../api/client";
import { Orders } from "../api/endpoints";
import { Badge, Button, EmptyState, Loading } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, font, radius, shadow, spacing } from "../theme";
import { Inquiry } from "../types";

export default function InquiriesScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyFor, setReplyFor] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Orders.inquiries()
      // Only inquiries this seller received.
      .then((r) => setItems(r.data.results.filter((i) => i.seller === user?.id)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function reply(id: number) {
    setSending(true);
    try { await Orders.replyInquiry(id, text); setReplyFor(null); setText(""); load(); }
    catch (e) { Alert.alert("Error", apiError(e)); } finally { setSending(false); }
  }

  if (loading) return <Loading label="Loading inquiries…" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + spacing.sm }}>
      <Text style={styles.heading}>Inquiries</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}
        ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title="No inquiries yet" subtitle="Buyer questions about your parts appear here." />}
        renderItem={({ item }) => {
          const canReply = item.status !== "answered";
          return (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text numberOfLines={1} style={styles.subject}>{item.part_title || "Vehicle inquiry"}</Text>
                <Badge label={item.status.toUpperCase()} color={item.status === "answered" ? colors.accent : colors.warning} />
              </View>
              <Text style={styles.from}>From {item.buyer_name}</Text>
              <Text style={styles.msg}>{item.message}</Text>
              {!!item.reply && <Text style={styles.reply}>You replied: {item.reply}</Text>}

              {canReply && replyFor !== item.id && (
                <Pressable style={styles.replyBtn} onPress={() => { setReplyFor(item.id); setText(""); }}>
                  <Text style={styles.replyBtnText}>Reply →</Text>
                </Pressable>
              )}
              {canReply && replyFor === item.id && (
                <View style={styles.replyBox}>
                  <TextInput style={styles.input} placeholder="Type your reply…" placeholderTextColor={colors.textMuted} value={text} onChangeText={setText} multiline />
                  <Button title="Send Reply" variant="success" onPress={() => reply(item.id)} loading={sending} disabled={!text.trim()} />
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
  heading: { fontSize: font.h1, fontWeight: "900", color: colors.text, paddingHorizontal: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.soft },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  subject: { fontWeight: "800", color: colors.text, flex: 1, marginRight: spacing.sm },
  from: { color: colors.textMuted, fontSize: font.tiny, marginBottom: spacing.xs },
  msg: { color: colors.text, lineHeight: 19 },
  reply: { color: colors.accent, lineHeight: 19, marginTop: spacing.sm, backgroundColor: colors.accentSoft, padding: spacing.sm, borderRadius: radius.sm },
  replyBtn: { marginTop: spacing.sm, alignSelf: "flex-start" },
  replyBtnText: { color: colors.primary, fontWeight: "800" },
  replyBox: { marginTop: spacing.sm, gap: spacing.sm },
  input: { backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.md, minHeight: 70, textAlignVertical: "top", borderWidth: 1, borderColor: colors.border, color: colors.text },
});
