import { Platform } from 'react-native';
import { COLORS } from './colors';

const monoFamily = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
const sansFamily = Platform.OS === 'ios' ? 'System' : 'Roboto';

export const FONTS = {
  display: {
    fontFamily: sansFamily,
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: sansFamily,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  heading: {
    fontFamily: sansFamily,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  body: {
    fontFamily: sansFamily,
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.text,
    lineHeight: 24,
  },
  caption: {
    fontFamily: sansFamily,
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.muted,
    lineHeight: 16,
  },
  mono: {
    fontFamily: monoFamily,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    letterSpacing: 1,
  },
  label: {
    fontFamily: sansFamily,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
};
