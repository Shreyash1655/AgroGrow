import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, Modal, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FadeIn, PressScale } from '../../src/components/UI';
import { useApp } from '../../src/store/AppContext';
import { Colors, Fonts, Radius, Shadows } from '../../src/theme';
import { supabase } from '../../src/utils/store';

function SettingRow({ icon, label, sublabel, right, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.settingIcon, danger && { backgroundColor: Colors.redp }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, danger && { color: Colors.red }]}>{label}</Text>
        {sublabel ? <Text style={styles.settingSub}>{sublabel}</Text> : null}
      </View>
      {right || <Text style={{ color: Colors.g300, fontSize: 18 }}>›</Text>}
    </TouchableOpacity>
  );
}

function Toggle({ value, onToggle }) {
  return (
    <TouchableOpacity
      style={[styles.toggle, value && styles.toggleOn]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={[styles.toggleKnob, value && styles.toggleKnobOn]} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout, apiKey, setApiKey } = useApp();
  const [bioOn, setBioOn] = useState(false);
  const [notifOn, setNotifOn] = useState(true);
  const [showApiModal, setShowApiModal] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [supaStatus, setSupaStatus] = useState('');

  const crops = (user?.crops || []).map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');
  const initials = user?.name?.[0]?.toUpperCase() || '?';

  function openApiModal() { setTempKey(apiKey || ''); setShowApiModal(true); }
  async function saveApiKey() {
    await setApiKey(tempKey.trim());
    setShowApiModal(false);
  }

  async function checkSupabase() {
    setSupaStatus('Checking...');
    try {
      const { count, error } = await supabase.from('farmers').select('*', { count: 'exact', head: true });
      if (error) setSupaStatus('⚠️ ' + error.message);
      else setSupaStatus(`✅ Connected · ${count} farmers`);
    } catch (e) { setSupaStatus('❌ ' + e.message); }
  }

  function handleLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/onboard'); } },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={[Colors.g1, Colors.g3]} style={styles.hero}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroContent}>
              <FadeIn style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </FadeIn>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroName}>{user?.name || 'Farmer'}</Text>
                <Text style={styles.heroRole}>{crops} Farmer · {user?.taluka}, Goa</Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available in the next update.')}>
                <Text style={{ fontSize: 16 }}>✏️</Text>
              </TouchableOpacity>
            </View>
            {/* Stat pills */}
            <View style={styles.statPills}>
              <View style={styles.statPill}><Text style={styles.statPillText}>🌾 {user?.farmSize} acres</Text></View>
              <View style={styles.statPill}><Text style={styles.statPillText}>🌍 {user?.soil}</Text></View>
              <View style={styles.statPill}><Text style={styles.statPillText}>📍 {user?.taluka}</Text></View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Farm stats */}
        <View style={styles.statsRow}>
          {[{ v:(user?.crops||[]).length, l:'Crops' }, { v:user?.farmSize+' ac', l:'Farm Size' }, { v:user?.soil||'laterite', l:'Soil Type' }].map((s,i) => (
            <FadeIn key={i} delay={i*60} style={styles.statCard}>
              <Text style={styles.statVal}>{s.v}</Text>
              <Text style={styles.statLabel}>{s.l}</Text>
            </FadeIn>
          ))}
        </View>

        {/* AI Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI & CONNECTIVITY</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="🔑"
              label={apiKey ? '✅ AI API Key (Active)' : '🔑 AI API Key'}
              sublabel={apiKey ? 'Claude AI chatbot enabled — tap to change' : 'Tap to enable AI chatbot & crop diagnosis'}
              onPress={openApiModal}
            />
            <SettingRow
              icon="☁️"
              label="Supabase Connection"
              sublabel={supaStatus || 'Tap to check database status'}
              onPress={checkSupabase}
            />
          </View>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.sectionCard}>
            <SettingRow icon="📅" label="Crop Calendar" sublabel={crops + ' · farming schedule'} onPress={() => router.push('/calendar')} />
            <SettingRow icon="🌱" label="Soil Advisor" sublabel="AI soil analysis for your farm" onPress={() => router.push('/soil')} />
            <SettingRow icon="💧" label="Smart Irrigation" sublabel="AI watering recommendations" onPress={() => router.push('/irrigation')} />
            <SettingRow
              icon="📱"
              label="Biometric Login"
              sublabel="Use Face ID / Fingerprint"
              onPress={() => setBioOn(b => !b)}
              right={<Toggle value={bioOn} onToggle={() => setBioOn(b => !b)} />}
            />
            <SettingRow
              icon="🔔"
              label="Push Notifications"
              sublabel="Disease alerts, weather warnings"
              onPress={() => setNotifOn(b => !b)}
              right={<Toggle value={notifOn} onToggle={() => setNotifOn(b => !b)} />}
            />
          </View>
        </View>

        {/* More */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MORE</Text>
          <View style={styles.sectionCard}>
            <SettingRow icon="🌐" label="Change Language" sublabel="English / Konkani / Marathi / Hindi" onPress={() => Alert.alert('Languages', 'Multi-language support coming soon!')} />
            <SettingRow icon="❓" label="Help & Support" sublabel="Call 1800-XXX-XXXX · WhatsApp" onPress={() => Alert.alert('Support', 'WhatsApp: +91 98765 43210\nEmail: support@agrogrow.in')} />
            <SettingRow icon="ℹ️" label="About AgroGROW" sublabel="v2.0 · Built for GDG Hackathon Goa 2025" onPress={() => Alert.alert('AgroGROW', 'v2.0 · 4-Layer Architecture\nBuilt with Expo + React Native + Supabase + Claude AI')} />
          </View>
        </View>

        {/* Logout */}
        <View style={[styles.section, { paddingBottom: 100 }]}>
          <View style={styles.sectionCard}>
            <SettingRow icon="🚪" label="Log out" onPress={handleLogout} danger />
          </View>
        </View>
      </ScrollView>

      {/* API Key Modal */}
      <Modal visible={showApiModal} transparent animationType="fade" onRequestClose={() => setShowApiModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowApiModal(false)} />
        <View style={styles.apiModal}>
          <Text style={styles.apiModalTitle}>🔑 Anthropic API Key</Text>
          <Text style={styles.apiModalDesc}>Enter your Anthropic API key to enable AI chatbot, crop diagnosis and soil advisor.</Text>
          <TextInput
            style={styles.apiInput}
            value={tempKey}
            onChangeText={setTempKey}
            placeholder="sk-ant-api03-..."
            placeholderTextColor={Colors.g400}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.apiHint}>Get your free key at console.anthropic.com → API Keys</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <TouchableOpacity style={styles.apiCancelBtn} onPress={() => setShowApiModal(false)}>
              <Text style={{ fontFamily: Fonts.extraBold, fontSize: 14, color: Colors.g500 }}>Cancel</Text>
            </TouchableOpacity>
            <PressScale style={{ flex: 1 }} onPress={saveApiKey}>
              <LinearGradient colors={[Colors.g3, Colors.g1]} style={styles.apiSaveBtn}>
                <Text style={{ fontFamily: Fonts.black, fontSize: 14, color: '#fff' }}>Save Key</Text>
              </LinearGradient>
            </PressScale>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingBottom: 16 },
  heroContent: { flexDirection:'row', alignItems:'center', gap:14, paddingHorizontal:18, paddingTop:8, paddingBottom:12 },
  avatar: { width:66, height:66, borderRadius:33, backgroundColor:Colors.amber, alignItems:'center', justifyContent:'center', borderWidth:3, borderColor:'rgba(255,255,255,.25)' },
  avatarText: { fontFamily:Fonts.black, fontSize:28, color:Colors.g1 },
  heroName: { fontFamily:Fonts.black, fontSize:20, color:'#fff' },
  heroRole: { fontFamily:Fonts.medium, fontSize:12, color:'rgba(255,255,255,.65)', marginTop:2 },
  editBtn: { width:34, height:34, backgroundColor:'rgba(255,255,255,.15)', borderRadius:17, alignItems:'center', justifyContent:'center' },
  statPills: { flexDirection:'row', gap:7, paddingHorizontal:18, paddingBottom:4 },
  statPill: { backgroundColor:'rgba(255,255,255,.15)', borderRadius:Radius.r99, paddingHorizontal:11, paddingVertical:4 },
  statPillText: { fontFamily:Fonts.extraBold, fontSize:11, color:'rgba(255,255,255,.9)' },
  statsRow: { flexDirection:'row', gap:1, backgroundColor:Colors.g100 },
  statCard: { flex:1, backgroundColor:Colors.white, padding:14, alignItems:'center' },
  statVal: { fontFamily:Fonts.black, fontSize:17, color:Colors.g1 },
  statLabel: { fontFamily:Fonts.bold, fontSize:10, color:Colors.g400, textTransform:'uppercase', letterSpacing:0.5, marginTop:2 },
  section: { paddingHorizontal:14, paddingTop:14 },
  sectionTitle: { fontFamily:Fonts.extraBold, fontSize:10, color:Colors.g400, textTransform:'uppercase', letterSpacing:0.8, marginBottom:7 },
  sectionCard: { backgroundColor:Colors.white, borderRadius:Radius.r16, overflow:'hidden', ...Shadows.sh1 },
  settingRow: { flexDirection:'row', alignItems:'center', gap:13, padding:14, borderBottomWidth:1, borderBottomColor:Colors.g100 },
  settingIcon: { width:38, height:38, backgroundColor:Colors.g100, borderRadius:Radius.r8, alignItems:'center', justifyContent:'center' },
  settingLabel: { fontFamily:Fonts.extraBold, fontSize:14, color:Colors.g900 },
  settingSub: { fontFamily:Fonts.medium, fontSize:11, color:Colors.g400, marginTop:1 },
  toggle: { width:44, height:24, borderRadius:12, backgroundColor:Colors.g200, justifyContent:'center', paddingHorizontal:2 },
  toggleOn: { backgroundColor:Colors.g3 },
  toggleKnob: { width:20, height:20, borderRadius:10, backgroundColor:Colors.white, ...Shadows.sh1 },
  toggleKnobOn: { transform:[{ translateX:20 }] },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,.5)' },
  apiModal: { position:'absolute', bottom:0, left:0, right:0, backgroundColor:Colors.white, borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, ...Shadows.sh3 },
  apiModalTitle: { fontFamily:Fonts.black, fontSize:18, color:Colors.g900, marginBottom:6 },
  apiModalDesc: { fontFamily:Fonts.medium, fontSize:13, color:Colors.g500, lineHeight:20, marginBottom:14 },
  apiInput: { borderWidth:2, borderColor:Colors.g200, borderRadius:Radius.r12, padding:13, fontSize:13, fontFamily:Fonts.medium, color:Colors.g900, marginBottom:6 },
  apiHint: { fontFamily:Fonts.bold, fontSize:11, color:Colors.g400, marginBottom:4 },
  apiCancelBtn: { flex:1, padding:14, alignItems:'center', borderWidth:2, borderColor:Colors.g200, borderRadius:Radius.r99 },
  apiSaveBtn: { borderRadius:Radius.r99, padding:14, alignItems:'center' },
});
