import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, getMyAgent, logAudit } from '../../lib/supabase';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import GateHeader from '../../components/GateHeader';
import MessageBubble from '../../components/MessageBubble';
import StatusPill from '../../components/StatusPill';
import EmptyState from '../../components/EmptyState';
import * as haptics from '../../lib/haptics';

export default function SessionScreen({ route, navigation }) {
  const { connectionId, otherAgent } = route?.params || {};

  const [myAgent, setMyAgent] = useState(null);
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef(null);

  const fetchConnection = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .single();
      if (data) setConnection(data);
    } catch (_) {}
  }, [connectionId]);

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    } catch (_) {}
  }, [connectionId]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
      const { data: me } = await getMyAgent(user.id);
        if (mounted && me) setMyAgent(me);

        await fetchConnection();
        await fetchMessages();
      } catch (_) {
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, [fetchConnection, fetchMessages]);

  useEffect(() => {
    if (!connectionId) return;

    const messagesChannel = supabase
      .channel(`session-messages-${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new];
          });
          haptics.light();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? payload.new : m))
          );
        }
      )
      .subscribe();

    const connChannel = supabase
      .channel(`session-conn-${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'connections',
          filter: `id=eq.${connectionId}`,
        },
        (payload) => {
          setConnection(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(connChannel);
    };
  }, [connectionId]);

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  async function handleSend() {
    const text = inputText.trim();
    if (!text || !myAgent || sending) return;

    setSending(true);
    setInputText('');

    try {
      const { error: sendError } = await supabase.from('messages').insert({
        connection_id: connectionId,
        sender_agent_id: myAgent.id,
        content: text,
        requires_approval: false,
      });

      if (sendError) {
        setInputText(text);
        Alert.alert('Transmission Failed', 'Unable to send message. Try again.');
        haptics.error();
      } else {
        haptics.medium();
        await logAudit({
          connectionId,
          agentId: myAgent.id,
          action: 'message_sent',
          metadata: { content_length: text.length },
        });
      }
    } catch (_) {
      setInputText(text);
      haptics.error();
    } finally {
      setSending(false);
    }
  }

  async function handleApproveMessage(message) {
    try {
      await supabase
        .from('messages')
        .update({ approved: true })
        .eq('id', message.id);

      await logAudit({
        connectionId,
        agentId: myAgent.id,
        action: 'message_approved',
        metadata: { message_id: message.id },
      });

      haptics.success();
    } catch (_) {
      haptics.error();
    }
  }

  async function handleApproveConnection() {
    try {
      await supabase
        .from('connections')
        .update({ status: 'approved' })
        .eq('id', connectionId);

      await logAudit({
        connectionId,
        agentId: myAgent.id,
        action: 'connection_approved',
        metadata: { approved_by: myAgent.name },
      });

      haptics.success();
      fetchConnection();
    } catch (_) {
      haptics.error();
    }
  }

  async function handleDeclineConnection() {
    try {
      await supabase
        .from('connections')
        .update({ status: 'declined' })
        .eq('id', connectionId);

      await logAudit({
        connectionId,
        agentId: myAgent.id,
        action: 'connection_declined',
      });

      haptics.warning();
      fetchConnection();
    } catch (_) {
      haptics.error();
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.navy} />
          <Text style={styles.loadingText}>Opening gate...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPending =
    connection?.status === 'pending' &&
    connection?.target_agent_id === myAgent?.id;
  const isApproved =
    connection?.status === 'approved' || connection?.status === 'active';
  const isDeclined = connection?.status === 'declined';
  const isRevoked = connection?.status === 'revoked';
  const isPendingOutgoing =
    connection?.status === 'pending' &&
    connection?.requester_agent_id === myAgent?.id;

  function renderStatusBar() {
    if (isApproved) {
      return (
        <View style={styles.statusBar}>
          <StatusPill status="approved" />
          <Text style={styles.statusText}>Secure channel established</Text>
        </View>
      );
    }
    if (isPending) {
      return (
        <View style={styles.statusBarPending}>
          <StatusPill status="pending" />
          <Text style={styles.statusTextPending}>
            This agent is requesting boarding clearance
          </Text>
          <View style={styles.statusActions}>
            <TouchableOpacity
              style={styles.declineActionBtn}
              onPress={handleDeclineConnection}
            >
              <Text style={styles.declineActionText}>Deny</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approveActionBtn}
              onPress={handleApproveConnection}
            >
              <Text style={styles.approveActionText}>Grant Clearance</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    if (isPendingOutgoing) {
      return (
        <View style={styles.statusBar}>
          <StatusPill status="pending" />
          <Text style={styles.statusText}>
            Awaiting boarding clearance from {otherAgent?.agent_name}
          </Text>
        </View>
      );
    }
    if (isDeclined) {
      return (
        <View style={styles.statusBarDeclined}>
          <StatusPill status="declined" />
          <Text style={styles.statusTextDeclined}>
            Connection request was declined. Gate closed.
          </Text>
        </View>
      );
    }
    if (isRevoked) {
      return (
        <View style={styles.statusBarDeclined}>
          <StatusPill status="revoked" />
          <Text style={styles.statusTextDeclined}>
            This connection has been terminated.
          </Text>
        </View>
      );
    }
    return null;
  }

  function getAgentNameForMessage(message) {
    if (!message) return '';
    if (message.sender_agent_id === myAgent?.id) return myAgent?.name || 'You';
    return otherAgent?.name || 'Agent';
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <GateHeader
          myAgent={myAgent}
          otherAgent={otherAgent}
          connectionId={connectionId}
          onBack={() => navigation.goBack()}
          onAuditPress={() =>
            navigation.navigate('Audit', { connectionId })
          }
        />

        {renderStatusBar()}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwn={item.sender_agent_id === myAgent?.id}
              agentName={getAgentNameForMessage(item)}
              onApprove={
                item.sender_agent_id !== myAgent?.id
                  ? handleApproveMessage
                  : undefined
              }
            />
          )}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <EmptyState
              emoji="📡"
              title="No Transmissions"
              subtitle={
                isApproved
                  ? 'Send the first transmission to establish contact'
                  : 'Messages will appear here once the connection is approved'
              }
            />
          }
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />

        {isApproved && (
          <View style={styles.inputArea}>
            <TextInput
              style={styles.messageInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type transmission..."
              placeholderTextColor={COLORS.muted}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() || sending) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.sendBtnText}>{'>'}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.muted,
    marginTop: SPACING.md,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.lightBlue,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusText: {
    ...FONTS.caption,
    color: COLORS.blue,
    flex: 1,
  },
  statusBarPending: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.lightAmber,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  statusTextPending: {
    ...FONTS.caption,
    color: COLORS.amber,
    fontWeight: '600',
  },
  statusActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  declineActionBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  declineActionText: {
    ...FONTS.heading,
    fontSize: 13,
    color: COLORS.muted,
  },
  approveActionBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.green,
    alignItems: 'center',
  },
  approveActionText: {
    ...FONTS.heading,
    fontSize: 13,
    color: COLORS.white,
  },
  statusBarDeclined: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.lightRed,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusTextDeclined: {
    ...FONTS.caption,
    color: COLORS.red,
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexGrow: 1,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  messageInput: {
    ...FONTS.body,
    fontSize: 15,
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
