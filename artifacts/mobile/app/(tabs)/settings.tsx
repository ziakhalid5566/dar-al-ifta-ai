import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp, type AppLanguage } from '@/context/AppContext';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

// ─── Language options ───────────────────────────────────────────────────────
const LANGUAGES: { value: AppLanguage; label: string; native: string; flag: string }[] = [
  { value: 'auto', label: 'Auto Detect', native: 'خودکار', flag: '🌐' },
  { value: 'ur',   label: 'Urdu',        native: 'اردو',   flag: '🇵🇰' },
  { value: 'ar',   label: 'Arabic',      native: 'العربية', flag: '🇸🇦' },
  { value: 'en',   label: 'English',     native: 'English', flag: '🇬🇧' },
];

// ─── Sub-components ─────────────────────────────────────────────────────────
interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
  showChevron?: boolean;
}

function SettingRow({
  icon, title, subtitle, onPress, rightElement, destructive, showChevron = true,
}: SettingRowProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: destructive ? '#FEE2E2' : colors.secondary }]}>
        <Ionicons name={icon} size={18} color={destructive ? colors.destructive : colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: destructive ? colors.destructive : colors.foreground }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
        ) : null}
      </View>
      {rightElement ?? (showChevron && onPress ? (
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      ) : null)}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>{title}</Text>;
}

