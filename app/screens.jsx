import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, LayoutAnimation, Platform, UIManager, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
// Premium Vector Icons
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

// Ensure your AppContext and staticData paths are correct
import { useApp } from '../src/store/AppContext';
import { PESTS, DEFAULT_ALERTS } from '../src/data/staticData';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ─── Premium Animation Wrapper ─────────────────────────── */
const FadeInView = ({ delay = 0, children, style }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true })
    ]).start();
  }, []);

  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
};


// ═══════════════════════════════════════════════════
// PEST SCREEN
// ═══════════════════════════════════════════════════
export function PestScreen() {
  const { weather, user } = useApp();
  const [crop, setCrop] = useState(user?.crops?.[0] || 'cashew');
  const [expanded, setExpanded] = useState({});

  const w = weather?.current ? { h: weather.current.relativehumidity_2m, t: weather.current.temperature_2m, wind: Math.round(weather.current.windspeed_10m) } : { h: 75, t: 28, wind: 12 };

  const riskLevel = w.h > 85 ? 'CRITICAL' : w.h > 70 ? 'HIGH' : w.h > 55 ? 'MEDIUM' : 'LOW';
  const riskColor = w.h > 70 ? '#EF4444' : w.h > 55 ? '#F59E0B' : '#10B981';

  const pests = PESTS?.[crop] || [];

  const RISK_STYLE = {
    hi: { bg: '#FEE2E2', text: '#B91C1C', label: 'HIGH RISK', icon: 'warning' },
    me: { bg: '#FEF3C7', text: '#B45309', label: 'MODERATE', icon: 'alert-circle' },
    lo: { bg: '#ECFDF5', text: '#047857', label: 'LOW RISK', icon: 'checkmark-circle' },
  };

  const toggle = (i) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(e => ({ ...e, [i]: !e[i] }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pests & Disease</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>

        {/* Crop Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cropSelector}>
          {['cashew','paddy','coconut'].map(c => (
            <TouchableOpacity key={c} style={[styles.cropChip, crop === c && styles.cropChipActive]} onPress={() => setCrop(c)}>
              <MaterialCommunityIcons name={c === 'cashew' ? 'peanut' : c === 'paddy' ? 'grass' : 'palm-tree'} size={18} color={crop === c ? '#FFF' : '#64748B'} style={{ marginRight: 6 }} />
              <Text style={[styles.cropChipText, crop === c && styles.cropChipTextActive]}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Environmental Risk Factors */}
        <View style={styles.weatherMetricsGrid}>
          {[
            { val: `${w.t}°`, lbl: 'Temp', ico: 'thermometer' },
            { val: `${w.h}%`, lbl: 'Humidity', ico: 'water' },
            { val: riskLevel, lbl: 'Risk Level', ico: 'shield-alert', color: riskColor },
            { val: `${w.wind}`, lbl: 'km/h', ico: 'weather-windy' }
          ].map((cell, i) => (
            <View key={i} style={styles.metricCard}>
              <MaterialCommunityIcons name={cell.ico} size={20} color={cell.color || '#64748B'} />
              <Text style={[styles.metricVal, cell.color && { color: cell.color }]}>{cell.val}</Text>
              <Text style={styles.metricLbl}>{cell.lbl}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeading}>Identified Threats ({pests.length})</Text>

        {pests.map((p, i) => {
          const risk = p.rfn ? p.rfn(w) : 'me'; // Fallback to medium
          const rs = RISK_STYLE[risk];
          const isExp = expanded[i];

          return (
            <FadeInView key={i} delay={i * 80}>
              <View style={[styles.pestCard, isExp && styles.pestCardExpanded]}>
                <TouchableOpacity onPress={() => toggle(i)} activeOpacity={0.7} style={styles.pestHeader}>
                  <View style={styles.pestIconWrap}>
                    <MaterialCommunityIcons name="bug" size={24} color="#64748B" />
                  </View>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.pestName}>{p.nm}</Text>
                    <Text style={styles.pestSeason}>Season: {p.sea}</Text>
                  </View>
                  <View style={styles.pestRightCol}>
                    <View style={[styles.riskBadge, { backgroundColor: rs.bg }]}>
                      <Ionicons name={rs.icon} size={12} color={rs.text} style={{ marginRight: 4 }} />
                      <Text style={[styles.riskBadgeText, { color: rs.text }]}>{rs.label}</Text>
                    </View>
                    <Ionicons name={isExp ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" style={{ marginTop: 8, alignSelf: 'flex-end' }} />
                  </View>
                </TouchableOpacity>

                {isExp && (
                  <View style={styles.pestBody}>
                    <View style={styles.divider} />
                    <Text style={styles.pestDesc}>{p.desc}</Text>
                    <View style={styles.actionPlanBox}>
                      <Text style={styles.actionPlanTitle}>Action Plan</Text>
                      {p.tips.map((t, j) => (
                        <View key={j} style={styles.tipRow}>
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginTop: 2, marginRight: 8 }} />
                          <Text style={styles.tipText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </FadeInView>
          );
        })}
      </ScrollView>
    </View>
  );
}


// ═══════════════════════════════════════════════════
// IRRIGATION SCREEN
// ═══════════════════════════════════════════════════
export function IrrigationScreen() {
  const { weather, user } = useApp();
  const [crop, setCrop] = useState(user?.crops?.[0] || 'paddy');
  const [size, setSize] = useState(String(user?.farmSize || '1.5'));
  const [lastIrr, setLastIrr] = useState('3');
  const [stage, setStage] = useState('veg');

  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  function calc() {
    setAnalyzing(true);
    setResult(null);
    fadeAnim.setValue(0);

    setTimeout(() => {
      const w = weather?.current || { relativehumidity_2m: 70, temperature_2m: 28, windspeed_10m: 12 };
      const hum = w.relativehumidity_2m, temp = w.temperature_2m;
      const rain = weather?.daily?.precipitation_probability_max?.[0] || 0;
      const daysAgo = parseInt(lastIrr);
      const acres = parseFloat(size) || 1;

      const cropNeed = { paddy:6, cashew:3, coconut:4, vegetable:5 };
      const stageMulti = { seed:0.7, veg:1.0, flower:1.3, fruit:1.1 };

      let needed = (cropNeed[crop] || 5) * stageMulti[stage];
      if (hum > 80) needed *= 0.6;
      else if (hum > 65) needed *= 0.8;
      if (temp > 35) needed *= 1.2;

      const totalLitres = Math.round(needed * acres * 4047);
      const hours = Math.round((totalLitres / 1500) * 10) / 10;

      let urgency = 'Optimal Moisture', urgencyColor = '#10B981', urgencyBg = '#D1FAE5', urgencyIco = 'checkmark-circle';
      if (daysAgo >= 4 && hum < 60) { urgency = 'Irrigate Immediately'; urgencyColor = '#DC2626'; urgencyBg = '#FEE2E2'; urgencyIco = 'alert-circle'; }
      else if (daysAgo >= 3 && hum < 75) { urgency = 'Irrigate Today'; urgencyColor = '#D97706'; urgencyBg = '#FEF3C7'; urgencyIco = 'warning'; }
      else if (rain > 60) { urgency = 'Rain Expected (Skip)'; urgencyColor = '#2563EB'; urgencyBg = '#DBEAFE'; urgencyIco = 'cloud-down'; }

      const bestTime = hum > 80 ? '6:00 AM – 8:00 AM' : temp > 33 ? '5:30 AM – 7:00 AM' : '6:00 AM or 5:00 PM';

      const tips = [];
      if (hum < 50) tips.push('High evaporation rate. Water early morning to minimize loss.');
      if (rain > 50) tips.push(`${rain}% chance of rain tomorrow. Conserve water today.`);
      if (crop === 'cashew') tips.push('Cashews are drought-tolerant. Allow topsoil to dry before watering.');

      setResult({ urgency, urgencyColor, urgencyBg, urgencyIco, totalLitres, hours, bestTime, tips, mm: Math.round(needed) });
      setAnalyzing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 800);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Smart Irrigation</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>

        {/* Bento Box Selections */}
        <Text style={styles.inputLabel}>Select Crop</Text>
        <View style={styles.bentoGrid}>
          {['paddy','cashew','coconut','vegetable'].map(c => (
            <TouchableOpacity key={c} style={[styles.bentoSelect, crop===c && styles.bentoSelectActive]} onPress={() => setCrop(c)}>
              <MaterialCommunityIcons name={c==='paddy'?'grass':c==='cashew'?'peanut':c==='coconut'?'palm-tree':'leaf'} size={24} color={crop===c ? '#10B981' : '#64748B'} />
              <Text style={[styles.bentoSelectText, crop===c && styles.bentoSelectTextActive]}>{c.charAt(0).toUpperCase() + c.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>Farm Size (Acres)</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="map-outline" size={20} color="#94A3B8" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.textInput}
            value={size}
            onChangeText={setSize}
            placeholder="e.g. 1.5"
            keyboardType="decimal-pad"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <Text style={styles.inputLabel}>Last Irrigated</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 20 }}>
          {[{v:'0',l:'Today'},{v:'1',l:'Yesterday'},{v:'2',l:'2 Days'},{v:'3',l:'3 Days'},{v:'5',l:'4+ Days'}].map(o => (
            <TouchableOpacity key={o.v} style={[styles.pillSelect, lastIrr===o.v && styles.pillSelectActive]} onPress={() => setLastIrr(o.v)}>
              <Text style={[styles.pillSelectText, lastIrr===o.v && styles.pillSelectTextActive]}>{o.l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.inputLabel}>Growth Stage</Text>
        <View style={styles.bentoGrid}>
          {[{v:'seed',l:'Seedling', i:'seed'},{v:'veg',l:'Vegetative', i:'leaf'},{v:'flower',l:'Flowering', i:'flower'},{v:'fruit',l:'Fruiting', i:'fruit-cherries'}].map(o => (
            <TouchableOpacity key={o.v} style={[styles.bentoSelect, stage===o.v && styles.bentoSelectActive]} onPress={() => setStage(o.v)}>
              <MaterialCommunityIcons name={o.i} size={24} color={stage===o.v ? '#10B981' : '#64748B'} />
              <Text style={[styles.bentoSelectText, stage===o.v && styles.bentoSelectTextActive]}>{o.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={calc} disabled={analyzing} style={styles.primaryBtn}>
          {analyzing ? <Text style={styles.primaryBtnText}>Analyzing Data...</Text> : (
            <>
              <Ionicons name="water" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Generate Recommendation</Text>
            </>
          )}
        </TouchableOpacity>

        {result && (
          <Animated.View style={{ opacity: fadeAnim, marginTop: 10 }}>
            <View style={[styles.resultHero, { backgroundColor: result.urgencyBg, borderColor: result.urgencyColor }]}>
              <Ionicons name={result.urgencyIco} size={28} color={result.urgencyColor} />
              <Text style={[styles.resultUrgencyText, { color: result.urgencyColor }]}>{result.urgency}</Text>
            </View>

            <View style={styles.resultMetricsRow}>
              {[
                { v: `${result.totalLitres.toLocaleString()}L`, l: 'Total Water', i: 'water-outline' },
                { v: `${result.hours}h`, l: 'Pump Time', i: 'time-outline' },
                { v: `${result.mm}mm`, l: 'Depth', i: 'layers-outline' }
              ].map((m, i) => (
                <View key={i} style={styles.resultMetricBox}>
                  <Ionicons name={m.i} size={20} color="#64748B" marginBottom={4} />
                  <Text style={styles.resultMetricVal}>{m.v}</Text>
                  <Text style={styles.resultMetricLbl}>{m.l}</Text>
                </View>
              ))}
            </View>

            <View style={styles.adviceCard}>
              <View style={styles.adviceCardHeader}>
                <Ionicons name="alarm" size={20} color="#10B981" />
                <Text style={styles.adviceCardTitle}>Optimal Schedule</Text>
              </View>
              <Text style={styles.adviceCardVal}>{result.bestTime}</Text>
            </View>

            {result.tips.map((t, i) => (
              <View key={i} style={styles.tipBox}>
                <Ionicons name="bulb" size={20} color="#F59E0B" style={{ marginRight: 12, marginTop: 2 }} />
                <Text style={styles.tipBoxText}>{t}</Text>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}


// ═══════════════════════════════════════════════════
// ALERTS SCREEN
// ═══════════════════════════════════════════════════
export function AlertsScreen() {
  const [filter, setFilter] = useState('all');
  const alerts = DEFAULT_ALERTS.filter(a => filter === 'all' || a.type === filter);

  const TABS = [{ v:'all',l:'All' },{ v:'risk',l:'Risk' },{ v:'weather',l:'Weather' },{ v:'tip',l:'Tips' }];

  const TYPE_STYLES = {
    r: { bg: '#FEE2E2', icon: '#EF4444' }, // Red
    y: { bg: '#FEF3C7', icon: '#F59E0B' }, // Yellow
    b: { bg: '#DBEAFE', icon: '#3B82F6' }, // Blue
    g: { bg: '#D1FAE5', icon: '#10B981' }, // Green
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
          <View style={{ width: 40 }} />
        </View>

        {/* Sleek Horizontal Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {TABS.map(t => (
            <TouchableOpacity key={t.v} style={[styles.filterPill, filter===t.v && styles.filterPillActive]} onPress={() => setFilter(t.v)}>
              <Text style={[styles.filterPillText, filter===t.v && styles.filterPillTextActive]}>{t.l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.timeSectionHeader}>TODAY</Text>

        {alerts.map((a, i) => {
          const style = TYPE_STYLES[a.ic] || TYPE_STYLES.g;

          return (
            <FadeInView key={a.id} delay={i * 50}>
              <TouchableOpacity activeOpacity={0.7} style={styles.alertListItem}>
                <View style={[styles.alertIconBox, { backgroundColor: style.bg }]}>
                  {/* Map your old emoji a.ico to a proper vector icon if possible, or just render it */}
                  <Text style={{ fontSize: 20 }}>{a.ico}</Text>
                </View>

                <View style={styles.alertContent}>
                  <View style={styles.alertTitleRow}>
                    <Text style={styles.alertTitle} numberOfLines={1}>{a.title}</Text>
                    <Text style={styles.alertTime}>{a.t}</Text>
                  </View>

                  <Text style={styles.alertMsg} numberOfLines={2}>{a.msg}</Text>

                  <View style={styles.alertTagsRow}>
                    <View style={styles.alertTag}>
                      <Ionicons name="location-outline" size={12} color="#64748B" />
                      <Text style={styles.alertTagText}>{a.area}</Text>
                    </View>
                    <View style={[styles.alertTag, { backgroundColor: style.bg }]}>
                      <Text style={[styles.alertTagText, { color: style.icon, fontWeight: '700' }]}>{a.pill}</Text>
                    </View>
                  </View>

                  {a.actions && (
                    <View style={styles.alertActionsRow}>
                      {a.actions.map((x, j) => (
                        <TouchableOpacity key={j} style={[styles.actionBtnSm, x.s && styles.actionBtnSmPrimary]}>
                          <Text style={[styles.actionBtnSmText, x.s && { color: '#FFF' }]}>{x.l}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </FadeInView>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

/* ─── Shared Premium Styles ─────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollPad: { padding: 20, paddingBottom: 100 },

  // Headers
  headerArea: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },

  // Generic Typography
  sectionHeading: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 24, marginBottom: 12, letterSpacing: -0.3 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },

  /* --- Pest Screen --- */
  cropSelector: { gap: 10, paddingVertical: 10 },
  cropChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  cropChipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  cropChipText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  cropChipTextActive: { color: '#FFFFFF' },

  weatherMetricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  metricCard: { flex: 1, minWidth: '45%', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  metricVal: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  metricLbl: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 2 },

  pestCard: { backgroundColor: '#FFFFFF', borderRadius: 24, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: 'transparent' },
  pestCardExpanded: { borderColor: '#E2E8F0' },
  pestHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  pestIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  pestName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  pestSeason: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 2 },
  pestRightCol: { alignItems: 'flex-end' },
  riskBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  riskBadgeText: { fontSize: 10, fontWeight: '800' },

  pestBody: { paddingHorizontal: 16, paddingBottom: 20 },
  pestDesc: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 16 },
  actionPlanBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16 },
  actionPlanTitle: { fontSize: 12, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  tipText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 20 },

  /* --- Irrigation Screen --- */
  inputLabel: { fontSize: 13, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 10 },
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bentoSelect: { flex: 1, minWidth: '45%', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', gap: 8 },
  bentoSelectActive: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  bentoSelectText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  bentoSelectTextActive: { color: '#059669' },

  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, paddingHorizontal: 16, height: 60 },
  textInput: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0F172A' },

  pillSelect: { backgroundColor: '#FFFFFF', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  pillSelectActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  pillSelectText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  pillSelectTextActive: { color: '#FFFFFF' },

  primaryBtn: { flexDirection: 'row', backgroundColor: '#10B981', paddingVertical: 18, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: 30, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 6 },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },

  resultHero: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderWidth: 1, marginTop: 20 },
  resultUrgencyText: { fontSize: 18, fontWeight: '900', marginLeft: 12 },
  resultMetricsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  resultMetricBox: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5, elevation: 1 },
  resultMetricVal: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  resultMetricLbl: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 2 },

  adviceCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginTop: 12, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5, elevation: 1 },
  adviceCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  adviceCardTitle: { fontSize: 12, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 8 },
  adviceCardVal: { fontSize: 22, fontWeight: '900', color: '#0F172A' },

  tipBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFBEB', padding: 16, borderRadius: 16, marginTop: 12 },
  tipBoxText: { flex: 1, fontSize: 14, color: '#92400E', lineHeight: 22, fontWeight: '500' },

  /* --- Alerts Screen --- */
  filterScroll: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9' },
  filterPillActive: { backgroundColor: '#10B981' },
  filterPillText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  filterPillTextActive: { color: '#FFFFFF' },

  timeSectionHeader: { fontSize: 12, fontWeight: '800', color: '#94A3B8', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, letterSpacing: 1 },

  alertListItem: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  alertIconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  alertContent: { flex: 1 },
  alertTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  alertTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', flex: 1, paddingRight: 10 },
  alertTime: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  alertMsg: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 12 },

  alertTagsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  alertTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  alertTagText: { fontSize: 11, fontWeight: '600', color: '#64748B', marginLeft: 4 },

  alertActionsRow: { flexDirection: 'row', gap: 8 },
  actionBtnSm: { backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  actionBtnSmPrimary: { backgroundColor: '#10B981' },
  actionBtnSmText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
});
// Add this at the end of the file
export default function ScreensPlaceholder() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
      <Text style={{ color: '#64748B', fontWeight: '600' }}>Screen Container Loaded</Text>
    </View>
  );
}