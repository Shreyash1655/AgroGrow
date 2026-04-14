import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FadeIn, PressScale, SectionLabel, Card } from '../src/components/UI';
import { useApp } from '../src/store/AppContext';
import { Colors, Fonts, Radius, Shadows } from '../src/theme';
import { PESTS, SOIL_DATA, DEFAULT_ALERTS } from '../src/data/staticData';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ═══════════════════════════════════════════════════
// PEST SCREEN
// ═══════════════════════════════════════════════════
export function PestScreen() {
  const { weather, user } = useApp();
  const [crop, setCrop] = useState(user?.crops?.[0] || 'cashew');
  const [expanded, setExpanded] = useState({});

  const w = weather?.current ? { h: weather.current.relativehumidity_2m, t: weather.current.temperature_2m, wind: Math.round(weather.current.windspeed_10m) } : { h: 72, t: 28, wind: 12 };
  const rl = w.h > 85 ? 'Critical' : w.h > 70 ? 'High' : w.h > 55 ? 'Medium' : 'Low';
  const rlColor = w.h > 70 ? Colors.red : w.h > 55 ? Colors.amber : Colors.g3;
  const pests = PESTS[crop] || [];

  const RISK_STYLE = {
    hi: { bg: Colors.redp, text: Colors.red, label: '🔴 HIGH RISK' },
    me: { bg: Colors.amberp, text: '#92600a', label: '🟡 MEDIUM' },
    lo: { bg: Colors.gp, text: Colors.g2, label: '🟢 LOW' },
  };

  function toggle(i) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(e => ({ ...e, [i]: !e[i] }));
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <LinearGradient colors={[Colors.g1, Colors.g2]} style={styles.pageHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.pageHeaderRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Pest & Disease Alerts</Text>
            <View style={{ width: 32 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 14, paddingBottom: 6 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['cashew','paddy','coconut'].map(c => (
                <TouchableOpacity key={c} style={[styles.cropChip, crop === c && styles.cropChipOn]} onPress={() => setCrop(c)}>
                  <Text style={[styles.cropChipText, crop === c && { color: '#fff' }]}>
                    {c === 'cashew' ? '🥜' : c === 'paddy' ? '🌾' : '🥥'} {c.charAt(0).toUpperCase() + c.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Weather strip */}
          <View style={styles.wxStrip}>
            {[{ v: `${w.t}°C`, l: 'Temp' }, { v: `${w.h}%`, l: 'Humidity' }, { v: rl, l: 'Risk', color: rlColor }, { v: `${w.wind}km/h`, l: 'Wind' }].map((cell, i) => (
              <View key={i} style={styles.wxStripCell}>
                <Text style={[styles.wxStripVal, cell.color && { color: cell.color }]}>{cell.v}</Text>
                <Text style={styles.wxStripLabel}>{cell.l}</Text>
              </View>
            ))}
          </View>
        </View>

        <SectionLabel label={`${pests.length} conditions for ${crop}`} />

        {pests.map((p, i) => {
          const risk = p.rfn(w);
          const rs = RISK_STYLE[risk];
          return (
            <FadeIn key={i} delay={i * 60} style={styles.pestCard}>
              <TouchableOpacity onPress={() => toggle(i)} activeOpacity={0.85} style={styles.pestHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pestName}>{p.nm}</Text>
                  <Text style={styles.pestSeason}>Season: {p.sea}</Text>
                </View>
                <View style={[styles.riskPill, { backgroundColor: rs.bg }]}>
                  <Text style={[styles.riskText, { color: rs.text }]}>{rs.label}</Text>
                </View>
                <Text style={[styles.expandArrow, { transform: [{ rotate: expanded[i] ? '90deg' : '0deg' }] }]}>›</Text>
              </TouchableOpacity>
              {expanded[i] && (
                <View style={styles.pestBody}>
                  <Text style={styles.pestDesc}>{p.desc}</Text>
                  {p.tips.map((t, j) => (
                    <View key={j} style={styles.tipRow}>
                      <Text style={styles.tipDot}>•</Text>
                      <Text style={styles.tipText}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}
            </FadeIn>
          );
        })}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════
// SOIL SCREEN
// ═══════════════════════════════════════════════════
export function SoilScreen() {
  const { user } = useApp();
  const [crop, setCrop] = useState(user?.crops?.[0] || 'cashew');
  const [soilType, setSoilType] = useState(user?.soil || 'laterite');
  const [result, setResult] = useState(null);

  const soilTypes = [{ v:'laterite',l:'🔴 Red Laterite' },{ v:'alluvial',l:'🌊 Alluvial' },{ v:'clay',l:'🟤 Clay' },{ v:'sandy',l:'🟡 Sandy' }];

  function analyse() {
    const data = SOIL_DATA[soilType]?.[crop];
    if (data) setResult({ ...data, soilType, crop });
  }

  const scoreColor = result ? (result.score >= 75 ? Colors.g3 : result.score >= 50 ? Colors.amber : Colors.red) : Colors.g3;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <LinearGradient colors={[Colors.g1, Colors.g2]} style={styles.pageHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.pageHeaderRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backArrow}>←</Text></TouchableOpacity>
            <Text style={styles.pageTitle}>Soil & Crop Advisor</Text>
            <View style={{ width: 32 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 14, gap: 14 }}>
        <FadeIn delay={0}>
          <Text style={styles.selectLabel}>Select Your Crop</Text>
          <View style={styles.optRow}>
            {['cashew','paddy','coconut','vegetable'].map(c => (
              <TouchableOpacity key={c} style={[styles.optBtn, crop === c && styles.optBtnOn]} onPress={() => setCrop(c)}>
                <Text style={{ fontSize: 18 }}>{c==='cashew'?'🥜':c==='paddy'?'🌾':c==='coconut'?'🥥':'🥬'}</Text>
                <Text style={[styles.optLabel, crop === c && { color: Colors.g1 }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <Text style={styles.selectLabel}>Soil Type</Text>
          <View style={{ gap: 7 }}>
            {soilTypes.map(s => (
              <TouchableOpacity key={s.v} style={[styles.soilOptBtn, soilType === s.v && styles.soilOptBtnOn]} onPress={() => setSoilType(s.v)}>
                <Text style={[styles.soilOptText, soilType === s.v && { color: Colors.g1, fontFamily: Fonts.extraBold }]}>{s.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeIn>

        <PressScale onPress={analyse}>
          <LinearGradient colors={[Colors.g3, Colors.g1]} style={styles.analyseBtn}>
            <Text style={styles.analyseBtnText}>🌱 Analyse My Soil →</Text>
          </LinearGradient>
        </PressScale>

        {result && (
          <FadeIn delay={0}>
            {/* Score */}
            <View style={[styles.scoreCard, Shadows.sh1]}>
              <View style={styles.scoreRing}>
                <View style={[styles.scoreInner, { borderColor: scoreColor }]}>
                  <Text style={[styles.scoreNum, { color: scoreColor }]}>{result.score}</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scoreTitle}>{result.soilType} for {result.crop}</Text>
                <Text style={styles.scoreSub}>Soil Suitability Score</Text>
                <Text style={[styles.scoreVerdict, { color: scoreColor }]}>
                  {result.score >= 75 ? '✅ Excellent match' : result.score >= 50 ? '⚠️ Moderate suitability' : '❌ Low suitability'}
                </Text>
              </View>
            </View>

            {/* Params */}
            <View style={styles.paramsGrid}>
              {[{ l:'Nitrogen', v:result.n },{ l:'Phosphorus', v:result.p },{ l:'Potassium', v:result.k },{ l:'Org. Matter', v:result.om }].map((p,i) => (
                <FadeIn key={i} delay={i*40} style={styles.paramCell}>
                  <Text style={styles.paramVal}>{p.v}</Text>
                  <Text style={styles.paramLabel}>{p.l}</Text>
                </FadeIn>
              ))}
            </View>

            {/* Recommendations */}
            <View style={[styles.recBox, { borderColor: Colors.g3 }]}>
              <Text style={styles.recTitle}>🌿 Fertilizer Recommendation</Text>
              <Text style={styles.recText}>{result.fert}</Text>
            </View>
            <View style={[styles.recBox, { borderColor: Colors.amber }]}>
              <Text style={[styles.recTitle, { color: '#92600a' }]}>⚠️ Watch Out</Text>
              <Text style={styles.recText}>{result.warn}</Text>
            </View>
          </FadeIn>
        )}
        <View style={{ height: 80 }} />
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
  const [size, setSize] = useState(String(user?.farmSize || ''));
  const [lastIrr, setLastIrr] = useState('3');
  const [stage, setStage] = useState('veg');
  const [result, setResult] = useState(null);

  function calc() {
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

    let urgency = '✅ Normal', urgencyColor = Colors.g3, urgencyBg = Colors.gp;
    if (daysAgo >= 4 && hum < 60) { urgency = '🚨 Irrigate Now'; urgencyColor = Colors.red; urgencyBg = Colors.redp; }
    else if (daysAgo >= 3 && hum < 75) { urgency = '⚠️ Irrigate Today'; urgencyColor = Colors.amber; urgencyBg = Colors.amberp; }
    else if (rain > 60) { urgency = '🌧️ Skip — Rain Coming'; urgencyColor = Colors.blue; urgencyBg = Colors.bluep; }
    else if (hum > 85) { urgency = '✅ Hold Off'; urgencyColor = Colors.g2; urgencyBg = Colors.gp; }

    const bestTime = hum > 80 ? '6:00–8:00 AM' : temp > 33 ? '5:30–7:00 AM' : '6:00–9:00 AM or 4:00–6:00 PM';
    const tips = [];
    if (hum < 50) tips.push('Soil evaporation is very high. Water early morning (5–7am) to reduce loss.');
    if (rain > 50) tips.push(`Rain probability ${rain}% tomorrow — consider skipping today's irrigation.`);
    if (crop === 'cashew') tips.push('Cashew is drought-tolerant — avoid overwatering. Allow soil to dry between irrigations.');
    if (stage === 'flower') tips.push('Flowering stage: ensure consistent moisture. Water stress reduces fruit set by 30–40%.');

    setResult({ urgency, urgencyColor, urgencyBg, totalLitres, hours, bestTime, tips, mm: Math.round(needed) });
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <LinearGradient colors={[Colors.g1, Colors.g2]} style={styles.pageHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.pageHeaderRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backArrow}>←</Text></TouchableOpacity>
            <Text style={styles.pageTitle}>Smart Irrigation</Text>
            <View style={{ width: 32 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 14, gap: 14 }}>
        <FadeIn delay={0}>
          <Text style={styles.selectLabel}>Crop</Text>
          <View style={styles.optRow}>
            {['paddy','cashew','coconut','vegetable'].map(c => (
              <TouchableOpacity key={c} style={[styles.optBtn, crop===c && styles.optBtnOn]} onPress={() => setCrop(c)}>
                <Text style={{ fontSize: 18 }}>{c==='paddy'?'🌾':c==='cashew'?'🥜':c==='coconut'?'🥥':'🥬'}</Text>
                <Text style={[styles.optLabel, crop===c && { color: Colors.g1 }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeIn>
        <FadeIn delay={60}>
          <Text style={styles.selectLabel}>Farm Size (acres)</Text>
          <TextInput style={styles.inputField} value={size} onChangeText={setSize} placeholder="e.g. 1.5" keyboardType="decimal-pad" placeholderTextColor={Colors.g400} />
        </FadeIn>
        <FadeIn delay={120}>
          <Text style={styles.selectLabel}>Last Irrigated</Text>
          <View style={styles.optRow}>
            {[{v:'0',l:'Today'},{v:'1',l:'Yesterday'},{v:'2',l:'2 days'},{v:'3',l:'3 days'},{v:'5',l:'4+ days'}].map(o => (
              <TouchableOpacity key={o.v} style={[styles.optBtnSm, lastIrr===o.v && styles.optBtnSmOn]} onPress={() => setLastIrr(o.v)}>
                <Text style={[styles.optLabelSm, lastIrr===o.v && { color:'#fff' }]}>{o.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeIn>
        <FadeIn delay={180}>
          <Text style={styles.selectLabel}>Crop Stage</Text>
          <View style={styles.optRow}>
            {[{v:'seed',l:'Seedling'},{v:'veg',l:'Vegetative'},{v:'flower',l:'Flowering'},{v:'fruit',l:'Fruiting'}].map(o => (
              <TouchableOpacity key={o.v} style={[styles.optBtn, stage===o.v && styles.optBtnOn]} onPress={() => setStage(o.v)}>
                <Text style={[styles.optLabel, stage===o.v && { color:Colors.g1 }]}>{o.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeIn>

        <PressScale onPress={calc}>
          <LinearGradient colors={['#2563eb','#1d4ed8']} style={styles.analyseBtn}>
            <Text style={styles.analyseBtnText}>💧 Get AI Recommendation</Text>
          </LinearGradient>
        </PressScale>

        {result && (
          <FadeIn delay={0} style={{ gap: 10 }}>
            <View style={[styles.urgencyCard, { backgroundColor: result.urgencyBg, borderColor: result.urgencyColor }]}>
              <Text style={[styles.urgencyText, { color: result.urgencyColor }]}>{result.urgency}</Text>
            </View>
            <View style={styles.metricsRow}>
              {[{ v:`${result.totalLitres.toLocaleString()}L`, l:'Water Needed' },{ v:`${result.hours}hrs`, l:'Duration' },{ v:`${result.mm}mm`, l:'Depth' }].map((m,i) => (
                <FadeIn key={i} delay={i*40} style={styles.metricCard}>
                  <Text style={styles.metricVal}>{m.v}</Text>
                  <Text style={styles.metricLabel}>{m.l}</Text>
                </FadeIn>
              ))}
            </View>
            <View style={styles.bestTimeCard}>
              <Text style={{ fontSize: 20 }}>⏰</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bestTimeLabel}>Best Time to Irrigate</Text>
                <Text style={styles.bestTimeVal}>{result.bestTime}</Text>
              </View>
            </View>
            {result.tips.map((t,i) => (
              <View key={i} style={styles.tipCard}><Text style={{ fontSize: 16 }}>💡</Text><Text style={styles.tipCardText}>{t}</Text></View>
            ))}
          </FadeIn>
        )}
        <View style={{ height: 80 }} />
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
  const PILL_COLORS = { r:Colors.redp, y:Colors.amberp, b:Colors.bluep, g:Colors.gp };
  const PILL_TEXT = { r:Colors.red, y:'#92600a', b:Colors.blue, g:Colors.g2 };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <LinearGradient colors={[Colors.g1, Colors.g2]} style={styles.pageHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.pageHeaderRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backArrow}>←</Text></TouchableOpacity>
            <Text style={styles.pageTitle}>Notifications</Text>
            <View style={{ width: 32 }} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:14, gap:7, paddingBottom:12 }}>
            {TABS.map(t => (
              <TouchableOpacity key={t.v} style={[styles.alertTab, filter===t.v && styles.alertTabOn]} onPress={() => setFilter(t.v)}>
                <Text style={[styles.alertTabText, filter===t.v && { color:'#fff' }]}>{t.l}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.sepRow}><Text style={styles.sepText}>TODAY</Text></View>
        {alerts.map((a,i) => (
          <FadeIn key={a.id} delay={i*50} style={styles.alertItem}>
            <View style={[styles.alertIco, { backgroundColor: PILL_COLORS[a.ic] || Colors.gp }]}>
              <Text style={{ fontSize: 18 }}>{a.ico}</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                <Text style={styles.alertTitle}>{a.title}</Text>
                {a.sev === 'critical' && <View style={{ width:6, height:6, borderRadius:3, backgroundColor:Colors.red }} />}
              </View>
              <Text style={styles.alertMsg}>{a.msg}</Text>
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:4 }}>
                <View style={[styles.miniPill, { backgroundColor:Colors.gp }]}>
                  <Text style={[styles.miniPillText, { color:Colors.g2 }]}>📍 {a.area}</Text>
                </View>
                <View style={[styles.miniPill, { backgroundColor:PILL_COLORS[a.pc] }]}>
                  <Text style={[styles.miniPillText, { color:PILL_TEXT[a.pc] }]}>{a.pill}</Text>
                </View>
                <Text style={styles.alertTime}>{a.t}</Text>
              </View>
              {a.actions && (
                <View style={{ flexDirection:'row', gap:7, marginTop:8 }}>
                  {a.actions.map((x,j) => (
                    <TouchableOpacity key={j} style={[styles.alertActionBtn, x.s && { backgroundColor:Colors.g1 }]}>
                      <Text style={[styles.alertActionText, x.s && { color:'#fff' }]}>{x.l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </FadeIn>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeader: { paddingBottom: 12 },
  pageHeaderRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingTop:10, paddingBottom:4 },
  backBtn: { width:32, height:32, alignItems:'center', justifyContent:'center' },
  backArrow: { fontFamily:Fonts.extraBold, fontSize:22, color:'rgba(255,255,255,.8)' },
  pageTitle: { fontFamily:Fonts.black, fontSize:17, color:'#fff' },
  cropChip: { paddingHorizontal:14, paddingVertical:7, borderRadius:Radius.r99, borderWidth:2, borderColor:Colors.g200, backgroundColor:Colors.white },
  cropChipOn: { backgroundColor:Colors.g1, borderColor:Colors.g1 },
  cropChipText: { fontFamily:Fonts.extraBold, fontSize:13, color:Colors.g500 },
  wxStrip: { flexDirection:'row', backgroundColor:Colors.gb, borderRadius:Radius.r12, padding:11, marginBottom:4 },
  wxStripCell: { flex:1, alignItems:'center' },
  wxStripVal: { fontFamily:Fonts.black, fontSize:15, color:Colors.g1 },
  wxStripLabel: { fontFamily:Fonts.extraBold, fontSize:9, color:Colors.g400, textTransform:'uppercase', marginTop:2 },
  pestCard: { backgroundColor:Colors.white, marginHorizontal:14, marginBottom:8, borderRadius:Radius.r12, ...Shadows.sh1, overflow:'hidden' },
  pestHeader: { flexDirection:'row', alignItems:'center', padding:12, gap:8 },
  pestName: { fontFamily:Fonts.extraBold, fontSize:14, color:Colors.g900 },
  pestSeason: { fontFamily:Fonts.medium, fontSize:11, color:Colors.g400, marginTop:1 },
  riskPill: { paddingHorizontal:9, paddingVertical:3, borderRadius:Radius.r99 },
  riskText: { fontFamily:Fonts.extraBold, fontSize:10 },
  expandArrow: { fontFamily:Fonts.black, fontSize:18, color:Colors.g400 },
  pestBody: { paddingHorizontal:12, paddingBottom:12, gap:5 },
  pestDesc: { fontFamily:Fonts.medium, fontSize:12.5, color:Colors.g500, lineHeight:19, marginBottom:4 },
  tipRow: { flexDirection:'row', gap:6 },
  tipDot: { fontFamily:Fonts.black, fontSize:12, color:Colors.g3, marginTop:2 },
  tipText: { flex:1, fontFamily:Fonts.medium, fontSize:12, color:Colors.g700, lineHeight:18 },
  selectLabel: { fontFamily:Fonts.extraBold, fontSize:11, color:Colors.g500, textTransform:'uppercase', letterSpacing:0.7, marginBottom:8 },
  optRow: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  optBtn: { paddingHorizontal:14, paddingVertical:10, borderRadius:Radius.r12, borderWidth:2, borderColor:Colors.g200, alignItems:'center', gap:4, minWidth:'22%' },
  optBtnOn: { borderColor:Colors.g3, backgroundColor:Colors.gp },
  optLabel: { fontFamily:Fonts.bold, fontSize:12, color:Colors.g500 },
  optBtnSm: { paddingHorizontal:11, paddingVertical:7, borderRadius:Radius.r99, borderWidth:2, borderColor:Colors.g200 },
  optBtnSmOn: { backgroundColor:Colors.g1, borderColor:Colors.g1 },
  optLabelSm: { fontFamily:Fonts.extraBold, fontSize:12, color:Colors.g500 },
  soilOptBtn: { padding:13, borderRadius:Radius.r12, borderWidth:2, borderColor:Colors.g200, backgroundColor:Colors.white },
  soilOptBtnOn: { borderColor:Colors.g3, backgroundColor:Colors.gp },
  soilOptText: { fontFamily:Fonts.bold, fontSize:14, color:Colors.g500 },
  analyseBtn: { borderRadius:Radius.r99, paddingVertical:15, alignItems:'center', ...Shadows.sh2 },
  analyseBtnText: { fontFamily:Fonts.black, fontSize:15, color:'#fff', letterSpacing:0.3 },
  inputField: { borderWidth:2, borderColor:Colors.g200, borderRadius:Radius.r12, padding:13, fontSize:14, fontFamily:Fonts.bold, color:Colors.g900, backgroundColor:Colors.white },
  scoreCard: { flexDirection:'row', gap:14, backgroundColor:Colors.white, borderRadius:Radius.r16, padding:16, alignItems:'center' },
  scoreRing: { width:80, height:80, alignItems:'center', justifyContent:'center' },
  scoreInner: { width:76, height:76, borderRadius:38, borderWidth:4, alignItems:'center', justifyContent:'center' },
  scoreNum: { fontFamily:Fonts.black, fontSize:24 },
  scoreTitle: { fontFamily:Fonts.extraBold, fontSize:14, color:Colors.g900 },
  scoreSub: { fontFamily:Fonts.medium, fontSize:11, color:Colors.g400, marginTop:2 },
  scoreVerdict: { fontFamily:Fonts.extraBold, fontSize:12, marginTop:4 },
  paramsGrid: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  paramCell: { flex:1, minWidth:'22%', backgroundColor:Colors.white, borderRadius:Radius.r12, padding:10, alignItems:'center', ...Shadows.sh1 },
  paramVal: { fontFamily:Fonts.black, fontSize:15, color:Colors.g1 },
  paramLabel: { fontFamily:Fonts.medium, fontSize:10, color:Colors.g400, textTransform:'uppercase', marginTop:2 },
  recBox: { backgroundColor:Colors.white, borderRadius:Radius.r16, padding:14, borderLeftWidth:4, ...Shadows.sh1 },
  recTitle: { fontFamily:Fonts.extraBold, fontSize:13, color:Colors.g1, marginBottom:6 },
  recText: { fontFamily:Fonts.medium, fontSize:13, color:Colors.g700, lineHeight:21 },
  urgencyCard: { borderRadius:Radius.r16, padding:14, borderWidth:2, alignItems:'center' },
  urgencyText: { fontFamily:Fonts.black, fontSize:18 },
  metricsRow: { flexDirection:'row', gap:8 },
  metricCard: { flex:1, backgroundColor:Colors.white, borderRadius:Radius.r12, padding:12, alignItems:'center', ...Shadows.sh1 },
  metricVal: { fontFamily:Fonts.black, fontSize:16, color:Colors.g1 },
  metricLabel: { fontFamily:Fonts.medium, fontSize:10, color:Colors.g400, textTransform:'uppercase', marginTop:2 },
  bestTimeCard: { flexDirection:'row', gap:10, backgroundColor:Colors.white, borderRadius:Radius.r12, padding:12, alignItems:'center', ...Shadows.sh1 },
  bestTimeLabel: { fontFamily:Fonts.extraBold, fontSize:10, color:Colors.g400, textTransform:'uppercase', letterSpacing:0.5 },
  bestTimeVal: { fontFamily:Fonts.extraBold, fontSize:14, color:Colors.g1, marginTop:2 },
  tipCard: { flexDirection:'row', gap:10, backgroundColor:Colors.white, borderRadius:Radius.r12, padding:11, alignItems:'flex-start', ...Shadows.sh1 },
  tipCardText: { flex:1, fontFamily:Fonts.medium, fontSize:13, color:Colors.g700, lineHeight:20 },
  alertTab: { paddingHorizontal:14, paddingVertical:6, borderRadius:Radius.r99, borderWidth:1.5, borderColor:'rgba(255,255,255,.3)' },
  alertTabOn: { backgroundColor:'rgba(255,255,255,.2)', borderColor:'rgba(255,255,255,.4)' },
  alertTabText: { fontFamily:Fonts.extraBold, fontSize:12, color:'rgba(255,255,255,.7)' },
  sepRow: { paddingHorizontal:16, paddingVertical:7, backgroundColor:Colors.g50 },
  sepText: { fontFamily:Fonts.extraBold, fontSize:10, color:Colors.g400, letterSpacing:0.7 },
  alertItem: { flexDirection:'row', gap:12, padding:14, backgroundColor:Colors.white, borderBottomWidth:1, borderBottomColor:Colors.g100 },
  alertIco: { width:42, height:42, borderRadius:21, alignItems:'center', justifyContent:'center', flexShrink:0 },
  alertTitle: { fontFamily:Fonts.extraBold, fontSize:14, color:Colors.g900, flex:1 },
  alertMsg: { fontFamily:Fonts.medium, fontSize:12.5, color:Colors.g500, lineHeight:19 },
  miniPill: { paddingHorizontal:9, paddingVertical:3, borderRadius:Radius.r99 },
  miniPillText: { fontFamily:Fonts.extraBold, fontSize:11 },
  alertTime: { fontFamily:Fonts.bold, fontSize:10, color:Colors.g400, alignSelf:'center' },
  alertActionBtn: { paddingHorizontal:12, paddingVertical:5, borderRadius:Radius.r99, backgroundColor:Colors.g100 },
  alertActionText: { fontFamily:Fonts.extraBold, fontSize:12, color:Colors.g500 },
});
