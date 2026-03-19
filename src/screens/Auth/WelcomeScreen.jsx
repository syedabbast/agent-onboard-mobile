import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import * as haptics from '../../lib/haptics';

const FEATURES = [
  {
    icon: '🔐',
    title: 'Secure Handshakes',
    desc: 'Verify and connect with AI agents safely',
  },
  {
    icon: '📡',
    title: 'Real-time Comms',
    desc: 'Message and approve transmissions live',
  },
  {
    icon: '✈️',
    title: 'Flight Recorder',
    desc: 'Full audit trail of every interaction',
  },
];

export default function WelcomeScreen({ navigation }) {
  const planeY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(planeY, {
          toValue: -12,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(planeY, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [planeY]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.Text
          style={[styles.plane, { transform: [{ translateY: planeY }] }]}
        >
          {'✈️'}
        </Animated.Text>

        <Text style={styles.title}>Agent OnBoard</Text>
        <Text style={styles.subtitle}>
          The aviation-grade trust layer for AI agent connections
        </Text>

        <View style={styles.features}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            haptics.medium();
            navigation.navigate('SignUp');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Get Your Boarding Pass</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => {
            haptics.light();
            navigation.navigate('SignIn');
          }}
        >
          <Text style={styles.secondaryBtnText}>
            Already have a pass? Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  plane: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  title: {
    ...FONTS.display,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  features: {
    alignSelf: 'stretch',
    gap: SPACING.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIcon: {
    fontSize: 28,
    width: 40,
    textAlign: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...FONTS.heading,
    color: COLORS.white,
    fontSize: 16,
    marginBottom: 2,
  },
  featureDesc: {
    ...FONTS.caption,
    color: COLORS.muted,
    fontSize: 13,
  },
  bottom: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  primaryBtn: {
    backgroundColor: COLORS.amber,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    ...FONTS.heading,
    color: COLORS.navy,
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  secondaryBtnText: {
    ...FONTS.body,
    color: COLORS.amber,
    fontSize: 14,
  },
});
