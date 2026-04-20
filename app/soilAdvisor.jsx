import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { useTranslation } from "react-i18next"; // 🌐 Translation Hook

const { width } = Dimensions.get("window");

// --- DATA STRIPPED FOR i18n ---
const CROPS = [
  { id: "cashew", emoji: "🥜", color: "#FDE68A" },
  { id: "paddy", emoji: "🌾", color: "#BBF7D0" },
  { id: "coconut", emoji: "🥥", color: "#E7E5E4" },
  { id: "vegetable", emoji: "🥦", color: "#A7F3D0" },
  { id: "sugarcane", emoji: "🎋", color: "#99F6E4" },
  { id: "maize", emoji: "🌽", color: "#FEF08A" },
  { id: "banana", emoji: "🍌", color: "#FEF9C3" },
  { id: "groundnut", emoji: "🫘", color: "#FED7AA" },
];

const SOILS = [
  { id: "laterite", tag: "🔴" },
  { id: "alluvial", tag: "🌊" },
  { id: "clay", tag: "🟤" },
  { id: "sandy", tag: "🟡" },
  { id: "loam", tag: "🌿" },
  { id: "black", tag: "⚫" },
];

// --- HELPER COMPONENTS ---
const getScoreColor = (score) => {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
};

const ScoreRing = ({ score }) => {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const col = getScoreColor(score);

  return (
    <View style={styles.scoreWrapper}>
      <Svg width="100" height="100">
        <Circle cx="50" cy="50" r={r} fill="none" stroke="#F3F4F6" strokeWidth="8" />
        <Circle
          cx="50" cy="50" r={r} fill="none" stroke={col} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 50 50)"
        />
        <SvgText x="50" y="56" textAnchor="middle" fill="#111827" fontSize="24" fontWeight="900">{score}</SvgText>
      </Svg>
    </View>
  );
};

