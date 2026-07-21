import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import FatwaCard from '@/components/FatwaCard';
import { useApp, type Fatwa } from '@/context/AppContext';
import { useDebounce } from '@/hooks/useDebounce';

const CATEGORIES = ['All', 'عبادات', 'معاملات', 'خاندان', 'Contemporary'];

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  All:          'apps-outline',
  عبادات:       'moon-outline',
  معاملات:      'cash-outline',
  خاندان:       'people-outline',
  Contemporary: 'bulb-outline',
};

const ALL_FATWAS: Fatwa[] = [
  { id: '1',  question: 'نماز فجر قضا ہو جائے تو کیا کریں؟ کیا قضا نماز کا طریقہ ادا نماز جیسا ہے؟',             category: 'عبادات',       timeAgo: '2 منٹ پہلے'    },
  { id: '2',  question: 'کرپٹو کرنسی میں سرمایہ کاری کا شرعی حکم کیا ہے؟ بٹ کوائن حلال ہے یا حرام؟',          category: 'Contemporary',  timeAgo: '5 منٹ پہلے'    },
  { id: '3',  question: 'ما حكم زكاة الأسهم في البورصة وكيفية حسابها؟',                                          category: 'معاملات',       timeAgo: '1 گھنٹہ پہلے'  },
  { id: '4',  question: 'رمضان میں روزے کی حالت میں انجکشن لگوانا جائز ہے؟',                                    category: 'عبادات',       timeAgo: '2 گھنٹے پہلے'  },
  { id: '5',  question: 'What is the Islamic ruling on taking out an interest-based mortgage to buy a house?',    category: 'Contemporary',  timeAgo: '3 hours ago'   },
  { id: '6',  question: 'طلاق کے بعد عدت کا حکم اور بچوں کی حضانت کا مسئلہ',                                   category: 'خاندان',       timeAgo: '5 گھنٹے پہلے'  },
  { id: '7',  question: 'اسلام میں وراثت کی تقسیم کا طریقہ کیا ہے؟ بیٹی کو کتنا حصہ ملتا ہے؟',               category: 'خاندان',       timeAgo: '6 گھنٹے پہلے'  },
  { id: '8',  question: 'حلال انکم ٹیکس دینا واجب ہے؟ اسلامی نقطہ نظر سے ٹیکس کا کیا حکم ہے؟',              category: 'معاملات',       timeAgo: '8 گھنٹے پہلے'  },
  { id: '9',  question: 'ما حكم الصلاة في المسجد المبني على أرض مغصوبة؟',                                        category: 'عبادات',       timeAgo: '10 گھنٹے پہلے' },
  { id: '10', question: 'Is it permissible to work in a conventional bank that deals with interest (riba)?',     category: 'Contemporary',  timeAgo: '12 hours ago'  },
];

const DAILY_HADITH = {
  ar: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
  ur: 'اعمال کا دارومدار نیتوں پر ہے',
  source: 'صحیح بخاری • 1',
};

