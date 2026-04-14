import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, RefreshControl, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { FadeIn, PressScale, SectionLabel, Skeleton } from '../../src/components/UI';
import { useApp } from '../../src/store/AppContext';
import { Colors, Fonts, Radius, Shadows } from '../../src/theme';
import { WC, WD } from '../../src/data/staticData';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, weather, setWeather, lat, lng, locName } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [aitip, setAitip] = useState('Generating farming advice based on today\'s weather...');
  const [forecast, setForecast] = useState([]);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchWeather(); }, [lat, lng]);

  async function fetchWeather() {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relativehumidity_2m,apparent_temperature,windspeed_10m,weathercode,visibility&daily=weathercode,temperature_2m_max,precipitation_probability_max&forecast_days=7&timezone=Asia%2FKolkata`;
      const r = await fetch(url);
      const d = await r.json();
      setWeather(d);
      buildForecast(d.daily);
      genTip(d.current, d.daily);
    } catch { }
  }

  function buildForecast(daily) {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    setForecast(Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(daily.time[i]);
      return { lbl: i === 0 ? 'Today' : days[dt.getDay()], ico: WC[daily.weathercode[i]] || '🌡️', max: Math.round(daily.temperature_2m_max[i]), rain: daily.precipitation_probability_max[i] || 0, isNow: i === 0 };
    }));
  }

  function genTip(c, daily) {
    const hum = c.relativehumidity_2m, wind = c.windspeed_10m, temp = c.temperature_2m;
    const rain = daily?.precipitation_probability_max?.[1] || 0;
    const crop = (user?.crops || ['cashew'])[0];
    let tip = hum > 85
      ? `⚠️ Humidity critically high at ${hum}% — Rice Blast and Powdery Mildew risk is very high. Inspect your ${crop} immediately.`
      : hum > 72
      ? `🟡 Elevated humidity (${hum}%) — moderate fungal risk. Check ${crop} leaves. Spray window: ${wind < 15 ? 'Good before 10am' : 'Avoid, winds too high'}.`
      : `✅ Good farming day! ${Math.round(temp)}°C, ${hum}% humidity. Ideal for ${crop} inspection.`;
    if (rain > 60) tip += ' 🌧️ Heavy rain tomorrow — skip fertilizer today.';
    if (wind < 12 && hum < 75) tip += ' 💨 Perfect spraying conditions until 10am.';
    setAitip(tip);
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchWeather();
    setRefreshing(false);
  }

  const c = weather?.current;
  const code = c?.weathercode || 0;
  const heroHeight = scrollY.interpolate({ inputRange: [0, 100], outputRange: [0, -40], extrapolate: 'clamp' });

  const quickActions = [
    { ico: '🌡️', lbl: 'Weather\nAlerts', route: '/alerts' },
    { ico: '🗺️', lbl: 'Risk\nMap', route: '/map' },
    { ico: '💧', lbl: 'Irrigation\nAI', route: '/irrigation' },
    { ico: '🐛', lbl: 'Pest\nAlerts', route: '/pest' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Weather Hero */}
        <LinearGradient colors={['#1a5c35','#2d8653','#3ea86a']} style={styles.wxHero}>
          <SafeAreaView edges={['top']}>
            <View style={styles.wxTopBar}>
              <TouchableOpacity onPress={() => router.push('/drawer')} style={styles.menuBtn}>
                <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 18 }}>☰</Text>
              </TouchableOpacity>
              <Text style={styles.wxLocText}>📍 {locName}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/community')} style={styles.menuBtn}>
                <Text style={{ fontSize: 18 }}>🔔</Text>
                <View style={styles.notifDot} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Weather art */}
          <View style={styles.wxArt}>
            <View style={styles.wxSun} />
            <View style={styles.wxCloud} />
          </View>

          <FadeIn delay={100}>
            <Text style={styles.wxIco}>{WC[code] || '🌡️'}</Text>
            <Text style={styles.wxTemp}>{c ? `${Math.round(c.temperature_2m)}°C` : '--°'}</Text>
            <Text style={styles.wxDesc}>{c ? (WD[code] || 'Clear') : 'Fetching weather...'}</Text>
          </FadeIn>

          <FadeIn delay={200} style={styles.wxGrid}>
            {[
              { v: c ? `${c.relativehumidity_2m}%` : '--%', l: 'Humid' },
              { v: c ? `${Math.round(c.windspeed_10m)}km/h` : '--', l: 'Wind' },
              { v: c ? `${Math.round(c.apparent_temperature)}°` : '--°', l: 'Feels' },
              { v: c ? (c.visibility ? `${Math.round(c.visibility/1000)}km` : '--') : '--', l: 'Vis' },
            ].map((cell, i) => (
              <View key={i} style={styles.wxCell}>
                <Text style={styles.wxCellV}>{cell.v}</Text>
                <Text style={styles.wxCellL}>{cell.l}</Text>
              </View>
            ))}
          </FadeIn>
        </LinearGradient>

        {/* AI Tip */}
        <FadeIn delay={200} style={styles.aiTip}>
          <View style={styles.aiTipIcon}><Text style={{ fontSize: 16 }}>🔊</Text></View>
          <Text style={styles.aiTipText}>{aitip}</Text>
        </FadeIn>

        {/* Quick Actions */}
        <SectionLabel label="Quick Actions" />
        <FadeIn delay={250} style={styles.qaCard}>
          {quickActions.map((q, i) => (
            <PressScale key={i} onPress={() => router.push(q.route)} style={[styles.qaItem, i < 3 && styles.qaItemBorder]}>
              <Text style={styles.qaIco}>{q.ico}</Text>
              <Text style={styles.qaLabel}>{q.lbl}</Text>
            </PressScale>
          ))}
        </FadeIn>

        {/* Forecast */}
        <SectionLabel label="7-Day Forecast" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fcRow}>
          {forecast.length === 0
            ? [1,2,3,4].map(i => <Skeleton key={i} width={68} height={88} style={{ marginRight: 8 }} />)
            : forecast.map((f, i) => (
              <FadeIn key={i} delay={300 + i * 40}>
                <View style={[styles.fcc, f.isNow && styles.fccNow]}>
                  <Text style={styles.fccDay}>{f.lbl}</Text>
                  <Text style={{ fontSize: 22, marginVertical: 3 }}>{f.ico}</Text>
                  <Text style={styles.fccTemp}>{f.max}°</Text>
                  {f.rain > 40 && <Text style={styles.fccRain}>💧{f.rain}%</Text>}
                </View>
              </FadeIn>
            ))}
        </ScrollView>

        {/* Farm shortcuts */}
        <SectionLabel label="Farm Tools" />
        <View style={styles.farmTools}>
          {[
            { ico:'🌱', title:'Soil Advisor', sub:'AI soil analysis', route:'/soil' },
            { ico:'📅', title:'Crop Calendar', sub:'Your schedule', route:'/calendar' },
          ].map((t, i) => (
            <FadeIn key={i} delay={400 + i * 60} style={{ flex: 1 }}>
              <PressScale onPress={() => router.push(t.route)} style={{ flex: 1 }}>
                <LinearGradient colors={i === 0 ? [Colors.g1, Colors.g2] : [Colors.g3, Colors.g4]} style={styles.farmToolCard}>
                  <Text style={{ fontSize: 28, marginBottom: 6 }}>{t.ico}</Text>
                  <Text style={styles.farmToolTitle}>{t.title}</Text>
                  <Text style={styles.farmToolSub}>{t.sub}</Text>
                </LinearGradient>
              </PressScale>
            </FadeIn>
          ))}
        </View>
        <View style={{ height: 20 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wxHero: { paddingBottom: 20 },
  wxTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  menuBtn: { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,.12)', borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  wxLocText: { fontFamily: Fonts.extraBold, fontSize: 12, color: 'rgba(255,255,255,.85)' },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, backgroundColor: Colors.red, borderRadius: 4 },
  wxArt: { position: 'absolute', right: 16, top: 80, width: 100, height: 80 },
  wxSun: { position: 'absolute', right: 4, top: 2, width: 52, height: 52, backgroundColor: '#ffd54f', borderRadius: 26 },
  wxCloud: { position: 'absolute', bottom: 4, left: 0, width: 80, height: 42, backgroundColor: 'rgba(255,255,255,.9)', borderRadius: 21 },
  wxIco: { fontSize: 0, paddingHorizontal: 18 }, // hidden, handled by desc
  wxTemp: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 72, color: '#fff', paddingHorizontal: 18, lineHeight: 80 },
  wxDesc: { fontFamily: Fonts.semiBold, fontSize: 13, color: 'rgba(255,255,255,.7)', paddingHorizontal: 18, marginBottom: 14 },
  wxGrid: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,.18)', marginHorizontal: 14, borderRadius: Radius.r12, paddingVertical: 10 },
  wxCell: { flex: 1, alignItems: 'center' },
  wxCellV: { fontFamily: Fonts.extraBold, fontSize: 14, color: '#fff' },
  wxCellL: { fontFamily: Fonts.extraBold, fontSize: 9, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },
  aiTip: { margin: 14, backgroundColor: Colors.g1, borderRadius: Radius.r16, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start', ...Shadows.sh2 },
  aiTipIcon: { width: 32, height: 32, backgroundColor: 'rgba(255,255,255,.12)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  aiTipText: { fontFamily: Fonts.medium, fontSize: 12.5, color: 'rgba(255,255,255,.9)', lineHeight: 20, flex: 1 },
  qaCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.r16, marginHorizontal: 14, ...Shadows.sh1, overflow: 'hidden' },
  qaItem: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 5 },
  qaItemBorder: { borderRightWidth: 1, borderRightColor: Colors.g100 },
  qaIco: { fontSize: 24 },
  qaLabel: { fontFamily: Fonts.extraBold, fontSize: 10, color: Colors.g500, textAlign: 'center', lineHeight: 14 },
  fcRow: { paddingHorizontal: 14, gap: 8, paddingBottom: 8 },
  fcc: { backgroundColor: Colors.g3, borderRadius: Radius.r12, padding: 11, alignItems: 'center', minWidth: 68, ...Shadows.sh1 },
  fccNow: { backgroundColor: Colors.g1 },
  fccDay: { fontFamily: Fonts.extraBold, fontSize: 10, color: 'rgba(255,255,255,.75)', textTransform: 'uppercase', letterSpacing: 0.3 },
  fccTemp: { fontFamily: Fonts.black, fontSize: 20, color: '#fff' },
  fccRain: { fontFamily: Fonts.bold, fontSize: 9, color: 'rgba(255,255,255,.7)', marginTop: 1 },
  farmTools: { flexDirection: 'row', gap: 12, marginHorizontal: 14, marginBottom: 14 },
  farmToolCard: { borderRadius: Radius.r16, padding: 16, flex: 1, minHeight: 110, justifyContent: 'flex-end', ...Shadows.sh2 },
  farmToolTitle: { fontFamily: Fonts.extraBold, fontSize: 14, color: '#fff' },
  farmToolSub: { fontFamily: Fonts.medium, fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 2 },
});
