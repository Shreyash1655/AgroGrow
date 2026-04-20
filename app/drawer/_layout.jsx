import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, StatusBar } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { useApp } from '../../src/store/AppContext';

const { width } = Dimensions.get('window');

// ─── CUSTOM MENU ITEM COMPONENT ───
const DrawerButton = ({ label, icon, route, currentPath, colorTheme }) => {
  const isActive = currentPath === route || (currentPath.includes('(tabs)') && route === '/drawer/(tabs)');
  const bgColor = isActive ? colorTheme.activeBg : 'transparent';
  const textColor = isActive ? colorTheme.activeText : '#475569';
  const iconColor = isActive ? colorTheme.activeText : '#94A3B8';

  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: bgColor }]}
      onPress={() => router.push(route)}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconBox, isActive && { backgroundColor: colorTheme.iconBg }]}>
        <Feather name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.menuItemText, { color: textColor }]}>{label}</Text>
      {isActive && <View style={[styles.activeIndicatorBar, { backgroundColor: colorTheme.activeText }]} />}
    </TouchableOpacity>
  );
};

function CustomDrawerContent(props) {
  const { user, weather } = useApp();
  const currentPath = usePathname();
  const temp = weather?.current?.temperature_2m || '--';

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" />

      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }} showsVerticalScrollIndicator={false}>
        {/* ─── 1. COMMAND CENTER HEADER ─── */}
        <LinearGradient
          colors={['#022C22', '#064E3B', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1.5 }}
          style={styles.headerGradient}
        >
          {/* Top Row: Avatar & Settings */}
          <View style={styles.headerTop}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarTxt}>{user?.name?.charAt(0) || 'S'}</Text>
              </View>
              <View style={styles.activeStatusDot} />
            </View>
            <TouchableOpacity style={styles.settingsIcon} onPress={() => router.push('/drawer/profile')}>
              <Feather name="sliders" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <Text style={styles.userName}>{user?.name || 'Shrey'}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.userRole}>AGROMYSTIC • PANAJI</Text>
          </View>

          {/* ─── GLASSMORPHISM STATS CARD ─── */}
          <View style={styles.glassCard}>
            <View style={styles.miniStat}>
              <Feather name="thermometer" size={18} color="#FDE047" />
              <Text style={styles.statVal}>{temp}°C <Text style={styles.statLbl}>LOCAL</Text></Text>
            </View>
            <View style={styles.statLine} />
            <View style={styles.miniStat}>
              <Animated.View style={{ opacity: pulseAnim }}>
                <MaterialCommunityIcons name="brain" size={20} color="#60A5FA" />
              </Animated.View>
              <Text style={[styles.statVal, { color: '#60A5FA' }]}>AI Active</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ─── 2. CORE NAVIGATION ─── */}
        <View style={styles.navSection}>
          <Text style={styles.sectionLabel}>INTELLIGENCE</Text>

          <DrawerButton
            label="Command Deck"
            icon="grid"
            route="/drawer/(tabs)"
            currentPath={currentPath}
            colorTheme={{ activeBg: '#ECFDF5', activeText: '#059669', iconBg: '#D1FAE5' }}
          />
          <DrawerButton
            label="Crop Lifecycle"
            icon="clock"
            route="/drawer/calendar"
            currentPath={currentPath}
            colorTheme={{ activeBg: '#FFFBEB', activeText: '#D97706', iconBg: '#FEF3C7' }}
          />
          <DrawerButton
            label="Soil Analytics"
            icon="layers"
            route="/drawer/soil"
            currentPath={currentPath}
            colorTheme={{ activeBg: '#F3F4F6', activeText: '#475569', iconBg: '#E2E8F0' }}
          />
          <DrawerButton
            label="Risk Topography"
            icon="map-pin"
            route="/drawer/map"
            currentPath={currentPath}
            colorTheme={{ activeBg: '#FEF2F2', activeText: '#DC2626', iconBg: '#FEE2E2' }}
          />

          {/* 👇 NEW SCHEMES BUTTON ADDED HERE 👇 */}
          <DrawerButton
            label="Govt Schemes"
            icon="file-text"
            route="/drawer/schemes"
            currentPath={currentPath}
            colorTheme={{ activeBg: '#EEF2FF', activeText: '#2563EB', iconBg: '#DBEAFE' }}
          />
        </View>

        <View style={styles.divider} />

        {/* ─── 3. COMMUNITY & SUPPORT ─── */}
        <View style={styles.navSection}>
          <Text style={styles.sectionLabel}>NETWORK</Text>

          {/* Note: Ensure '/drawer/community' is correct based on your routing setup */}
          <TouchableOpacity style={styles.customActionItem} onPress={() => router.push('/drawer/community')}>
            <View style={[styles.actionIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="chatbubbles-outline" size={18} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.actionLabel}>Goa Agri Forum</Text>
              <Text style={styles.actionSub}>Discuss with 500+ farmers</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.customActionItem}>
            <View style={[styles.actionIconBox, { backgroundColor: '#F3E8FF' }]}>
              <Feather name="life-buoy" size={18} color="#7E22CE" />
            </View>
            <View>
              <Text style={styles.actionLabel}>Expert Support</Text>
              <Text style={styles.actionSub}>KVK Agronomist Hotline</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </DrawerContentScrollView>

      {/* ─── 4. SYSTEM FOOTER ─── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/(auth)/login')}>
          <View style={styles.logoutIconBg}>
            <Feather name="power" size={16} color="#EF4444" />
          </View>
          <Text style={styles.logoutTxt}>Disconnect</Text>
        </TouchableOpacity>
        <Text style={styles.versionTxt}>v1.3.0 · <Text style={{ color: '#10B981' }}>System Secured</Text></Text>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="(tabs)" />
      <Drawer.Screen name="calendar" />
      <Drawer.Screen name="soil" />
      <Drawer.Screen name="map" />

      {/* 👇 NEW SCHEMES ROUTE REGISTERED HERE 👇 */}
      <Drawer.Screen name="schemes" />
    </Drawer>
  );
}

