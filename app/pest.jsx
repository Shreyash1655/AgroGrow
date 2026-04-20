import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, LayoutAnimation, Platform, UIManager, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; // 🌐 Translation Hook

import { useApp } from '../src/store/AppContext'; // Ensure correct path

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CROP_MASTER = [
  { id: 'cashew', icon: 'peanut', color: '#F59E0B' },
  { id: 'paddy', icon: 'grass', color: '#10B981' },
  { id: 'coconut', icon: 'palm-tree', color: '#0EA5E9' },
  { id: 'arecanut', icon: 'tree', color: '#8B4513' },
  { id: 'mango', icon: 'food-apple', color: '#FB923C' },
  { id: 'pepper', icon: 'dots-grid', color: '#475569' },
];

export default function PestScreen() {
  const { weather, user } = useApp();
  const { t } = useTranslation(); // 🌐 Bring in the engine
  const [crop, setCrop] = useState(user?.crops?.[0] || 'cashew');
  const [expanded, setExpanded] = useState({});
  const ringAnim = useRef(new Animated.Value(0)).current;

  const w = weather?.current ? {
    h: weather.current.relativehumidity_2m,
    t: weather.current.temperature_2m
  } : { h: 72, t: 28 };

  const getRiskScore = () => {
    const profiles = {
      paddy:   { hCrit: 85, tCrit: 25, hWeight: 0.7, tWeight: 0.3 },
      cashew:  { hCrit: 75, tCrit: 32, hWeight: 0.4, tWeight: 0.6 },
      mango:   { hCrit: 70, tCrit: 30, hWeight: 0.5, tWeight: 0.5 },
      coconut: { hCrit: 80, tCrit: 28, hWeight: 0.6, tWeight: 0.4 },
      arecanut:{ hCrit: 85, tCrit: 26, hWeight: 0.8, tWeight: 0.2 },
      pepper:  { hCrit: 90, tCrit: 24, hWeight: 0.9, tWeight: 0.1 },
    };
    const p = profiles[crop] || profiles.cashew;
    const hFactor = Math.max(0, (w.h - 40) / (p.hCrit - 40));
    const tFactor = Math.max(0, (w.t - 20) / (p.tCrit - 20));
    const finalScore = (hFactor * p.hWeight) + (tFactor * p.tWeight);
    return Math.min(Math.max(finalScore * 0.8, 0.12), 0.98);
  };

  const riskScore = getRiskScore();
  const riskColor = riskScore > 0.75 ? '#EF4444' : riskScore > 0.45 ? '#F59E0B' : '#10B981';

  useEffect(() => {
    Animated.spring(ringAnim, { toValue: riskScore, useNativeDriver: false, friction: 8 }).start();
  }, [crop, riskScore]);

  const toggle = (i) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setExpanded(e => ({ ...e, [i]: !e[i] }));
  };

  // 🌐 Fetch the translated database object directly from i18n
  const rawThreats = t('pest.threats', { returnObjects: true });
  const pests = (typeof rawThreats === 'object' && rawThreats !== null) ? (rawThreats[crop] || []) : [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#064E3B', '#10B981']} style={styles.topHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.glassBackBtn}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('pest.title')}</Text>
            <View style={{ width: 42 }} />
          </View>

          <View style={styles.envOverviewCard}>
            <View style={styles.envLeft}>
              <Text style={styles.envLabel}>{t(`pest.crops.${crop}`).toUpperCase()} {t('pest.riskStatus')}</Text>
              <Text style={[styles.envStatus, { color: riskColor }]}>
                {riskScore > 0.75 ? t('pest.criticalAlert') : riskScore > 0.45 ? t('pest.watchRequired') : t('pest.statusOptimal')}
              </Text>
              <Text style={styles.envSub}>{w.t}°C • {w.h}% {t('pest.humid')}</Text>
            </View>
            <View style={styles.envRight}>
              <View style={[styles.riskRingBase, { borderColor: '#F1F5F9' }]}>
                <Animated.View style={[styles.riskRingFill, {
                  borderColor: riskColor,
                  borderTopColor: 'transparent',
                  transform: [{ rotate: ringAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })}]
                }]} />
                <Text style={[styles.riskPercent, { color: riskColor }]}>{Math.round(riskScore * 100)}%</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
        <Text style={styles.sectionHeading}>{t('pest.myCrops')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cropPortfolio}>
          {CROP_MASTER.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.cropCard, crop === item.id && { borderColor: item.color, backgroundColor: '#FFF', elevation: 4 }]}
              onPress={() => setCrop(item.id)}
            >
              <View style={[styles.cropIconBox, { backgroundColor: item.color + '15' }]}>
                <MaterialCommunityIcons name={item.icon} size={26} color={item.color} />
              </View>
              {/* 🌐 Dynamically pull translated crop names */}
              <Text style={[styles.cropLabel, crop === item.id && { color: '#0F172A' }]}>{t(`pest.crops.${item.id}`)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionHeading}>{t('pest.topThreats')} ({pests.length})</Text>

        {pests.map((p, i) => (
          <TouchableOpacity key={i} onPress={() => toggle(i)} activeOpacity={0.9} style={[styles.pestCard, expanded[i] && styles.pestCardActive]}>
            <View style={styles.pestHeader}>
              <View style={styles.pestIconBox}><MaterialCommunityIcons name="bug-outline" size={24} color="#64748B" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pestName}>{p.nm}</Text>
                <Text style={styles.pestSeason}>{t('pest.season')}: {p.sea}</Text>
              </View>
              <Ionicons name={expanded[i] ? "chevron-up" : "chevron-forward"} size={20} color="#94A3B8" />
            </View>
            {expanded[i] && (
              <View style={styles.pestBody}>
                <Text style={styles.pestDesc}>{p.desc}</Text>
                <View style={styles.tipBox}>
                  {p.tips.map((tip, j) => (
                    <View key={j} style={styles.tipRow}>
                      <Ionicons name="shield-checkmark" size={14} color="#10B981" style={{ marginTop: 2 }} />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topHeader: { paddingBottom: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  glassBackBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  envOverviewCard: { backgroundColor: '#FFF', marginHorizontal: 20, marginTop: 10, borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  envLeft: { flex: 1 },
  envLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  envStatus: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  envSub: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  riskRingBase: { width: 60, height: 60, borderRadius: 30, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  riskRingFill: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 5 },
  riskPercent: { fontSize: 14, fontWeight: '900' },
  scrollPad: { paddingHorizontal: 20, paddingTop: 24 },
  sectionHeading: { fontSize: 13, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1 },
  cropPortfolio: { gap: 12, paddingBottom: 20 },
  cropCard: { width: 100, backgroundColor: '#FFF', padding: 16, borderRadius: 24, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', elevation: 2 },
  cropIconBox: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cropLabel: { fontSize: 13, fontWeight: '800', color: '#94A3B8' },
  pestCard: { backgroundColor: '#FFF', borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  pestCardActive: { borderColor: '#10B981', elevation: 4 },
  pestHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  pestIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  pestName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  pestSeason: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  pestBody: { paddingHorizontal: 16, paddingBottom: 16 },
  pestDesc: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 12 },
  tipBox: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12 },
  tipRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  tipText: { flex: 1, fontSize: 13, color: '#1E293B' }
});