function filterFatwas(fatwas: Fatwa[], query: string, cat: string): Fatwa[] {
  return fatwas.filter((f) => {
    const matchCat = cat === 'All' || f.category === cat;
    if (!query.trim()) return matchCat;
    const q = query.toLowerCase();
    const inQuestion = f.question.toLowerCase().includes(q) || f.question.includes(query);
    const inCategory = f.category.toLowerCase().includes(q);
    return matchCat && (inQuestion || inCategory);
  });
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isFavorited, addFavorite, removeFavorite, language, favorites } = useApp();
  const isWeb = Platform.OS === 'web';

  const [inputText, setInputText]     = useState('');
  const [category, setCategory]       = useState('All');
  const [isSearching, setIsSearching] = useState(false);
  const [filtered, setFiltered]       = useState<Fatwa[]>(ALL_FATWAS);

  const debouncedQuery = useDebounce(inputText, 450);

  useEffect(() => {
    if (debouncedQuery !== inputText) { setIsSearching(true); return; }
    setIsSearching(false);
    setFiltered(filterFatwas(ALL_FATWAS, debouncedQuery, category));
  }, [debouncedQuery, inputText, category]);

  useEffect(() => {
    setFiltered(filterFatwas(ALL_FATWAS, debouncedQuery, category));
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearSearch = useCallback(() => {
    setInputText('');
    setFiltered(filterFatwas(ALL_FATWAS, '', category));
    setIsSearching(false);
  }, [category]);

  const toggleFav = useCallback((fatwa: Fatwa) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isFavorited(fatwa.id)) removeFavorite(fatwa.id);
    else addFavorite(fatwa);
  }, [isFavorited, addFavorite, removeFavorite]);

  const openFatwa = useCallback((fatwa: Fatwa) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/fatwa/[id]', params: { id: fatwa.id, question: fatwa.question, category: fatwa.category } });
  }, [router]);

  const langLabel: Record<string, string> = { auto: 'Auto', ur: 'اردو', ar: 'عربي', en: 'EN' };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 12, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoBox, { backgroundColor: colors.secondary }]}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.appName, { color: colors.foreground }]}>Dar Al-Ifta AI</Text>
            <Text style={[styles.appSub, { color: colors.mutedForeground }]}>Authentic Shariah Guidance</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.langBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.langBadgeText, { color: colors.primary }]}>
              {langLabel[language] ?? 'Auto'}
            </Text>
          </View>
          {favorites.length > 0 && (
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/(tabs)/favorites')}
            >
              <Ionicons name="heart" size={15} color={colors.primary} />
              <Text style={[styles.favCount, { color: colors.primary }]}>{favorites.length}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <Feather name="message-circle" size={15} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 34 + 84 : insets.bottom + 90 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Daily Hadith Banner ── */}
        {!inputText && (
          <View style={[styles.hadithBanner, { backgroundColor: colors.primary }]}>
            <View style={styles.hadithTop}>
              <Ionicons name="book" size={14} color={colors.primaryForeground} style={{ opacity: 0.8 }} />
              <Text style={[styles.hadithLabel, { color: colors.primaryForeground }]}>حدیث یومیہ</Text>
            </View>
            <Text style={[styles.hadithAr, { color: colors.primaryForeground }]}>{DAILY_HADITH.ar}</Text>
            <Text style={[styles.hadithUr, { color: colors.primaryForeground }]}>{DAILY_HADITH.ur}</Text>
            <Text style={[styles.hadithSource, { color: colors.primaryForeground }]}>{DAILY_HADITH.source}</Text>
          </View>
        )}

        {/* ── Search bar ── */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: isSearching ? colors.primary : colors.border }]}>
          {isSearching
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Feather name="search" size={16} color={colors.mutedForeground} />}
          <TextInput
            placeholder="فتوی یا شرعی سوال تلاش کریں... / Search fatwas..."
            placeholderTextColor={colors.mutedForeground}
            value={inputText}
            onChangeText={setInputText}
            returnKeyType="search"
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {inputText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {inputText.length > 0 && !isSearching && (
          <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'} found
          </Text>
        )}

        {/* ── Categories ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategory(cat); }}
                style={[styles.pill, {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                }]}
              >
                <Ionicons
                  name={CATEGORY_ICONS[cat] ?? 'apps-outline'}
                  size={12}
                  color={active ? colors.primaryForeground : colors.mutedForeground}
                />
                <Text style={[styles.pillText, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Fatwa list ── */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {inputText ? 'نتائج' : 'حالیہ فتاویٰ'}
          </Text>
          {!isSearching && (
            <Text style={[styles.seeAll, { color: colors.primary }]}>{filtered.length} فتاویٰ</Text>
          )}
        </View>

        {isSearching ? (
          <View style={styles.searchingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.searchingText, { color: colors.mutedForeground }]}>مکمل اسکیننگ جاری ہے...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="search-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>کوئی نتیجہ نہیں ملا</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              "{inputText}" کے لیے کوئی فتویٰ نہیں ملا۔{'\n'}Chat میں براہ راست سوال پوچھیں۔
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/chat')}
              style={[styles.askBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="chatbubble-ellipses" size={16} color={colors.primaryForeground} />
              <Text style={[styles.askBtnText, { color: colors.primaryForeground }]}>AI سے پوچھیں</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((fatwa) => (
            <FatwaCard
              key={fatwa.id}
              fatwa={fatwa}
              isFavorited={isFavorited(fatwa.id)}
              onToggleFavorite={() => toggleFav(fatwa)}
              onPress={() => openFatwa(fatwa)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  appSub:  { fontSize: 10, fontFamily: 'Poppins_400Regular' },
  langBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  langBadgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold' },
  iconBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, height: 34, borderRadius: 10, borderWidth: 1,
  },
  favCount: { fontSize: 12, fontFamily: 'Poppins_700Bold' },
  scroll: { paddingHorizontal: 16, paddingTop: 14 },
  // Hadith banner
  hadithBanner: {
    borderRadius: 14, padding: 16, marginBottom: 14, gap: 4,
  },
  hadithTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  hadithLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', opacity: 0.85 },
  hadithAr: { fontSize: 16, fontFamily: 'Poppins_700Bold', textAlign: 'right', lineHeight: 28 },
  hadithUr: { fontSize: 13, fontFamily: 'Poppins_400Regular', opacity: 0.9, marginTop: 2 },
  hadithSource: { fontSize: 10, fontFamily: 'Poppins_400Regular', opacity: 0.65, marginTop: 4 },
  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', padding: 0 },
  resultCount: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 12, paddingLeft: 4 },
  searchingWrap: { alignItems: 'center', paddingVertical: 40, gap: 14 },
  searchingText: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  // Categories
  catRow: { gap: 8, paddingBottom: 14 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  pillText: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  // Section headers
  sectionTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', marginBottom: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  seeAll: { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  // Quick access
  quickRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  quickCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 5 },
  quickIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  quickTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  quickDesc: { fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 16 },
  quickBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  quickBadgeText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, borderRadius: 12, borderWidth: 1, padding: 12,
    alignItems: 'center', gap: 4,
  },
  statValue: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  emptyDesc: { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 20 },
  askBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  askBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});
