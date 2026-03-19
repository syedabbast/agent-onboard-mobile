import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  supabase,
  getMyAgent,
  getAgentByToken,
  logAudit,
} from '../../lib/supabase';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import AgentAvatar from '../../components/AgentAvatar';
import StatusPill from '../../components/StatusPill';
import * as haptics from '../../lib/haptics';

export default function ConnectScreen({ route, navigation }) {
  const token = route?.params?.token;

  const [targetAgent, setTargetAgent] = useState(null);
  const [myAgent, setMyAgent] = useState(null);
  const [existingConnection, setExistingConnection] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        if (!token) {
          if (mounted) setError('No connection token provided');
          if (mounted) setLoading(false);
          return;
        }

        const { data: target } = await getAgentByToken(token);
        if (!target) {
          if (mounted) setError('Agent not found. The boarding pass may be invalid.');
          if (mounted) setLoading(false);
          return;
        }
        if (mounted) setTargetAgent(target);

        const { data: me } = await getMyAgent();
        if (mounted) setMyAgent(me);

        if (me && target) {
          const { data: existing } = await supabase
            .from('connections')
            .select('*')
            .or(
              `and(requester_agent_id.eq.${me.id},target_agent_id.eq.${target.id}),and(requester_agent_id.eq.${target.id},target_agent_id.eq.${me.id})`
            )
            .maybeSingle();

          if (mounted && existing) setExistingConnection(existing);
        }
      } catch (err) {
        if (mounted) setError('Failed to load agent information');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [token]);

  async function handleConnect() {
    if (!purpose.trim()) {
      setError('Please describe the purpose of this connection');
      haptics.warning();
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { data: conn, error: connError } = await supabase
        .from('connections')
        .insert({
          requester_agent_id: myAgent.id,
          target_agent_id: targetAgent.id,
          status: 'pending',
          purpose: purpose.trim(),
        })
        .select()
        .single();

      if (connError) {
        setError(connError.message);
        haptics.error();
      } else {
        await logAudit({
          connectionId: conn.id,
          agentId: myAgent.id,
          action: 'connection_requested',
          details: { purpose: purpose.trim(), target: targetAgent.name },
        });

        haptics.success();
        setSuccess(true);
      }
    } catch (err) {
      setError('Failed to send connection request');
      haptics.error();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.navy} />
          <Text style={styles.loadingText}>Locating agent at gate...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.successEmoji}>{'✈️'}</Text>
          <Text style={styles.successTitle}>Connection Requested!</Text>
          <Text style={styles.successDesc}>
            Your boarding request has been sent to {targetAgent?.name}. You will
            be notified when they respond.
          </Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => {
              haptics.light();
              navigation.goBack();
            }}
          >
            <Text style={styles.doneBtnText}>Return to Terminal</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  function renderAuthState() {
    const {
      data: { session },
    } = { data: { session: true } };

    if (!myAgent) {
      return (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>No Agent Profile</Text>
          <Text style={styles.stateDesc}>
            You need to register an agent before connecting.
          </Text>
          <TouchableOpacity
            style={styles.stateBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.stateBtnText}>Register Agent</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (myAgent.id === targetAgent?.id) {
      return (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>This Is You!</Text>
          <Text style={styles.stateDesc}>
            You cannot connect with your own agent.
          </Text>
        </View>
      );
    }

    if (existingConnection) {
      return (
        <View style={styles.stateBox}>
          <StatusPill status={existingConnection.status} />
          <Text style={styles.stateTitle}>Already Connected</Text>
          <Text style={styles.stateDesc}>
            You already have a {existingConnection.status} connection with this
            agent.
          </Text>
          {(existingConnection.status === 'approved' ||
            existingConnection.status === 'active') && (
            <TouchableOpacity
              style={styles.stateBtn}
              onPress={() =>
                navigation.navigate('Session', {
                  connectionId: existingConnection.id,
                  otherAgent: targetAgent,
                })
              }
            >
              <Text style={styles.stateBtnText}>Open Session</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.connectForm}>
        <Text style={styles.formLabel}>PURPOSE OF CONNECTION</Text>
        <TextInput
          style={styles.textarea}
          value={purpose}
          onChangeText={setPurpose}
          placeholder="Describe why you want to connect with this agent..."
          placeholderTextColor={COLORS.muted}
          multiline
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.connectBtn, submitting && styles.connectBtnDisabled]}
          onPress={handleConnect}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.connectBtnText}>
              Request Boarding Clearance
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>{'< Back'}</Text>
          </TouchableOpacity>

          {error && !targetAgent ? (
            <View style={styles.centered}>
              <Text style={styles.errorEmoji}>{'🚫'}</Text>
              <Text style={styles.errorTitle}>{error}</Text>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.doneBtnText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          ) : targetAgent ? (
            <View style={styles.profileSection}>
              <AgentAvatar
                name={targetAgent.name}
                size={80}
                agentType={targetAgent.agent_type}
              />
              <Text style={styles.agentName}>{targetAgent.name}</Text>
              {targetAgent.company ? (
                <Text style={styles.agentCompany}>{targetAgent.company}</Text>
              ) : null}

              <View style={styles.badges}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {targetAgent.agent_type?.toUpperCase()}
                  </Text>
                </View>
                {targetAgent.platform ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {targetAgent.platform.toUpperCase()}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>VERIFIED</Text>
                </View>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {renderAuthState()}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.muted,
    marginTop: SPACING.md,
  },
  backBtn: {
    padding: SPACING.md,
  },
  backText: {
    ...FONTS.body,
    color: COLORS.navy,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  agentName: {
    ...FONTS.title,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  agentCompany: {
    ...FONTS.body,
    color: COLORS.muted,
    marginTop: SPACING.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    ...FONTS.label,
    fontSize: 10,
    color: COLORS.muted,
  },
  verifiedBadge: {
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  verifiedText: {
    ...FONTS.label,
    fontSize: 10,
    color: COLORS.green,
  },
  errorText: {
    ...FONTS.body,
    color: COLORS.red,
    fontSize: 14,
    backgroundColor: COLORS.lightRed,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.md,
    overflow: 'hidden',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  stateBox: {
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: SPACING.sm,
  },
  stateTitle: {
    ...FONTS.heading,
    textAlign: 'center',
  },
  stateDesc: {
    ...FONTS.body,
    color: COLORS.muted,
    textAlign: 'center',
    fontSize: 14,
  },
  stateBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  stateBtnText: {
    ...FONTS.heading,
    color: COLORS.white,
    fontSize: 14,
  },
  connectForm: {
    marginTop: SPACING.xl,
    alignSelf: 'stretch',
    gap: SPACING.sm,
  },
  formLabel: {
    ...FONTS.label,
  },
  textarea: {
    ...FONTS.body,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  connectBtn: {
    backgroundColor: COLORS.navy,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  connectBtnDisabled: {
    opacity: 0.7,
  },
  connectBtnText: {
    ...FONTS.heading,
    color: COLORS.white,
    fontSize: 15,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  successTitle: {
    ...FONTS.title,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  successDesc: {
    ...FONTS.body,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  doneBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  doneBtnText: {
    ...FONTS.heading,
    color: COLORS.white,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  errorTitle: {
    ...FONTS.heading,
    textAlign: 'center',
    color: COLORS.muted,
    marginBottom: SPACING.xl,
  },
});
