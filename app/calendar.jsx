import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FadeIn, PressScale } from '../src/components/UI';
import { useApp } from '../src/store/AppContext';
import { Colors, Fonts, Radius, Shadows } from '../src/theme';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const EVENT_DB = {
  cashew: {
    1: [{ nm:'Peak Harvest', sub:'Collect mature cashew apples daily', ico:'🥜', bg:'#f3e5f5', pl:'Harvest', plc:'b' }],
    3: [{ nm:'Morning Irrigation', sub:'Cashew field · 45 minutes', ico:'💧', bg:'#e3f2fd', pl:'Water', plc:'b' }, { nm:'Apply NPK Fertilizer', sub:'500g NPK 10:10:10 per tree', ico:'🌿', bg:'#fff8e1', pl:'Fertilize', plc:'y' }],
    5: [{ nm:'Pre-monsoon Pruning', sub:'Remove dead wood before rains', ico:'✂️', bg:'#f3e5f5', pl:'Prune', plc:'b' }],
  },
  paddy: {
    3: [{ nm:'Land Preparation', sub:'Plough and level paddy field', ico:'🚜', bg:'#fff8e1', pl:'Prep', plc:'y' }],
    4: [{ nm:'Top Dress Urea', sub:'25kg/acre at tillering stage', ico:'🌿', bg:'#fff8e1', pl:'Fertilize', plc:'y' }, { nm:'Blast Disease Check', sub:'Monitor for leaf lesions', ico:'🔍', bg:'#ffebee', pl:'Inspect', plc:'r' }],
    6: [{ nm:'Apply Fungicide', sub:'Tricyclazole 75% WP @ 0.6g/L', ico:'🛡️', bg:'#e8f5e9', pl:'Spray', plc:'g' }],
  },
  coconut: {
    3: [{ nm:'Fertilizer Dose 1', sub:'Urea 1kg + SSP 0.5kg + MOP 2kg/palm', ico:'🌿', bg:'#fff8e1', pl:'Fertilize', plc:'y' }, { nm:'Harvest Coconuts', sub:'Check for mature brown nuts', ico:'🥥', bg:'#f3e5f5', pl:'Harvest', plc:'b' }],
    5: [{ nm:'Crown Inspection', sub:'Check for Bud Rot signs', ico:'🔍', bg:'#ffebee', pl:'Inspect', plc:'r' }],
  },
};

const PILL_COLOR = { g:{ bg:Colors.gp, text:Colors.g2 }, y:{ bg:Colors.amberp, text:'#92600a' }, r:{ bg:Colors.redp, text:Colors.red }, b:{ bg:Colors.bluep, text:Colors.blue } };
const SEASON_PROG = { cashew:[98,80,50,20,25,40,60,70,75,80,92,98], paddy:[10,10,20,40,60,80,90,100,15,30,50,70], coconut:[50,55,60,65,70,75,65,60,70,80,85,45] };

