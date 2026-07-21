import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import {
  sendAgentMessage,
  generateSocialPost,
  searchImages,
  type ChatMessage,
  type ImageResult,
} from '@/services/groqApi';
import { useApp } from '@/context/AppContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Agent {
  id: string;
  name: string;
  specialty: string;
  status: 'online' | 'busy' | 'offline';
  icon: keyof typeof Ionicons.glyphMap;
  emoji: string;
  isSocial?: boolean;
}

interface AgentMessage {
  id: string;
  text: string;
  isUser: boolean;
  time: string;
}

interface SocialPost {
  id: string;
  text: string;
  image: ImageResult | null;
  topic: string;
  time: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const AGENTS: Agent[] = [
  { id: '1', name: 'Quran Researcher',    specialty: 'Quranic Studies & Tafsir',       status: 'online', icon: 'book-outline',         emoji: '📖' },
  { id: '2', name: 'Hadith Verifier',     specialty: 'Verify Hadith Authenticity',      status: 'online', icon: 'shield-checkmark-outline', emoji: '🛡️' },
  { id: '3', name: 'Fiqh Coordinator',   specialty: 'Islamic Jurisprudence Expert',    status: 'online', icon: 'hammer-outline',         emoji: '⚖️' },
  { id: '4', name: 'Fatwa Analyst',       specialty: 'Analyzes Contemporary Fatwas',   status: 'busy',   icon: 'analytics-outline',      emoji: '📊' },
  { id: '5', name: 'Arabic Linguist',     specialty: 'Arabic Language Specialist',     status: 'online', icon: 'text-outline',            emoji: '🔤' },
  { id: '6', name: 'Legal Advisor',       specialty: 'Islamic Legal Expertise',        status: 'online', icon: 'briefcase-outline',       emoji: '📋' },
  {
    id: '7',
    name: 'Social Post Creator',
    specialty: 'Islamic posts with images for your platform',
    status: 'online',
    icon: 'share-social-outline',
    emoji: '✍️',
    isSocial: true,
  },
];

const STATUS_COLOR: Record<Agent['status'], string> = {
  online: '#22C55E',
  busy:   '#F59E0B',
  offline: '#6B7280',
};

let msgCounter = 100;
function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AgentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const { language } = useApp();

