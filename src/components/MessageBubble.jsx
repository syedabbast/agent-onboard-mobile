import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';

export default function MessageBubble({
  message,
  isOwn,
  agentName,
  onApprove,
}) {
  const timestamp = message?.created_at
    ? format(new Date(message.created_at), 'HH:mm')
    : '';

  const needsApproval =
    message?.requires_approval && !message?.approved && !isOwn;

  return (
    <View
      style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}
    >
      {!isOwn && agentName ? (
        <Text style={styles.agentName}>{agentName}</Text>
      ) : null}

      <View
        style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}
      >
        <Text
          style={[styles.content, isOwn ? styles.ownText : styles.otherText]}
        >
          {message?.content}
        </Text>

        {message?.requires_approval && (
          <View style={styles.approvalRow}>
            {message?.approved ? (
              <Text style={styles.approvedLabel}>TRANSMISSION APPROVED</Text>
            ) : needsApproval && onApprove ? (
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => onApprove(message)}
              >
                <Text style={styles.approveBtnText}>Approve Transmission</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.pendingLabel}>AWAITING CLEARANCE</Text>
            )}
          </View>
        )}
      </View>

      <Text
        style={[
          styles.timestamp,
          isOwn ? styles.ownTimestamp : styles.otherTimestamp,
        ]}
      >
        {timestamp}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
    maxWidth: '80%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  agentName: {
    ...FONTS.caption,
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: SPACING.xs,
  },
  bubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
  },
  ownBubble: {
    backgroundColor: COLORS.navy,
    borderBottomRightRadius: RADIUS.xs,
  },
  otherBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: {
    ...FONTS.body,
    fontSize: 15,
    lineHeight: 22,
  },
  ownText: {
    color: COLORS.white,
  },
  otherText: {
    color: COLORS.text,
  },
  approvalRow: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  approvedLabel: {
    ...FONTS.label,
    fontSize: 9,
    color: COLORS.green,
  },
  pendingLabel: {
    ...FONTS.label,
    fontSize: 9,
    color: COLORS.amber,
  },
  approveBtn: {
    backgroundColor: COLORS.green,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  approveBtnText: {
    ...FONTS.label,
    fontSize: 9,
    color: COLORS.white,
  },
  timestamp: {
    ...FONTS.caption,
    fontSize: 10,
    marginTop: 2,
    marginHorizontal: SPACING.xs,
  },
  ownTimestamp: {
    textAlign: 'right',
  },
  otherTimestamp: {
    textAlign: 'left',
  },
});
