import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
// Premium Icons
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const FEATURES = [
  { ico: 'partly-sunny', title: 'Smart Weather', desc: 'Hyperlocal forecasts for your exact farm location', color: '#F59E0B' },
  { ico: 'leaf', title: 'Crop Advisor', desc: 'AI recommendations tailored for Goan laterite soil', color: '#10B981' },
  { ico: 'shield-alert', title: 'Pest Alerts', desc: 'Early warnings based on real-time weather risk', color: '#EF4444' },
  { ico: 'water', title: 'Irrigation Guide', desc: 'Know exactly when and how much to water daily', color: '#0EA5E9' },
];

export default function OnboardingScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  // Staggered animations for feature rows
  const rowAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Entrance for header and buttons
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    // Staggered entrance for feature cards
    const animations = rowAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 400 + (i * 150),
        useNativeDriver: true
      })
    );
    Animated.stagger(150, animations).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#064E3B' }}>
      <StatusBar barStyle="light-content" />

      {/* Background Glow Effect */}
      <View style={styles.glowCircle} />

      <LinearGradient
        colors={['transparent', 'rgba(6, 78, 59, 0.95)', '#064E3B']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Logo & Header */}
          <View style={styles.headerBox}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="seed-outline" size={40} color="#10B981" />
            </View>
            <Text style={styles.brandTitle}>Agro<Text style={{ color: '#10B981' }}>GROW</Text></Text>
            <View style={styles.taglinePill}>
              <Text style={styles.tagline}>PRECISION FARMING FOR GOA</Text>
            </View>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            {FEATURES.map((f, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.featureRow,
                  {
                    opacity: rowAnims[i],
                    transform: [{ translateX: rowAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
                  }
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: f.color + '20' }]}>
                  <MaterialCommunityIcons name={f.ico} size={24} color={f.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(auth)/login')}
              style={styles.primaryBtn}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGrad}
              >
                <Text style={styles.primaryBtnText}>Get Started</Text>
                <Feather name="arrow-right" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/login')}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Already have an account? <Text style={{ color: '#10B981', fontWeight: '800' }}>Login</Text></Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  glowCircle: {
    position: 'absolute',
    top: -width * 0.2,
    right: -width * 0.2,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: '#10B981',
    opacity: 0.15,
  },

  headerBox: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20
  },
  brandTitle: { fontSize: 42, color: '#fff', fontWeight: '900', letterSpacing: -1.5 },
  taglinePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8
  },
  tagline: { fontSize: 11, color: '#10B981', fontWeight: '800', letterSpacing: 1.5 },

  featuresContainer: { gap: 16 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  featureTitle: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: -0.3 },
  featureDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4, lineHeight: 18 },

  footer: { marginTop: 'auto', paddingBottom: 20 },
  primaryBtn: { height: 64, borderRadius: 32, overflow: 'hidden', elevation: 8, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 } },
  btnGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 18 },

  secondaryBtn: { marginTop: 20, alignItems: 'center', paddingVertical: 10 },
  secondaryBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' },
});