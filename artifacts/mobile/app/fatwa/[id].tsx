import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { getFatwaResearch } from '@/services/groqApi';
import * as Haptics from 'expo-haptics';

// Parse AI markdown into structured sections
function parseSections(raw: string): { heading: string; body: string; emoji: string }[] {
  const lines = raw.split('\n');
  const sections: { heading: string; body: string; emoji: string }[] = [];
  let current: { heading: string; body: string[]; emoji: string } | null = null;

  const EMOJI_MAP: Record<string, string> = {
    'question': '❓',
    'سوال': '❓',
    'ruling': '⚖️',
    'حكم': '⚖️',
    'حکم': '⚖️',
    'quran': '📖',
    'قرآن': '📖',
    'hadith': '🛡️',
    'حديث': '🛡️',
    'حدیث': '🛡️',
    'sunnah': '🛡️',
    'scholar': '🏛️',
    'فقهاء': '🏛️',
    'فقہاء': '🏛️',
    'issuing': '📍',
    'authority': '📍',
    'إفتاء': '📍',
    'افتاء': '📍',
    'ادارہ': '📍',
    'conclusion': '✅',
    'خلاص': '✅',
    'خلاصہ': '✅',
  };

  const getEmoji = (heading: string): string => {
    const lower = heading.toLowerCase();
    for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
      if (lower.includes(key)) return emoji;
    }
    return '📌';
  };

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) {
        sections.push({ heading: current.heading, body: current.body.join('\n').trim(), emoji: current.emoji });
      }
      const heading = line.replace('## ', '').trim();
      current = { heading, body: [], emoji: getEmoji(heading) };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) {
    sections.push({ heading: current.heading, body: current.body.join('\n').trim(), emoji: current.emoji });
  }

  // If no ## headers found, treat the whole thing as one section
  if (sections.length === 0 && raw.trim()) {
    sections.push({ heading: 'AI Research', body: raw.trim(), emoji: '🤖' });
  }

  return sections;
}

export default function FatwaDetailScreen() {
  const { id, question, category } = useLocalSearchParams<{
    id: string;
    question: string;
    category: string;
  }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const { isFavorited, addFavorite, removeFavorite, language } = useApp();

  const [research, setResearch] = useState<string>('');
  const [sections, setSections] = useState<{ heading: string; body: string; emoji: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fatwaId = id ?? 'unknown';
  const fatwaQuestion = question ?? '';
  const fatwaCategory = category ?? '';
  const favorited = isFavorited(fatwaId);

  const loadResearch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const content = await getFatwaResearch(fatwaQuestion, fatwaCategory, language);
      setResearch(content);
      setSections(parseSections(content));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fatwaQuestion, fatwaCategory, language]);

  useEffect(() => {
    if (fatwaQuestion) loadResearch();
  }, [loadResearch]);

  const toggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (favorited) {
      removeFavorite(fatwaId);
    } else {
      addFavorite({ id: fatwaId, question: fatwaQuestion, category: fatwaCategory, timeAgo: 'Just now' });
    }
  };

  const shareResearch = async () => {
    try {
      await Share.share({
        message: `📖 Dar Al-Ifta AI\n\nSoal: ${fatwaQuestion}\n\n${research.slice(0, 600)}...\n\nSource: Dar Al-Ifta AI`,
        title: 'Islamic Fatwa Research',
      });
    } catch (err) {
      // Share not available on this platform — silently ignore
      console.warn('Share failed:', err);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: isWeb ? 20 : insets.top + 8, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.backBtn, { backgroundColor: colors.secondary }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </TouchableOpacity>

        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Fatwa Research</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {fatwaCategory}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={toggleFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
          >
            <Ionicons
              name={favorited ? 'heart' : 'heart-outline'}
              size={18}
              color={favorited ? colors.destructive : colors.foreground}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={shareResearch}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
          >
            <Ionicons name="share-outline" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: isWeb ? 40 : insets.bottom + 30 },
        ]}
      >
        {/* Question Card */}
        <View style={[styles.questionCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <View style={styles.questionTop}>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>
                {fatwaCategory}
              </Text>
            </View>
            <View style={[styles.aiBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="sparkles" size={10} color={colors.primary} />
              <Text style={[styles.aiBadgeText, { color: colors.primary }]}>AI Research</Text>
            </View>
          </View>
          <Text style={[styles.questionText, { color: colors.foreground }]}>
            {fatwaQuestion}
          </Text>
        </View>

        {/* Loading state */}
        {loading && (
          <View style={styles.loadingWrap}>
            <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingTitle, { color: colors.foreground }]}>
                Researching Fatwa...
              </Text>
              <Text style={[styles.loadingDesc, { color: colors.mutedForeground }]}>
                Scanning Quran, Hadith, and scholarly sources
              </Text>
              <View style={styles.loadingSteps}>
                {['📖 Quranic Evidence', '🛡️ Hadith Verification', '⚖️ Fiqh Analysis', '🏛️ Scholarly Consensus'].map((step) => (
                  <View key={step} style={styles.loadingStep}>
                    <ActivityIndicator size="small" color={colors.primary} style={{ opacity: 0.6 }} />
                    <Text style={[styles.loadingStepText, { color: colors.mutedForeground }]}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Error state */}
        {!loading && error ? (
          <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.destructive }]}>
            <Ionicons name="alert-circle" size={32} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            <TouchableOpacity
              onPress={loadResearch}
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="refresh" size={16} color={colors.primaryForeground} />
              <Text style={[styles.retryText, { color: colors.primaryForeground }]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Research Sections */}
        {!loading && !error && sections.map((section, i) => (
          <View
            key={i}
            style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>{section.emoji}</Text>
              <Text style={[styles.sectionHeading, { color: colors.primary }]}>
                {section.heading}
              </Text>
            </View>
            <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
            <Text style={[styles.sectionBody, { color: colors.foreground }]}>
              {section.body}
            </Text>
          </View>
        ))}

        {/* Disclaimer */}
        {!loading && !error && sections.length > 0 && (
          <View style={[styles.disclaimer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
              This research is AI-generated based on Islamic sources. For personal matters, please consult a qualified Mufti or Islamic scholar.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  headerSub: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: 16, gap: 12 },
  questionCard: {
    borderRadius: 14, padding: 16, borderWidth: 1, gap: 12, marginBottom: 4,
  },
  questionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1,
  },
  aiBadgeText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  questionText: {
    fontSize: 16, fontFamily: 'Poppins_600SemiBold', lineHeight: 26, textAlign: 'right',
  },
  loadingWrap: { marginTop: 8 },
  loadingCard: {
    borderRadius: 14, padding: 24, borderWidth: 1,
    alignItems: 'center', gap: 12,
  },
  loadingTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  loadingDesc: { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  loadingSteps: { width: '100%', gap: 8, marginTop: 8 },
  loadingStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingStepText: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  errorCard: {
    borderRadius: 14, padding: 24, borderWidth: 1,
    alignItems: 'center', gap: 12,
  },
  errorText: { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
  },
  retryText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  sectionCard: {
    borderRadius: 14, padding: 16, borderWidth: 1, gap: 10,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionEmoji: { fontSize: 20 },
  sectionHeading: { fontSize: 14, fontFamily: 'Poppins_700Bold', flex: 1 },
  sectionDivider: { height: 1, marginHorizontal: -16 },
  sectionBody: {
    fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 24,
  },
  disclaimer: {
    flexDirection: 'row', gap: 8, borderRadius: 10,
    padding: 12, borderWidth: 1, alignItems: 'flex-start',
    marginTop: 4,
  },
  disclaimerText: { flex: 1, fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
});
