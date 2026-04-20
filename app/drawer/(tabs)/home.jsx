import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, RefreshControl, Dimensions, StatusBar,
  UIManager, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react-native'; // Imported Bell icon

import { useApp } from '../../../src/store/AppContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const WC = { 0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️', 45: '🌫', 51: '🌧', 61: '🌧', 63: '🌧', 65: '🌧', 80: '🌦', 95: '⛈' };
const WD = { 0: 'Sunny', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Cloudy', 45: 'Fog', 51: 'Drizzle', 61: 'Rain', 63: 'Moderate Rain', 65: 'Heavy Rain', 80: 'Showers', 95: 'Thunderstorm' };

/* ─── Animation Components ─────────────────────────────── */

const DriftingCloud = ({ delay = 0, duration = 30000, top = 20, scale = 1, opacity = 0.8 }) => {
  const drift = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    const startAnimation = () => {
      drift.setValue(-150);
      Animated.loop(
        Animated.timing(drift, {
          toValue: width + 50,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ).start();
    };

    const timeout = setTimeout(startAnimation, delay);
    return () => clearTimeout(timeout);
  }, [drift, duration, delay]);

  return (
    <Animated.View style={[styles.cloudWrap, { top, opacity, transform: [{ translateX: drift }, { scale }] }]}>
      <View style={styles.cloudPuff1} />
      <View style={styles.cloudPuff2} />
      <View style={styles.cloudMain} />
    </Animated.View>
  );
};

const RainOverlay = () => {
  const drops = Array.from({ length: 15 });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {drops.map((_, i) => <RainDrop key={i} delay={i * 90} left={Math.random() * width} />)}
    </View>
  );
};

const RainDrop = ({ delay, left }) => {
  const fall = useRef(new Animated.Value(-20)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(fall, { toValue: 350, duration: 800 + Math.random() * 200, delay, easing: Easing.linear, useNativeDriver: true })).start();
  }, [fall, delay]);
  return <Animated.View style={[styles.raindrop, { left, transform: [{ translateY: fall }] }]} />;
};

const LightningOverlay = () => {
  const flash = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let timeout;
    const triggerLightning = () => {
      Animated.sequence([
        Animated.timing(flash, { toValue: 0.8, duration: 50, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0.6, duration: 50, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
      timeout = setTimeout(triggerLightning, 3500 + Math.random() * 6500);
    };
    timeout = setTimeout(triggerLightning, 2000);
    return () => clearTimeout(timeout);
  }, [flash]);
  return <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF', opacity: flash }]} pointerEvents="none" />;
};

const LiveDot = () => {
  const op = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0.3, duration: 800, useNativeDriver: true })
    ])).start();
  }, []);
  return <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', opacity: op, marginRight: 6, marginTop: 4 }} />;
};

