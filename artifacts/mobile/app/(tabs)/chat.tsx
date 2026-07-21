import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { sendChatMessage, type ChatMessage } from '@/services/groqApi';
import { useApp, type ChatPreviewMessage } from '@/context/AppContext';

const LANG_LABEL: Record<string, string> = { auto: '🌐 Auto', ur: '🇵🇰 اردو', ar: '🇸🇦 عربي', en: '🇬🇧 EN' };

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  time: string;
  sender?: string;
  error?: boolean;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '0',
    text: 'Assalamu Alaikum! میں آپ کا اسلامی معاون ہوں۔ قرآن، حدیث، فقہ اور اسلامی زندگی کے بارے میں کوئی بھی سوال پوچھیں۔\n\nبِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    isUser: false,
    time: 'Just now',
    sender: 'Islamic Assistant',
  },
];

// Rotating suggested questions — cycle every 4 seconds
const SUGGESTED_QUESTIONS = [
  ['نماز قضا کا طریقہ؟', 'زکوٰۃ کب فرض ہے؟', 'روزے کی نیت'],
  ['کرپٹو حلال ہے؟', 'غیبت کا کفارہ', 'طلاق کے مسائل'],
  ['حج کی شرائط', 'سود کا حکم', 'نکاح کے آداب'],
  ['وتر کی رکعات', 'قرضہ معاف کرنا', 'حلال کھانا'],
];