// ─── Language Picker Modal ──────────────────────────────────────────────────
function LanguageModal({
  visible, current, onSelect, onClose,
}: {
  visible: boolean; current: AppLanguage; onSelect: (l: AppLanguage) => void; onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Response Language</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={[styles.modalNote, { color: colors.mutedForeground }]}>
          Select the language for Islamic guidance responses. "Auto Detect" matches the language you write in.
        </Text>

        <View style={[styles.langList, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {LANGUAGES.map((lang, i) => {
            const isActive = current === lang.value;
            return (
              <TouchableOpacity
                key={lang.value}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(lang.value);
                  onClose();
                }}
                style={[
                  styles.langRow,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: i < LANGUAGES.length - 1 ? StyleSheet.hairlineWidth : 0,
                    backgroundColor: isActive ? colors.secondary : 'transparent',
                  },
                ]}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.langLabel, { color: colors.foreground }]}>{lang.label}</Text>
                  <Text style={[styles.langNative, { color: colors.mutedForeground }]}>{lang.native}</Text>
                </View>
                {isActive && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

// ─── Notification Settings Modal ─────────────────────────────────────────────
const NOTIFICATION_ITEMS = [
  { key: 'prayer',  icon: 'time-outline' as const,          title: 'Prayer Time Reminders', subtitle: 'اوقات نماز کی اطلاع',       defaultOn: true  },
  { key: 'fatwa',   icon: 'book-outline' as const,           title: 'Daily Fatwa',           subtitle: 'روزانہ ایک فتویٰ',          defaultOn: true  },
  { key: 'tip',     icon: 'bulb-outline' as const,           title: 'Weekly Islamic Tip',    subtitle: 'ہفتہ وار اسلامی نصیحت',   defaultOn: false },
  { key: 'updates', icon: 'notifications-outline' as const,  title: 'App Updates',           subtitle: 'نئی خصوصیات کی اطلاع',   defaultOn: false },
];

function NotificationModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIFICATION_ITEMS.map((n) => [n.key, n.defaultOn])),
  );

  const toggle = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const save = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    Alert.alert('محفوظ ہوگیا', 'نوٹیفکیشن ترجیحات محفوظ کر دی گئی ہیں۔');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
          {/* Icon banner */}
          <View style={[styles.notifBanner, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Ionicons name="notifications" size={32} color={colors.primary} />
            <Text style={[styles.notifBannerTitle, { color: colors.foreground }]}>اطلاعات کی ترجیحات</Text>
            <Text style={[styles.notifBannerSub, { color: colors.mutedForeground }]}>
              منتخب کریں کہ آپ کون سی اطلاعات حاصل کرنا چاہتے ہیں
            </Text>
          </View>

          {/* Toggle rows */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {NOTIFICATION_ITEMS.map((item, i) => (
              <View
                key={item.key}
                style={[
                  styles.row,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: i < NOTIFICATION_ITEMS.length - 1 ? StyleSheet.hairlineWidth : 0,
                  },
                ]}
              >
                <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
                  <Ionicons name={item.icon} size={18} color={colors.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{item.subtitle}</Text>
                </View>
                <Switch
                  value={prefs[item.key]}
                  onValueChange={() => toggle(item.key)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.card}
                />
              </View>
            ))}
          </View>

          {/* Save button */}
          <TouchableOpacity
            onPress={save}
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={18} color={colors.primaryForeground} />
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>محفوظ کریں</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const { darkMode, toggleDarkMode, fontSize, setFontSize, language, setLanguage, favorites, clearAllData } = useApp();
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.value === language) ?? LANGUAGES[0];

  const nextFontSize = (): 'small' | 'medium' | 'large' => {
    if (fontSize === 'small') return 'medium';
    if (fontSize === 'medium') return 'large';
    return 'small';
  };

  const handleClearCache = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Clear Cache',
      `This will remove all ${favorites.length} saved favorites and reset cached data. Settings will be kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Done', 'Cache cleared successfully.');
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 34 + 84 : insets.bottom + 90 }]}
      >
        {/* Profile */}
        <View style={[styles.profile, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
            <Ionicons name="sparkles" size={28} color={colors.primary} />
          </View>
          <View style={styles.profileText}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>Dar Al-Ifta AI</Text>
            <View style={[styles.premiumBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.premiumText, { color: colors.primaryForeground }]}>
                Authentic Islamic Guidance
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </View>

        {/* Application Settings */}
        <SectionHeader title="Application Settings" />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="globe"
            title="Response Language"
            subtitle={`${currentLang.flag} ${currentLang.label} (${currentLang.native})`}
            onPress={() => setLangModalVisible(true)}
            rightElement={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.rightValue, { color: colors.mutedForeground }]}>
                  {currentLang.flag} {currentLang.label}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </View>
            }
          />
          <SettingRow
            icon="heart"
            title="Saved Fatwas"
            subtitle={`${favorites.length} fatwas saved`}
            onPress={() => router.push('/(tabs)/favorites')}
          />
          <SettingRow
            icon="shield-checkmark"
            title="Security & Privacy"
            subtitle="Data Protection"
            onPress={() => router.push('/privacy-policy')}
          />
          <SettingRow
            icon="notifications"
            title="Notifications"
            subtitle="Manage Alerts & Reminders"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setNotifModalVisible(true);
            }}
          />
          <SettingRow
            icon="document-text"
            title="Privacy Policy"
            subtitle="How we handle your data"
            onPress={() => router.push('/privacy-policy')}
          />
          <SettingRow
            icon="information-circle"
            title="About Dar Al-Ifta AI"
            subtitle="Version 1.0.0 — دار الإفتاء"
            onPress={() => router.push('/about')}
          />
        </View>

        {/* Modern Features */}
        <SectionHeader title="Display" />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="moon"
            title="Dark Mode"
            subtitle="Easy on the eyes"
            showChevron={false}
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleDarkMode();
                }}
                thumbColor={darkMode ? colors.primaryForeground : '#ccc'}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            }
          />
          <SettingRow
            icon="text"
            title="Font Size"
            subtitle="Adjust text size for readability"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFontSize(nextFontSize());
            }}
            rightElement={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.rightValue, { color: colors.primary }]}>
                  {fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </View>
            }
          />
          <SettingRow icon="time" title="Chat History" subtitle="View your past conversations" onPress={() => router.push('/chat-history')} />
          <SettingRow
            icon="trash"
            title="Clear Cache"
            subtitle={`Clear ${favorites.length} saved items`}
            onPress={handleClearCache}
          />
        </View>
      </ScrollView>

      {/* Language Modal */}
      <LanguageModal
        visible={langModalVisible}
        current={language}
        onSelect={setLanguage}
        onClose={() => setLangModalVisible(false)}
      />

      {/* Notification Modal */}
      <NotificationModal
        visible={notifModalVisible}
        onClose={() => setNotifModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  scroll: { paddingHorizontal: 16, paddingTop: 20 },
  profile: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 24,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  profileText: { flex: 1, gap: 6 },
  profileName: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  premiumBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 6 },
  premiumText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeader: {
    fontSize: 11, fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 8, marginTop: 4, paddingLeft: 4,
  },
  section: { borderRadius: 14, borderWidth: 1, marginBottom: 24, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13, gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  rowSub: { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  rightValue: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  // Modal
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  modalNote: {
    fontSize: 13, fontFamily: 'Poppins_400Regular',
    lineHeight: 20, paddingHorizontal: 16, paddingVertical: 16,
  },
  langList: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  langRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 14,
  },
  langFlag: { fontSize: 28 },
  langLabel: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  langNative: { fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  // Notification modal
  notifBanner: {
    alignItems: 'center', padding: 20, borderRadius: 14, borderWidth: 1, gap: 6,
  },
  notifBannerTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', marginTop: 4 },
  notifBannerSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 18 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 12,
  },
  saveBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
});
