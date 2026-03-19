import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { supabase, getMyAgent, logAudit } from '../../lib/supabase';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import BoardingPass from '../../components/BoardingPass';
import ConnectionCard from '../../components/ConnectionCard';
import DepartureBoard from '../../components/DepartureBoard';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';
import * as haptics from '../../lib/haptics';

const appUrl =
  Constants.expoConfig?.extra?.appUrl || 'https://agent-onboard.netlify.app';

export default function DashboardScreen({ navigation }) {
  const [agent, setAgent] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: myAgent } = await getMyAgent(user.id);

      if (!myAgent) {
        setLoading(false);
        navigation.navigate('Register');
        return;
      }

      setAgent(myAgent);

      const { data: conns } = await supabase
        .from('connections')
        .select(
          '*, requester_agent:agents!connections_requester_agent_id_fkey(*), target_agent:agents!connections_target_agent_id_fkey(*)'
        )
        .or(
          `requester_agent_id.eq.${myAgent.id},target_agent_id.eq.${myAgent.id}`
        )
        .order('created_at', { ascending: false });

      setConnections(conns || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!agent?.id) return;

    const channel = supabase
      .channel('dashboard-connections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agent?.id, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  async function handleApprove(connection) {
    try {
      await supabase
        .from('connections')
        .update({ status: 'approved' })
        .eq('id', connection.id);

      await logAudit({
        connectionId: connection.id,
        agentId: agent.id,
        action: 'connection_approved',
        metadata: { approved_by: agent.name },
      });

      haptics.success();
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to approve connection');
      haptics.error();
    }
  }

  async function handleDecline(connection) {
    try {
      await supabase
        .from('connections')
        .update({ status: 'declined' })
        .eq('id', connection.id);

      await logAudit({
        connectionId: connection.id,
        agentId: agent.id,
        action: 'connection_declined',
        metadata: { declined_by: agent.name },
      });

      haptics.warning();
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to decline connection');
      haptics.error();
    }
  }

  function handleShare() {
    haptics.medium();
    const url = `${appUrl}/connect?token=${agent.qr_token}`;
    Share.share({
      message: `Connect with ${agent.agent_name} on Agent OnBoard: ${url}`,
      url,
    });
  }

  async function handleCopy() {
    haptics.light();
    const url = `${appUrl}/connect?token=${agent.qr_token}`;
    await Clipboard.setStringAsync(url);
    Alert.alert('Copied', 'Boarding pass link copied to clipboard');
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!agent) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          emoji="✈️"
          title="No Agent Registered"
          subtitle="Register your agent to get a boarding pass"
          buttonLabel="Register Agent"
          onPress={() => navigation.navigate('Register')}
        />
      </SafeAreaView>
    );
  }

  const pendingIncoming = connections.filter(
    (c) => c.status === 'pending' && c.target_agent_id === agent.id
  );
  const activeConnections = connections.filter(
    (c) => c.status === 'approved' || c.status === 'active'
  );

  function getOtherAgent(conn) {
    return conn.requester_agent_id === agent.id
      ? conn.target_agent
      : conn.requester_agent;
  }

  const listHeader = (
    <View>
      <View style={styles.header}>
        <Text style={styles.terminalLabel}>TERMINAL A</Text>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      <View style={styles.section}>
        <BoardingPass agent={agent} />
        <View style={styles.shareRow}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share Pass</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            <Text style={styles.copyBtnText}>Copy Link</Text>
          </TouchableOpacity>
        </View>
      </View>

      {pendingIncoming.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            PENDING GATE REQUESTS ({pendingIncoming.length})
          </Text>
        </View>
      )}
    </View>
  );

  const listFooter = (
    <View>
      {activeConnections.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTIVE FLIGHTS</Text>
          <DepartureBoard
            connections={activeConnections}
            myAgentId={agent.id}
            onPress={(conn) =>
              navigation.navigate('Session', {
                connectionId: conn.id,
                otherAgent: getOtherAgent(conn),
              })
            }
          />
        </View>
      )}

      {connections.length === 0 && (
        <EmptyState
          emoji="🛫"
          title="No Connections Yet"
          subtitle="Share your boarding pass or scan another agent's QR code to connect"
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={pendingIncoming}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardPadding}>
            <ConnectionCard
              connection={item}
              otherAgent={getOtherAgent(item)}
              onPress={() =>
                navigation.navigate('Session', {
                  connectionId: item.id,
                  otherAgent: getOtherAgent(item),
                })
              }
              onApprove={() => handleApprove(item)}
              onDecline={() => handleDecline(item)}
            />
          </View>
        )}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.navy}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  terminalLabel: {
    ...FONTS.label,
    color: COLORS.amber,
    letterSpacing: 3,
    marginBottom: SPACING.xs,
  },
  headerTitle: {
    ...FONTS.display,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.label,
    marginBottom: SPACING.sm,
  },
  shareRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: COLORS.navy,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  shareBtnText: {
    ...FONTS.heading,
    fontSize: 14,
    color: COLORS.white,
  },
  copyBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  copyBtnText: {
    ...FONTS.heading,
    fontSize: 14,
    color: COLORS.navy,
  },
  cardPadding: {
    paddingHorizontal: SPACING.lg,
  },
});
