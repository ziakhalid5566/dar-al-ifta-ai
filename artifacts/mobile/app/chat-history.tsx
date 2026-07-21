import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import * as Haptics from 'expo-haptics';

export default function ChatHistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const { chatHistory, deleteChatSession, clearChatHistory } = useApp();

  const handleDeleteSession = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('گفتگو حذف کریں', 'کیا آپ یہ گفتگو حذف کرنا چاہتے ہیں؟', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteChatSession(id) },
    ]);
  }, [deleteChatSession]);

  const handleClearAll = useCallback(() => {
    if (chatHistory.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('تمام گفتگو حذف کریں', `${chatHistory.length} conversations will be deleted permanently.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: clearChatHistory },
    ]);
  }, [chatHistory.length, clearChatHistory]);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = diffMs / 3600000;
    if (diffH < 1) return 'ابھی';
    if (diffH < 24) return `${Math.floor(diffH)} گھنٹے پہلے`;
    if (diffH < 48) return 'کل';
    return d.toLocaleDateString('ur-PK', { day: 'numeric', month: 'short' });
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
        <Ionicons name="chatbubbles-outline" size={48} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>کوئی گفتگو نہیں</Text>
      <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
        Chat میں سوال پوچھنے کے بعد گفتگو یہاں محفوظ ہوگی
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/chat')}
        style={[styles.startBtn, { backgroundColor: colors.primary }]}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubble-ellipses" size={16} color={colors.primaryForeground} />
        <Text style={[styles.startBtnText, { color: colors.primaryForeground }]}>نئی گفتگو شروع کریں</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Chat History</Text>
          {chatHistory.length > 0 && (
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {chatHistory.length} گفتگو محفوظ
            </Text>
          )}
        </View>
        {chatHistory.length > 0 && (
          <TouchableOpacity
            onPress={handleClearAll}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.destructive} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={chatHistory}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: isWeb ? 40 : insets.bottom + 24 },
          chatHistory.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Top row */}
            <View style={styles.sessionTop}>
              <View style={[styles.sessionAvatar, { backgroundColor: colors.secondary }]}>
                <Ionicons
                  name={item.isMultiAgent ? 'git-network' : 'chatbubble-ellipses'}
                  size={16}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sessionMode, { color: colors.primary }]}>
                  {item.isMultiAgent ? 'Multi-Scholar Mode' : 'Islamic Assistant'}
                </Text>
                <Text style={[styles.sessionTime, { color: colors.mutedForeground }]}>
                  {formatDate(item.timestamp)}
                </Text>
              </View>
              <View style={[styles.msgCountBadge, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.msgCountText, { color: colors.primary }]}>
                  {item.messageCount} پیغام
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteSession(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle-outline" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Preview messages */}
            <View style={[styles.previewBox, { borderTopColor: colors.border }]}>
              {item.preview.map((msg, i) => (
                <View key={i} style={[styles.previewRow, { flexDirection: msg.isUser ? 'row-reverse' : 'row' }]}>
                  <View
                    style={[
                      styles.previewBubble,
                      {
                        backgroundColor: msg.isUser ? colors.primary : colors.secondary,
                        borderRadius: msg.isUser ? 12 : 12,
                        maxWidth: '82%',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.previewText,
                        { color: msg.isUser ? colors.primaryForeground : colors.foreground },
                      ]}
                      numberOfLines={2}
                    >
                      {msg.content}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold' },
  headerSub: { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  list: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  listEmpty: { flex: 1, justifyContent: 'center' },
  // Empty state
  emptyWrap: { alignItems: 'center', gap: 14, paddingHorizontal: 32 },
  emptyIcon: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  emptyDesc: { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 20 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 11, borderRadius: 11, marginTop: 4,
  },
  startBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  // Session card
  sessionCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  sessionTop: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  sessionAvatar: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sessionMode: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  sessionTime: { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  msgCountBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  msgCountText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  // Preview
  previewBox: { borderTopWidth: StyleSheet.hairlineWidth, padding: 12, gap: 6 },
  previewRow: { gap: 0 },
  previewBubble: { paddingHorizontal: 10, paddingVertical: 6 },
  previewText: { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
});
