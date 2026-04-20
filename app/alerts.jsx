import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, UIManager, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

// Safety: We import it, but we'll check if it exists below
import * as StaticData from '../src/data/staticData';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─────────────────────────────────────────────────────
// FALLBACK SAMPLE DATA
// ─────────────────────────────────────────────────────
const SAMPLE_ALERTS = [
  {
    id: '1',
    type: 'weather', // Matches the 'Weather' tab
    ic: 'r',         // Red (Urgent)
    t: '10 mins ago',
    title: 'Heavy Rainfall Warning',
    msg: 'Expect sudden heavy rainfall in your area within the next 2 hours. Please secure any harvested crops.',
    area: 'Panaji, Goa',
    sev: 'critical'  // Triggers the pulsing CRITICAL badge
  },
  {
    id: '2',
    type: 'risk',    // Matches the 'Risk' tab
    ic: 'y',         // Yellow (Warning)
    t: '2 hours ago',
    title: 'High Pest Probability',
    msg: 'Conditions are highly favorable for Mango Hoppers today. A preventive Neem Oil spray is recommended.',
    area: 'Tiswadi Sector',
    sev: 'high'
  },
  {
    id: '3',
    type: 'tip',     // Matches the 'Tips' tab
    ic: 'b',         // Blue (Update)
    t: '5 hours ago',
    title: 'Market Price Surge',
    msg: 'Cashew nut prices have increased by ₹12/kg at the local APMC mandi since yesterday.',
    area: 'Local Mandi',
    sev: 'low'
  },
  {
    id: '4',
    type: 'tip',
    ic: 'g',         // Green (Tip)
    t: '1 day ago',
    title: 'Fertilizer Schedule',
    msg: 'It is time for the second split dose of Urea for your Paddy crop to ensure optimal vegetative growth.',
    area: 'Your Farm',
    sev: 'low'
  }
];

const FadeInItem = ({ delay = 0, children }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true })
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
};

export default function AlertsScreen() {
  const [filter, setFilter] = useState('all');

  // FIX: If StaticData is missing or empty, it uses our SAMPLE_ALERTS
  const rawAlerts = (StaticData.DEFAULT_ALERTS && StaticData.DEFAULT_ALERTS.length > 0)
    ? StaticData.DEFAULT_ALERTS
    : (StaticData.alerts && StaticData.alerts.length > 0)
      ? StaticData.alerts
      : SAMPLE_ALERTS;

  const alerts = rawAlerts.filter(a => filter === 'all' || a.type === filter);

  const TABS = [
    { v: 'all', l: 'All', i: 'layers-outline' },
    { v: 'risk', l: 'Risk', i: 'warning-outline' },
    { v: 'weather', l: 'Weather', i: 'cloudy-outline' },
    { v: 'tip', l: 'Tips', i: 'bulb-outline' }
  ];

  const TYPE_STYLES = {
    r: { bg: '#FEE2E2', icon: '#EF4444', label: 'Urgent' },
    y: { bg: '#FEF3C7', icon: '#D97706', label: 'Warning' },
    b: { bg: '#DBEAFE', icon: '#2563EB', label: 'Update' },
    g: { bg: '#ECFDF5', icon: '#10B981', label: 'Tip' },
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity style={styles.markReadBtn}>
            <Feather name="check-square" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.v}
              style={[styles.filterPill, filter === t.v && styles.filterPillActive]}
              onPress={() => setFilter(t.v)}
            >
              <Ionicons name={t.i} size={16} color={filter === t.v ? '#FFF' : '#64748B'} style={{marginRight: 6}} />
              <Text style={[styles.filterPillText, filter === t.v && styles.filterPillTextActive]}>{t.l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listPad}>
        <Text style={styles.timeSectionHeader}>LATEST UPDATES</Text>

        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-off-outline" size={60} color="#E2E8F0" />
            <Text style={styles.emptyText}>No alerts found</Text>
          </View>
        ) : (
          alerts.map((a, i) => {
            const theme = TYPE_STYLES[a.ic] || TYPE_STYLES.g;
            return (
              <FadeInItem key={a.id || i} delay={i * 60}>
                <TouchableOpacity activeOpacity={0.8} style={styles.alertCard}>
                  <View style={[styles.indicatorSide, { backgroundColor: theme.icon }]} />
                  <View style={styles.alertBody}>
                    <View style={styles.alertHeader}>
                      <View style={[styles.typeBadge, { backgroundColor: theme.bg }]}>
                        <Text style={[styles.typeBadgeText, { color: theme.icon }]}>{theme.label}</Text>
                      </View>
                      <Text style={styles.alertTime}>{a.t}</Text>
                    </View>
                    <Text style={styles.alertTitle}>{a.title}</Text>
                    <Text style={styles.alertMsg}>{a.msg}</Text>
                    <View style={styles.alertFooter}>
                      <View style={styles.locationWrap}>
                        <Ionicons name="location-sharp" size={14} color="#94A3B8" />
                        <Text style={styles.locationText}>{a.area}</Text>
                      </View>
                      {a.sev === 'critical' && (
                        <View style={styles.criticalBadge}>
                          <View style={styles.pulseDot} />
                          <Text style={styles.criticalText}>CRITICAL</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </FadeInItem>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerArea: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  markReadBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  filterScroll: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  filterPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F1F5F9' },
  filterPillActive: { backgroundColor: '#0F172A' },
  filterPillText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  filterPillTextActive: { color: '#FFFFFF' },
  listPad: { paddingBottom: 40 },
  timeSectionHeader: { fontSize: 12, fontWeight: '800', color: '#94A3B8', paddingHorizontal: 20, marginTop: 24, marginBottom: 12, letterSpacing: 1 },
  alertCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 12, borderRadius: 24, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10 },
  indicatorSide: { width: 6, height: '100%' },
  alertBody: { flex: 1, padding: 18 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  alertTime: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  alertTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  alertMsg: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 16 },
  alertFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locationWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  criticalBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  criticalText: { fontSize: 10, fontWeight: '900', color: '#EF4444' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 12, fontSize: 14, color: '#94A3B8', fontWeight: '600' }
});