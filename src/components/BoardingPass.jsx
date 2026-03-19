import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Constants from 'expo-constants';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import StatusPill from './StatusPill';

const appUrl =
  Constants.expoConfig?.extra?.appUrl || 'https://agent-onboard.netlify.app';

function getFlightId(agent) {
  if (!agent?.id) return 'AOB-0000';
  return 'AOB-' + agent.id.substring(0, 4).toUpperCase();
}

function getGate(agentType) {
  const gates = { human: 'H1', ai: 'A1', tool: 'T1', hybrid: 'X1' };
  return gates[agentType] || 'G1';
}

function getClass(agentType) {
  const classes = {
    human: 'CREW',
    ai: 'AUTO',
    tool: 'UTIL',
    hybrid: 'FLEX',
  };
  return classes[agentType] || 'STD';
}

export default function BoardingPass({
  agent,
  showQR = true,
  compact = false,
}) {
  if (!agent) return null;

  const flightId = getFlightId(agent);
  const gate = getGate(agent.agent_type);
  const cls = getClass(agent.agent_type);
  const qrValue = agent.qr_token
    ? `${appUrl}/connect?token=${agent.qr_token}`
    : flightId;

  if (compact) {
    return (
      <View style={styles.compactCard}>
        <View style={styles.navyStripeCompact} />
        <View style={styles.compactContent}>
          <Text style={styles.compactName} numberOfLines={1}>
            {agent.agent_name}
          </Text>
          <Text style={styles.compactFlight}>{flightId}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.navyStripe}>
        <Text style={styles.airline}>AGENT ONBOARD</Text>
        <Text style={styles.flightLabel}>FLIGHT {flightId}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.passengerRow}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>PASSENGER</Text>
            <Text style={styles.fieldValue} numberOfLines={1}>
              {agent.agent_name}
            </Text>
          </View>
          <StatusPill status="active" />
        </View>

        <View style={styles.routeRow}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>FROM</Text>
            <Text style={styles.routeCode}>
              {agent.company ? agent.company.substring(0, 3).toUpperCase() : 'ORG'}
            </Text>
          </View>
          <Text style={styles.arrow}>{'---->'}</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>TO</Text>
            <Text style={styles.routeCode}>AOB</Text>
          </View>
        </View>

        <View style={styles.dashedLine} />

        <View style={styles.detailsRow}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>GATE</Text>
            <Text style={styles.detailValue}>{gate}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>CLASS</Text>
            <Text style={styles.detailValue}>{cls}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>SEAT</Text>
            <Text style={styles.detailValue}>
              {agent.id ? agent.id.substring(0, 2).toUpperCase() : '1A'}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>PLATFORM</Text>
            <Text style={styles.detailValue}>
              {agent.platform ? agent.platform.substring(0, 4).toUpperCase() : 'WEB'}
            </Text>
          </View>
        </View>

        {showQR && (
          <View style={styles.qrSection}>
            <View style={styles.dashedLine} />
            <View style={styles.qrContainer}>
              <QRCode
                value={qrValue}
                size={120}
                color={COLORS.navy}
                backgroundColor={COLORS.white}
              />
            </View>
            <Text style={styles.qrHint}>Scan to connect</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  navyStripe: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  airline: {
    ...FONTS.label,
    color: COLORS.amber,
    letterSpacing: 3,
  },
  flightLabel: {
    ...FONTS.mono,
    color: COLORS.white,
    fontSize: 12,
  },
  body: {
    padding: SPACING.lg,
  },
  passengerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  field: {
    flex: 0,
  },
  fieldLabel: {
    ...FONTS.label,
    fontSize: 9,
    marginBottom: 2,
  },
  fieldValue: {
    ...FONTS.heading,
    fontSize: 20,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  routeCode: {
    ...FONTS.mono,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
  },
  arrow: {
    ...FONTS.mono,
    color: COLORS.muted,
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },
  dashedLine: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailValue: {
    ...FONTS.mono,
    fontSize: 18,
    fontWeight: '700',
  },
  qrSection: {
    alignItems: 'center',
  },
  qrContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qrHint: {
    ...FONTS.caption,
    marginTop: SPACING.sm,
  },
  compactCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  navyStripeCompact: {
    width: 6,
    backgroundColor: COLORS.navy,
    alignSelf: 'stretch',
  },
  compactContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  compactName: {
    ...FONTS.heading,
    flex: 1,
  },
  compactFlight: {
    ...FONTS.mono,
    color: COLORS.muted,
    fontSize: 12,
  },
});
