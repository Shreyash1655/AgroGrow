import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Radius, Shadows } from '../../src/theme';
import { useApp } from '../../src/store/AppContext';

function NavIcon({ name, focused }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: focused ? 1.15 : 1, tension: 200, friction: 10, useNativeDriver: true }).start();
  }, [focused]);

  const icons = {
    home:      focused ? '🏡' : '🏠',
    community: focused ? '🌍' : '🌐',
    chatbot:   '🤖',
    market:    focused ? '🛒' : '🛍️',
    profile:   focused ? '👤' : '👤',
  };

  const svgs = {
    home: (
      <Animated.Text style={[styles.tabIcoEmoji, { transform: [{ scale }] }]}>{icons.home}</Animated.Text>
    ),
    community: (
      <Animated.Text style={[styles.tabIcoEmoji, { transform: [{ scale }] }]}>{icons.community}</Animated.Text>
    ),
    chatbot: (
      <Animated.View style={[styles.botBtn, { transform: [{ scale }] }]}>
        <LinearGradient colors={[Colors.g4, Colors.g3]} style={styles.botGrad}>
          <Text style={{ fontSize: 20 }}>🤖</Text>
        </LinearGradient>
      </Animated.View>
    ),
    market: (
      <Animated.Text style={[styles.tabIcoEmoji, { transform: [{ scale }] }]}>{icons.market}</Animated.Text>
    ),
    profile: (
      <Animated.Text style={[styles.tabIcoEmoji, { transform: [{ scale }] }]}>{icons.profile}</Animated.Text>
    ),
  };
  return svgs[name] || null;
}

function TabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { cartTotal } = useApp();

  const tabs = [
    { name: 'home', label: 'Home' },
    { name: 'community', label: 'Explore' },
    { name: 'chatbot', label: null, isCenter: true },
    { name: 'market', label: 'Market' },
    { name: 'profile', label: 'Profile' },
  ];

  return (
    <View style={[styles.navWrap, { paddingBottom: Math.max(insets.bottom - 8, 8) }]}>
      <LinearGradient colors={[Colors.g1, '#0a2e1a']} style={styles.navBar}>
        {tabs.map((tab, i) => {
          const isFocused = state.routes[state.index]?.name === tab.name;
          function onPress() {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate(tab.name);
          }
          if (tab.isCenter) {
            return (
              <TouchableOpacity key={tab.name} onPress={onPress} style={styles.centerTabWrap} activeOpacity={0.85}>
                <NavIcon name="chatbot" focused={isFocused} />
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity key={tab.name} onPress={onPress} style={[styles.tabItem, isFocused && styles.tabItemOn]} activeOpacity={0.8}>
              <View style={{ position: 'relative' }}>
                <NavIcon name={tab.name} focused={isFocused} />
                {tab.name === 'market' && cartTotal > 0 && (
                  <View style={styles.badge}><Text style={styles.badgeText}>{cartTotal}</Text></View>
                )}
              </View>
              {tab.label && <Text style={[styles.tabLabel, isFocused && styles.tabLabelOn]}>{tab.label}</Text>}
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
}

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
  navWrap: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: 'transparent' },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderRadius: 32, paddingHorizontal: 8, height: 62, ...Shadows.sh3 },
  tabItem: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 8, borderRadius: 22 },
  tabItemOn: { backgroundColor: 'rgba(255,255,255,.15)' },
  tabIcoEmoji: { fontSize: 20 },
  tabLabel: { fontFamily: Fonts.extraBold, fontSize: 9, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: 0.4 },
  tabLabelOn: { color: '#fff' },
  centerTabWrap: { width: 52, alignItems: 'center', justifyContent: 'center', marginTop: -14 },
  botBtn: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', ...Shadows.sh2 },
  botGrad: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.red, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.g1 },
  badgeText: { fontFamily: Fonts.black, fontSize: 9, color: '#fff' },
});
