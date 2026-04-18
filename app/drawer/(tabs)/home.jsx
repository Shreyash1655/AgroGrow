import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, RefreshControl, Dimensions, StatusBar,
  UIManager, Platform, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
// High-end vector icons
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
// IMPORTANT: Adjust this path to your actual project structure
import { useApp } from '../../src/store/AppContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

/* ─── Weather Data Mappings ─────────────────────────────── */
const WC = { 0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️', 45: '🌫', 51: '🌧', 61: '🌧', 63: '🌧', 65: '🌧', 80: '🌦', 95: '⛈' };
const WD = { 0: 'Sunny', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Cloudy', 45: 'Fog', 51: 'Drizzle', 61: 'Rain', 63: 'Moderate Rain', 65: 'Heavy Rain', 80: 'Showers', 95: 'Thunderstorm' };

/* ─── Crash-Proof Animation Components ──────────────────── */

const DriftingCloud = ({ delay = 0, duration = 30000, top = 20, scale = 1, opacity = 0.8 }) => {
  const drift = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(drift, {
        toValue: width + 50,
        duration: duration,
        delay: delay,
        useNativeDriver: true,
      })
    ).start();
  }, [drift, duration, delay]);

  return (
    <Animated.View style={[
      styles.cloudShape,
      { top, opacity, transform: [{ translateX: drift }, { scale }] }
    ]} />
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
    Animated.loop(
      Animated.timing(fall, { toValue: 350, duration: 800 + Math.random() * 200, delay, useNativeDriver: true })
    ).start();
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


/* ─── Main Screen Component ─────────────────────────────── */
export default function HomeScreen() {
  const { user, weather, setWeather, lat, lng, locName } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [aitip, setAitip] = useState('Analyzing local weather patterns for optimal farming conditions...');
  const [forecast, setForecast] = useState([]);
const navigation = useNavigation();
  // Market State
  const [marketLoading, setMarketLoading] = useState(true);
  const [mandiData, setMandiData] = useState(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const sunPulse = useRef(new Animated.Value(1)).current;

  const hour = new Date().getHours();

  useEffect(() => {
    fetchWeather();
    fetchMarketRates();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sunPulse, { toValue: 1.12, duration: 2500, useNativeDriver: true }),
        Animated.timing(sunPulse, { toValue: 1, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, [lat, lng, sunPulse]);

  // Fetch Weather
  async function fetchWeather() {
    try {
      const queryLat = lat || 15.4989;
      const queryLng = lng || 73.8278;

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${queryLat}&longitude=${queryLng}&current=temperature_2m,relativehumidity_2m,apparent_temperature,windspeed_10m,weathercode,visibility&daily=weathercode,temperature_2m_max,precipitation_probability_max&forecast_days=7&timezone=Asia%2FKolkata`;
      const r = await fetch(url);
      const d = await r.json();
      setWeather(d);
      buildForecast(d.daily);
      genTip(d.current, d.daily);
    } catch { }
  }

  // 📈 Fetch Market Rates (Govt Mandi API)
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

      if (data && data.records && data.records.length > 0) {
        const record = data.records[0];
        const pricePerQuintal = parseFloat(record.modal_price);
        const pricePerKg = pricePerQuintal ? Math.round(pricePerQuintal / 100) : '--';

        setMandiData({
          crop: record.commodity,
          price: pricePerKg,
          trend: '+₹2',
          isUp: true,
          market: record.market || 'Local Mandi'
        });
      } else {
        throw new Error("No records found for this crop.");
      }
    } catch (error) {
      setMandiData({
        crop: 'Cashew (Raw)',
        price: 148,
        trend: '+₹5',
        isUp: true,
        market: 'Panaji Mandi'
      });
    } finally {
      setMarketLoading(false);
    }
  }

  function buildForecast(daily) {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    setForecast(Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(daily.time[i]);
      const code = daily.weathercode[i];
      return {
        lbl: i === 0 ? 'Today' : days[dt.getDay()],
        ico: WC[code] || '⛅',
        max: Math.round(daily.temperature_2m_max[i]),
        rain: daily.precipitation_probability_max[i] || 0,
        isNow: i === 0
      };
    }));
  }

  function genTip(c, daily) {
    const hum = c.relativehumidity_2m, wind = c.windspeed_10m, temp = c.temperature_2m;
    const rain = daily?.precipitation_probability_max?.[1] || 0;
    const crop = (user?.crops || ['cashew'])[0];

    let tip = hum > 85
      ? `⚠️ Critical humidity (${hum}%). High risk of fungal infections like Powdery Mildew. Inspect your ${crop} today.`
      : hum > 72
      ? `Elevated humidity (${hum}%). ${wind < 15 ? 'Good conditions for spraying before 10 AM.' : 'Winds too high for spraying.'}`
      : `✅ Optimal conditions: ${Math.round(temp)}°C. Great day for ${crop} maintenance.`;

    if (rain > 60) tip += ' 🌧️ Heavy rain expected tomorrow — delay fertilizer application.';
    if (wind < 12 && hum < 75) tip += ' 💨 Perfect weather window for spraying right now.';
    setAitip(tip);
  }

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([fetchWeather(), fetchMarketRates()]);
    setRefreshing(false);
  }

  const c = weather?.current;
  const code = c?.weathercode || 0;
  const currDesc = WD[code] || 'Fetching...';
  const currIcon = WC[code] || '⛅';

  const isCloudy = code >= 2 && code <= 48;
  const isRainy = (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
  const isStormy = code >= 95;

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

        {/* Animated Hero Section */}
        <LinearGradient colors={getGradientColors()} style={styles.heroBackground}>
          <View style={styles.wxArtContainer} pointerEvents="none">
            {(isCloudy || code <= 1) && (
              <Animated.View style={[
                styles.wxSunNode,
                (hour >= 19 || hour < 5) ? styles.wxMoonNode : {},
                { transform: [{ scale: sunPulse }] }
              ]} />
            )}

            <DriftingCloud delay={0} duration={35000} top={30} scale={0.9} opacity={0.6} />
            {isCloudy || isRainy || isStormy ? (
              <>
                <DriftingCloud delay={10000} duration={45000} top={80} scale={0.7} opacity={0.4} />
                <DriftingCloud delay={20000} duration={28000} top={40} scale={1.1} opacity={0.5} />
              </>
            ) : null}

            {isRainy || isStormy ? <RainOverlay /> : null}
            {isStormy ? <LightningOverlay /> : null}
          </View>

          <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => router.push('/drawer')} style={styles.glassButton}>
                <Text style={styles.glassButtonText}>☰</Text>
              </TouchableOpacity>
              <View style={styles.locationPill}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{locName || 'Panaji, Goa'}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/community')} style={styles.glassButton}>
                <Text style={styles.glassButtonText}>🔔</Text>
                <View style={styles.redDot} />
              </TouchableOpacity>
            </View>

            <View style={styles.weatherCenter}>
              <Text style={styles.hugeIconText}>{currIcon}</Text>
              <Text style={styles.mainTemp}>{c ? Math.round(c.temperature_2m) : '--'}°</Text>
              <View style={styles.descPill}>
                <Text style={styles.descText}>{currDesc}</Text>
              </View>
            </View>

            <View style={styles.metricsStrip}>
              {[
                { label: 'Humidity', val: c ? c.relativehumidity_2m : '--', unit: '%' },
                { label: 'Wind', val: c ? Math.round(c.windspeed_10m) : '--', unit: ' km/h' },
                { label: 'Feels', val: c ? Math.round(c.apparent_temperature) : '--', unit: '°' },
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

        {/* Floating AI Insight Card */}
        <View style={styles.floatingCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIconBg}>
              <Text style={styles.aiIcon}>✨</Text>
            </View>
            <Text style={styles.aiTitle}>Agronomy Insight</Text>
          </View>
          <Text style={styles.aiBody}>{aitip}</Text>
        </View>

        {/* 1. TODAY'S BRIEFING */}
        <Text style={styles.sectionTitle}>Today's Briefing</Text>
        <View style={{ paddingHorizontal: 20 }}>

          <View style={styles.growthCard}>
            <View style={styles.growthHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>🌱</Text>
                <Text style={styles.growthTitle}>Cashew Lifecycle</Text>
              </View>
              <View style={styles.stagePill}>
                <Text style={styles.stageText}>Flowering</Text>
              </View>
            </View>
            <View style={styles.growthBarBg}>
              <View style={styles.growthBarFill} />
            </View>
            <Text style={styles.growthSubText}>Day 45 of 120 • Early bloom detected</Text>
          </View>

          <View style={styles.briefingRow}>
            <TouchableOpacity onPress={() => router.push('/calendar')} activeOpacity={0.9} style={[styles.briefingBlock, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7', flex: 1.2 }]}>
              <View style={styles.briefingTopRow}>
                <View style={[styles.briefingIconBg, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="water" size={20} color="#D97706" />
                </View>
                <View style={styles.urgentTag}>
                  <Text style={styles.urgentTagText}>DUE TODAY</Text>
                </View>
              </View>
              <Text style={styles.briefingTaskTitle}>Light Irrigation</Text>
              <Text style={styles.briefingTaskSub}>45 min · Morning</Text>

              <View style={styles.checkCircleRow}>
                <Text style={styles.viewCalendarText}>View details</Text>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={16} color="#E2E8F0" />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/market')} activeOpacity={0.9} style={[styles.briefingBlock, { backgroundColor: '#F0FDF4', borderColor: '#D1FAE5', flex: 1 }]}>
              <View style={[styles.briefingIconBg, { backgroundColor: '#D1FAE5' }]}>
                <FontAwesome5 name="chart-line" size={16} color="#059669" />
              </View>
              <View style={{ marginTop: 12 }}>
                <Text style={styles.marketSub}>{mandiData?.market || 'Mandi Rate'}</Text>

                {marketLoading ? (
                  <ActivityIndicator size="small" color="#059669" style={{ marginTop: 10, alignSelf: 'flex-start' }} />
                ) : (
                  <>
                    <Text style={styles.marketTitle}>₹{mandiData?.price || '--'}<Text style={styles.marketUnit}>/kg</Text></Text>
                    <View style={styles.trendRow}>
                      <Ionicons name={mandiData?.isUp ? "trending-up" : "trending-down"} size={14} color={mandiData?.isUp ? "#10B981" : "#EF4444"} />
                      <Text style={[styles.marketTrend, { color: mandiData?.isUp ? "#10B981" : "#EF4444" }]}>
                        {mandiData?.trend} (Today)
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. 7-DAY OUTLOOK (Moved Here) */}
        <Text style={styles.sectionTitle}>7-Day Outlook</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.forecastScroll}>
          {forecast.length === 0
            ? [1,2,3,4,5].map(i => <View key={i} style={styles.forecastSkeleton} />)
            : forecast.map((f, i) => (
              <View key={i} style={[styles.forecastCard, f.isNow && styles.forecastCardActive]}>
                <Text style={[styles.fDay, f.isNow && styles.textWhite]}>{f.lbl}</Text>
                <Text style={styles.fIconText}>{f.ico}</Text>
                <Text style={[styles.fTemp, f.isNow && styles.fTempHL]}>{f.max}°</Text>
                <View style={[styles.rainPill, f.isNow ? styles.rainPillActive : (f.rain > 30 ? styles.rainPillBlue : {})]}>
                  <Text style={[styles.rainText, f.isNow || f.rain > 30 ? styles.textWhite : {}]}>
                    {f.rain > 20 ? `💧 ${f.rain}%` : '☀️ --'}
                  </Text>
                </View>
              </View>
          ))}
        </ScrollView>

        {/* 3. ACTIONABLE DATA */}
        <Text style={styles.sectionTitle}>Actionable Data</Text>
        <View style={styles.actionGrid}>
          {[
            { ico: <Ionicons name="warning" size={24} color="#EF4444" />, lbl: 'Alerts', route: '/alerts', color: '#FEE2E2', txt: '#B91C1C' },
            { ico: <FontAwesome5 name="map-marked-alt" size={22} color="#0EA5E9" />, lbl: 'Risk Map', route: '/map', color: '#E0F2FE', txt: '#0284C7' },
            { ico: <MaterialCommunityIcons name="bug" size={26} color="#C084FC" />, lbl: 'Pests AI', route: '/pest', color: '#F3E8FF', txt: '#7E22CE' },
            { ico: <Ionicons name="chatbubbles-sharp" size={26} color="#FBBF24" />, lbl: 'Goa Agri', route: '/community', color: '#FFFBEB', txt: '#D97706' },
          ].map((item, i) => (
            <TouchableOpacity key={i} onPress={() => router.push(item.route)} activeOpacity={0.7} style={styles.actionBtn}>
              <View style={[styles.actionSquircle, { backgroundColor: item.color }]}>
                {item.ico}
              </View>
              <Text style={[styles.actionLabel, { color: item.txt }]}>{item.lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. FARM DASHBOARD */}
        <Text style={styles.sectionTitle}>Farm Dashboard</Text>
        <View style={styles.bentoRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/calendar')}
            style={[styles.bentoBlock, styles.bentoTall, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
            <View style={[styles.bentoIconBg, { backgroundColor: '#BAE6FD' }]}>
              <FontAwesome5 name="calendar-alt" size={24} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.bentoTitle}>Calendar</Text>
              <Text style={styles.bentoSub}>Sowing & harvest schedules</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/soil')}
            style={[styles.bentoBlock, styles.bentoTall, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <View style={[styles.bentoIconBg, { backgroundColor: '#A7F3D0' }]}>
              <MaterialCommunityIcons name="seed" size={26} color="#059669" />
            </View>
            <View>
              <Text style={styles.bentoTitle}>Soil Advisor</Text>
              <Text style={styles.bentoSub}>AI nutrition compatibility</Text>
            </View>
          </TouchableOpacity>
        </View>

      </Animated.ScrollView>
    </View>
  );
}

/* ─── Modern Premium Styles ─────────────────────────────── */
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
  locationText: { fontSize: 14, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },

  weatherCenter: { alignItems: 'center', marginTop: 15, paddingHorizontal: 20 },
  hugeIconText: { fontSize: 56, marginBottom: -10, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 5 }, textShadowRadius: 10 },
  mainTemp: { fontSize: 90, fontWeight: '900', color: '#FFF', lineHeight: 100, letterSpacing: -4, includeFontPadding: false },
  descPill: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: -5 },
  descText: { fontSize: 16, fontWeight: '800', color: '#FFF', textTransform: 'capitalize' },

  metricsStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 30, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 10, marginTop: 25, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, backgroundColor: 'rgba(0,0,0,0.15)' },
  metricItem: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  metricLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', marginRight: 8 },
  metricVal: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  metricDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 10 },

  wxArtContainer: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  wxSunNode: { position: 'absolute', right: 40, top: 100, width: 80, height: 80, backgroundColor: '#FDE047', borderRadius: 40, shadowColor: '#FEF08A', shadowOpacity: 0.8, shadowRadius: 25, elevation: 10 },
  wxMoonNode: { backgroundColor: '#E2E8F0', shadowColor: '#FFFFFF' },
  cloudShape: { position: 'absolute', width: 100, height: 35, backgroundColor: '#FFFFFF', borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10 },
  raindrop: { position: 'absolute', width: 2, height: 18, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 1 },

  floatingCard: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginTop: -40, borderRadius: 24, padding: 20, zIndex: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiIconBg: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 12, shadowColor: '#F59E0B', shadowOpacity: 0.2, shadowRadius: 5, elevation: 2 },
  aiIcon: { fontSize: 18 },
  aiTitle: { fontSize: 16, fontWeight: '800', color: '#D97706' },
  aiBody: { fontSize: 14, color: '#475569', lineHeight: 22, fontWeight: '500' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', paddingHorizontal: 20, marginTop: 30, marginBottom: 16, letterSpacing: -0.3 },

  growthCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  growthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  growthTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  stagePill: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  stageText: { fontSize: 11, fontWeight: '800', color: '#059669', textTransform: 'uppercase' },
  growthBarBg: { height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, marginTop: 14, overflow: 'hidden' },
  growthBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 5, width: '38%' },
  growthSubText: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 10 },

  briefingRow: { flexDirection: 'row', gap: 12 },
  briefingBlock: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  briefingTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  briefingIconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  urgentTag: { backgroundColor: '#FDE68A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  urgentTagText: { fontSize: 10, fontWeight: '800', color: '#B45309' },
  briefingTaskTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 12 },
  briefingTaskSub: { fontSize: 13, color: '#64748B', fontWeight: '500', marginTop: 2 },
  checkCircleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 },
  viewCalendarText: { fontSize: 12, fontWeight: '700', color: '#D97706' },
  checkCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#FDE68A', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },

  marketSub: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  marketTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', marginTop: 2, letterSpacing: -1 },
  marketUnit: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  marketTrend: { fontSize: 12, fontWeight: '800' },

  // Forecast
  forecastScroll: { paddingHorizontal: 20, gap: 12, marginTop: 5, paddingBottom: 10 },
  forecastSkeleton: { width: 80, height: 120, backgroundColor: '#E2E8F0', borderRadius: 24 },
  forecastCard: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 24, alignItems: 'center', minWidth: 88, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  forecastCardActive: { backgroundColor: '#10B981', shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  fDay: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  fIconText: { fontSize: 30, marginBottom: 10 },
  fTemp: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  fTempHL: { color: '#FFFFFF' },
  rainPill: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 12 },
  rainPillActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  rainPillBlue: { backgroundColor: '#DBEAFE' },
  rainText: { fontSize: 10, fontWeight: '800', color: '#94A3B8' },
  textWhite: { color: '#FFFFFF' },

  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 5 },
  actionBtn: { alignItems: 'center', width: (width - 40) / 4 },
  actionSquircle: { width: 62, height: 62, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  actionLabel: { fontSize: 12, fontWeight: '800' },

  bentoRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 10, gap: 12 },
  bentoBlock: { flex: 1, borderRadius: 28, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, borderWidth: 1 },
  bentoTall: { minHeight: 180, justifyContent: 'space-between' },
  bentoIconBg: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  bentoTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 15, letterSpacing: -0.3 },
  bentoSub: { fontSize: 13, color: '#475569', fontWeight: '500', lineHeight: 18, marginTop: 2 },
});