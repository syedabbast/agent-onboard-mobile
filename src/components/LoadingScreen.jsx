import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { SPACING } from '../theme/spacing';

export default function LoadingScreen() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 200);
    const a3 = animate(dot3, 400);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  const dotStyle = (anim) => ({
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.plane}>{'✈️'}</Text>
      <Text style={styles.title}>Agent OnBoard</Text>
      <View style={styles.dotsContainer}>
        <Animated.Text style={[styles.dot, dotStyle(dot1)]}>
          {'●'}
        </Animated.Text>
        <Animated.Text style={[styles.dot, dotStyle(dot2)]}>
          {'●'}
        </Animated.Text>
        <Animated.Text style={[styles.dot, dotStyle(dot3)]}>
          {'●'}
        </Animated.Text>
      </View>
      <Text style={styles.subtitle}>Preparing for departure...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plane: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  title: {
    ...FONTS.display,
    color: COLORS.white,
    marginBottom: SPACING.lg,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  dot: {
    fontSize: 12,
    color: COLORS.amber,
  },
  subtitle: {
    ...FONTS.caption,
    color: COLORS.muted,
  },
});
