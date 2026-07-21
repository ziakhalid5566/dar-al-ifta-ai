import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import FatwaCard from '@/components/FatwaCard';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import type { Fatwa } from '@/context/AppContext';

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const { favorites, isFavorited, removeFavorite, clearAllData } = useApp();

  const toggleFav = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeFavorite(id);
  }, [removeFavorite]);

  const openFatwa = useCallback((fatwa: Fatwa) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/fatwa/[id]',
      params: { id: fatwa.id, question: fatwa.question, category: fatwa.category },
    });
  }, [router]);

  const handleClearAll = () => {
    if (favorites.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'تمام محفوظ فتاویٰ حذف کریں',
      `${favorites.length} saved fatwas will be removed permanently.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => clearAllData() },
      ],
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 12, borderBottomColor: colors.border }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Saved Fatwas</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>محفوظ شدہ فتاویٰ</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: colors.secondary }]}>
          <Ionicons name="heart" size={12} color={colors.primary} />
          <Text style={[styles.countText, { color: colors.primary }]}>{favorites.length}</Text>
        </View>
        {favorites.length > 0 && (
          <TouchableOpacity
            onPress={handleClearAll}
            style={[styles.clearBtn, { backgroundColor: '#FEE2E2' }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color={colors.destructive} />
          </TouchableOpacity>
        )}
      </View>

      {favorites.length === 0 ? (
        /* ── Empty state ── */
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.secondary }]}>
            <Ionicons name="heart-outline" size={48} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>کوئی محفوظ فتویٰ نہیں</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            کسی بھی فتویٰ کو دل کے نشان سے محفوظ کریں تاکہ یہاں نظر آئے
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/index')}
            style={[styles.browseBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <Ionicons name="book-outline" size={16} color={colors.primaryForeground} />
            <Text style={[styles.browseBtnText, { color: colors.primaryForeground }]}>
              فتاویٰ دیکھیں
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FatwaCard
              fatwa={item}
              isFavorited={isFavorited(item.id)}
              onToggleFavorite={() => toggleFav(item.id)}
              onPress={() => openFatwa(item)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: isWeb ? 34 + 84 : insets.bottom + 90 },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            favorites.length > 0 ? (
              <Text style={[styles.listMeta, { color: colors.mutedForeground }]}>
                {favorites.length} فتاویٰ محفوظ ہیں
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  headerSub: { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  countText: { fontSize: 13, fontFamily: 'Poppins_700Bold' },
  clearBtn: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, gap: 14,
  },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  emptyDesc: { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 20 },
  browseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 11, borderRadius: 11, marginTop: 4,
  },
  browseBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  listContent: { paddingHorizontal: 16, paddingTop: 12 },
  listMeta: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 8 },
});