export default function HomeScreen() {
  const { user, weather, setWeather, lat, lng, locName } = useApp();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [forecast, setForecast] = useState([]);
  const navigation = useNavigation();

  const [marketLoading, setMarketLoading] = useState(true);
  const [mandiData, setMandiData] = useState(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const sunPulse = useRef(new Animated.Value(1)).current;
  const hour = new Date().getHours();

  useEffect(() => {
    fetchWeather();
    fetchMarketRates();
    Animated.loop(Animated.sequence([
      Animated.timing(sunPulse, { toValue: 1.12, duration: 2500, useNativeDriver: true }),
      Animated.timing(sunPulse, { toValue: 1, duration: 2500, useNativeDriver: true }),
    ])).start();
  }, [lat, lng]);

  async function fetchWeather() {
    try {
      const queryLat = lat || 15.4989;
      const queryLng = lng || 73.8278;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${queryLat}&longitude=${queryLng}&current=temperature_2m,relativehumidity_2m,apparent_temperature,windspeed_10m,weathercode,visibility&daily=weathercode,temperature_2m_max,precipitation_probability_max&forecast_days=7&timezone=Asia%2FKolkata`;
      const r = await fetch(url);
      const d = await r.json();
      setWeather(d);
      buildForecast(d.daily);
    } catch { }
  }

  async function fetchMarketRates() {
    setMarketLoading(true);
    try {
      const API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
      const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
      const preferredCrop = (user?.crops || ['Cashew'])[0];
      const cropQuery = preferredCrop.charAt(0).toUpperCase() + preferredCrop.slice(1);
      const url = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&limit=10&filters[commodity]=${cropQuery}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data?.records?.length > 0) {
        const record = data.records[0];
        setMandiData({
          crop: record.commodity,
          price: record.modal_price ? Math.round(parseFloat(record.modal_price) / 100) : '--',
          market: record.market || 'Local Mandi'
        });
      } else { throw new Error(); }
    } catch {
      setMandiData({ crop: 'Cashew', price: 148, market: 'Panaji Mandi' });
    } finally { setMarketLoading(false); }
  }

  function buildForecast(daily) {
    setForecast(Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(daily.time[i]);
      return { dayIndex: dt.getDay(), ico: WC[daily.weathercode[i]] || '⛅', max: Math.round(daily.temperature_2m_max[i]), isNow: i === 0 };
    }));
  }

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([fetchWeather(), fetchMarketRates()]);
    setRefreshing(false);
  }

  const preferredCrop = (user?.crops || ['Cashew'])[0];
  const getLifecycleData = () => {
    const plantedString = user?.plantedDate || user?.created_at || user?.createdAt;
    const plantedDate = plantedString ? new Date(plantedString) : new Date();
    const daysElapsed = Math.max(0, Math.floor((Date.now() - plantedDate.getTime()) / (1000 * 60 * 60 * 24)));

    const profiles = {
      cashew: { total: 120, stages: [{d:30, n: t('home.stageVeg', 'Vegetative')}, {d:60, n: t('home.stageFlowering', 'Flowering')}, {d:90, n: t('home.stageFruiting', 'Fruiting')}, {d:120, n: t('home.stageHarvest', 'Harvest')}] },
      paddy: { total: 140, stages: [{d:30, n: t('home.stageSeedling', 'Seedling')}, {d:65, n: t('home.stageTillering', 'Tillering')}, {d:100, n: t('home.stageHeading', 'Heading')}, {d:140, n: t('home.stageRipening', 'Ripening')}] },
      coconut: { total: 365, stages: [{d:90, n: t('home.stageVeg', 'Vegetative')}, {d:180, n: t('home.stageFlowering', 'Flowering')}, {d:270, n: t('home.stageNut', 'Nut Dev')}, {d:365, n: t('home.stageHarvest', 'Harvest')}] },
      default: { total: 100, stages: [{d:25, n: t('home.stageSprout', 'Sprouting')}, {d:50, n: t('home.stageVeg', 'Vegetative')}, {d:75, n: t('home.stageMature', 'Maturing')}, {d:100, n: t('home.stageHarvest', 'Harvest')}] }
    };

    const p = profiles[preferredCrop.toLowerCase()] || profiles.default;
    const currentStage = p.stages.find(s => daysElapsed <= s.d) || p.stages[p.stages.length-1];
    const progress = Math.min(100, (daysElapsed / p.total) * 100);

    return { stage: currentStage.n, daysElapsed, total: p.total, progress };
  };

  const cycle = getLifecycleData();

  const c = weather?.current;
  const code = c?.weathercode || 0;
  const currDesc = WD[code] || t('home.fetching', 'Fetching...');
  const currIcon = WC[code] || '⛅';
  const isCloudy = code >= 2 && code <= 48;
  const isRainy = (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
  const isStormy = code >= 95;

  const hum = c?.relativehumidity_2m || 0;
  const aitipText = weather
    ? (hum > 85 ? t('home.highHumidity', { hum, crop: preferredCrop, defaultValue: `High humidity (${hum}%). Watch ${preferredCrop} for fungal issues.` }) : t('home.optimalConditions', { crop: preferredCrop, defaultValue: `Conditions are currently optimal for your ${preferredCrop}.` }))
    : t('home.analyzingTip', 'Analyzing conditions...');

  const daysArray = [t('home.sun', 'Sun'), t('home.mon', 'Mon'), t('home.tue', 'Tue'), t('home.wed', 'Wed'), t('home.thu', 'Thu'), t('home.fri', 'Fri'), t('home.sat', 'Sat')];

  const getGradientColors = () => {
    if (hour >= 5 && hour < 9) return ['#F59E0B', '#F97316'];
    if (hour >= 9 && hour < 17) return ['#059669', '#10B981'];
    if (hour >= 17 && hour < 19) return ['#BE185D', '#E11D48'];
    return ['#1E1B4B', '#312E81'];
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" progressViewOffset={50} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        <LinearGradient colors={getGradientColors()} style={styles.heroBackground}>
          <View style={styles.wxArtContainer} pointerEvents="none">
            {(isCloudy || code <= 1) && <Animated.View style={[styles.wxSunNode, (hour >= 19 || hour < 5) ? styles.wxMoonNode : {}, { transform: [{ scale: sunPulse }] }]} />}
            <DriftingCloud delay={0} duration={40000} top={30} scale={0.9} opacity={0.6} />
            {(isCloudy || isRainy || isStormy) && <DriftingCloud delay={12000} duration={55000} top={70} scale={0.6} opacity={0.4} />}
            {(isRainy || isStormy) && <RainOverlay />}
            {isStormy && <LightningOverlay />}
          </View>

          <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.glassButton}>
                <Text style={styles.glassButtonText}>☰</Text>
              </TouchableOpacity>
              <View style={styles.locationPill}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{locName || t('home.panajiGoa', 'Panaji, Goa')}</Text>
              </View>
              {/* ✅ FIXED: Beautiful Bell Icon instead of Emoji */}
              <TouchableOpacity onPress={() => router.push('/alerts')} style={styles.glassButton}>
                <Bell color="#FFF" size={22} />
                <View style={styles.redDot} />
              </TouchableOpacity>
            </View>

            <View style={styles.weatherCenter}>
              <Text style={styles.hugeIconText}>{currIcon}</Text>
              <Text style={styles.mainTemp}>{c ? Math.round(c.temperature_2m) : '--'}°</Text>
              <View style={styles.descPill}><Text style={styles.descText}>{currDesc}</Text></View>
            </View>

            <View style={styles.metricsStrip}>
              {[
                { label: t('home.humidity', 'HUMIDITY'), val: c ? c.relativehumidity_2m : '--', unit: '%' },
                { label: t('home.wind', 'WIND'), val: c ? Math.round(c.windspeed_10m) : '--', unit: ' km/h' },
                { label: t('home.feels', 'FEELS LIKE'), val: c ? Math.round(c.apparent_temperature) : '--', unit: '°' },
              ].map((metric, i) => (
                <View key={i} style={styles.metricItem}>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text style={styles.metricVal}>{metric.val}{metric.unit}</Text>
                  {i < 2 && <View style={styles.metricDivider} />}
                </View>
              ))}
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.floatingCardWrap}>
          <LinearGradient colors={['#FFFFFF', '#ECFDF5']} style={styles.floatingCard}>
            <View style={styles.aiHeader}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.aiIconBg}>
                <MaterialCommunityIcons name="brain" size={20} color="#FFF" />
              </LinearGradient>
              <Text style={styles.aiTitle}>{t('home.agronomyInsight', 'Agronomy Insight')}</Text>
            </View>
            <Text style={styles.aiBody}>{aitipText}</Text>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>{t('home.todaysBriefing', 'Today\'s Briefing')}</Text>
        <View style={{ paddingHorizontal: 20 }}>

          <View style={styles.growthCard}>
            <View style={styles.growthHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>🌱</Text>
                <Text style={styles.growthTitle}>{preferredCrop} {t('home.lifecycle', 'Lifecycle')}</Text>
              </View>
              <View style={styles.stagePill}><Text style={styles.stageText}>{cycle.stage}</Text></View>
            </View>
            <View style={styles.growthBarBg}>
              <View style={[styles.growthBarFill, { width: `${cycle.progress}%` }]} />
            </View>
            <Text style={styles.growthSubText}>
              {t('home.dynamicDayProgress', { day: cycle.daysElapsed, total: cycle.total, defaultValue: `Day ${cycle.daysElapsed} of ${cycle.total} • Tracking phase` })}
            </Text>
          </View>

          <View style={styles.briefingRow}>
            {/* ✅ FIXED: Now routes properly to '/irrigation' */}
            <TouchableOpacity onPress={() => router.push('/irrigation')} style={[styles.briefingBlock, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7', flex: 1.2 }]}>
              <View style={styles.briefingTopRow}>
                <View style={[styles.briefingIconBg, { backgroundColor: '#FEF3C7' }]}><Ionicons name="water" size={20} color="#D97706" /></View>
                <View style={styles.urgentTag}><Text style={styles.urgentTagText}>{t('home.dueToday', 'DUE TODAY')}</Text></View>
              </View>
              <Text style={styles.briefingTaskTitle}>{t('home.lightIrrigation', 'Light Irrigation')}</Text>
              <Text style={styles.briefingTaskSub}>{t('home.morning45', 'Morning • 45 mins')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/arbitrage')} style={[styles.briefingBlock, { backgroundColor: '#F0FDF4', borderColor: '#D1FAE5', flex: 1 }]}>
              <View style={[styles.briefingIconBg, { backgroundColor: '#D1FAE5' }]}><FontAwesome5 name="store" size={16} color="#059669" /></View>
              <View style={{ marginTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <LiveDot />
                  <Text style={styles.marketTitle}>₹{mandiData?.price || '--'}<Text style={styles.marketUnit}>/kg</Text></Text>
                </View>
                <Text style={styles.marketSub}>{mandiData?.market}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('home.outlook7Day', '7-Day Outlook')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.forecastScroll}>
          {forecast.map((f, i) => (
            <View key={i} style={[styles.forecastCard, f.isNow && styles.forecastCardActive]}>
              <Text style={[styles.fDay, f.isNow && styles.textWhite]}>
                {f.isNow ? t('home.today', 'Today') : daysArray[f.dayIndex]}
              </Text>
              <Text style={styles.fIconText}>{f.ico}</Text>
              <Text style={[styles.fTemp, f.isNow && styles.fTempHL]}>{f.max}°</Text>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>{t('home.actionableData', 'Actionable Tools')}</Text>
        <View style={styles.actionGrid}>
          {[
            { ico: <Ionicons name="warning" size={24} color="#EF4444" />, lbl: t('home.alerts', 'Alerts'), route: '/alerts', color: '#FEE2E2', txt: '#B91C1C' },
            { ico: <FontAwesome5 name="map-marked-alt" size={22} color="#0EA5E9" />, lbl: t('home.riskMap', 'Risk Map'), route: '/drawer/map', color: '#E0F2FE', txt: '#0284C7' },
            { ico: <MaterialCommunityIcons name="bug" size={26} color="#C084FC" />, lbl: t('home.pestsAi', 'Pest AI'), route: '/pest', color: '#F3E8FF', txt: '#7E22CE' },
            { ico: <Ionicons name="chatbubbles-sharp" size={26} color="#FBBF24" />, lbl: t('home.goaAgri', 'Community'), route: '/drawer/community', color: '#FFFBEB', txt: '#D97706' },
          ].map((item, i) => (
            <TouchableOpacity key={i} onPress={() => router.push(item.route)} style={styles.actionBtn}>
              <View style={[styles.actionSquircle, { backgroundColor: item.color }]}>{item.ico}</View>
              <Text style={[styles.actionLabel, { color: item.txt }]}>{item.lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { paddingBottom: 100 },
  heroBackground: { paddingBottom: 60, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' },
  heroSafeArea: { zIndex: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, zIndex: 20 },
  glassButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  glassButtonText: { fontSize: 18, color: '#FFF' },
  redDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, backgroundColor: '#EF4444', borderRadius: 4, borderWidth: 1, borderColor: '#FFF' },
  locationPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  locationIcon: { fontSize: 14, marginRight: 6 },
  locationText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  weatherCenter: { alignItems: 'center', marginTop: 15, paddingHorizontal: 20 },
  hugeIconText: { fontSize: 56, marginBottom: -10 },
  mainTemp: { fontSize: 90, fontWeight: '900', color: '#FFF', letterSpacing: -4 },
  descPill: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: -5 },
  descText: { fontSize: 16, fontWeight: '800', color: '#FFF', textTransform: 'capitalize' },
  metricsStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 30, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 10, marginTop: 25, backgroundColor: 'rgba(0,0,0,0.15)' },
  metricItem: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  metricLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginRight: 8 },
  metricVal: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  metricDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 10 },
  wxArtContainer: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  wxSunNode: { position: 'absolute', right: 40, top: 100, width: 80, height: 80, backgroundColor: '#FDE047', borderRadius: 40 },
  wxMoonNode: { backgroundColor: '#E2E8F0' },

  cloudWrap: { position: 'absolute', width: 100, height: 40 },
  cloudMain: { position: 'absolute', bottom: 0, width: 100, height: 35, backgroundColor: '#FFFFFF', borderRadius: 20 },
  cloudPuff1: { position: 'absolute', width: 45, height: 45, backgroundColor: '#FFFFFF', borderRadius: 25, bottom: 10, left: 15 },
  cloudPuff2: { position: 'absolute', width: 35, height: 35, backgroundColor: '#FFFFFF', borderRadius: 20, bottom: 15, right: 20 },

  raindrop: { position: 'absolute', width: 2, height: 18, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 1 },

  floatingCardWrap: { marginHorizontal: 20, marginTop: -40, borderRadius: 24, zIndex: 20, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  floatingCard: { borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#D1FAE5' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiIconBg: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  aiTitle: { fontSize: 16, fontWeight: '800', color: '#064E3B' },
  aiBody: { fontSize: 14, color: '#475569', lineHeight: 22, fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', paddingHorizontal: 20, marginTop: 30, marginBottom: 16 },
  growthCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 12, elevation: 2 },
  growthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  growthTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', textTransform: 'capitalize' },
  stagePill: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  stageText: { fontSize: 11, fontWeight: '800', color: '#059669', textTransform: 'uppercase' },
  growthBarBg: { height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, marginTop: 14, overflow: 'hidden' },
  growthBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 5 },
  growthSubText: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 10 },
  briefingRow: { flexDirection: 'row', gap: 12 },
  briefingBlock: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, borderWidth: 1 },
  briefingTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  briefingIconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  urgentTag: { backgroundColor: '#FDE68A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  urgentTagText: { fontSize: 10, fontWeight: '800', color: '#B45309' },
  briefingTaskTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 12 },
  briefingTaskSub: { fontSize: 13, color: '#64748B', fontWeight: '500', marginTop: 2 },
  marketTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
  marketUnit: { fontSize: 14, color: '#64748B' },
  marketSub: { fontSize: 12, color: '#64748B', marginTop: 2 },

  forecastScroll: { paddingHorizontal: 20, gap: 12, marginTop: 5, paddingBottom: 10 },
  forecastCard: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 24, alignItems: 'center', minWidth: 88, elevation: 1 },
  forecastCardActive: { backgroundColor: '#10B981' },
  fDay: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 10 },
  fIconText: { fontSize: 30, marginBottom: 10 },
  fTemp: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  fTempHL: { color: '#FFFFFF' },
  textWhite: { color: '#FFFFFF' },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 5 },
  actionBtn: { alignItems: 'center', width: (width - 40) / 4 },
  actionSquircle: { width: 62, height: 62, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8, elevation: 1 },
  actionLabel: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
});