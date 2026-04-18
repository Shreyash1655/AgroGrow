import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, StatusBar, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';

import { useApp } from '../../src/store/AppContext'; // ✅ Correct
/* ─── Premium Setting Row Component ────────────────────── */
function SettingRow({ name, label, sublabel, right, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.settingIcon, danger && { backgroundColor: '#FEE2E2' }]}>
        <Ionicons name={name} size={20} color={danger ? '#EF4444' : '#10B981'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, danger && { color: '#EF4444' }]}>{label}</Text>
        {sublabel ? <Text style={styles.settingSub}>{sublabel}</Text> : null}
      </View>
      {right || <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useApp();
  const [notifOn, setNotifOn] = useState(true);

  const cropsCount = (user?.crops || []).length;
  const initials = user?.name?.[0]?.toUpperCase() || 'F';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of AgroGROW?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/onboard'); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* IMMERSIVE HERO */}
        <LinearGradient colors={['#064E3B', '#10B981']} style={styles.hero}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroContent}>
              <View style={styles.avatarBorder}>
                <View style={styles.avatar}>
                   <Text style={styles.avatarText}>{initials}</Text>
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.heroName}>{user?.name || 'Farmer'}</Text>
                <View style={styles.locationBadge}>
                  <Ionicons name="location" size={12} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.locationText}>{user?.taluka || 'Goa'}, India</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.glassEditBtn}>
                <Feather name="edit-3" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* QUICK STATS BENTO */}
            <View style={styles.statsBento}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{cropsCount}</Text>
                <Text style={styles.statLbl}>Active Crops</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{user?.farmSize || '0'}</Text>
                <Text style={styles.statLbl}>Acres</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{user?.soil?.split(' ')[0] || 'Laterite'}</Text>
                <Text style={styles.statLbl}>Soil Type</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* FARM MANAGEMENT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farm Tools</Text>
          <View style={styles.card}>
            <SettingRow name="calendar-outline" label="Crop Calendar" sublabel="Your personalized season guide" onPress={() => router.push('/calendar')} />
            <SettingRow name="leaf-outline" label="Soil Advisor" sublabel="Advanced nutrient analysis" onPress={() => router.push('/pest')} />
            <SettingRow name="water-outline" label="Irrigation Log" sublabel="Manage pump schedules" onPress={() => router.push('/irrigation')} />
          </View>
        </View>

        {/* APP PREFERENCES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <SettingRow
              name="notifications-outline"
              label="Push Notifications"
              sublabel="Critical weather & pest alerts"
              onPress={() => setNotifOn(!notifOn)}
              right={
                <TouchableOpacity onPress={() => setNotifOn(!notifOn)} style={[styles.toggleBase, notifOn && styles.toggleActive]}>
                  <View style={[styles.toggleKnob, notifOn && styles.toggleKnobActive]} />
                </TouchableOpacity>
              }
            />
            <SettingRow name="language-outline" label="App Language" sublabel="English / Konkani / Hindi" />
            <SettingRow name="help-buoy-outline" label="Support Center" sublabel="Contact Goa Agri Officers" />
          </View>
        </View>

        {/* DANGER ZONE */}
        <View style={styles.section}>
          <View style={styles.card}>
            <SettingRow name="log-out-outline" label="Sign Out" danger onPress={handleLogout} />
          </View>
          <Text style={styles.versionTxt}>AgroGROW v2.4.0 • Build 2026</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  hero: { paddingBottom: 30, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  heroContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, marginTop: 10 },
  avatarBorder: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', padding: 4 },
  avatar: { flex: 1, backgroundColor: '#FFF', borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#10B981' },
  heroName: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  locationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 6, alignSelf: 'flex-start' },
  locationText: { color: '#FFF', fontSize: 12, fontWeight: '700', marginLeft: 5 },
  glassEditBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  statsBento: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 25, marginTop: 25, borderRadius: 24, padding: 20, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  statLbl: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginTop: 4 },
  statDivider: { width: 1, height: '100%', backgroundColor: '#F1F5F9' },

  section: { paddingHorizontal: 20, marginTop: 25 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 5 },
  card: { backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', elevation: 2 },

  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  settingIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  settingLabel: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  settingSub: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '500' },

  toggleBase: { width: 46, height: 26, borderRadius: 13, backgroundColor: '#E2E8F0', padding: 3, justifyContent: 'center' },
  toggleActive: { backgroundColor: '#10B981' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' },
  toggleKnobActive: { alignSelf: 'flex-end' },

  versionTxt: { textAlign: 'center', marginTop: 20, color: '#CBD5E1', fontSize: 11, fontWeight: '700' },
});