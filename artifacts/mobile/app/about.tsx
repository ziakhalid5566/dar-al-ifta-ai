import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const FEATURES = [
  { icon: 'chatbubble-ellipses-outline' as const, title: 'AI Mufti Chat',      desc: 'اسلامی سوالات کا فوری جواب'           },
  { icon: 'git-network-outline'          as const, title: 'ماہر ایجنٹس',        desc: '6 specialist scholars for every topic' },
  { icon: 'book-outline'                 as const, title: 'فتویٰ لائبریری',     desc: 'Categorised Islamic rulings'           },
  { icon: 'heart-outline'                as const, title: 'Saved Fatwas',       desc: 'آف لائن محفوظ کریں'                    },
  { icon: 'globe-outline'               as const, title: 'تین زبانیں',         desc: 'Urdu · Arabic · English'               },
  { icon: 'moon-outline'                as const, title: 'Light & Dark Mode',  desc: 'آنکھوں کے لیے آرام دہ'               },
];

const TEAM = [
  { name: 'Zia Ullah',        role: 'Founder & Developer', icon: 'code-slash-outline' as const },
  { name: 'Islamic Scholars', role: 'Content Advisors',     icon: 'school-outline'      as const },
];

export default function AboutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>About</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 40 : insets.bottom + 28 }]}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
            <Ionicons name="sparkles" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.heroName, { color: colors.foreground }]}>Dar Al-Ifta AI</Text>
          <Text style={[styles.heroAr, { color: colors.primary }]}>دار الإفتاء</Text>
          <Text style={[styles.heroTagline, { color: colors.mutedForeground }]}>
            Authentic Shariah Guidance — اسلامی رہنمائی
          </Text>
          <View style={[styles.versionBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.versionText, { color: colors.primary }]}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Mission */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="flag-outline" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>ہمارا مقصد</Text>
          </View>
          <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>
            {'دار الإفتاء AI کا مقصد جدید مسائل میں مستند علمی رہنمائی فراہم کرنا ہے۔ ہم چاہتے ہیں کہ ہر مسلمان کو اپنی زبان میں، اپنے وقت پر، معتبر اسلامی فتاویٰ تک رسائی ہو۔\n\nOur mission is to make authentic Islamic scholarship accessible to every Muslim — in their language, at any time.'}
          </Text>
        </View>

        {/* Features */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>خصوصیات</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {FEATURES.map((f, i) => (
            <View
              key={f.title}
              style={[
                styles.featureRow,
                { borderBottomColor: colors.border, borderBottomWidth: i < FEATURES.length - 1 ? StyleSheet.hairlineWidth : 0 },
              ]}
            >
              <View style={[styles.featureIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name={f.icon} size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Team */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ٹیم</Text>
        <View style={styles.teamRow}>
          {TEAM.map((t) => (
            <View key={t.name} style={[styles.teamCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.teamIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name={t.icon} size={22} color={colors.primary} />
              </View>
              <Text style={[styles.teamName, { color: colors.foreground }]}>{t.name}</Text>
              <Text style={[styles.teamRole, { color: colors.mutedForeground }]}>{t.role}</Text>
            </View>
          ))}
        </View>

        {/* Links */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>روابط</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: 'logo-github'       as const, label: 'GitHub Repository',  url: 'https://github.com/ziakhalid5566/dar-al-ifta-ai' },
            { icon: 'mail-outline'      as const, label: 'Contact / Support',   url: 'mailto:ziakhalid5566@gmail.com' },
            { icon: 'document-text-outline' as const, label: 'Privacy Policy',  url: null },
          ].map((link, i, arr) => (
            <TouchableOpacity
              key={link.label}
              onPress={() => {
                if (link.url) Linking.openURL(link.url);
                else router.push('/privacy-policy');
              }}
              style={[
                styles.linkRow,
                { borderBottomColor: colors.border, borderBottomWidth: i < arr.length - 1 ? StyleSheet.hairlineWidth : 0 },
              ]}
              activeOpacity={0.7}
            >
              <View style={[styles.featureIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name={link.icon} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.linkLabel, { color: colors.foreground }]}>{link.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Disclaimer */}
        <View style={[styles.disclaimer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
            This app provides Islamic guidance for informational purposes. For critical matters, always consult a qualified scholar.
          </Text>
        </View>

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          دار الإفتاء AI • Made with ♡ for the Ummah
        </Text>
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
  headerTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold' },
  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 0 },
  // Hero
  hero: {
    alignItems: 'center', padding: 28, borderRadius: 16, borderWidth: 1,
    marginBottom: 20, gap: 6,
  },
  heroIcon: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroName: { fontSize: 22, fontFamily: 'Poppins_700Bold' },
  heroAr: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  heroTagline: { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 20 },
  versionBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 6 },
  versionText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  // Section
  sectionLabel: {
    fontSize: 11, fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 8, marginTop: 4, paddingLeft: 4,
  },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 20, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 10 },
  cardIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  cardBody: { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 21, paddingHorizontal: 14, paddingBottom: 14 },
  // Features
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  featureIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  featureDesc: { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  // Team
  teamRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  teamCard: {
    flex: 1, borderRadius: 14, borderWidth: 1, padding: 16,
    alignItems: 'center', gap: 6,
  },
  teamIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  teamName: { fontSize: 13, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  teamRole: { fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  // Links
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  linkLabel: { flex: 1, fontSize: 14, fontFamily: 'Poppins_500Medium' },
  // Disclaimer
  disclaimer: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16,
  },
  disclaimerText: { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  footer: { textAlign: 'center', fontSize: 12, fontFamily: 'Poppins_400Regular', paddingBottom: 4 },
});
