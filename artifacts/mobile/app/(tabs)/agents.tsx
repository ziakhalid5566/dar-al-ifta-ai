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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { sendAgentMessage, type ChatMessage } from '@/services/groqApi';
import { useApp } from '@/context/AppContext';

interface Agent {
  id: string;
  name: string;
  specialty: string;
  status: 'online' | 'busy' | 'offline';
  icon: string;
  emoji: string;
}

interface AgentMessage {
  id: string;
  text: string;
  isUser: boolean;
  time: string;
}

const AGENTS: Agent[] = [
  { id: '1', name: 'Quran Researcher', specialty: 'Quranic Studies & Tafsir', status: 'online', icon: 'book', emoji: '📖' },
  { id: '2', name: 'Hadith Verifier', specialty: 'Verify Hadith Authenticity', status: 'online', icon: 'shield-checkmark', emoji: '🛡️' },
  { id: '3', name: 'Fiqh Coordinator', specialty: 'Islamic Jurisprudence Expert', status: 'online', icon: 'hammer', emoji: '⚖️' },
  { id: '4', name: 'Fatwa Analyst', specialty: 'Analyzes Contemporary Fatwas', status: 'busy', icon: 'analytics', emoji: '📊' },
  { id: '5', name: 'Arabic Linguist', specialty: 'Arabic Language Specialist', status: 'online', icon: 'text', emoji: '🔤' },
  { id: '6', name: 'Legal Advisor', specialty: 'Islamic Legal Expertise', status: 'online', icon: 'briefcase', emoji: '📋' },
];

const STATUS_COLOR: Record<Agent['status'], string> = {
  online: '#22C55E',
  busy: '#F59E0B',
  offline: '#6B7280',
};

let msgCounter = 100;
function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AgentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const { language } = useApp();

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const apiHistory = useRef<ChatMessage[]>([]);
  const inputRef = useRef<TextInput>(null);

  const onlineCount = AGENTS.filter((a) => a.status === 'online').length;

  const openAgent = useCallback((agent: Agent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedAgent(agent);
    apiHistory.current = [];
    setMessages([
      {
        id: `welcome-${agent.id}`,
        text: `Assalamu Alaikum! I am the ${agent.name} ${agent.emoji}. I specialize in ${agent.specialty}. How can I assist you today?`,
        isUser: false,
        time: getTime(),
      },
    ]);
    setInput('');
  }, []);

  const closeAgent = useCallback(() => {
    setSelectedAgent(null);
    setMessages([]);
    apiHistory.current = [];
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || !selectedAgent) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: AgentMessage = {
      id: `${Date.now()}-${msgCounter++}`,
      text: text.trim(),
      isUser: true,
      time: getTime(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    apiHistory.current = [...apiHistory.current, { role: 'user', content: text.trim() }];

    try {
      const content = await sendAgentMessage(
        selectedAgent.id,
        selectedAgent.name,
        selectedAgent.specialty,
        apiHistory.current,
        language,
      );
      apiHistory.current = [...apiHistory.current, { role: 'assistant', content }];

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${msgCounter++}`,
          text: content,
          isUser: false,
          time: getTime(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          text: 'Connection error. Please try again.',
          isUser: false,
          time: getTime(),
        },
      ]);
      apiHistory.current = apiHistory.current.slice(0, -1);
      Alert.alert('Error', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, selectedAgent]);

  const renderAgentCard = useCallback(
    ({ item }: { item: Agent }) => (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => openAgent(item)}
        style={[styles.agentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.agentCardHeader}>
          <View style={[styles.agentIcon, { backgroundColor: colors.secondary }]}>
            <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[item.status] }]} />
        </View>
        <Text style={[styles.agentName, { color: colors.foreground }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.agentSpecialty, { color: colors.mutedForeground }]} numberOfLines={2}>
          {item.specialty}
        </Text>
        <View style={[styles.chatBtn, { backgroundColor: colors.secondary }]}>
          <Ionicons name="chatbubble-outline" size={12} color={colors.primary} />
          <Text style={[styles.chatBtnText, { color: colors.primary }]}>Chat</Text>
        </View>
      </TouchableOpacity>
    ),
    [colors, openAgent],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: isWeb ? 67 : insets.top + 12, borderBottomColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Agents Hub</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            ماہر علماء سے رہنمائی حاصل کریں
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{onlineCount} آن لائن</Text>
        </View>
      </View>

      <FlatList
        data={AGENTS}
        numColumns={2}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.countRow}>
              <View style={[styles.onlineDot, { backgroundColor: STATUS_COLOR.online }]} />
              <Text style={[styles.countText, { color: colors.foreground }]}>
                {onlineCount} ماہرین دستیاب — Chat کریں
              </Text>
            </View>
          </View>
        }
        renderItem={renderAgentCard}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: isWeb ? 34 + 84 : insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Agent Chat Modal */}
      <Modal
        visible={!!selectedAgent}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeAgent}
      >
        {selectedAgent && (
          <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: isWeb ? 20 : insets.top + 8 }]}>
              <TouchableOpacity onPress={closeAgent} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {selectedAgent.emoji} {selectedAgent.name}
                </Text>
                <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                  {selectedAgent.specialty}
                </Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[selectedAgent.status], width: 10, height: 10, borderRadius: 5 }]} />
            </View>

            {/* Messages */}
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
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

            {/* Typing indicator */}
            {isLoading && (
              <View style={[styles.typingRow, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.typingText, { color: colors.mutedForeground }]}>
                  {selectedAgent.name} is researching...
                </Text>
              </View>
            )}

            {/* Input */}
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
                  style={[
                    styles.sendBtn,
                    { backgroundColor: input.trim() && !isLoading ? colors.primary : colors.secondary },
                  ]}
                >
                  <Ionicons
                    name="send"
                    size={16}
                    color={input.trim() && !isLoading ? colors.primaryForeground : colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  headerSub: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  listContent: { paddingHorizontal: 11, paddingTop: 16 },
  listHeader: { paddingHorizontal: 5, marginBottom: 16 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  countText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  row: { justifyContent: 'space-between' },
  agentCard: {
    flex: 1, margin: 5, borderRadius: 14, borderWidth: 1, padding: 14, gap: 6,
  },
  agentCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  agentIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  agentName: { fontSize: 13, fontFamily: 'Poppins_700Bold' },
  agentSpecialty: { fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 16 },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start',
  },
  chatBtnText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  // Modal styles
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  modalSub: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  msgList: { padding: 16, gap: 14 },
  userMsgWrap: { alignItems: 'flex-end' },
  userBubble: { maxWidth: '78%', borderRadius: 16, borderBottomRightRadius: 4, padding: 12 },
  aiBubbleWrap: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  aiAvatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0,
  },
  aiBubble: { borderRadius: 16, borderBottomLeftRadius: 4, padding: 12, borderWidth: 1 },
  msgText: { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22 },
  timeText: { fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 4 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  typingText: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  inputArea: { borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 16 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 8,
  },
  textInput: { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', maxHeight: 100, padding: 0 },
  sendBtn: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
});
