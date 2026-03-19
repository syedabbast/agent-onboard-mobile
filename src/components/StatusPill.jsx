import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';

const STATUS_MAP = {
  pending: { label: 'AT GATE', bg: COLORS.lightAmber, color: COLORS.amber },
  approved: { label: 'IN FLIGHT', bg: COLORS.lightBlue, color: COLORS.blue },
  declined: { label: 'GATE CLOSED', bg: COLORS.lightGray, color: COLORS.muted },
  revoked: { label: 'TERMINATED', bg: COLORS.lightRed, color: COLORS.red },
  active: { label: 'ACTIVE', bg: COLORS.lightGreen, color: COLORS.green },
};

export default function StatusPill({ status, style }) {
  const config = STATUS_MAP[status] || STATUS_MAP.pending;

  return (
    <View style={[styles.pill, { backgroundColor: config.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    gap: SPACING.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
