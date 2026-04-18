import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/store/AppContext';

const { width } = Dimensions.get('window');

/* ─── Animated Icon Component ───────────────────────────── */
function NavIcon({ name, focused }) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.15 : 1,
        tension: 300,
        friction: 15,
        useNativeDriver: true
      }),
      Animated.spring(translateY, {
        toValue: focused ? -4 : 0,
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

  const activeColor = '#10B981';
  const inactiveColor = '#64748B';

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

  // 🔥 THE FIX: Get the current active route name
  const currentRoute = state.routes[state.index].name;

  // 🔥 If the user is on the chatbot screen, return null to hide the bar
  if (currentRoute === 'chatbot') {
    return null;
  }

  const tabs = [
    { name: 'home', label: 'Home' },
    { name: 'community', label: 'Explore' },
    { name: 'chatbot', label: null, isCenter: true },
    { name: 'market', label: 'Market' },
    { name: 'profile', label: 'Profile' },
  ];

  return (
    <View style={[styles.navContainer, { bottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
      <View style={styles.navBar}>
        {tabs.map((tab, i) => {
          // Identify if the tab is focused based on state index
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
              <TouchableOpacity
                key={tab.name}
                onPress={onPress}
                activeOpacity={0.9}
                style={styles.centerTabContainer}
              >
                <NavIcon name="chatbot" focused={isFocused} />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              <View>
                <NavIcon name={tab.name} focused={isFocused} />
                {tab.name === 'market' && cartTotal > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartTotal > 9 ? '9+' : cartTotal}</Text>
                  </View>
                )}
              </View>
              {tab.label && (
                <Text style={[styles.tabLabel, isFocused && styles.tabLabelOn]}>
                  {tab.label}
                </Text>
              )}
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
    <Tabs tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="community" />
      <Tabs.Screen name="chatbot" />
      <Tabs.Screen name="market" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  navContainer: { position: 'absolute', left: 20, right: 20, alignItems: 'center' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    borderRadius: 36,
    height: 72,
    width: '100%',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 15,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  tabLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', marginTop: 4 },
  tabLabelOn: { color: '#10B981', fontWeight: '800' },
  activeDot: { width: 4, height: 4, borderRadius: 2, marginTop: 4, position: 'absolute', bottom: -10 },
  centerTabContainer: { width: 68, alignItems: 'center', justifyContent: 'flex-start', height: 90, transform: [{ translateY: -18 }] },
  centerBotWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#111827', padding: 6, elevation: 8 },
  botGrad: { width: '100%', height: '100%', borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -6, right: -10, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#111827' },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
});