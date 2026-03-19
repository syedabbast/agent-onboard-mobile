import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Switch,
  Platform,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { supabase, getMyAgent } from '../../lib/supabase';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import AgentAvatar from '../../components/AgentAvatar';
import BoardingPass from '../../components/BoardingPass';
import * as haptics from '../../lib/haptics';

const appUrl =
  Constants.expoConfig?.extra?.appUrl || 'https://agent-onboard.netlify.app';

export default function ProfileScreen({ navigation }) {
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [llmAccess, setLlmAccess] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await getMyAgent();
      if (data) {
        setAgent(data);
        setLlmAccess(data.settings?.llm_access || false);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  async function handleToggleLlm(value) {
    setLlmAccess(value);
    haptics.selection();
    try {
      await supabase
        .from('agents')
        .update({
          settings: { ...agent.settings, llm_access: value },
        })
        .eq('id', agent.id);
    } catch (_) {
      setLlmAccess(!value);
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

  async function handleSignOut() {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        try { await supabase.auth.signOut(); } catch (_) {}
      }
    } else {
      Alert.alert(
        'Disembark',
        'Are you sure you want to sign out? You will need to board again.',
        [
          { text: 'Stay On Board', style: 'cancel' },
          {
            text: 'Disembark',
            style: 'destructive',
            onPress: async () => {
              haptics.medium();
              try { await supabase.auth.signOut(); } catch (_) {}
            },
          },
        ]
      );
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading boarding pass...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!agent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>{'🎫'}</Text>
          <Text style={styles.emptyTitle}>No Boarding Pass</Text>
          <Text style={styles.emptyDesc}>
            Register your agent to get a boarding pass.
          </Text>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => {
              haptics.medium();
              navigation
                .getParent()
                ?.navigate('Dashboard', { screen: 'Register' });
            }}
          >
            <Text style={styles.registerBtnText}>Register Agent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutLink} onPress={handleSignOut}>
            <Text style={styles.signOutLinkText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.navy}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerLabel}>MY BOARDING PASS</Text>
        </View>

        <View style={styles.avatarSection}>
          <AgentAvatar
            name={agent.agent_name}
            size={80}
            agentType={agent.agent_type}
          />
          <Text style={styles.agentName}>{agent.agent_name}</Text>
          {agent.company ? (
            <Text style={styles.agentCompany}>{agent.company}</Text>
          ) : null}
        </View>

        <View style={styles.passSection}>
          <BoardingPass agent={agent} />
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>Share Boarding Pass</Text>
        </TouchableOpacity>

        {agent.soul_md ? (
          <View style={styles.mdSection}>
            <Text style={styles.mdLabel}>SOUL.MD</Text>
            <View style={styles.mdCard}>
              <Text style={styles.mdText}>{agent.soul_md}</Text>
            </View>
          </View>
        ) : null}

        {agent.skill_md ? (
          <View style={styles.mdSection}>
            <Text style={styles.mdLabel}>SKILL.MD</Text>
            <View style={styles.mdCard}>
              <Text style={styles.mdText}>{agent.skill_md}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.settingsSection}>
          <Text style={styles.settingsLabel}>FLIGHT SETTINGS</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>LLM Access</Text>
              <Text style={styles.settingDesc}>
                Allow connected agents to access your LLM capabilities
              </Text>
            </View>
            <Switch
              value={llmAccess}
              onValueChange={handleToggleLlm}
              trackColor={{ false: COLORS.border, true: COLORS.green }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutBtnText}>Disembark (Sign Out)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    ...FONTS.title,
    marginBottom: SPACING.sm,
  },
  emptyDesc: {
    ...FONTS.body,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  registerBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  registerBtnText: {
    ...FONTS.heading,
    color: COLORS.white,
  },
  signOutLink: {
    padding: SPACING.sm,
  },
  signOutLinkText: {
    ...FONTS.body,
    color: COLORS.red,
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  headerLabel: {
    ...FONTS.label,
    color: COLORS.amber,
    letterSpacing: 3,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  agentName: {
    ...FONTS.title,
    marginTop: SPACING.sm,
  },
  agentCompany: {
    ...FONTS.body,
    color: COLORS.muted,
    marginTop: SPACING.xs,
  },
  passSection: {
    paddingHorizontal: SPACING.lg,
  },
  shareBtn: {
    backgroundColor: COLORS.navy,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  shareBtnText: {
    ...FONTS.heading,
    fontSize: 14,
    color: COLORS.white,
  },
  mdSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  mdLabel: {
    ...FONTS.label,
    marginBottom: SPACING.sm,
  },
  mdCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mdText: {
    ...FONTS.mono,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 20,
  },
  settingsSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  settingsLabel: {
    ...FONTS.label,
    marginBottom: SPACING.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingTitle: {
    ...FONTS.heading,
    fontSize: 15,
  },
  settingDesc: {
    ...FONTS.caption,
    marginTop: 2,
  },
  signOutBtn: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.red,
    alignItems: 'center',
  },
  signOutBtnText: {
    ...FONTS.heading,
    fontSize: 14,
    color: COLORS.red,
  },
});
