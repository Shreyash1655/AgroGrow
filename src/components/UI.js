import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  ActivityIndicator, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Radius, Shadows } from '../theme';

// ── Animated fade-in wrapper ──────────────────────────────────
export function FadeIn({ children, delay = 0, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}

// ── Scale-bounce button ───────────────────────────────────────
export function PressScale({ children, onPress, style, haptic = true }) {
  const scale = useRef(new Animated.Value(1)).current;
  function onIn() { Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 200, friction: 10 }).start(); }
  function onOut() { Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start(); }
  function handlePress() {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }
  return (
    <Pressable onPressIn={onIn} onPressOut={onOut} onPress={handlePress}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

// ── Primary button ────────────────────────────────────────────
export function BtnPrimary({ label, onPress, loading, style }) {
  return (
    <PressScale onPress={onPress} style={style}>
      <LinearGradient colors={[Colors.g2, Colors.g1]} style={styles.btnPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.btnPrimaryText}>{label}</Text>}
      </LinearGradient>
    </PressScale>
  );
}

// ── Outline button ────────────────────────────────────────────
export function BtnOutline({ label, onPress, style }) {
  return (
    <PressScale onPress={onPress} style={style}>
      <View style={styles.btnOutline}>
        <Text style={styles.btnOutlineText}>{label}</Text>
      </View>
    </PressScale>
  );
}

// ── Pill badge ────────────────────────────────────────────────
const pillColors = {
  g: { bg: Colors.gp, text: Colors.g2 },
  r: { bg: Colors.redp, text: Colors.red },
  y: { bg: Colors.amberp, text: '#92600a' },
  b: { bg: Colors.bluep, text: Colors.blue },
};
export function Pill({ label, color = 'g', style }) {
  const c = pillColors[color] || pillColors.g;
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }, style]}>
      <Text style={[styles.pillText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

// ── Card wrapper ──────────────────────────────────────────────
export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ── Section label ─────────────────────────────────────────────
export function SectionLabel({ label, style }) {
  return <Text style={[styles.slbl, style]}>{label}</Text>;
}

// ── Skeleton loader ───────────────────────────────────────────
export function Skeleton({ width, height, style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[{ width, height, backgroundColor: Colors.g200, borderRadius: Radius.r8, opacity }, style]} />;
}

// ── Toast component ───────────────────────────────────────────
export function Toast({ message, visible, isError }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);
  return (
    <Animated.View style={[styles.toast, { backgroundColor: isError ? Colors.red : Colors.g1, opacity, transform: [{ translateY }] }]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btnPrimary: {
    borderRadius: Radius.r99, paddingVertical: 15, paddingHorizontal: 24,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.sh2,
  },
  btnPrimaryText: { fontFamily: Fonts.extraBold, fontSize: 15, color: '#fff', letterSpacing: 0.3 },
  btnOutline: {
    borderRadius: Radius.r99, paddingVertical: 13, paddingHorizontal: 24,
    alignItems: 'center', borderWidth: 2, borderColor: Colors.g3,
  },
  btnOutlineText: { fontFamily: Fonts.extraBold, fontSize: 14, color: Colors.g2 },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.r99 },
  pillText: { fontFamily: Fonts.extraBold, fontSize: 11 },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.r16,
    borderWidth: 1, borderColor: Colors.g100, ...Shadows.sh1,
  },
  slbl: {
    fontFamily: Fonts.extraBold, fontSize: 11, color: Colors.g500,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 5,
  },
  toast: {
    position: 'absolute', top: 54, left: 14, right: 14,
    borderRadius: Radius.r12, padding: 12, paddingHorizontal: 16,
    zIndex: 600, ...Shadows.sh3,
  },
  toastText: { fontFamily: Fonts.bold, fontSize: 13, color: '#fff' },
});
