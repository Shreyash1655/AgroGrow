import { Platform } from 'react-native';

export const Colors = {
  g1: '#0d3b22',
  g2: '#1a5c35',
  g3: '#2d8653',
  g4: '#3ea86a',
  g5: '#6dc993',
  gp: '#e8f7ee',
  gb: '#f2fbf5',
  amber: '#f59e0b',
  amberp: '#fef3c7',
  red: '#dc2626',
  redp: '#fee2e2',
  blue: '#2563eb',
  bluep: '#dbeafe',
  white: '#ffffff',
  g50: '#f9fafb',
  g100: '#f3f4f6',
  g200: '#e5e7eb',
  g300: '#d1d5db',
  g400: '#9ca3af',
  g500: '#6b7280',
  g700: '#374151',
  g900: '#111827',
  bg: '#f0f4f1',
};

export const Fonts = {
  light: 'Nunito_300Light',
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
  displayBold: 'PlayfairDisplay_700Bold',
  displayExtraBold: 'PlayfairDisplay_800ExtraBold',
};

export const Radius = {
  r8: 8,
  r12: 12,
  r16: 16,
  r24: 24,
  r99: 999,
};

export const Shadows = {
  sh1: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
    android: { elevation: 2 },
  }),
  sh2: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 16 },
    android: { elevation: 5 },
  }),
  sh3: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 32 },
    android: { elevation: 10 },
  }),
};