export default function SoilAdvisor() {
  const { t } = useTranslation(); // 🌐 Bring in the engine
  const [crop, setCrop] = useState("cashew");
  const [soil, setSoil] = useState("laterite");
  const [result, setResult] = useState(null);
  const [analysing, setAnalysing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const runAnalysis = () => {
    setAnalysing(true);
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    setResult(null);

    setTimeout(() => {
      // 🌐 Pull the translated soil data database
      const db = t('soilAdvisor.data', { returnObjects: true });

      const dataPoint = (db[crop] && db[crop][soil]) ? db[crop][soil] : {
        score: 65, n: t('soilAdvisor.levels.med'), p: t('soilAdvisor.levels.med'), k: t('soilAdvisor.levels.med'),
        ph: "6.0-7.0", fert: t('soilAdvisor.fallbackFert'), warn: t('soilAdvisor.fallbackWarn'), match: t('soilAdvisor.matches.good')
      };

      setResult(dataPoint);
      setAnalysing(false);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true })
      ]).start();
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <View style={styles.bgBlurTop} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('soilAdvisor.title')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('soilAdvisor.step1')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {CROPS.map((item) => {
              const isActive = crop === item.id;
              return (
                <TouchableOpacity key={item.id} activeOpacity={0.7} onPress={() => setCrop(item.id)} style={[styles.cropCard, isActive && styles.cropCardActive]}>
                  <View style={[styles.emojiCircle, { backgroundColor: item.color }]}><Text style={styles.emoji}>{item.emoji}</Text></View>
                  {/* 🌐 Translated Crop Label */}
                  <Text style={[styles.cropLabel, isActive && styles.cropLabelActive]}>{t(`soilAdvisor.crops.${item.id}`)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('soilAdvisor.step2')}</Text>
          <View style={styles.pillContainer}>
            {SOILS.map((item) => {
              const isActive = soil === item.id;
              return (
                <TouchableOpacity key={item.id} activeOpacity={0.7} onPress={() => setSoil(item.id)} style={[styles.soilPill, isActive && styles.soilPillActive]}>
                  <Text style={styles.soilPillEmoji}>{item.tag}</Text>
                  {/* 🌐 Translated Soil Label */}
                  <Text style={[styles.soilPillText, isActive && styles.soilPillTextActive]}>{t(`soilAdvisor.soils.${item.id}`)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={runAnalysis} disabled={analysing} style={styles.actionBtn}>
          {analysing ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>{t('soilAdvisor.analyzeBtn')}</Text>}
        </TouchableOpacity>

        {result && (
          <Animated.View style={[styles.resultDashboard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.resultTop}>
              <ScoreRing score={result.score} />
              <View style={styles.resultHeaderInfo}>
                <Text style={styles.resultContext}>{t('soilAdvisor.soilFor', { soil: t(`soilAdvisor.soils.${soil}`), crop: t(`soilAdvisor.crops.${crop}`) })}</Text>
                <View style={[styles.matchTag, { backgroundColor: getScoreColor(result.score) + '15' }]}>
                  <Text style={[styles.matchTagText, { color: getScoreColor(result.score) }]}>
                    {result.match} {t('soilAdvisor.suitability')}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.statsGrid}>
              {[
                { label: t('soilAdvisor.nitrogen'), val: result.n },
                { label: t('soilAdvisor.phosphorus'), val: result.p },
                { label: t('soilAdvisor.potassium'), val: result.k },
                { label: t('soilAdvisor.idealPh'), val: result.ph },
              ].map((stat, i) => (
                <View key={i} style={styles.statBox}>
                  <Text style={styles.statVal}>{stat.val}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.insightBox}>
              <View style={styles.insightHeader}>
                <Text style={styles.insightIcon}>🌱</Text>
                <Text style={styles.insightTitle}>{t('soilAdvisor.agronomyPlan')}</Text>
              </View>
              <Text style={styles.insightText}>{result.fert}</Text>
            </View>

            <View style={[styles.insightBox, styles.warningBox]}>
              <View style={styles.insightHeader}>
                <Text style={styles.insightIcon}>⚠️</Text>
                <Text style={[styles.insightTitle, { color: '#B45309' }]}>{t('soilAdvisor.crucialWarning')}</Text>
              </View>
              <Text style={[styles.insightText, { color: '#78350F' }]}>{result.warn}</Text>
            </View>

          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  bgBlurTop: { position: "absolute", top: -100, right: -100, width: 300, height: 300, backgroundColor: "#D1FAE5", borderRadius: 150, opacity: 0.5 },
  scrollContent: { paddingBottom: 50 },
  header: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 20 },
  title: { fontSize: 36, fontWeight: "300", color: "#111827", letterSpacing: -1 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#374151", marginLeft: 24, marginBottom: 16 },
  hScroll: { paddingHorizontal: 20 },
  cropCard: { backgroundColor: "#FFFFFF", width: 100, height: 110, borderRadius: 20, alignItems: "center", justifyContent: "center", marginHorizontal: 4, borderWidth: 2, borderColor: "transparent", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  cropCardActive: { borderColor: "#10B981", backgroundColor: "#ECFDF5" },
  emojiCircle: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  emoji: { fontSize: 24 },
  cropLabel: { fontSize: 13, fontWeight: "600", color: "#4B5563" },
  cropLabelActive: { color: "#059669", fontWeight: "700" },
  pillContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 10 },
  soilPill: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: "#E5E7EB", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  soilPillActive: { backgroundColor: "#111827", borderColor: "#111827" },
  soilPillEmoji: { fontSize: 16, marginRight: 8 },
  soilPillText: { fontSize: 14, fontWeight: "600", color: "#4B5563" },
  soilPillTextActive: { color: "#FFFFFF" },
  actionBtn: { backgroundColor: "#059669", marginHorizontal: 24, marginTop: 36, paddingVertical: 18, borderRadius: 20, alignItems: "center", shadowColor: "#059669", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  actionBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
  resultDashboard: { margin: 24, backgroundColor: "#FFFFFF", borderRadius: 28, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 10 },
  resultTop: { flexDirection: "row", alignItems: "center" },
  scoreWrapper: { marginRight: 16 },
  resultHeaderInfo: { flex: 1 },
  resultContext: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 8 },
  matchTag: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  matchTagText: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 24, gap: 12 },
  statBox: { flex: 1, minWidth: '45%', backgroundColor: "#F3F4F6", padding: 12, borderRadius: 14 },
  statVal: { fontSize: 16, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 24 },
  insightBox: { marginBottom: 16 },
  insightHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  insightIcon: { fontSize: 16, marginRight: 8 },
  insightTitle: { fontSize: 15, fontWeight: "700", color: "#065F46" },
  insightText: { fontSize: 14, lineHeight: 22, color: "#4B5563", paddingLeft: 24 },
  warningBox: { backgroundColor: "#FEF3C7", padding: 16, borderRadius: 16, marginTop: 8, marginBottom: 0 },
});