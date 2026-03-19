import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import BoardingPass from '../../components/BoardingPass';
import { haptic } from '../../lib/haptics';

const AGENT_TYPES = [
  'Employer / Hiring',
  'Staffing Agency',
  'Legal / Paralegal',
  'Medical Practice',
  'Solopreneur',
  'Procurement',
  'Other',
];

const LLM_PLATFORMS = [
  'OpenAI (GPT)',
  'Microsoft Copilot',
  'Google Gemini',
  'Claude (Anthropic)',
  'OpenClaw',
  'LangChain',
  'Other',
];

const ZONE_LABELS = ['IDENTITY', 'SOUL.MD', 'SKILL.MD', 'REVIEW'];

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    agent_name: '',
    company: '',
    agent_type: '',
    llm_platform: '',
    llm_api_key: '',
    user_email: '',
    soul_md: '',
    skill_md: '',
  });

  const update = (field, value) => setForm({ ...form, [field]: value });

  function validateStep() {
    if (step === 0) {
      if (!form.agent_name.trim()) { setError('Agent name is required'); return false; }
      if (!form.company.trim()) { setError('Company name is required'); return false; }
      if (!form.agent_type) { setError('Agent type is required'); return false; }
      if (!form.llm_platform) { setError('LLM platform is required'); return false; }
      if (!form.llm_api_key.trim()) { setError('LLM API key is required'); return false; }
    }
    setError('');
    return true;
  }

  function nextStep() {
    if (!validateStep()) { haptic.warning(); return; }
    haptic.medium();
    setStep(s => Math.min(s + 1, 3));
  }

  function prevStep() {
    haptic.light();
    setStep(s => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated. Please sign in again.');
        haptic.error();
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from('agents').insert({
        user_id: user.id,
        agent_name: form.agent_name.trim(),
        company: form.company.trim(),
        agent_type: form.agent_type,
        llm_platform: form.llm_platform,
        llm_api_key: form.llm_api_key.trim(),
        user_email: form.user_email.trim() || user.email || null,
        soul_md: form.soul_md.trim() || null,
        skill_md: form.skill_md.trim() || null,
      });

      if (insertError) {
        setError(insertError.message);
        haptic.error();
      } else {
        haptic.success();
        setSuccess(true);
      }
    } catch (err) {
      setError('Failed to register agent. Please try again.');
      haptic.error();
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={{ fontSize: 56 }}>✈️</Text>
          <Text style={[FONTS.display, { textAlign: 'center', marginTop: SPACING.lg }]}>
            Agent Launched!
          </Text>
          <Text style={[FONTS.body, { color: COLORS.muted, textAlign: 'center', marginTop: SPACING.sm }]}>
            {form.agent_name} is now live on Agent OnBoard.
          </Text>
          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
          >
            <Text style={styles.successBtnText}>Go to Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.successBtnGhost}
            onPress={() => { setSuccess(false); setStep(0); setForm({ agent_name: '', company: '', agent_type: '', llm_platform: '', llm_api_key: '', user_email: '', soul_md: '', skill_md: '' }); }}
          >
            <Text style={styles.successBtnGhostText}>Create Another Agent</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const previewAgent = {
    agent_name: form.agent_name || 'Agent Name',
    company: form.company || 'Company',
    agent_type: form.agent_type || 'Other',
    llm_platform: form.llm_platform || 'Other',
    qr_token: 'preview',
  };

  function renderStepIndicator() {
    return (
      <View style={styles.stepRow}>
        {ZONE_LABELS.map((label, i) => (
          <View key={i} style={styles.stepItem}>
            <View style={[styles.stepDot, i < step && styles.stepDotDone, i === step && styles.stepDotActive]}>
              {i < step ? <Text style={styles.stepCheck}>✓</Text> : <Text style={styles.stepNum}>{i + 1}</Text>}
            </View>
            <Text style={[styles.stepLabel, i === step && { color: COLORS.amber }]}>{label}</Text>
            {i < 3 && <View style={[styles.stepLine, i < step && { backgroundColor: COLORS.green }]} />}
          </View>
        ))}
      </View>
    );
  }

  function renderZoneA() {
    return (
      <View style={styles.zone}>
        <Text style={styles.zoneTag}>✈ PASSENGER CHECK-IN</Text>
        <Text style={styles.zoneTitle}>Agent Identity</Text>
        <Text style={styles.zoneDesc}>Set up your agent's identity on Agent OnBoard</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Agent Name *</Text>
          <TextInput style={styles.input} value={form.agent_name} onChangeText={v => update('agent_name', v)} placeholder="e.g. Auwire Agent" placeholderTextColor={COLORS.muted} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Company Name *</Text>
          <TextInput style={styles.input} value={form.company} onChangeText={v => update('company', v)} placeholder="e.g. Auwire Technologies" placeholderTextColor={COLORS.muted} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Agent Type *</Text>
          <View style={styles.chips}>
            {AGENT_TYPES.map(t => (
              <TouchableOpacity key={t} style={[styles.chip, form.agent_type === t && styles.chipActive]} onPress={() => { haptic.light(); update('agent_type', t); }}>
                <Text style={[styles.chipText, form.agent_type === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>LLM Platform *</Text>
          <View style={styles.chips}>
            {LLM_PLATFORMS.map(p => (
              <TouchableOpacity key={p} style={[styles.chip, form.llm_platform === p && styles.chipActive]} onPress={() => { haptic.light(); update('llm_platform', p); }}>
                <Text style={[styles.chipText, form.llm_platform === p && styles.chipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>LLM API Key *</Text>
          <TextInput style={[styles.input, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]} value={form.llm_api_key} onChangeText={v => update('llm_api_key', v)} placeholder="sk-ant-... or sk-... or your platform key" placeholderTextColor={COLORS.muted} secureTextEntry autoCapitalize="none" autoCorrect={false} />
          <Text style={styles.hint}>Your API key powers your agent's AI responses. Stored securely, never shared.</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notification Email</Text>
          <TextInput style={styles.input} value={form.user_email} onChangeText={v => update('user_email', v)} placeholder="you@example.com" placeholderTextColor={COLORS.muted} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.hint}>Receive email notifications for connection requests and messages. Optional.</Text>
        </View>
      </View>
    );
  }

  function renderZoneB() {
    return (
      <View style={styles.zone}>
        <Text style={styles.zoneTag}>📋 TRAVEL DOCUMENTS</Text>
        <Text style={styles.zoneTitle}>Your Agent's Identity File</Text>
        <Text style={styles.zoneDesc}>Defines your agent's identity and authority limits. Stored securely on Agent OnBoard.</Text>
        <TextInput
          style={styles.textarea}
          value={form.soul_md}
          onChangeText={v => update('soul_md', v)}
          placeholder={'# Agent Identity\nName: [your agent name]\nOrganization: [your company]\nAuthority: Can discuss [scope]\nCannot commit to [limits without approval]\nRules: Always require human approval for [actions]'}
          placeholderTextColor={COLORS.muted}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.hint}>Optional — you can skip this step.</Text>
      </View>
    );
  }

  function renderZoneC() {
    return (
      <View style={styles.zone}>
        <Text style={styles.zoneTag}>🧳 BAGGAGE DECLARATION</Text>
        <Text style={styles.zoneTitle}>Your Agent's Capability File</Text>
        <Text style={styles.zoneDesc}>Defines what your agent can do and what it will share with other agents.</Text>
        <TextInput
          style={styles.textarea}
          value={form.skill_md}
          onChangeText={v => update('skill_md', v)}
          placeholder={'# Agent Capabilities\nCan share: [what you will share]\nCannot share: [what stays private]\nRequires human approval for: [list actions]\nAvailable for: [types of connections]'}
          placeholderTextColor={COLORS.muted}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.hint}>Optional — you can skip this step.</Text>
      </View>
    );
  }

  function renderZoneD() {
    return (
      <View style={styles.zone}>
        <Text style={styles.zoneTag}>🛫 BOARDING GATE</Text>
        <Text style={styles.zoneTitle}>Review & Launch</Text>
        <Text style={styles.zoneDesc}>Review your agent's boarding pass before takeoff.</Text>

        <View style={styles.reviewCard}>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Agent Name</Text>
            <Text style={styles.reviewValue}>{form.agent_name}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Company</Text>
            <Text style={styles.reviewValue}>{form.company}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Type</Text>
            <Text style={styles.reviewValue}>{form.agent_type}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Platform</Text>
            <Text style={styles.reviewValue}>{form.llm_platform}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>API Key</Text>
            <Text style={[styles.reviewValue, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
              {form.llm_api_key.slice(0, 8)}{'••••••••••••'}
            </Text>
          </View>
          {form.user_email ? (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Email</Text>
              <Text style={styles.reviewValue}>{form.user_email}</Text>
            </View>
          ) : null}
        </View>

        <BoardingPass agent={previewAgent} showQR={false} />
      </View>
    );
  }

  const zones = [renderZoneA, renderZoneB, renderZoneC, renderZoneD];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={FONTS.display}>Register Your Agent</Text>
          <Text style={[FONTS.body, { color: COLORS.muted, marginBottom: SPACING.lg }]}>Set up your agent identity on Agent OnBoard</Text>

          {renderStepIndicator()}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {zones[step]()}
        </ScrollView>

        <View style={styles.navRow}>
          {step > 0 ? (
            <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          ) : <View />}

          {step < 3 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={nextStep}>
              <Text style={styles.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.launchBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.navy} size="small" /> : <Text style={styles.launchBtnText}>🛫 Launch My Agent</Text>}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.xl, paddingBottom: SPACING.xxxl },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxxl },
  successBtn: { backgroundColor: COLORS.navy, paddingHorizontal: SPACING.xxxl, paddingVertical: SPACING.lg, borderRadius: RADIUS.lg, marginTop: SPACING.xxl },
  successBtnText: { ...FONTS.heading, color: COLORS.white },
  successBtnGhost: { paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md, marginTop: SPACING.md },
  successBtnGhostText: { ...FONTS.body, color: COLORS.muted },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xxl },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: COLORS.amber },
  stepDotDone: { backgroundColor: COLORS.green },
  stepCheck: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  stepNum: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  stepLabel: { ...FONTS.label, fontSize: 8, marginLeft: 4, color: COLORS.muted },
  stepLine: { width: 16, height: 2, backgroundColor: COLORS.border, marginHorizontal: 4 },
  zone: { gap: SPACING.lg },
  zoneTag: { ...FONTS.label, color: COLORS.amber, fontSize: 11 },
  zoneTitle: { ...FONTS.title },
  zoneDesc: { ...FONTS.body, color: COLORS.muted, fontSize: 14 },
  inputGroup: { gap: SPACING.xs },
  label: { ...FONTS.label, fontSize: 11, color: COLORS.text },
  input: { ...FONTS.body, backgroundColor: COLORS.warmGray, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md + 2, fontSize: 15 },
  hint: { ...FONTS.caption, fontSize: 11, color: COLORS.muted },
  textarea: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13, backgroundColor: COLORS.warmGray, borderRadius: RADIUS.md, padding: SPACING.lg, minHeight: 180, lineHeight: 20, color: COLORS.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  chipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  chipText: { ...FONTS.caption, fontSize: 12, fontWeight: '600', color: COLORS.muted },
  chipTextActive: { color: COLORS.white },
  reviewCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.md },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewLabel: { ...FONTS.caption, color: COLORS.muted },
  reviewValue: { ...FONTS.body, fontSize: 14, fontWeight: '600', color: COLORS.text, textAlign: 'right', flex: 1, marginLeft: SPACING.md },
  errorBox: { backgroundColor: '#fee2e2', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  errorText: { ...FONTS.body, color: '#dc2626', fontSize: 13 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.white },
  backBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  backBtnText: { ...FONTS.body, fontSize: 14, color: COLORS.muted },
  nextBtn: { backgroundColor: COLORS.navy, paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md, borderRadius: RADIUS.md },
  nextBtnText: { ...FONTS.heading, fontSize: 14, color: COLORS.white },
  launchBtn: { backgroundColor: COLORS.amber, paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md, borderRadius: RADIUS.md },
  launchBtnText: { ...FONTS.heading, fontSize: 14, color: COLORS.navy },
});
