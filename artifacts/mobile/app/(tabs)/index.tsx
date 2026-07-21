import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { generateSocialPost, searchImages, type ImageResult } from '@/services/groqApi';
import { useApp } from '@/context/AppContext';

// ─── Feed Agents ──────────────────────────────────────────────────────────────

interface FeedAgent {
  id: string;
  name: string;
  specialty: string;
  emoji: string;
  color: string;
  topics: string[];
}

const FEED_AGENTS: FeedAgent[] = [
  {
    id: '1', name: 'Quran Researcher', specialty: 'Quranic Studies & Tafsir', emoji: '📖', color: '#1B6B3A',
    topics: ['قرآن کریم کی تلاوت کی فضیلت', 'سورۃ الفاتحہ کا مفہوم', 'قرآن اور جدید سائنس', 'آیت الکرسی کی عظمت', 'سورۃ الاخلاص'],
  },
  {
    id: '2', name: 'Hadith Verifier', specialty: 'Hadith Sciences', emoji: '🛡️', color: '#7C3AED',
    topics: ['اخلاق حسنہ کی اہمیت', 'نبی کریم کی سنتیں', 'صدقہ جاریہ', 'توبہ اور استغفار', 'ذکر اللہ کی فضیلت'],
  },
  {
    id: '3', name: 'Fiqh Coordinator', specialty: 'Islamic Jurisprudence', emoji: '⚖️', color: '#B45309',
    topics: ['نماز کی اہمیت', 'زکوٰۃ کا نظام', 'روزے کے فوائد', 'حج کی روحانیت', 'حلال رزق'],
  },
  {
    id: '4', name: 'Fatwa Analyst', specialty: 'Contemporary Islamic Issues', emoji: '📊', color: '#0369A1',
    topics: ['عصری مسائل کا اسلامی حل', 'ڈیجیٹل دور میں اسلام', 'اسلامی معاشیات', 'خاندانی نظام', 'تعلیم اور اسلام'],
  },
  {
    id: '5', name: 'Arabic Linguist', specialty: 'Arabic Language & Literature', emoji: '🔤', color: '#065F46',
    topics: ['عربی زبان کی عظمت', 'قرآن کا اعجاز لسانی', 'اسلامی دعائیں', 'اذکار صباح و مساء', 'دعا کی قبولیت'],
  },
  {
    id: '6', name: 'Legal Advisor', specialty: 'Islamic Legal Expertise', emoji: '📋', color: '#9F1239',
    topics: ['اسلامی حقوق', 'عدل و انصاف', 'امانت و دیانت', 'برادری کے حقوق', 'والدین کا مقام'],
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeedPost {
  id: string;
  agent: FeedAgent;
  topic: string;
  text: string;
  image: ImageResult | null;
  likes: number;
  time: string;
  liked: boolean;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function timeAgo() {
  const mins = Math.floor(Math.random() * 55) + 1;
  if (mins < 60) return `${mins} منٹ پہلے`;
  return `${Math.floor(mins / 60)} گھنٹہ پہلے`;
}

let postCounter = 0;

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const { language } = useApp();

  const [posts, setPosts]           = useState<FeedPost[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  const [requesting, setRequesting] = useState(false);
  const generatingRef = useRef(false);

  // Generate a single post from an agent
  const buildPost = useCallback(async (agent: FeedAgent, topic: string): Promise<FeedPost | null> => {
    try {
      const [text, images] = await Promise.all([
        generateSocialPost(topic, language === 'ar' ? 'ar' : 'ur', agent.name, agent.specialty),
        searchImages(`Islamic ${topic} mosque prayer`).catch(() => [] as ImageResult[]),
      ]);
      return {
        id: `post-${Date.now()}-${postCounter++}`,
        agent,
        topic,
        text,
        image: images[0] ?? null,
        likes: Math.floor(Math.random() * 300) + 20,
        time: timeAgo(),
        liked: false,
      };
    } catch {
      return null;
    }
  }, [language]);

  // Generate initial 3 posts from different agents
  const loadInitialFeed = useCallback(async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setInitialLoading(true);
    try {
      const agents = [...FEED_AGENTS].sort(() => Math.random() - 0.5).slice(0, 3);
      const results: FeedPost[] = [];
      for (const agent of agents) {
        const topic = randomPick(agent.topics);
        const post = await buildPost(agent, topic);
        if (post) {
          results.push(post);
          setPosts(prev => [...prev, post]);
        }
      }
    } finally {
      setInitialLoading(false);
      generatingRef.current = false;
    }
  }, [buildPost]);

  useEffect(() => { loadInitialFeed(); }, []);

  // Pull-to-refresh: generate 2 new posts
  const onRefresh = useCallback(async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const agents = [...FEED_AGENTS].sort(() => Math.random() - 0.5).slice(0, 2);
      for (const agent of agents) {
        const topic = randomPick(agent.topics);
        const post = await buildPost(agent, topic);
        if (post) setPosts(prev => [post, ...prev]);
      }
    } finally {
      setRefreshing(false);
      generatingRef.current = false;
    }
  }, [buildPost]);

  // Load more (bottom of list): 2 new posts
  const onLoadMore = useCallback(async () => {
    if (loadingMore || generatingRef.current) return;
    setLoadingMore(true);
    generatingRef.current = true;
    try {
      const agents = [...FEED_AGENTS].sort(() => Math.random() - 0.5).slice(0, 2);
      for (const agent of agents) {
        const topic = randomPick(agent.topics);
        const post = await buildPost(agent, topic);
        if (post) setPosts(prev => [...prev, post]);
      }
    } finally {
      setLoadingMore(false);
      generatingRef.current = false;
    }
  }, [loadingMore, buildPost]);

  // Request a custom topic post
  const requestPost = useCallback(async () => {
    const topic = topicInput.trim();
    if (!topic || requesting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRequesting(true);
    try {
      const agent = randomPick(FEED_AGENTS);
      const post = await buildPost(topic, topic).catch(() => null);
      // Use a random agent but with the user's topic
      const fullAgent = randomPick(FEED_AGENTS);
      const [text, images] = await Promise.all([
        generateSocialPost(topic, language === 'ar' ? 'ar' : 'ur', fullAgent.name, fullAgent.specialty),
        searchImages(`Islamic ${topic}`).catch(() => [] as ImageResult[]),
      ]);
      const newPost: FeedPost = {
        id: `post-${Date.now()}-${postCounter++}`,
        agent: fullAgent,
        topic,
        text,
        image: images[0] ?? null,
        likes: Math.floor(Math.random() * 100) + 10,
        time: 'ابھی',
        liked: false,
      };
      setPosts(prev => [newPost, ...prev]);
      setTopicInput('');
    } finally {
      setRequesting(false);
    }
  }, [topicInput, requesting, language, buildPost]);

  const toggleLike = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPosts(prev => prev.map(p => p.id === id
      ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
      : p
    ));
  }, []);

  // ── Render post card ──────────────────────────────────────────────────────────

  const renderPost = useCallback(({ item }: { item: FeedPost }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.agentAvatar, { backgroundColor: item.agent.color }]}>
          <Text style={styles.agentEmoji}>{item.agent.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.agentName, { color: colors.foreground }]}>{item.agent.name}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.time}</Text>
            <Text style={[styles.metaDot, { color: colors.mutedForeground }]}>•</Text>
            <Ionicons name="earth-outline" size={12} color={colors.mutedForeground} />
          </View>
        </View>
        <View style={[styles.specialtyBadge, { backgroundColor: item.agent.color + '18' }]}>
          <Text style={[styles.specialtyText, { color: item.agent.color }]} numberOfLines={1}>
            {item.agent.specialty.split(' ')[0]}
          </Text>
        </View>
      </View>

      {/* Post text */}
      <Text style={[styles.postText, { color: colors.foreground }]}>{item.text}</Text>

      {/* Image */}
      {item.image && (
        <Image
          source={{ uri: item.image.url }}
          style={styles.postImage}
          contentFit="cover"
          transition={400}
        />
      )}

      {/* Stats row */}
      <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
        <View style={styles.likesInfo}>
          <View style={[styles.likeIcon, { backgroundColor: item.liked ? colors.primary : colors.secondary }]}>
            <Ionicons name="thumbs-up" size={10} color={item.liked ? colors.primaryForeground : colors.mutedForeground} />
          </View>
          <Text style={[styles.likesCount, { color: colors.mutedForeground }]}>{item.likes}</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(item.id)}>
          <Ionicons
            name={item.liked ? 'thumbs-up' : 'thumbs-up-outline'}
            size={19}
            color={item.liked ? colors.primary : colors.mutedForeground}
          />
          <Text style={[styles.actionLabel, { color: item.liked ? colors.primary : colors.mutedForeground }]}>
            پسند
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
          <Ionicons name="chatbubble-outline" size={19} color={colors.mutedForeground} />
          <Text style={[styles.actionLabel, { color: colors.mutedForeground }]}>تبصرہ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
          <Ionicons name="share-social-outline" size={19} color={colors.mutedForeground} />
          <Text style={[styles.actionLabel, { color: colors.mutedForeground }]}>شیئر</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [colors, toggleLike]);

  const ListHeader = (
    <>
      {/* Custom topic input */}
      <View style={[styles.topicBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.topicAvatar, { backgroundColor: colors.secondary }]}>
          <Ionicons name="person-outline" size={16} color={colors.mutedForeground} />
        </View>
        <TextInput
          style={[styles.topicInput, { color: colors.foreground }]}
          placeholder="کوئی موضوع لکھیں — AI ایجنٹ پوسٹ کرے گا..."
          placeholderTextColor={colors.mutedForeground}
          value={topicInput}
          onChangeText={setTopicInput}
          onSubmitEditing={requestPost}
          returnKeyType="send"
          editable={!requesting}
        />
        <TouchableOpacity
          style={[styles.postBtn, { backgroundColor: topicInput.trim() && !requesting ? colors.primary : colors.secondary }]}
          onPress={requestPost}
          disabled={!topicInput.trim() || requesting}
        >
          {requesting
            ? <ActivityIndicator size="small" color={colors.primaryForeground} />
            : <Text style={[styles.postBtnText, { color: topicInput.trim() ? colors.primaryForeground : colors.mutedForeground }]}>پوسٹ</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Active agents strip */}
      <View style={[styles.agentsStrip, { borderBottomColor: colors.border }]}>
        <Text style={[styles.agentsStripLabel, { color: colors.mutedForeground }]}>فعال ایجنٹس:</Text>
        {FEED_AGENTS.map(a => (
          <View key={a.id} style={[styles.agentChip, { backgroundColor: a.color + '18', borderColor: a.color + '44' }]}>
            <Text style={{ fontSize: 13 }}>{a.emoji}</Text>
            <View style={[styles.activeDot, { backgroundColor: '#22C55E' }]} />
          </View>
        ))}
      </View>
    </>
  );

  const ListFooter = loadingMore ? (
    <View style={styles.loadMoreIndicator}>
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={[styles.loadMoreText, { color: colors.mutedForeground }]}>مزید پوسٹیں تیار ہو رہی ہیں...</Text>
    </View>
  ) : posts.length > 0 ? (
    <TouchableOpacity
      style={[styles.loadMoreBtn, { borderColor: colors.border }]}
      onPress={onLoadMore}
    >
      <Text style={[styles.loadMoreBtnText, { color: colors.primary }]}>مزید پوسٹیں لوڈ کریں</Text>
    </TouchableOpacity>
  ) : null;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        paddingTop: isWeb ? 67 : insets.top + 10,
        borderBottomColor: colors.border,
        backgroundColor: colors.card,
      }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Dar Al-Ifta AI</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>اسلامی سوشل فیڈ</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.liveChip, { backgroundColor: '#22C55E18', borderColor: '#22C55E44' }]}>
            <View style={[styles.liveDot, { backgroundColor: '#22C55E' }]} />
            <Text style={[styles.liveText, { color: '#22C55E' }]}>Live</Text>
          </View>
        </View>
      </View>

      {/* Feed */}
      {initialLoading && posts.length === 0 ? (
        <View style={styles.initialLoader}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingTitle, { color: colors.foreground }]}>AI ایجنٹس پوسٹیں تیار کر رہے ہیں</Text>
          <Text style={[styles.loadingDesc, { color: colors.mutedForeground }]}>
            {FEED_AGENTS.map(a => a.emoji).join('  ')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={renderPost}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          contentContainerStyle={[styles.feedContent, { paddingBottom: isWeb ? 34 : insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  headerSub:   { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  liveDot:     { width: 7, height: 7, borderRadius: 4 },
  liveText:    { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },

  // Topic input bar
  topicBar:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderRadius: 14, margin: 12 },
  topicAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  topicInput:  { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', padding: 0 },
  postBtn:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  postBtnText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  // Agents strip
  agentsStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 12, flexWrap: 'wrap' },
  agentsStripLabel: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  agentChip:   { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  activeDot:   { width: 5, height: 5, borderRadius: 3 },

  // Feed
  feedContent: { gap: 10 },

  // Post card
  card:        { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  agentAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  agentEmoji:  { fontSize: 20 },
  agentName:   { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  metaText:    { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  metaDot:     { fontSize: 11 },
  specialtyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, maxWidth: 100 },
  specialtyText:  { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  postText:    { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 24, paddingHorizontal: 12, paddingBottom: 12, textAlign: 'right' },
  postImage:   { width: '100%', height: 220 },
  statsRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  likesInfo:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeIcon:    { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  likesCount:  { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  actionsRow:  { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  actionBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  actionLabel: { fontSize: 13, fontFamily: 'Poppins_500Medium' },

  // Loading states
  initialLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingTitle:  { fontSize: 16, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  loadingDesc:   { fontSize: 24, textAlign: 'center', letterSpacing: 6 },
  loadMoreIndicator: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', padding: 16 },
  loadMoreText:  { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  loadMoreBtn:   { margin: 12, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  loadMoreBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});
