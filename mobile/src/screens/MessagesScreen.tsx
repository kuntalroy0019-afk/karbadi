import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { apiError } from "../api/client";
import { Orders } from "../api/endpoints";
import { Button, EmptyState, Loading } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, font, radius, spacing } from "../theme";
import { Inquiry } from "../types";

export default function MessagesScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyFor, setReplyFor] = useState<number | null>(null);
  const [text, setText] = useState("");

  const load = useCallback(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    Orders.inquiries().then((r) => setItems(r.data.results)).catch(() => {}).finally(() => setLoading(false));
  }, [user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function reply(id: number) {
    try { await Orders.replyInquiry(id, text); setReplyFor(null); setText(""); load(); }
    catch (e) { Alert.alert("Error", apiError(e)); }
  }

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <EmptyState icon="chatbubbles-outline" title="Your messages" subtitle="Sign in to chat with sellers about parts." />
        <View style={{ padding: spacing.md }}><Button title="Sign In" onPress={() => nav.navigate("Login")} /></View>
      </View>
    );
  }
  if (loading) return <Loading label="Loading messages…" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Inquiries with sellers</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.h }}
        ListEmptyComponent={<EmptyState icon="chatbubble-ellipses-outline" title="No messages yet" subtitle="Send an inquiry from any product to start a conversation." />}
        renderItem={({ item }) => {
          const iAmSeller = item.seller === user.id;
          const canReply = iAmSeller && item.status !== "answered";
          return (
            <View style={styles.card}>
              <View style={styles.rowTop}>
                <View style={styles.thumb}><Ionicons name="cube-outline" size={20} color={colors.accent} /></View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={styles.subject}>{item.part_title || "Vehicle inquiry"}</Text>
                  <Text style={styles.who}>{iAmSeller ? `From ${item.buyer_name}` : "You asked"}</Text>
                </View>
                <View style={[styles.status, item.status === "answered" && styles.statusDone]}>
                  <Text style={[styles.statusText, item.status === "answered" && { color: colors.accent }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.msg}>{item.message}</Text>
              {!!item.reply && (
                <View style={styles.replyBubble}><Text style={styles.replyText}>{item.reply}</Text></View>
              )}
              {canReply && replyFor !== item.id && (
                <Pressable onPress={() => { setReplyFor(item.id); setText(""); }}><Text style={styles.replyLink}>Reply →</Text></Pressable>
              )}
              {canReply && replyFor === item.id && (
                <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                  <TextInput style={styles.input} placeholder="Type your reply…" placeholderTextColor={colors.textFaint} value={text} onChangeText={setText} multiline />
                  <Button title="Send" onPress={() => reply(item.id)} disabled={!text.trim()} />
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
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: font.h1, fontWeight: "700", color: colors.text },
  subtitle: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  rowTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  thumb: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  subject: { fontWeight: "700", color: colors.text, fontSize: font.body },
  who: { color: colors.textMuted, fontSize: font.tiny, marginTop: 1 },
  status: { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  statusDone: { backgroundColor: colors.accentSoft },
  statusText: { color: colors.textMuted, fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  msg: { color: colors.text, lineHeight: 20 },
  replyBubble: { backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  replyText: { color: colors.accentDark, lineHeight: 20 },
  replyLink: { color: colors.accent, fontWeight: "700", marginTop: spacing.sm },
  input: { backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.md, minHeight: 64, textAlignVertical: "top", borderWidth: 1, borderColor: colors.border, color: colors.text },
});
