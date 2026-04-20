import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
  Animated, Easing, Dimensions, StatusBar, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';

import { useApp } from '../../src/store/AppContext';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────
// SUPABASE CONFIGURATION
// ─────────────────────────────────────────────────────
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* ─── Shared UI: Premium Floating Header ───────────────── */
function AuthHeader({ step, title, progress, subtitle }) {
  return (
    <LinearGradient colors={['#022C22', '#064E3B', '#10B981']} style={styles.authHdr}>
      <SafeAreaView edges={['top']}>
        <View style={styles.hdrRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
             {[33, 66, 100].map((val, idx) => (
               <View key={idx} style={[styles.progressSegment, progress >= val && styles.progressSegmentActive]} />
             ))}
          </View>
        </View>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.authStep}>{step}</Text>
          <Text style={styles.authTitle}>{title}</Text>
          {subtitle && <Text style={styles.authSubtitle}>{subtitle}</Text>}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ─── Shared UI: Icon Input Field ──────────────────────── */
const IconInput = ({ icon, label, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={20} color="#94A3B8" style={styles.inputIcon} />
      <TextInput style={styles.input} placeholderTextColor="#94A3B8" {...props} />
    </View>
  </View>
);

/* ─── STEP 1: REGISTER ─────────────────────────────────── */
export function Register() {
  const [form, setForm] = useState({ name: '', phone: '', pass: '', lang: 'en' });

  const next = async () => {
    if (form.name.length < 2) return Alert.alert('Invalid Name', 'Please enter your full name.');
    if (!/^\d{10}$/.test(form.phone)) return Alert.alert('Invalid Phone', '10-digit number required.');
    if (form.pass.length < 6) return Alert.alert('Security', 'Password must be at least 6 characters.');
    router.push({ pathname: '/(auth)/farm', params: form });
  };

  return (
    <View style={styles.main}>
      <StatusBar barStyle="light-content" backgroundColor="#022C22" />
      <AuthHeader step="Step 1 of 3" title="Create Account" subtitle="Join the smart farming revolution 🌱" progress={33} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={styles.floatingCardContainer}>
        <ScrollView contentContainerStyle={styles.floatingCard} showsVerticalScrollIndicator={false}>
          <IconInput icon="person-outline" label="Full Name" placeholder="e.g. Ramesh Kumar" onChangeText={(v) => setForm({...form, name: v})} />
          <IconInput icon="call-outline" label="Mobile Number" placeholder="98XXXXXXXX" keyboardType="phone-pad" maxLength={10} onChangeText={(v) => setForm({...form, phone: v})} />
          <IconInput icon="lock-closed-outline" label="Set Password" placeholder="••••••" secureTextEntry onChangeText={(v) => setForm({...form, pass: v})} />

          <TouchableOpacity onPress={next} style={styles.primaryBtn} activeOpacity={0.8}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.btnGrad}>
               <Text style={styles.btnText}>Continue</Text>
               <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ─── STEP 2: FARM DETAILS ─────────────────────────────── */
export function Farm() {
  const params = useLocalSearchParams();
  const [taluka, setTaluka] = useState('Panaji');
  const [size, setSize] = useState('');
  const [crops, setCrops] = useState([]);

  const talukas = ['Tiswadi', 'Bardez', 'Salcete', 'Ponda', 'Sattari', 'Bicholim', 'Pernem'];
  const cropOpts = [
    { v: 'cashew', l: 'Cashew', ico: '🥜' },
    { v: 'paddy', l: 'Paddy', ico: '🌾' },
    { v: 'coconut', l: 'Coconut', ico: '🥥' },
    { v: 'mango', l: 'Mango', ico: '🥭' }
  ];

  const next = () => {
    if (!size) return Alert.alert('Missing Data', 'Please enter farm size.');
    if (!crops.length) return Alert.alert('Selection', 'Select at least one crop.');
    router.push({
        pathname: '/(auth)/location',
        params: { ...params, taluka, farmSize: size, crops: JSON.stringify(crops) }
    });
  };

  return (
    <View style={styles.main}>
      <StatusBar barStyle="light-content" backgroundColor="#022C22" />
      <AuthHeader step="Step 2 of 3" title="Farm Details" subtitle="Help AI understand your land 🌾" progress={66} />

      <View style={styles.floatingCardContainer}>
        <ScrollView contentContainerStyle={styles.floatingCard} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Select Taluka</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {talukas.map(t => (
              <TouchableOpacity key={t} onPress={() => setTaluka(t)} style={[styles.chip, taluka === t && styles.chipActive]} activeOpacity={0.7}>
                <Text style={[styles.chipTxt, taluka === t && styles.chipTxtActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <IconInput icon="expand-outline" label="Farm Size (Acres)" placeholder="e.g. 2.5" keyboardType="decimal-pad" onChangeText={setSize} />

          <Text style={styles.label}>Primary Crops</Text>
          <View style={styles.grid}>
            {cropOpts.map(c => {
              const isSelected = crops.includes(c.v);
              return (
                <TouchableOpacity
                  key={c.v}
                  activeOpacity={0.7}
                  onPress={() => setCrops(prev => isSelected ? prev.filter(x => x !== c.v) : [...prev, c.v])}
                  style={[styles.gridItem, isSelected && styles.gridItemActive]}
                >
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    </View>
                  )}
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>{c.ico}</Text>
                  <Text style={[styles.gridTxt, isSelected && styles.gridTxtActive]}>{c.l}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={next} style={styles.primaryBtn} activeOpacity={0.8}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.btnGrad}>
               <Text style={styles.btnText}>Next: Location Sync</Text>
               <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

/* ─── STEP 3: LOCATION (SUPABASE REGISTER) ─────────────── */
export function LocationScreen() {
  const params = useLocalSearchParams();
  const { login } = useApp();
  const [state, setState] = useState('detecting');
  const [dbSaving, setDbSaving] = useState(false);
  const [locData, setLocData] = useState({ lat: 15.4909, lng: 73.8278, locName: 'Panaji, Goa' });

  const portalAnim = useRef(new Animated.Value(0)).current;
  const radarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(radarAnim, { toValue: 1, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true })
    ).start();
    setTimeout(detectLocation, 2000);
  }, []);

  const detectLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return setState('error');
    let loc = await Location.getCurrentPositionAsync({});
    setLocData({ lat: loc.coords.latitude, lng: loc.coords.longitude, locName: `${params.taluka || 'Panaji'}, Goa` });
    setState('found');
  };

  const finish = async () => {
    setDbSaving(true);

    // ✅ FIXED: Perfectly matches your exact `farmers` table columns!
    const userToSave = {
      phone: params.phone,
      name: params.name,
      password: params.pass, // YOU MUST ADD THIS COLUMN IN SUPABASE!
      taluka: params.taluka,
      farm_size: parseFloat(params.farmSize) || 0,
      crops: JSON.parse(params.crops || '[]') // Sends the array like ["cashew"]
    };

    // ✅ FIXED: Inserting into 'farmers' table
    const { error } = await supabase.from('farmers').insert([userToSave]);

    if (error) {
      setDbSaving(false);
      Alert.alert(
        'Database Error',
        `Could not save to Supabase. Ensure you added the 'password' column to your 'farmers' table.\n\nError: ${error.message}`
      );
      return;
    }

    Animated.timing(portalAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start(async () => {
      await login(userToSave);
      router.replace('/drawer/home');
    });
  };

  const radarScale = radarAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2] });
  const radarOpacity = radarAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });

  return (
    <View style={styles.main}>
      <StatusBar barStyle="light-content" backgroundColor="#022C22" />
      <AuthHeader step="Step 3 of 3" title="Precision Location 📍" subtitle="Connecting to Agri-Satellites" progress={100} />

      <View style={styles.radarWrapper}>
        {state === 'detecting' ? (
          <View style={styles.radarContainer}>
            <Animated.View style={[styles.radarRing, { transform: [{ scale: radarScale }], opacity: radarOpacity }]} />
            <View style={styles.radarCenter}>
              <Ionicons name="satellite-outline" size={32} color="#FFF" />
            </View>
            <Text style={styles.radarTitle}>SYNCING COORDINATES...</Text>
          </View>
        ) : (
          <View style={[styles.floatingCard, { alignItems: 'center', padding: 40 }]}>
            <View style={styles.successIconBox}>
              <Ionicons name="location" size={45} color="#FFF" />
            </View>
            <Text style={styles.foundLocName}>{locData.locName}</Text>
            <Text style={styles.foundLocCoords}>{locData.lat.toFixed(4)}° N, {locData.lng.toFixed(4)}° E</Text>

            <View style={styles.dataTag}><Text style={styles.dataTagTxt}>✓ Weather Data Linked</Text></View>
            <View style={styles.dataTag}><Text style={styles.dataTagTxt}>✓ Soil Profile Linked</Text></View>

            <TouchableOpacity onPress={finish} disabled={dbSaving} style={[styles.primaryBtn, { width: '100%', marginTop: 30 }]} activeOpacity={0.8}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.btnGrad}>
                {dbSaving ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Text style={styles.btnText}>ENTER DASHBOARD</Text>
                    <Ionicons name="planet" size={20} color="#FFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF', opacity: portalAnim }]} />
    </View>
  );
}

/* ─── LOGIN SCREEN (SUPABASE AUTH) ─────────────────────── */
export default function Login() {
  const { login } = useApp();
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const loginAnim = useRef(new Animated.Value(0)).current;

  const doLogin = async () => {
    if (!phone || !pass) return Alert.alert('Error', 'Please enter both phone and password.');

    setLoading(true);

    // ✅ FIXED: Looking up the user in your 'farmers' table
    const { data, error } = await supabase
      .from('farmers')
      .select('*')
      .eq('phone', phone);

    setLoading(false);

    if (error) {
      return Alert.alert('Database Error', error.message);
    }

    if (!data || data.length === 0) {
      return Alert.alert('Error', 'Account not found. Please Register first.');
    }

    const dbUser = data[0];

    // ✅ FIXED: Checks the new password column
    if (dbUser.password !== pass) {
      return Alert.alert('Error', 'Invalid password. Please try again.');
    }

    Animated.timing(loginAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start(async () => {
        await login(dbUser);
        router.replace('/drawer/home');
    });
  };

  return (
    <View style={styles.main}>
      <StatusBar barStyle="light-content" backgroundColor="#022C22" />

      <LinearGradient colors={['#022C22', '#064E3B', '#10B981']} style={[styles.authHdr, { paddingBottom: 60 }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.hdrRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerTextWrapper}>
            <View style={styles.logoCircle}>
              <Ionicons name="leaf" size={36} color="#10B981" />
            </View>
            <Text style={[styles.authTitle, { fontSize: 32 }]}>Welcome Back</Text>
            <Text style={styles.authSubtitle}>Login to your smart farm dashboard</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.floatingCardContainer}>
        <View style={styles.floatingCard}>
          <IconInput icon="call-outline" label="Mobile Number" placeholder="98XXXXXXXX" keyboardType="phone-pad" onChangeText={setPhone} />
          <IconInput icon="lock-closed-outline" label="Password" placeholder="••••••" secureTextEntry onChangeText={setPass} />

          <TouchableOpacity onPress={doLogin} disabled={loading} style={[styles.primaryBtn, { marginTop: 30 }]} activeOpacity={0.8}>
            <LinearGradient colors={['#064E3B', '#10B981']} style={styles.btnGrad}>
               {loading ? <ActivityIndicator color="#FFF" /> : (
                 <>
                   <Text style={styles.btnText}>Login Now</Text>
                   <Ionicons name="log-in-outline" size={22} color="#FFF" />
                 </>
               )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerLink}>Register Here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF', opacity: loginAnim }]} />
    </View>
  );
}

/* ─── PREMIUM STYLES ───────────────────────────────────── */
const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#F4F7F6' },

  authHdr: { paddingHorizontal: 25, paddingBottom: 50, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15 },
  hdrRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 15 },
  backCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  progressContainer: { flexDirection: 'row', gap: 6 },
  progressSegment: { height: 4, width: 30, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
  progressSegmentActive: { backgroundColor: '#FFF' },
  headerTextWrapper: { marginTop: 10 },
  authStep: { fontSize: 12, fontWeight: '800', color: '#4ADE80', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 5 },
  authTitle: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  authSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginTop: 5 },
  logoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },

  floatingCardContainer: { flex: 1, marginTop: -35, paddingHorizontal: 20 },
  floatingCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 25, paddingTop: 30, elevation: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: 5 }, marginBottom: 30 },

  inputGroup: { marginBottom: 22 },
  label: { fontSize: 13, fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, height: 60 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1E293B', fontWeight: '600' },

  primaryBtn: { height: 60, borderRadius: 18, overflow: 'hidden', marginTop: 10, elevation: 4, shadowColor: '#10B981', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  btnGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },

  chipScroll: { marginBottom: 25 },
  chip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, backgroundColor: '#F8FAFC', marginRight: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  chipActive: { backgroundColor: '#064E3B', borderColor: '#064E3B', elevation: 3, shadowColor: '#064E3B', shadowOpacity: 0.3, shadowRadius: 5 },
  chipTxt: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  chipTxtActive: { color: '#FFF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 25 },
  gridItem: { width: (width - 105) / 2, backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0', position: 'relative' },
  gridItemActive: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  gridTxt: { marginTop: 5, fontWeight: '800', color: '#64748B', fontSize: 15 },
  gridTxtActive: { color: '#064E3B' },
  checkBadge: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },

  radarWrapper: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, marginTop: -35 },
  radarContainer: { alignItems: 'center', justifyContent: 'center', height: 300 },
  radarRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#10B981' },
  radarCenter: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#064E3B', alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#064E3B', shadowOpacity: 0.5, shadowRadius: 20 },
  radarTitle: { marginTop: 40, fontSize: 13, fontWeight: '900', color: '#94A3B8', letterSpacing: 2 },

  successIconBox: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 20, elevation: 10, shadowColor: '#10B981', shadowOpacity: 0.4, shadowRadius: 15 },
  foundLocName: { fontSize: 24, fontWeight: '900', color: '#1E293B', textAlign: 'center' },
  foundLocCoords: { fontSize: 14, color: '#94A3B8', marginTop: 5, fontWeight: '700', marginBottom: 25 },
  dataTag: { backgroundColor: '#F0FDF4', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, marginBottom: 10, width: '100%' },
  dataTagTxt: { color: '#15803D', fontWeight: '700', fontSize: 14 },

  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { color: '#64748B', fontSize: 15, fontWeight: '600' },
  footerLink: { color: '#059669', fontSize: 15, fontWeight: '800' }
});