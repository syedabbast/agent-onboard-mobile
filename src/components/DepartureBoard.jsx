import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import * as haptics from '../lib/haptics';

const STATUS_LABELS = {
  pending: 'BOARDING',
  approved: 'IN FLIGHT',
  declined: 'CANCELLED',
  revoked: 'TERMINATED',
  active: 'ACTIVE',
};

function LiveDot() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.liveDot, { opacity }]} />;
}

export default function DepartureBoard({ connections, myAgentId, onPress }) {
  if (!connections || connections.length === 0) return null;

  return (
    <View style={styles.board}>
      <View style={styles.boardHeader}>
        <Text style={styles.boardTitle}>DEPARTURES</Text>
        <View style={styles.liveContainer}>
          <LiveDot />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.columnHeaders}>
        <Text style={[styles.colHeader, styles.colAgent]}>AGENT</Text>
        <Text style={[styles.colHeader, styles.colDest]}>DEST</Text>
        <Text style={[styles.colHeader, styles.colStatus]}>STATUS</Text>
      </View>

      {connections.map((conn) => {
        const isRequester = conn.requester_agent_id === myAgentId;
        const otherAgent = isRequester ? conn.target_agent : conn.requester_agent;
        const agentName = otherAgent?.name || 'Unknown';
        const dest = otherAgent?.company
          ? otherAgent.company.substring(0, 3).toUpperCase()
          : 'UNK';
        const statusLabel = STATUS_LABELS[conn.status] || conn.status;

        return (
          <TouchableOpacity
            key={conn.id}
            style={styles.row}
            onPress={() => {
              haptics.light();
              if (onPress) onPress(conn);
            }}
            activeOpacity={0.6}
          >
            <Text style={[styles.rowText, styles.colAgent]} numberOfLines={1}>
              {agentName}
            </Text>
            <Text style={[styles.rowText, styles.colDest]}>{dest}</Text>
            <Text
              style={[
                styles.rowText,
                styles.colStatus,
                conn.status === 'approved' && styles.statusActive,
                conn.status === 'pending' && styles.statusPending,
                conn.status === 'declined' && styles.statusDeclined,
                conn.status === 'revoked' && styles.statusRevoked,
              ]}
            >
              {statusLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: COLORS.navy,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    padding: SPACING.md,
  },
  boardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  boardTitle: {
    ...FONTS.mono,
    color: COLORS.amber,
    fontSize: 12,
    letterSpacing: 3,
  },
  liveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },
  liveText: {
    ...FONTS.mono,
    color: COLORS.green,
    fontSize: 10,
  },
  columnHeaders: {
    flexDirection: 'row',
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: SPACING.xs,
  },
  colHeader: {
    ...FONTS.label,
    color: COLORS.muted,
    fontSize: 9,
  },
  colAgent: {
    flex: 2,
  },
  colDest: {
    flex: 1,
    textAlign: 'center',
  },
  colStatus: {
    flex: 1.5,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowText: {
    ...FONTS.mono,
    color: COLORS.white,
    fontSize: 13,
  },
  statusActive: {
    color: COLORS.green,
  },
  statusPending: {
    color: COLORS.amber,
  },
  statusDeclined: {
    color: COLORS.muted,
  },
  statusRevoked: {
    color: COLORS.red,
  },
});
