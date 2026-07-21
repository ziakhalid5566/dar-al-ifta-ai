import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export interface Agent {
  id: string;
  name: string;
  specialty: string;
  status: 'online' | 'offline' | 'busy';
  icon: keyof typeof Ionicons.glyphMap;
}

const STATUS_COLOR: Record<Agent['status'], string> = {
  online: '#22C55E',
  busy: '#F59E0B',
  offline: '#6B7280',
};

export default function AgentCard({ agent }: { agent: Agent }) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
        <Ionicons name={agent.icon} size={22} color={colors.primary} />
      </View>
      <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
        {agent.name}
      </Text>
      <Text style={[styles.spec, { color: colors.mutedForeground }]} numberOfLines={2}>
        {agent.specialty}
      </Text>
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: STATUS_COLOR[agent.status] }]} />
        <Text style={[styles.statusText, { color: STATUS_COLOR[agent.status] }]}>
          {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    margin: 5,
    borderWidth: 1,
    gap: 6,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 18,
  },
  spec: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: 'Poppins_500Medium' },
});
