import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useApp } from '../src/store/AppContext';

// Import your logo file
import LogoImg from '../assets/icon.png';

export default function Index() {
  const { user, ready } = useApp();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Start Splash Animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      })
    ]).start();

    if (ready) {
      const timer = setTimeout(() => {
        // --- NAVIGATION LOGIC ---
        // For testing, we are bypassing the login/home check
        // to go straight to your new AI Arbitrage screen.
        if (user) {
          router.replace('/drawer/home');
        } else {
          router.replace('/onboard');
        }

        /* NOTE: When you are done testing, change it back to:
        if (user) {
          router.replace('/drawer/home');
        } else {
          router.replace('/onboard');
        }
        */
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [ready, user]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#064E3B', '#022C22']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoCircle}>
          <Image
            source={LogoImg}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.brandName}>
          Agro<Text style={{ color: '#10B981' }}>GROW</Text>
        </Text>

        <View style={styles.loadingContainer}>
          <View style={styles.track}>
            <Animated.View style={styles.bar} />
          </View>
          <Text style={styles.loadingText}>INITIALIZING PRECISION AGRI</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', justifyContent: 'center' },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  logoImage: { width: '70%', height: '70%' },
  brandName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  loadingContainer: { marginTop: 40, alignItems: 'center' },
  track: {
    width: 140,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  bar: { width: '40%', height: '100%', backgroundColor: '#10B981', borderRadius: 2 },
  loadingText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
  },
});