import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// 🔥 PATH FIX: Now 3 levels up to reach src
import { useApp } from '../../../src/store/AppContext';

const { width } = Dimensions.get('window');

/* ─── Animated Icon Component ───────────────────────────── */
function NavIcon({ name, focused }) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.12 : 1,
        tension: 300,
        friction: 15,
        useNativeDriver: true
      }),
      Animated.spring(translateY, {
        toValue: focused ? -2 : 0,
        tension: 300,
        friction: 15,
        useNativeDriver: true
      })
    ]).start();
  }, [focused]);

  const iconConfig = {
    home:      { active: 'home', inactive: 'home-outline' },
    community: { active: 'planet', inactive: 'planet-outline' },
    market:    { active: 'cart', inactive: 'cart-outline' },
    profile:   { active: 'person', inactive: 'person-outline' },
  };

  // Modern Green accent for active, soft slate for inactive
  const activeColor = '#10B981';
  const inactiveColor = '#94A3B8'; // Lighter grey for white background

  if (name === 'chatbot') {
    return (
      <Animated.View style={[styles.centerBotWrap, { transform: [{ scale }] }]}>
        <LinearGradient colors={['#34D399', '#059669']} style={styles.botGrad}>
          <Ionicons name="sparkles" size={24} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>
    );
  }

  const iconName = focused ? iconConfig[name].active : iconConfig[name].inactive;
  const color = focused ? activeColor : inactiveColor;

  return (
    <Animated.View style={{ alignItems: 'center', transform: [{ scale }, { translateY }] }}>
      <Ionicons name={iconName} size={24} color={color} />
      <View style={[styles.activeDot, { opacity: focused ? 1 : 0, backgroundColor: color }]} />
    </Animated.View>
  );
}

/* ─── Custom Tab Bar Component ──────────────────────────── */
function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { cartTotal } = useApp();

  // Identify current route to hide bar on chatbot
  const currentRoute = state.routes[state.index].name;
  if (currentRoute === 'chatbot') return null;

  const tabs = [
    { name: 'home', label: 'Home' },
    { name: 'community', label: 'Explore' },
    { name: 'chatbot', label: null, isCenter: true },
    { name: 'market', label: 'Market' },
    { name: 'profile', label: 'Profile' },
  ];

  return (
    // Adjust bottom positioning based on safe area
    <View style={[styles.navContainer, { bottom: insets.bottom > 0 ? insets.bottom : 15 }]}>
      <View style={styles.navBar}>
        {tabs.map((tab, i) => {
          const isFocused = state.index === i;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes[i]?.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(tab.name);
            }
          };

          if (tab.isCenter) {
            return (
              <TouchableOpacity key={tab.name} onPress={onPress} activeOpacity={0.9} style={styles.centerTabContainer}>
                <NavIcon name="chatbot" focused={isFocused} />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity key={tab.name} onPress={onPress} activeOpacity={0.7} style={styles.tabItem}>
              <View>
                <NavIcon name={tab.name} focused={isFocused} />
                {tab.name === 'market' && cartTotal > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartTotal > 9 ? '9+' : cartTotal}</Text>
                  </View>
                )}
              </View>
              {tab.label && <Text style={[styles.tabLabel, isFocused && styles.tabLabelOn]}>{tab.label}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/* ─── Main Layout ───────────────────────────────────────── */
export default function TabsLayout() {
  return (
    <Tabs
        tabBar={props => <TabBar {...props} />}
        screenOptions={{
            headerShown: false,
            // Ensure screens have a white background
            sceneContainerStyle: { backgroundColor: '#FFFFFF' }
        }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="community" />
      <Tabs.Screen name="chatbot" />
      <Tabs.Screen name="market" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  navContainer: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 100 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', // 🟢 MADE WHITE
    borderRadius: 36,
    height: 72,
    width: '100%',
    paddingHorizontal: 8,
    // Shadows adjusted for light background
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    borderWidth: 1, // Full border looks cleaner in white
    borderColor: '#F1F5F9', // Very subtle border color
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  tabLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginTop: 4 }, // Lighter grey for label
  tabLabelOn: { color: '#10B981', fontWeight: '800' },
  activeDot: { width: 4, height: 4, borderRadius: 2, marginTop: 4, position: 'absolute', bottom: -10 },
  centerTabContainer: { width: 68, alignItems: 'center', justifyContent: 'flex-start', height: 90, transform: [{ translateY: -18 }] },
  // Wrap around the center button is white, adds padding before gradient starts
  centerBotWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF', // 🟢 MADE WHITE
    padding: 7,
    // Soft shadow for the center button
    shadowColor: '#059669',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10
  },
  botGrad: { width: '100%', height: '100%', borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  // Badge border updated to match white background
  badge: { position: 'absolute', top: -6, right: -10, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
});