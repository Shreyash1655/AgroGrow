import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BtnPrimary, BtnOutline, FadeIn } from '../../src/components/UI';
import { Colors, Fonts, Radius } from '../../src/theme';

const FEATURES = [
  { ico: '🗺️', title: 'Live Disease Risk Map', sub: 'GPS outbreak detection — 5km radius alerts' },
  { ico: '🤖', title: 'Claude AI Chatbot', sub: 'Real answers in Konkani, Marathi & English' },
  { ico: '🌤️', title: 'Hyper-local Weather', sub: 'Village-level forecasts via Open-Meteo' },
  { ico: '🛒', title: 'Agri Marketplace', sub: 'Buy inputs with Govt incentive prices' },
];

export default function Onboard() {
  return (
    <LinearGradient colors={['#0d3b22', '#1a5c35', '#2d8653']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
          <FadeIn delay={0}>
            <Text style={styles.logo}>🌱</Text>
            <Text style={styles.title}>AgroGROW</Text>
            <Text style={styles.sub}>Your AI-powered smart farming companion.{'\n'}Built for Goa's cashew, paddy & coconut farmers.</Text>
          </FadeIn>

          <View style={styles.features}>
            {FEATURES.map((f, i) => (
              <FadeIn key={i} delay={200 + i * 80}>
                <View style={styles.featureRow}>
                  <Text style={styles.featureIco}>{f.ico}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureSub}>{f.sub}</Text>
                  </View>
                </View>
              </FadeIn>
            ))}
          </View>

          <FadeIn delay={600} style={styles.btns}>
            <BtnPrimary label="Get Started →" onPress={() => router.push('/(auth)/register')} style={{ marginBottom: 12 }} />
            <BtnOutline label="I already have an account" onPress={() => router.push('/(auth)/login')} style={{ borderColor: 'rgba(255,255,255,.35)' }} />
          </FadeIn>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 26, paddingTop: 40, alignItems: 'center', gap: 0 },
  logo: { fontSize: 72, textAlign: 'center', marginBottom: 8 },
  title: { fontFamily: Fonts.displayExtraBold, fontSize: 36, color: '#fff', textAlign: 'center', letterSpacing: -0.5 },
  sub: { fontFamily: Fonts.medium, fontSize: 14, color: 'rgba(255,255,255,.7)', textAlign: 'center', lineHeight: 22, marginTop: 10, marginBottom: 28 },
  features: { width: '100%', gap: 10, marginBottom: 28 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,.1)', borderRadius: Radius.r16, padding: 14 },
  featureIco: { fontSize: 26 },
  featureTitle: { fontFamily: Fonts.extraBold, fontSize: 14, color: '#fff' },
  featureSub: { fontFamily: Fonts.medium, fontSize: 12.5, color: 'rgba(255,255,255,.8)', marginTop: 2, lineHeight: 18 },
  btns: { width: '100%', gap: 0 },
});