let msgCounter = 1;

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const { fontSize, language, saveChatSession } = useApp();

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggIdx, setSuggIdx] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const apiHistory = useRef<ChatMessage[]>([]);

  const baseFontSize = fontSize === 'small' ? 13 : fontSize === 'large' ? 16 : 14.5;

  // Rotate suggested questions every 4s
  useEffect(() => {
    const t = setInterval(() => setSuggIdx(i => (i + 1) % SUGGESTED_QUESTIONS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const userMsg: Message = {
        id: `${Date.now()}-${msgCounter++}`,
        text: text.trim(),
        isUser: true,
        time: getTime(),
      };
      setMessages(prev => [userMsg, ...prev]);
      setInput('');
      setIsLoading(true);

      apiHistory.current = [...apiHistory.current, { role: 'user', content: text.trim() }];

      try {
        const content = await sendChatMessage(apiHistory.current, false, language);
        apiHistory.current = [...apiHistory.current, { role: 'assistant', content }];

        const aiMsg: Message = {
          id: `${Date.now()}-${msgCounter++}`,
          text: content,
          isUser: false,
          time: getTime(),
          sender: 'Islamic Assistant',
        };
        setMessages(prev => [aiMsg, ...prev]);
      } catch (err) {
        const errMsg: Message = {
          id: `${Date.now()}-${msgCounter++}`,
          text: 'AI سے رابطہ نہیں ہو سکا۔ انٹرنیٹ چیک کریں اور دوبارہ کوشش کریں۔',
          isUser: false,
          time: getTime(),
          sender: 'System',
          error: true,
        };
        setMessages(prev => [errMsg, ...prev]);
        apiHistory.current = apiHistory.current.slice(0, -1);
        Alert.alert('Connection Error', err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, language],
  );

  const clearChat = useCallback(() => {
    Alert.alert('Clear Chat', 'نئی گفتگو شروع کریں؟', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          const userMessages = messages.filter(m => m.isUser);
          if (userMessages.length > 0) {
            const preview: ChatPreviewMessage[] = messages
              .slice(-4).reverse().slice(0, 2)
              .map(m => ({ isUser: m.isUser, content: m.text }));
            saveChatSession({ timestamp: Date.now(), messageCount: messages.length - 1, isMultiAgent: false, preview });
          }
          setMessages(INITIAL_MESSAGES);
          apiHistory.current = [];
        },
      },
    ]);
  }, [messages, saveChatSession]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      if (item.isUser) {
        return (
          <View style={styles.userMsgWrap}>
            <View style={[styles.userBubble, { backgroundColor: colors.primary }]}>
              <Text style={[styles.msgText, { color: colors.primaryForeground, fontSize: baseFontSize }]}>
                {item.text}
              </Text>
              <Text style={[styles.timeText, { color: colors.primaryForeground, opacity: 0.55 }]}>
                {item.time}
              </Text>
            </View>
          </View>
        );
      }
      return (
        <View style={styles.aiBubbleWrap}>
          {/* Avatar */}
          <View style={[
            styles.aiAvatar,
            { backgroundColor: item.error ? colors.destructive + '22' : colors.secondary },
          ]}>
            <Ionicons
              name={item.error ? 'alert-circle' : 'sparkles'}
              size={13}
              color={item.error ? colors.destructive : colors.primary}
            />
          </View>
          {/* Bubble */}
          <View style={styles.aiBubbleInner}>
            {item.sender && (
              <Text style={[styles.sender, { color: colors.primary }]}>{item.sender}</Text>
            )}
            <View style={[
              styles.aiBubble,
              {
                backgroundColor: item.error ? colors.destructive + '11' : colors.card,
                borderColor: item.error ? colors.destructive + '55' : colors.border,
              },
            ]}>
              <Text style={[
                styles.msgText,
                { color: item.error ? colors.destructive : colors.foreground, fontSize: baseFontSize },
              ]}>
                {item.text}
              </Text>
            </View>
            <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{item.time}</Text>
          </View>
        </View>
      );
    },
    [colors, baseFontSize],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 12, borderBottomColor: colors.border }]}>
        <View style={[styles.avatarSmall, { backgroundColor: colors.secondary }]}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Mufti Chat</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {LANG_LABEL[language] ?? '🌐 Auto'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={clearChat}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
        >
          <Ionicons name="trash-outline" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* ── Messages ── */}
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={[styles.msgList, { paddingBottom: 8 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {/* ── Typing indicator ── */}
      {isLoading && (
        <View style={[styles.typingRow, { backgroundColor: colors.background }]}>
          <View style={[styles.aiAvatar, { backgroundColor: colors.secondary }]}>
            <Ionicons name="sparkles" size={13} color={colors.primary} />
          </View>
          <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.dotsRow}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[styles.dot, { backgroundColor: colors.primary, opacity: 0.4 + i * 0.2 }]} />
              ))}
            </View>
            <Text style={[styles.typingText, { color: colors.mutedForeground }]}>
              {'جواب تیار ہو رہا ہے...'}
            </Text>
          </View>
        </View>
      )}

      {/* ── Input area ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.inputArea, {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: isWeb ? 24 : insets.bottom + 10,
        }]}
      >
        {/* Suggested questions — rotating */}
        <View style={styles.suggestionsRow}>
          {SUGGESTED_QUESTIONS[suggIdx].map(q => (
            <TouchableOpacity
              key={q}
              onPress={() => sendMessage(q)}
              style={[styles.suggestionPill, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={10} color={colors.primary} />
              <Text style={[styles.suggestionText, { color: colors.foreground }]} numberOfLines={1}>{q}</Text>
            </TouchableOpacity>
          ))}
          {/* Dot indicators for rotation */}
          <View style={styles.dotIndicators}>
            {SUGGESTED_QUESTIONS.map((_, i) => (
              <View key={i} style={[styles.rotDot, {
                backgroundColor: i === suggIdx ? colors.primary : colors.border,
                width: i === suggIdx ? 12 : 5,
              }]} />
            ))}
          </View>
        </View>

        {/* Text input row */}
        <View style={[styles.inputRow, {
          backgroundColor: colors.card,
          borderColor: input.trim() ? colors.primary : colors.border,
          shadowColor: colors.primary,
          shadowOpacity: input.trim() ? 0.12 : 0,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: input.trim() ? 4 : 1,
        }]}>
          <TextInput
            ref={inputRef}
            style={[styles.textInput, { color: colors.foreground }]}
            placeholder="کوئی بھی شرعی سوال پوچھیں..."
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.8}
            style={[styles.sendBtn, {
              backgroundColor: input.trim() && !isLoading ? colors.primary : colors.secondary,
            }]}
          >
            {isLoading
              ? <ActivityIndicator size="small" color={colors.mutedForeground} />
              : <Ionicons name="arrow-up" size={18} color={input.trim() ? colors.primaryForeground : colors.mutedForeground} />
            }
          </TouchableOpacity>
        </View>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          AI معاون ہے — ذاتی مسائل میں مستند مفتی سے رجوع کریں
        </Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  avatarSmall: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  headerSub: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
  togglePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  toggleLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  iconBtn: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  // Messages
  msgList: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },

  // User bubble
  userMsgWrap: { alignItems: 'flex-end' },
  userBubble: {
    maxWidth: '80%', borderRadius: 20, borderBottomRightRadius: 5,
    paddingHorizontal: 14, paddingVertical: 10,
  },

  // AI bubble — ChatGPT-style: full width, minimal chrome
  aiBubbleWrap: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  aiBubbleInner: { flex: 1, gap: 3 },
  sender: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.2 },
  aiBubble: {
    borderRadius: 16, borderBottomLeftRadius: 5,
    paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1,
  },
  msgText: { fontFamily: 'Poppins_400Regular', lineHeight: 24 },
  timeText: { fontSize: 10, fontFamily: 'Poppins_400Regular' },

  // Typing
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 6 },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1,
  },
  dotsRow: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  typingText: { fontSize: 12, fontFamily: 'Poppins_400Regular' },

  // Input area
  inputArea: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 14,
    gap: 10,
  },

  // Suggestions
  suggestionsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 7, alignItems: 'center',
  },
  suggestionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: 14, borderWidth: 1,
  },
  suggestionText: { fontSize: 11, fontFamily: 'Poppins_500Medium', maxWidth: 90 },
  dotIndicators: { flexDirection: 'row', gap: 4, alignItems: 'center', marginLeft: 4 },
  rotDot: { height: 5, borderRadius: 3 },

  // Input row
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    borderRadius: 18, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 8, gap: 8,
  },
  textInput: {
    flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular',
    maxHeight: 110, padding: 0, lineHeight: 22,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  disclaimer: {
    fontSize: 10, fontFamily: 'Poppins_400Regular',
    textAlign: 'center', opacity: 0.6,
  },
});
