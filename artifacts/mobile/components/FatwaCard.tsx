import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { Fatwa } from '@/context/AppContext';

interface Props {
  fatwa: Fatwa;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onPress?: () => void;
}

export default function FatwaCard({ fatwa, isFavorited, onToggleFavorite, onPress }: Props) {
  const colors = useColors();
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* Top row — category badge + heart */}
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{fatwa.category}</Text>
        </View>
        <TouchableOpacity
          onPress={onToggleFavorite}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorited ? colors.destructive : colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      {/* Question text */}
      <Text style={[styles.question, { color: colors.foreground }]} numberOfLines={3}>
        {fatwa.question}
      </Text>

      {/* Bottom row — time + read more */}
      <View style={styles.bottomRow}>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>{fatwa.timeAgo}</Text>
        <View style={[styles.readMore, { backgroundColor: colors.secondary }]}>
          <Ionicons name="sparkles" size={10} color={colors.primary} />
          <Text style={[styles.readMoreText, { color: colors.primary }]}>AI Research</Text>
          <Ionicons name="chevron-forward" size={11} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, gap: 8,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: {
    fontSize: 10, fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  question: {
    fontSize: 15, fontFamily: 'Poppins_500Medium',
    lineHeight: 24, textAlign: 'right',
  },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  readMore: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  readMoreText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
});
