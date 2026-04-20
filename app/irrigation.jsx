import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, Platform, UIManager, StatusBar, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
// Premium Vector Icons
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useApp } from '../src/store/AppContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function IrrigationScreen() {
  const { weather, user } = useApp();
  const [crop, setCrop] = useState(user?.crops?.[0] || 'paddy');
  const [size, setSize] = useState(String(user?.farmSize || '1.5'));
  const [lastIrr, setLastIrr] = useState('3');
  const [stage, setStage] = useState('veg');

  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  function calculateIrrigation() {
    setAnalyzing(true);
    setResult(null);
    fadeAnim.setValue(0);

    // Simulate AI Processing delay
    setTimeout(() => {
      const w = weather?.current || { relativehumidity_2m: 70, temperature_2m: 28, windspeed_10m: 12 };
      const hum = w.relativehumidity_2m, temp = w.temperature_2m;
      const rain = weather?.daily?.precipitation_probability_max?.[0] || 0;
      const daysAgo = parseInt(lastIrr);
      const acres = parseFloat(size) || 1;

      const cropNeed = { paddy: 6, cashew: 3, coconut: 4, vegetable: 5 };
      const stageMulti = { seed: 0.7, veg: 1.0, flower: 1.3, fruit: 1.1 };

      let needed = (cropNeed[crop] || 5) * stageMulti[stage];
      if (hum > 80) needed *= 0.6;
      else if (hum > 65) needed *= 0.8;
      if (temp > 35) needed *= 1.2;

      const totalLitres = Math.round(needed * acres * 4047);
      const hours = Math.round((totalLitres / 1500) * 10) / 10;

      let urgency = 'Optimal Moisture', urgencyColor = '#10B981', urgencyBg = '#D1FAE5', urgencyIco = 'checkmark-circle';
      if (daysAgo >= 4 && hum < 60) { urgency = 'Irrigate Immediately'; urgencyColor = '#DC2626'; urgencyBg = '#FEE2E2'; urgencyIco = 'alert-circle'; }
      else if (daysAgo >= 3 && hum < 75) { urgency = 'Irrigate Today'; urgencyColor = '#D97706'; urgencyBg = '#FEF3C7'; urgencyIco = 'warning'; }
      else if (rain > 60) { urgency = 'Rain Expected (Skip)'; urgencyColor = '#2563EB'; urgencyBg = '#DBEAFE'; urgencyIco = 'cloud-download'; }

      const bestTime = hum > 80 ? '6:00 AM – 8:00 AM' : temp > 33 ? '5:30 AM – 7:00 AM' : '6:00 AM or 5:00 PM';

      const tips = [];
      if (hum < 50) tips.push('High evaporation rate. Water early morning to minimize loss.');
      if (rain > 50) tips.push(`${rain}% chance of rain tomorrow. Conserve water today.`);
      if (crop === 'cashew') tips.push('Cashews are drought-tolerant. Allow topsoil to dry before watering.');

      setResult({ urgency, urgencyColor, urgencyBg, urgencyIco, totalLitres, hours, bestTime, tips, mm: Math.round(needed) });
      setAnalyzing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 1200);
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

        <Text style={styles.inputLabel}>Select Crop</Text>
        <View style={styles.bentoGrid}>
          {['paddy', 'cashew', 'coconut', 'vegetable'].map(c => (
            <TouchableOpacity key={c} style={[styles.bentoSelect, crop === c && styles.bentoSelectActive]} onPress={() => setCrop(c)}>
              <MaterialCommunityIcons name={c === 'paddy' ? 'grass' : c === 'cashew' ? 'peanut' : c === 'coconut' ? 'palm-tree' : 'leaf'} size={26} color={crop === c ? '#10B981' : '#64748B'} />
              <Text style={[styles.bentoSelectText, crop === c && styles.bentoSelectTextActive]}>{c.charAt(0).toUpperCase() + c.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>Farm Size (Acres)</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="map-outline" size={20} color="#94A3B8" style={{ marginRight: 12 }} />
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
          {[{ v: '0', l: 'Today' }, { v: '1', l: 'Yesterday' }, { v: '2', l: '2 Days' }, { v: '3', l: '3 Days' }, { v: '5', l: '4+ Days' }].map(o => (
            <TouchableOpacity key={o.v} style={[styles.pillSelect, lastIrr === o.v && styles.pillSelectActive]} onPress={() => setLastIrr(o.v)}>
              <Text style={[styles.pillSelectText, lastIrr === o.v && styles.pillSelectTextActive]}>{o.l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.inputLabel}>Growth Stage</Text>
        <View style={styles.bentoGrid}>
          {[{ v: 'seed', l: 'Seedling', i: 'seed' }, { v: 'veg', l: 'Vegetative', i: 'leaf' }, { v: 'flower', l: 'Flowering', i: 'flower' }, { v: 'fruit', l: 'Fruiting', i: 'fruit-cherries' }].map(o => (
            <TouchableOpacity key={o.v} style={[styles.bentoSelect, stage === o.v && styles.bentoSelectActive]} onPress={() => setStage(o.v)}>
              <MaterialCommunityIcons name={o.i} size={26} color={stage === o.v ? '#10B981' : '#64748B'} />
              <Text style={[styles.bentoSelectText, stage === o.v && styles.bentoSelectTextActive]}>{o.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={calculateIrrigation} disabled={analyzing} style={styles.primaryBtn}>
          {analyzing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.primaryBtnText}>Analyzing Hydration...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="water" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Get Recommendation</Text>
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
                { v: `${result.totalLitres.toLocaleString()}L`, l: 'Needed', i: 'water-outline' },
                { v: `${result.hours}h`, l: 'Pump', i: 'time-outline' },
                { v: `${result.mm}mm`, l: 'Depth', i: 'layers-outline' }
              ].map((m, i) => (
                <View key={i} style={styles.resultMetricBox}>
                  <Ionicons name={m.i} size={20} color="#64748B" style={{ marginBottom: 4 }} />
                  <Text style={styles.resultMetricVal}>{m.v}</Text>
                  <Text style={styles.resultMetricLbl}>{m.l}</Text>
                </View>
              ))}
            </View>

            <View style={styles.adviceCard}>
              <View style={styles.adviceCardHeader}>
                <Ionicons name="alarm-outline" size={20} color="#10B981" />
                <Text style={styles.adviceCardTitle}>Best Watering Window</Text>
              </View>
              <Text style={styles.adviceCardVal}>{result.bestTime}</Text>
            </View>

            {result.tips.map((t, i) => (
              <View key={i} style={styles.tipBox}>
                <Ionicons name="bulb-outline" size={20} color="#92400E" style={{ marginRight: 12, marginTop: 2 }} />
                <Text style={styles.tipBoxText}>{t}</Text>
              </View>
            ))}
          </Animated.View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollPad: { padding: 20, paddingBottom: 100 },
  headerArea: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  inputLabel: { fontSize: 13, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 24, marginBottom: 12 },
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bentoSelect: { flex: 1, minWidth: '45%', backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
  bentoSelectActive: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  bentoSelectText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  bentoSelectTextActive: { color: '#059669' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, paddingHorizontal: 18, height: 64 },
  textInput: { flex: 1, fontSize: 18, fontWeight: '700', color: '#0F172A' },
  pillSelect: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  pillSelectActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  pillSelectText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  pillSelectTextActive: { color: '#FFFFFF' },
  primaryBtn: { flexDirection: 'row', backgroundColor: '#10B981', paddingVertical: 20, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: 32, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 6 },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  resultHero: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderWidth: 1.5, marginTop: 24 },
  resultUrgencyText: { fontSize: 18, fontWeight: '900', marginLeft: 12 },
  resultMetricsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  resultMetricBox: { flex: 1, backgroundColor: '#FFFFFF', padding: 18, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  resultMetricVal: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  resultMetricLbl: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginTop: 2, textTransform: 'uppercase' },
  adviceCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginTop: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  adviceCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  adviceCardTitle: { fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 8 },
  adviceCardVal: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  tipBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFBEB', padding: 18, borderRadius: 20, marginTop: 12 },
  tipBoxText: { flex: 1, fontSize: 14, color: '#92400E', lineHeight: 22, fontWeight: '600' },
});
