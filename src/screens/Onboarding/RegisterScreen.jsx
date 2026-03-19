import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import BoardingPass from '../../components/BoardingPass';
import * as haptics from '../../lib/haptics';

const AGENT_TYPES = ['human', 'ai', 'tool', 'hybrid'];
const PLATFORMS = ['web', 'mobile', 'api', 'desktop', 'cli'];

const ZONE_LABELS = ['ZONE A: IDENTITY', 'ZONE B: SOUL', 'ZONE C: SKILLS', 'ZONE D: REVIEW'];

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [agentType, setAgentType] = useState('human');
  const [platform, setPlatform] = useState('web');
  const [soulMd, setSoulMd] = useState('');
  const [skillMd, setSkillMd] = useState('');

  function validateStep() {
    if (step === 0) {
      if (!name.trim()) {
        setError('Agent name is required');
        return false;
      }
      if (!company.trim()) {
        setError('Company/organization is required');
        return false;
      }
    }
    setError('');
    return true;
  }

  function nextStep() {
    if (!validateStep()) {
      haptics.warning();
      return;
    }
    haptics.medium();
    setStep((s) => Math.min(s + 1, 3));
  }

  function prevStep() {
    haptics.light();
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Not authenticated. Please sign in again.');
        haptics.error();
        setLoading(false);
        return;
      }

      const token =
        Math.random().toString(36).substring(2) +
        Math.random().toString(36).substring(2);

      const { error: insertError } = await supabase.from('agents').insert({
        user_id: user.id,
        name: name.trim(),
        company: company.trim(),
        agent_type: agentType,
        platform,
        soul_md: soulMd.trim() || null,
        skill_md: skillMd.trim() || null,
        share_token: token,
        settings: { llm_access: false },
      });

      if (insertError) {
        setError(insertError.message);
        haptics.error();
      } else {
        haptics.success();
        navigation.navigate('Dashboard');
      }
    } catch (err) {
      setError('Failed to register agent. Please try again.');
      haptics.error();
    } finally {
      setLoading(false);
    }
  }

  const previewAgent = {
    name: name || 'Agent Name',
    company: company || 'Company',
    agent_type: agentType,
    platform,
    id: 'preview1234',
    share_token: 'preview',
  };

  function renderStepIndicator() {
    return (
      <View style={styles.stepIndicator}>
        {ZONE_LABELS.map((label, i) => (
          <View key={i} style={styles.stepDot}>
            <View
              style={[
                styles.dot,
                i < step && styles.dotComplete,
                i === step && styles.dotActive,
              ]}
            />
            {i === step && <Text style={styles.stepLabel}>{label}</Text>}
          </View>
        ))}
      </View>
    );
  }

  function renderZoneA() {
    return (
      <View style={styles.zone}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>AGENT NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Captain Nova"
            placeholderTextColor={COLORS.muted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>COMPANY / ORGANIZATION</Text>
          <TextInput
            style={styles.input}
            value={company}
            onChangeText={setCompany}
            placeholder="Acme AI Corp"
            placeholderTextColor={COLORS.muted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>AGENT TYPE</Text>
          <View style={styles.chips}>
            {AGENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chip,
                  agentType === type && styles.chipActive,
                ]}
                onPress={() => {
                  haptics.selection();
                  setAgentType(type);
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    agentType === type && styles.chipTextActive,
                  ]}
                >
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>PLATFORM</Text>
          <View style={styles.chips}>
            {PLATFORMS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, platform === p && styles.chipActive]}
                onPress={() => {
                  haptics.selection();
                  setPlatform(p);
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    platform === p && styles.chipTextActive,
                  ]}
                >
                  {p.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

  function renderZoneB() {
    return (
      <View style={styles.zone}>
        <Text style={styles.zoneTitle}>Soul Definition</Text>
        <Text style={styles.zoneDesc}>
          Describe this agent&apos;s identity, purpose, values, and behavioral
          guidelines. This is the agent&apos;s soul.md - who they are at their core.
        </Text>
        <TextInput
          style={styles.textarea}
          value={soulMd}
          onChangeText={setSoulMd}
          placeholder={
            '# Soul\n\nI am a helpful AI agent...\n\n## Values\n- Transparency\n- Safety\n- Helpfulness'
          }
          placeholderTextColor={COLORS.muted}
          multiline
          textAlignVertical="top"
        />
      </View>
    );
  }

  function renderZoneC() {
    return (
      <View style={styles.zone}>
        <Text style={styles.zoneTitle}>Skill Manifest</Text>
        <Text style={styles.zoneDesc}>
          List the agent&apos;s capabilities, tools, APIs, and skills. This is the
          agent&apos;s skill.md - what they can do.
        </Text>
        <TextInput
          style={styles.textarea}
          value={skillMd}
          onChangeText={setSkillMd}
          placeholder={
            '# Skills\n\n- Data analysis\n- Code review\n- Document generation\n\n## Tools\n- Search API\n- Calculator'
          }
          placeholderTextColor={COLORS.muted}
          multiline
          textAlignVertical="top"
        />
      </View>
    );
  }

  function renderZoneD() {
    return (
      <View style={styles.zone}>
        <Text style={styles.zoneTitle}>Pre-Flight Review</Text>
        <Text style={styles.zoneDesc}>
          Review your agent&apos;s boarding pass before takeoff.
        </Text>

        <BoardingPass agent={previewAgent} showQR={false} />

        <View style={styles.reviewSection}>
          {soulMd ? (
            <View style={styles.reviewBlock}>
              <Text style={styles.reviewLabel}>SOUL.MD</Text>
              <Text style={styles.reviewText} numberOfLines={3}>
                {soulMd}
              </Text>
            </View>
          ) : null}
          {skillMd ? (
            <View style={styles.reviewBlock}>
              <Text style={styles.reviewLabel}>SKILL.MD</Text>
              <Text style={styles.reviewText} numberOfLines={3}>
                {skillMd}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  const zones = [renderZoneA, renderZoneB, renderZoneC, renderZoneD];

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
          <Text style={styles.screenTitle}>Register Your Agent</Text>

          {renderStepIndicator()}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {zones[step]()}
        </ScrollView>

        <View style={styles.navRow}>
          {step > 0 ? (
            <TouchableOpacity style={styles.navBtnBack} onPress={prevStep}>
              <Text style={styles.navBtnBackText}>Previous Zone</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          {step < 3 ? (
            <TouchableOpacity style={styles.navBtnNext} onPress={nextStep}>
              <Text style={styles.navBtnNextText}>Next Zone</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navBtnSubmit, loading && styles.navBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.navy} size="small" />
              ) : (
                <Text style={styles.navBtnSubmitText}>
                  Clear for Takeoff
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
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
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  screenTitle: {
    ...FONTS.display,
    marginBottom: SPACING.md,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  stepDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.amber,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotComplete: {
    backgroundColor: COLORS.green,
  },
  stepLabel: {
    ...FONTS.label,
    fontSize: 9,
    color: COLORS.amber,
  },
  error: {
    ...FONTS.body,
    color: COLORS.red,
    fontSize: 14,
    backgroundColor: COLORS.lightRed,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  zone: {
    gap: SPACING.md,
  },
  zoneTitle: {
    ...FONTS.title,
  },
  zoneDesc: {
    ...FONTS.body,
    color: COLORS.muted,
    fontSize: 14,
  },
  inputGroup: {
    gap: SPACING.xs,
  },
  label: {
    ...FONTS.label,
  },
  input: {
    ...FONTS.body,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    backgroundColor: COLORS.white,
  },
  textarea: {
    ...FONTS.mono,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    minHeight: 200,
    lineHeight: 20,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  chipText: {
    ...FONTS.label,
    fontSize: 11,
    color: COLORS.muted,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  reviewSection: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  reviewBlock: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewLabel: {
    ...FONTS.label,
    marginBottom: SPACING.xs,
  },
  reviewText: {
    ...FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 18,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  navBtnBack: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navBtnBackText: {
    ...FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
  },
  navBtnNext: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  navBtnNextText: {
    ...FONTS.heading,
    fontSize: 14,
    color: COLORS.white,
  },
  navBtnSubmit: {
    backgroundColor: COLORS.amber,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  navBtnDisabled: {
    opacity: 0.7,
  },
  navBtnSubmitText: {
    ...FONTS.heading,
    fontSize: 14,
    color: COLORS.navy,
  },
});