  // Chat agent state
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages]           = useState<AgentMessage[]>([]);
  const [input, setInput]                 = useState('');
  const [isLoading, setIsLoading]         = useState(false);
  const apiHistory = useRef<ChatMessage[]>([]);
  const inputRef   = useRef<TextInput>(null);

  // Social post agent state
  const [socialVisible, setSocialVisible]   = useState(false);
  const [socialTopic, setSocialTopic]       = useState('');
  const [socialPosts, setSocialPosts]       = useState<SocialPost[]>([]);
  const [generating, setGenerating]         = useState(false);
  const socialInputRef = useRef<TextInput>(null);

  const onlineCount = AGENTS.filter(a => a.status === 'online').length;

  // ── Open agent ──────────────────────────────────────────────────────────────

  const openAgent = useCallback((agent: Agent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (agent.isSocial) {
      setSocialVisible(true);
      return;
    }
    setSelectedAgent(agent);
    apiHistory.current = [];
    setMessages([{
      id: `welcome-${agent.id}`,
      text: `Assalamu Alaikum! I am the ${agent.name} ${agent.emoji}. I specialize in ${agent.specialty}. How can I assist you today?`,
      isUser: false,
      time: getTime(),
    }]);
    setInput('');
  }, []);

  const closeAgent = useCallback(() => {
    setSelectedAgent(null);
    setMessages([]);
    apiHistory.current = [];
  }, []);

  // ── Chat send ───────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || !selectedAgent) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: AgentMessage = { id: `${Date.now()}-${msgCounter++}`, text: text.trim(), isUser: true, time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    apiHistory.current = [...apiHistory.current, { role: 'user', content: text.trim() }];

    try {
      const content = await sendAgentMessage(selectedAgent.id, selectedAgent.name, selectedAgent.specialty, apiHistory.current, language);
      apiHistory.current = [...apiHistory.current, { role: 'assistant', content }];
      setMessages(prev => [...prev, { id: `${Date.now()}-${msgCounter++}`, text: content, isUser: false, time: getTime() }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, text: 'رابطہ نہیں ہو سکا۔ دوبارہ کوشش کریں۔', isUser: false, time: getTime() }]);
      Alert.alert('Error', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, selectedAgent, language]);

  // ── Social post generate ─────────────────────────────────────────────────────

  const handleGeneratePost = useCallback(async () => {
    const topic = socialTopic.trim();
    if (!topic || generating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);
    try {
      // Generate post text and fetch image in parallel
      const [postText, images] = await Promise.all([
        generateSocialPost(topic, language === 'ar' ? 'ar' : 'ur'),
        searchImages(`Islamic ${topic} mosque prayer`).catch(() => [] as ImageResult[]),
      ]);
      const image = images.length > 0 ? images[0] : null;
      const newPost: SocialPost = {
        id: `post-${Date.now()}`,
        text: postText,
        image,
        topic,
        time: getTime(),
      };
      setSocialPosts(prev => [newPost, ...prev]);
      setSocialTopic('');
    } catch (err) {
      Alert.alert('خرابی', err instanceof Error ? err.message : 'پوسٹ بنانے میں ناکامی');
    } finally {
      setGenerating(false);
    }
  }, [socialTopic, generating, language]);

  // ── Render agent card ────────────────────────────────────────────────────────

  const renderAgent = useCallback(({ item }: { item: Agent }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.agentCard, {
        backgroundColor: item.isSocial ? colors.primary + '12' : colors.card,
        borderColor: item.isSocial ? colors.primary + '55' : colors.border,
      }]}
      onPress={() => openAgent(item)}
    >
      <View style={styles.agentCardHeader}>
        <View style={[styles.agentIcon, { backgroundColor: item.isSocial ? colors.primary + '22' : colors.secondary }]}>
          <Ionicons name={item.icon} size={20} color={colors.primary} />
        </View>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[item.status] }]} />
      </View>
      <Text style={[styles.agentName, { color: colors.foreground }]}>{item.name}</Text>
      <Text style={[styles.agentSpecialty, { color: colors.mutedForeground }]} numberOfLines={2}>{item.specialty}</Text>
      <TouchableOpacity
        style={[styles.chatBtn, { backgroundColor: colors.primary + '18' }]}
        onPress={() => openAgent(item)}
      >
        <Ionicons name={item.isSocial ? 'create-outline' : 'chatbubble-outline'} size={12} color={colors.primary} />
        <Text style={[styles.chatBtnText, { color: colors.primary }]}>{item.isSocial ? 'Create Post' : 'Chat'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  ), [colors, openAgent]);

  // ── Render social post card (Facebook style) ─────────────────────────────────

  const renderSocialPost = useCallback(({ item }: { item: SocialPost }) => (
    <View style={[styles.fbCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Post header */}
      <View style={styles.fbHeader}>
        <View style={[styles.fbAvatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.fbAvatarText}>د</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.fbName, { color: colors.foreground }]}>Dar Al-Ifta AI</Text>
          <Text style={[styles.fbTime, { color: colors.mutedForeground }]}>{item.time} • {item.topic}</Text>
        </View>
        <Ionicons name="earth-outline" size={14} color={colors.mutedForeground} />
      </View>

      {/* Post text */}
      <Text style={[styles.fbPostText, { color: colors.foreground }]}>{item.text}</Text>

      {/* Image */}
      {item.image && (
        <Image
          source={{ uri: item.image.url }}
          style={styles.fbImage}
          contentFit="cover"
          transition={300}
        />
      )}

      {/* Separator */}
      <View style={[styles.fbSep, { backgroundColor: colors.border }]} />

      {/* Action row */}
      <View style={styles.fbActions}>
        {(['thumbs-up-outline', 'chatbubble-outline', 'share-social-outline'] as const).map((icon, i) => (
          <TouchableOpacity
            key={icon}
            style={styles.fbActionBtn}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name={icon} size={18} color={colors.mutedForeground} />
            <Text style={[styles.fbActionText, { color: colors.mutedForeground }]}>
              {['Like', 'Comment', 'Share'][i]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ), [colors]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[styles.header, {
        paddingTop: isWeb ? 67 : insets.top + 12,
        borderBottomColor: colors.border,
      }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Agents</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>{AGENTS.length} agents available</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.primary + '18' }]}>
          <View style={[styles.onlineDot, { backgroundColor: STATUS_COLOR.online }]} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>{onlineCount} Online</Text>
        </View>
      </View>

      {/* Agents grid */}
      <FlatList
        data={AGENTS}
        keyExtractor={item => item.id}
        renderItem={renderAgent}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.listContent, { paddingBottom: isWeb ? 34 : insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Chat Agent Modal ── */}
      <Modal visible={!!selectedAgent} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeAgent}>
        {selectedAgent && (
          <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, {
              paddingTop: isWeb ? 67 : insets.top + 12,
              borderBottomColor: colors.border,
            }]}>
              <TouchableOpacity onPress={closeAgent} style={[styles.iconBtn, { backgroundColor: colors.secondary }]}>
                <Ionicons name="chevron-down" size={20} color={colors.foreground} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {selectedAgent.emoji} {selectedAgent.name}
                </Text>
                <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>{selectedAgent.specialty}</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[selectedAgent.status], width: 10, height: 10, borderRadius: 5 }]} />
            </View>

            <FlatList
              data={messages}
              keyExtractor={item => item.id}
              renderItem={({ item }) =>
                item.isUser ? (
                  <View style={styles.userMsgWrap}>
                    <View style={[styles.userBubble, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.msgText, { color: colors.primaryForeground }]}>{item.text}</Text>
                      <Text style={[styles.timeText, { color: colors.primaryForeground, opacity: 0.6 }]}>{item.time}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.aiBubbleWrap}>
                    <View style={[styles.aiAvatar, { backgroundColor: colors.secondary }]}>
                      <Text style={{ fontSize: 14 }}>{selectedAgent.emoji}</Text>
                    </View>
                    <View style={[styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
                      <Text style={[styles.msgText, { color: colors.foreground }]}>{item.text}</Text>
                      <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{item.time}</Text>
                    </View>
                  </View>
                )
              }
              contentContainerStyle={styles.msgList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />

            {isLoading && (
              <View style={[styles.typingRow, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.typingText, { color: colors.mutedForeground }]}>{selectedAgent.name} is researching...</Text>
              </View>
            )}

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[styles.inputArea, { borderTopColor: colors.border, paddingBottom: isWeb ? 20 : insets.bottom + 8 }]}
            >
              <View style={[styles.inputRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <TextInput
                  ref={inputRef}
                  style={[styles.textInput, { color: colors.foreground }]}
                  placeholder={`Ask ${selectedAgent.name}...`}
                  placeholderTextColor={colors.mutedForeground}
                  value={input}
                  onChangeText={setInput}
                  multiline
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  style={[styles.sendBtn, { backgroundColor: input.trim() && !isLoading ? colors.primary : colors.secondary }]}
                >
                  <Ionicons name="send" size={16} color={input.trim() && !isLoading ? colors.primaryForeground : colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        )}
      </Modal>

      {/* ── Social Post Creator Modal ── */}
      <Modal visible={socialVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSocialVisible(false)}>
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, {
            paddingTop: isWeb ? 67 : insets.top + 12,
            borderBottomColor: colors.border,
          }]}>
            <TouchableOpacity onPress={() => setSocialVisible(false)} style={[styles.iconBtn, { backgroundColor: colors.secondary }]}>
              <Ionicons name="chevron-down" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>✍️ Social Post Creator</Text>
              <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>Islamic posts with Google images</Text>
            </View>
          </View>

          {/* Topic input bar */}
          <View style={[styles.socialInputBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
            <TextInput
              ref={socialInputRef}
              style={[styles.socialInput, { color: colors.foreground }]}
              placeholder="موضوع لکھیں — مثلاً: نماز، رمضان، صدقہ..."
              placeholderTextColor={colors.mutedForeground}
              value={socialTopic}
              onChangeText={setSocialTopic}
              onSubmitEditing={handleGeneratePost}
              returnKeyType="send"
              editable={!generating}
            />
            <TouchableOpacity
              onPress={handleGeneratePost}
              disabled={!socialTopic.trim() || generating}
              style={[styles.generateBtn, {
                backgroundColor: socialTopic.trim() && !generating ? colors.primary : colors.secondary,
              }]}
            >
              {generating
                ? <ActivityIndicator size="small" color={colors.primaryForeground} />
                : <Ionicons name="sparkles" size={18} color={socialTopic.trim() ? colors.primaryForeground : colors.mutedForeground} />
              }
            </TouchableOpacity>
          </View>

          {/* Posts feed */}
          {socialPosts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="share-social-outline" size={48} color={colors.mutedForeground} style={{ opacity: 0.4 }} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>پوسٹ بنائیں</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                اوپر موضوع لکھ کر اسپارکل بٹن دبائیں۔{'\n'}AI پوسٹ لکھے گا اور تصویر بھی لائے گا۔
              </Text>
            </View>
          ) : (
            <FlatList
              data={socialPosts}
              keyExtractor={item => item.id}
              renderItem={renderSocialPost}
              contentContainerStyle={[styles.feedContent, { paddingBottom: isWeb ? 34 : insets.bottom + 16 }]}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  headerSub:   { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  badge:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText:   { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  onlineDot:   { width: 6, height: 6, borderRadius: 3 },
  listContent: { paddingHorizontal: 11, paddingTop: 16 },
  row: { justifyContent: 'space-between' },

  agentCard: { flex: 1, margin: 5, borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  agentCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  agentIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  agentName: { fontSize: 13, fontFamily: 'Poppins_700Bold' },
  agentSpecialty: { fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 16 },
  chatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start' },
  chatBtnText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },

  // Chat modal
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  iconBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  modalSub:   { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  msgList: { padding: 16, gap: 14 },
  userMsgWrap: { alignItems: 'flex-end' },
  userBubble:  { maxWidth: '78%', borderRadius: 16, borderBottomRightRadius: 4, padding: 12 },
  aiBubbleWrap: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  aiAvatar:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  aiBubble:  { borderRadius: 16, borderBottomLeftRadius: 4, padding: 12, borderWidth: 1 },
  msgText:   { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22 },
  timeText:  { fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 4 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  typingText: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  inputArea:  { borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 16 },
  inputRow:   { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  textInput:  { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', maxHeight: 100, padding: 0 },
  sendBtn:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Social post modal
  socialInputBar: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1 },
  socialInput:    { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', padding: 8 },
  generateBtn:    { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  feedContent:    { padding: 12, gap: 14 },
  emptyState:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyTitle:     { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  emptyDesc:      { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22 },

  // Facebook-style post card
  fbCard:   { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 2 },
  fbHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  fbAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  fbAvatarText: { fontSize: 18, color: '#fff', fontFamily: 'Poppins_700Bold' },
  fbName:   { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  fbTime:   { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  fbPostText: { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 24, paddingHorizontal: 12, paddingBottom: 12, textAlign: 'right' },
  fbImage:  { width: '100%', height: 220 },
  fbSep:    { height: 1, marginHorizontal: 12, marginTop: 10 },
  fbActions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, paddingHorizontal: 4 },
  fbActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12 },
  fbActionText: { fontSize: 13, fontFamily: 'Poppins_500Medium' },
});
