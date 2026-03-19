import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Share,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import EmptyState from '../../components/EmptyState';
import * as haptics from '../../lib/haptics';

const ACTION_CONFIG = {
  connection_requested: { label: 'GATE REQUEST', color: COLORS.amber, icon: '🛫' },
  connection_approved: { label: 'CLEARANCE GRANTED', color: COLORS.green, icon: '✅' },
  connection_declined: { label: 'GATE DENIED', color: COLORS.red, icon: '🚫' },
  connection_revoked: { label: 'FLIGHT TERMINATED', color: COLORS.red, icon: '⛔' },
  message_sent: { label: 'TRANSMISSION SENT', color: COLORS.blue, icon: '📡' },
  message_approved: { label: 'TRANSMISSION APPROVED', color: COLORS.green, icon: '✈️' },
  message_received: { label: 'TRANSMISSION RECEIVED', color: COLORS.blue, icon: '📨' },
};

function getActionConfig(action) {
  return (
    ACTION_CONFIG[action] || {
      label: action?.toUpperCase() || 'UNKNOWN',
      color: COLORS.muted,
      icon: '📋',
    }
  );
}

export default function AuditScreen({ route, navigation }) {
  const connectionId = route?.params?.connectionId;

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAudit = useCallback(async () => {
    try {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (connectionId) {
        query = query.eq('connection_id', connectionId);
      }

      const { data } = await query;
      setEntries(data || []);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAudit();
    setRefreshing(false);
  }, [fetchAudit]);

  function handleExport() {
    haptics.medium();
    const text = entries
      .map((e) => {
        const config = getActionConfig(e.action);
        const time = e.created_at
          ? format(new Date(e.created_at), 'yyyy-MM-dd HH:mm:ss')
          : '';
        return `[${time}] ${config.label} - ${JSON.stringify(e.details || {})}`;
      })
      .join('\n');

    Share.share({
      message: `Agent OnBoard Flight Recorder\n\n${text}`,
      title: 'Flight Recorder Export',
    });
  }

  const summaryStats = {
    total: entries.length,
    requests: entries.filter((e) => e.action === 'connection_requested').length,
    approvals: entries.filter((e) => e.action === 'connection_approved').length,
    messages: entries.filter((e) => e.action === 'message_sent').length,
  };

  function renderEntry({ item }) {
    const config = getActionConfig(item.action);
    const timestamp = item.created_at
      ? format(new Date(item.created_at), 'MMM dd, HH:mm:ss')
      : '';

    return (
      <View style={styles.entry}>
        <View style={[styles.entryDot, { backgroundColor: config.color }]} />
        <View style={styles.entryLine} />
        <View style={styles.entryContent}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryIcon}>{config.icon}</Text>
            <Text style={[styles.entryLabel, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
          <Text style={styles.entryTime}>{timestamp}</Text>
          {item.details ? (
            <Text style={styles.entryDetails} numberOfLines={2}>
              {typeof item.details === 'object'
                ? Object.entries(item.details)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ')
                : String(item.details)}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  const listHeader = (
    <View>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerLabel}>FLIGHT RECORDER</Text>
        <Text style={styles.headerTitle}>Audit Log</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>FLIGHT SUMMARY</Text>
        <View style={styles.summaryRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{summaryStats.total}</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{summaryStats.requests}</Text>
            <Text style={styles.statLabel}>REQUESTS</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{summaryStats.approvals}</Text>
            <Text style={styles.statLabel}>APPROVED</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{summaryStats.messages}</Text>
            <Text style={styles.statLabel}>MESSAGES</Text>
          </View>
        </View>
      </View>

      <View style={styles.exportRow}>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Text style={styles.exportBtnText}>Export Flight Record</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.timelineLabel}>TIMELINE</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              emoji="📋"
              title="No Records"
              subtitle="The flight recorder is empty. Actions will be logged here."
            />
          )
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.navy}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  backBtn: {
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  backText: {
    ...FONTS.body,
    color: COLORS.navy,
  },
  headerLabel: {
    ...FONTS.label,
    color: COLORS.amber,
    letterSpacing: 3,
    marginBottom: SPACING.xs,
  },
  headerTitle: {
    ...FONTS.display,
  },
  summaryCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.navy,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  summaryTitle: {
    ...FONTS.label,
    color: COLORS.amber,
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...FONTS.mono,
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    ...FONTS.label,
    color: COLORS.muted,
    fontSize: 9,
    marginTop: SPACING.xs,
  },
  exportRow: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  exportBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  exportBtnText: {
    ...FONTS.heading,
    fontSize: 14,
    color: COLORS.navy,
  },
  timelineLabel: {
    ...FONTS.label,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  entry: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: 0,
  },
  entryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: SPACING.md,
    zIndex: 1,
  },
  entryLine: {
    position: 'absolute',
    left: SPACING.lg + 4,
    top: 26,
    bottom: -2,
    width: 2,
    backgroundColor: COLORS.border,
  },
  entryContent: {
    flex: 1,
    marginLeft: SPACING.md,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  entryIcon: {
    fontSize: 14,
  },
  entryLabel: {
    ...FONTS.label,
    fontSize: 10,
  },
  entryTime: {
    ...FONTS.caption,
    fontSize: 11,
    marginTop: SPACING.xs,
  },
  entryDetails: {
    ...FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: SPACING.xs,
  },
});
