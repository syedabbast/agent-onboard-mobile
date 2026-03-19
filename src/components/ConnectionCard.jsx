import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import AgentAvatar from './AgentAvatar';
import StatusPill from './StatusPill';
import * as haptics from '../lib/haptics';

export default function ConnectionCard({
  connection,
  otherAgent,
  onPress,
  onApprove,
  onDecline,
}) {
  if (!otherAgent) return null;

  const timeAgo = connection?.created_at
    ? formatDistanceToNow(new Date(connection.created_at), { addSuffix: true })
    : '';

  const handleApprove = () => {
    haptics.success();
    if (onApprove) onApprove(connection);
  };

  const handleDecline = () => {
    haptics.warning();
    if (onDecline) onDecline(connection);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        haptics.light();
        if (onPress) onPress(connection);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <AgentAvatar
          name={otherAgent.agent_name}
          size={44}
          agentType={otherAgent.agent_type}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.agent_name} numberOfLines={1}>
            {otherAgent.agent_name}
          </Text>
          {otherAgent.company ? (
            <Text style={styles.company} numberOfLines={1}>
              {otherAgent.company}
            </Text>
          ) : null}
        </View>
        <StatusPill status={connection?.status} />
      </View>

      {connection?.purpose ? (
        <Text style={styles.purpose} numberOfLines={2}>
          {connection.purpose}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.time}>{timeAgo}</Text>
        {connection?.status === 'pending' && onApprove && onDecline && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.declineBtn}
              onPress={handleDecline}
            >
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={handleApprove}
            >
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    ...FONTS.heading,
    fontSize: 16,
  },
  company: {
    ...FONTS.caption,
  },
  purpose: {
    ...FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    marginTop: SPACING.sm,
    paddingLeft: 56,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingLeft: 56,
  },
  time: {
    ...FONTS.caption,
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  declineBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  declineBtnText: {
    ...FONTS.caption,
    fontWeight: '600',
    color: COLORS.muted,
  },
  approveBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.green,
  },
  approveBtnText: {
    ...FONTS.caption,
    fontWeight: '600',
    color: COLORS.white,
  },
});
