import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, StatusBar, Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ─── GEOGRAPHICALLY CORRECT DATA ───
const RISK_ZONES = [
  { id: '2', label: 'Mapusa', status: 'WARNING', color: '#FFA502', bg: 'rgba(255, 165, 2, 0.1)', top: '15%', left: '45%', threat: 'Leaf Miner' }, // NORTH
  { id: '3', label: 'Panaji', status: 'STABLE', color: '#2ED573', bg: 'rgba(46, 213, 115, 0.1)', top: '42%', left: '35%', threat: 'None Detected' }, // CENTRAL
  { id: '1', label: 'Canacona', status: 'CRITICAL', color: '#FF4757', bg: 'rgba(255, 71, 87, 0.1)', top: '78%', left: '55%', threat: 'Tea Mosquito Bug' }, // SOUTH
];

/* ─── The Pulse Component (2 Iterations then Vanish) ─── */
const MovingPulseMarker = ({ color, top, left, label }) => {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const [showRings, setShowRings] = useState(true);

  useEffect(() => {
    const pulseAnim = (anim, delay) => {
      return Animated.sequence([
        Animated.delay(delay),
        // Loop specifically 2 times
        Animated.loop(
          Animated.timing(anim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          { iterations: 2 }
        ),
      ]);
    };

    Animated.parallel([
      pulseAnim(ring1, 0),
      pulseAnim(ring2, 1250),
    ]).start(() => {
      // Callback: After 2 iterations, hide the moving rings
      setShowRings(false);
    });
  }, []);

  const getStyle = (anim) => ({
    transform: [{
      scale: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 3.5],
      })
    }],
    opacity: anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.6, 0],
    }),
    backgroundColor: color,
  });

  return (
    <View style={[styles.markerContainer, { top, left }]}>
      {/* Animated Rings - Only visible for 2 cycles */}
      {showRings && (
        <>
          <Animated.View style={[styles.pulseRing, getStyle(ring1)]} />
          <Animated.View style={[styles.pulseRing, getStyle(ring2)]} />
        </>
      )}

      {/* Solid Core remains visible */}
      <View style={[styles.markerCore, { backgroundColor: color }]}>
        <View style={styles.markerGlow} />
      </View>

      <View style={styles.markerLabel}>
        <Text style={styles.markerLabelText}>{label}</Text>
      </View>
    </View>
  );
};

export default function RiskMapScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#020617', '#0F172A']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color="#FFF" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.headerTitle}>Risk Intelligence</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveLabel}>TACTICAL SENSOR FEED</Text>
              </View>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.mapBox}>
          <LinearGradient colors={['#0F172A', '#1E293B']} style={StyleSheet.absoluteFill}>
            <View style={styles.gridLine} />
          </LinearGradient>

          {/* Corrected Landmass for Goa (North to South) */}
          <View style={styles.landmass} />

          {RISK_ZONES.map(z => (
            <MovingPulseMarker key={z.id} color={z.color} top={z.top} left={z.left} label={z.label} />
          ))}

          {/* Legend HUD */}
          <View style={styles.hudLegend}>
             <View style={styles.legendRow}><View style={[styles.legDot, { backgroundColor: '#FF4757' }]} /><Text style={styles.legTxt}>CRITICAL</Text></View>
             <View style={styles.legendRow}><View style={[styles.legDot, { backgroundColor: '#FFA502' }]} /><Text style={styles.legTxt}>WARNING</Text></View>
             <View style={styles.legendRow}><View style={[styles.legDot, { backgroundColor: '#2ED573' }]} /><Text style={styles.legTxt}>SECURE</Text></View>
          </View>
        </View>

        <View style={styles.infoArea}>
          <Text style={styles.sectionTitle}>Regional Vulnerability</Text>
          {RISK_ZONES.map(z => (
            <View key={z.id} style={styles.dataCard}>
              <View style={[styles.accentBar, { backgroundColor: z.color }]} />
              <View style={styles.cardInfo}>
                <Text style={styles.locName}>{z.label}</Text>
                <Text style={styles.threatName}>Threat: <Text style={{ color: '#F8FAFC' }}>{z.threat}</Text></Text>
              </View>
              <View style={[styles.statusBadge, { borderColor: z.color }]}>
                <Text style={[styles.statusText, { color: z.color }]}>{z.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { paddingBottom: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2ED573', marginRight: 6 },
  liveLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  mapBox: { height: 480, margin: 15, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: '#1E293B' },
  gridLine: { ...StyleSheet.absoluteFillObject, opacity: 0.05, borderWidth: 1, borderColor: '#FFF', borderStyle: 'dotted' },
  landmass: { position: 'absolute', width: 220, height: 600, backgroundColor: '#064E3B', opacity: 0.15, left: -40, borderTopRightRadius: 150, borderBottomRightRadius: 200 },
  markerContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 60, height: 60, borderRadius: 30 },
  markerCore: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  markerGlow: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFF' },
  markerLabel: { marginTop: 10, backgroundColor: 'rgba(15, 23, 42, 0.95)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  markerLabelText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  hudLegend: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(2, 6, 23, 0.9)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#1E293B' },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  legDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  legTxt: { color: '#94A3B8', fontSize: 9, fontWeight: '900' },
  infoArea: { padding: 20 },
  sectionTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 20 },
  dataCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 20, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#1E293B' },
  accentBar: { width: 5, height: '100%' },
  cardInfo: { flex: 1, padding: 18 },
  locName: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  threatName: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  statusBadge: { marginRight: 15, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1.5 },
  statusText: { fontSize: 10, fontWeight: '900' }
});