export default function CalendarScreen() {
  const { user } = useApp();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const year = now.getFullYear();
  const crop = user?.crops?.[0] || 'cashew';
  const events = EVENT_DB[crop]?.[month] || [];
  const prog = (SEASON_PROG[crop] || SEASON_PROG.cashew)[month] || 50;
  const fd = new Date(year, month, 1).getDay();
  const dim = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(fd).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  const hasEvent = new Set(events.map((_, i) => (i + 1) * 3));

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <LinearGradient colors={[Colors.g1, Colors.g2]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backArrow}>←</Text></TouchableOpacity>
            <Text style={styles.headerTitle}>Crop Calendar</Text>
            <View style={{ width: 32 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.monthBtn} onPress={() => setMonth(m => m === 0 ? 11 : m - 1)}>
            <Text style={styles.monthBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
            <View style={styles.progBar}>
              <View style={[styles.progFill, { width: `${prog}%` }]} />
            </View>
            <Text style={styles.progLabel}>{crop.charAt(0).toUpperCase()+crop.slice(1)} season {prog}% complete</Text>
          </View>
          <TouchableOpacity style={styles.monthBtn} onPress={() => setMonth(m => m === 11 ? 0 : m + 1)}>
            <Text style={styles.monthBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar grid */}
        <FadeIn delay={0} style={styles.calGrid}>
          {DAYS_SHORT.map(d => <Text key={d} style={styles.dayLbl}>{d}</Text>)}
          {cells.map((d, i) => {
            if (!d) return <View key={i} />;
            const isToday = now.getMonth() === month && now.getDate() === d;
            const hasEv = d % 7 === 0 || d === now.getDate(); // simplified demo
            return (
              <TouchableOpacity key={i} style={[styles.calDay, isToday && styles.calDayToday]}>
                <Text style={[styles.calDayText, isToday && { color: '#fff', fontFamily: Fonts.black }]}>{d}</Text>
                {hasEv && <View style={[styles.evDot, isToday && { backgroundColor: '#fff' }]} />}
              </TouchableOpacity>
            );
          })}
        </FadeIn>

        {/* Events */}
        {events.length > 0 && (
          <>
            <Text style={styles.evHeader}>Tasks this month</Text>
            {events.map((e, i) => (
              <FadeIn key={i} delay={i * 60} style={styles.evItem}>
                <View style={[styles.evIco, { backgroundColor: e.bg }]}>
                  <Text style={{ fontSize: 20 }}>{e.ico}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.evName}>{e.nm}</Text>
                  <Text style={styles.evSub}>{e.sub}</Text>
                </View>
                <View style={[styles.evPill, { backgroundColor: PILL_COLOR[e.plc]?.bg }]}>
                  <Text style={[styles.evPillText, { color: PILL_COLOR[e.plc]?.text }]}>{e.pl}</Text>
                </View>
              </FadeIn>
            ))}
          </>
        )}
        {events.length === 0 && (
          <View style={styles.noEvents}>
            <Text style={{ fontSize: 48 }}>📅</Text>
            <Text style={styles.noEventsText}>No tasks scheduled for {MONTHS[month]}</Text>
          </View>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: 12 },
  headerRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingTop:10 },
  backBtn: { width:32, height:32, alignItems:'center', justifyContent:'center' },
  backArrow: { fontFamily:Fonts.extraBold, fontSize:22, color:'rgba(255,255,255,.8)' },
  headerTitle: { fontFamily:Fonts.black, fontSize:17, color:'#fff' },
  monthNav: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:14, backgroundColor:Colors.white },
  monthBtn: { width:34, height:34, backgroundColor:Colors.g100, borderRadius:17, alignItems:'center', justifyContent:'center' },
  monthBtnText: { fontFamily:Fonts.black, fontSize:18, color:Colors.g700 },
  monthTitle: { fontFamily:Fonts.black, fontSize:17, color:Colors.g900 },
  progBar: { width:140, height:5, backgroundColor:Colors.g100, borderRadius:3, overflow:'hidden' },
  progFill: { height:'100%', backgroundColor:Colors.g3, borderRadius:3 },
  progLabel: { fontFamily:Fonts.medium, fontSize:11, color:Colors.g400 },
  calGrid: { backgroundColor:Colors.white, margin:14, borderRadius:Radius.r16, padding:8, ...Shadows.sh1, flexDirection:'row', flexWrap:'wrap' },
  dayLbl: { width:'14.28%', textAlign:'center', fontFamily:Fonts.extraBold, fontSize:10, color:Colors.g400, paddingVertical:4, textTransform:'uppercase' },
  calDay: { width:'14.28%', aspectRatio:1, alignItems:'center', justifyContent:'center', borderRadius:Radius.r8, position:'relative' },
  calDayToday: { backgroundColor:Colors.g1 },
  calDayText: { fontFamily:Fonts.bold, fontSize:13, color:Colors.g700 },
  evDot: { position:'absolute', bottom:3, width:4, height:4, borderRadius:2, backgroundColor:Colors.amber },
  evHeader: { fontFamily:Fonts.extraBold, fontSize:11, color:Colors.g500, textTransform:'uppercase', letterSpacing:0.8, paddingHorizontal:14, paddingTop:14, paddingBottom:8 },
  evItem: { flexDirection:'row', alignItems:'center', gap:12, padding:12, paddingHorizontal:14, backgroundColor:Colors.white, borderBottomWidth:1, borderBottomColor:Colors.g100 },
  evIco: { width:42, height:42, borderRadius:21, alignItems:'center', justifyContent:'center' },
  evName: { fontFamily:Fonts.extraBold, fontSize:13, color:Colors.g900 },
  evSub: { fontFamily:Fonts.medium, fontSize:11, color:Colors.g400, marginTop:1 },
  evPill: { paddingHorizontal:9, paddingVertical:3, borderRadius:Radius.r99 },
  evPillText: { fontFamily:Fonts.extraBold, fontSize:11 },
  noEvents: { alignItems:'center', padding:40, gap:10 },
  noEventsText: { fontFamily:Fonts.bold, fontSize:14, color:Colors.g400, textAlign:'center' },
});
