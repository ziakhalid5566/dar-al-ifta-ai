import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const sections = [
  {
    title: 'Introduction',
    icon: 'information-circle-outline' as const,
    content:
      'Dar Al-Ifta AI ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard information when you use our mobile application.',
  },
  {
    title: 'Information We Collect',
    icon: 'document-text-outline' as const,
    content:
      'We collect minimal data:\n\n• Questions and chat messages you submit — sent to our AI server for processing.\n• Favorites you save — stored locally on your device via AsyncStorage.\n• App preferences (dark mode, font size, language) — stored locally on your device.\n\nWe do NOT collect your name, email, location, or any personally identifiable information.',
  },
  {
    title: 'How We Use Your Data',
    icon: 'shield-checkmark-outline' as const,
    content:
      'Your questions are forwarded to our secure AI server to generate Islamic guidance responses. This processing occurs server-side.\n\nWe do not store your chat history on our servers. Each session starts fresh.',
  },
  {
    title: 'Third-Party Services',
    icon: 'globe-outline' as const,
    content:
      'We use a secure AI service to process your questions and generate scholarly Islamic guidance. No third-party analytics, advertising SDKs, or tracking tools are included in this app.',
  },
  {
    title: 'Data Storage & Security',
    icon: 'lock-closed-outline' as const,
    content:
      'All your preferences and favorites are stored locally on your device using AsyncStorage. They are not synced to any cloud or external server.\n\nCommunication between the app and our AI server is encrypted via HTTPS.',
  },
  {
    title: "Children's Privacy",
    icon: 'happy-outline' as const,
    content:
      'Dar Al-Ifta AI is not directed at children under 13. We do not knowingly collect information from children. If you believe a child has provided information, please contact us.',
  },
  {
    title: 'Your Rights',
    icon: 'person-outline' as const,
    content:
      'Since we store no personal data on our servers, there is nothing to delete from our side. You can clear all locally stored data at any time from Settings → Clear Cache.',
  },
  {
    title: 'Changes to This Policy',
    icon: 'refresh-outline' as const,
    content:
      'We may update this Privacy Policy occasionally. Changes will be reflected with a new "Last updated" date. Continued use of the app after changes constitutes acceptance.',
  },
  {
    title: 'Contact Us',
    icon: 'mail-outline' as const,
    content:
      'For any privacy-related questions or concerns:\n\nEmail: ziakhalid5566@gmail.com\nProject: Dar Al-Ifta AI\ngithub.com/ziakhalid5566/dar-al-ifta-ai',
  },
];

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: isWeb ? 67 : insets.top + 12, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 40 : insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
          <Text style={[styles.badgeTitle, { color: colors.foreground }]}>Your Privacy Matters</Text>
          <Text style={[styles.badgeSub, { color: colors.mutedForeground }]}>
            Last updated: July 2026
          </Text>
        </View>

        {/* Sections */}
        {sections.map((section, i) => (
          <View
            key={i}
            style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
                <Ionicons name={section.icon} size={18} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{section.title}</Text>
            </View>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>
              {section.content}
            </Text>
          </View>
        ))}

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          دار الإفتاء AI — Islamic Guidance Assistant
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold' },
  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 12 },
  badge: {
    alignItems: 'center', padding: 24, borderRadius: 16, borderWidth: 1, gap: 8, marginBottom: 4,
  },
  badgeTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  badgeSub: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', flex: 1 },
  sectionContent: { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 21 },
  footer: {
    textAlign: 'center', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 8, paddingBottom: 4,
  },
});
