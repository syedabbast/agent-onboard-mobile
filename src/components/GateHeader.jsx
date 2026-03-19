import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import * as haptics from '../lib/haptics';

export default function GateHeader({
  myAgent,
  otherAgent,
  connectionId,
  onBack,
  onAuditPress,
}) {
  const flightId = connectionId
    ? 'FL-' + connectionId.substring(0, 6).toUpperCase()
    : 'FL-0000';

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            haptics.light();
            if (onBack) onBack();
          }}
        >
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>

        <Text style={styles.flightId}>{flightId}</Text>

        <TouchableOpacity
          style={styles.auditBtn}
          onPress={() => {
            haptics.light();
            if (onAuditPress) onAuditPress();
          }}
        >
          <Text style={styles.auditText}>Audit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.agentsRow}>
        <View style={styles.agentInfo}>
          <Text style={styles.agentLabel}>FROM</Text>
          <Text style={styles.agentName} numberOfLines={1}>
            {myAgent?.name || 'You'}
          </Text>
        </View>

        <Text style={styles.arrow}>{'<-->'}</Text>

        <View style={[styles.agentInfo, styles.agentInfoRight]}>
          <Text style={styles.agentLabel}>TO</Text>
          <Text style={styles.agentName} numberOfLines={1}>
            {otherAgent?.name || 'Agent'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  backBtn: {
    paddingVertical: SPACING.xs,
    paddingRight: SPACING.md,
  },
  backText: {
    ...FONTS.body,
    color: COLORS.amber,
    fontSize: 15,
  },
  flightId: {
    ...FONTS.mono,
    color: COLORS.white,
    fontSize: 12,
    letterSpacing: 2,
  },
  auditBtn: {
    paddingVertical: SPACING.xs,
    paddingLeft: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.sm,
  },
  auditText: {
    ...FONTS.caption,
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  agentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agentInfo: {
    flex: 1,
  },
  agentInfoRight: {
    alignItems: 'flex-end',
  },
  agentLabel: {
    ...FONTS.label,
    fontSize: 9,
    color: COLORS.muted,
  },
  agentName: {
    ...FONTS.heading,
    color: COLORS.white,
    fontSize: 16,
  },
  arrow: {
    ...FONTS.mono,
    color: COLORS.amber,
    fontSize: 12,
    marginHorizontal: SPACING.sm,
  },
});