// ─── STYLES ───
const styles = StyleSheet.create({
  // Header
  headerGradient: { padding: 24, paddingTop: 65, borderBottomRightRadius: 45, marginBottom: 20, elevation: 15, shadowColor: '#022C22', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  avatarWrapper: { position: 'relative' },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#34D399' },
  avatarTxt: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  activeStatusDot: { position: 'absolute', bottom: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#10B981', borderWidth: 3, borderColor: '#022C22' },
  settingsIcon: { padding: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16 },
  userName: { color: '#FFF', fontSize: 26, fontWeight: '900', marginTop: 16, letterSpacing: -0.5 },
  rolePill: { backgroundColor: 'rgba(16, 185, 129, 0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginTop: 8 },
  userRole: { color: '#34D399', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },

  // Glass Stats
  glassCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 18, marginTop: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' },
  statVal: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  statLbl: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700' },
  statLine: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Navigation Sections
  navSection: { paddingHorizontal: 20, marginTop: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '900', color: '#94A3B8', marginLeft: 15, marginBottom: 15, letterSpacing: 1.5 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 35, marginVertical: 20 },

  // Custom Menu Buttons
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 18, marginBottom: 8, overflow: 'hidden' },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 15, backgroundColor: 'transparent' },
  menuItemText: { fontSize: 15, fontWeight: '800', flex: 1 },
  activeIndicatorBar: { position: 'absolute', left: 0, top: '25%', bottom: '25%', width: 4, borderRadius: 2 },

  // Action Items (Network)
  customActionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, marginBottom: 10, backgroundColor: '#FFF', borderRadius: 20, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  actionIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  actionLabel: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
  actionSub: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 35, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FFF' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoutIconBg: { padding: 10, borderRadius: 12, backgroundColor: '#FEF2F2' },
  logoutTxt: { fontSize: 15, fontWeight: '800', color: '#EF4444' },
  versionTxt: { fontSize: 11, color: '#94A3B8', fontWeight: '800' },
});