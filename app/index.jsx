import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useApp } from '../src/store/AppContext';
import { Colors, Fonts } from '../src/theme';

export default function Index() {
  const { user, ready } = useApp();
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    // Text fade
    Animated.timing(textOpacity, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }).start();
    // Loading bar
    Animated.timing(barWidth, { toValue: 1, duration: 2000, delay: 200, useNativeDriver: false }).start();

    // Navigate after 2.3s
    const timer = setTimeout(() => {
      if (!ready) return;
      if (user) router.replace('/(tabs)/home');
      else router.replace('/(auth)/onboard');
    }, 2300);
    return () => clearTimeout(timer);
  }, [ready]);

  return (
    <LinearGradient colors={[Colors.g1, Colors.g3]} style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Text style={styles.logo}>🌱</Text>
      </Animated.View>
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
        <Text style={styles.title}>AgroGROW</Text>
        <Text style={styles.sub}>Smart Farming for Goa · Powered by AI</Text>
      </Animated.View>
      <View style={styles.barWrap}>
        <Animated.View style={[styles.barFill, { width: barWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  logoWrap: { marginBottom: 4 },
  logo: { fontSize: 72 },
  title: { fontFamily: 'PlayfairDisplay_800ExtraBold', fontSize: 36, color: '#fff', letterSpacing: -0.5 },
  sub: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 6 },
  barWrap: { width: 200, height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden', marginTop: 24 },
  barFill: { height: '100%', backgroundColor: '#fff', borderRadius: 99 },
});
