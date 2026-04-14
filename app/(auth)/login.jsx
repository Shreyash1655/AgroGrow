import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { BtnPrimary, FadeIn } from '../../src/components/UI';
import { Colors, Fonts, Radius } from '../../src/theme';
import { UserStore, Session } from '../../src/utils/store';
import { useApp } from '../../src/store/AppContext';

// ── Shared auth header ────────────────────────────────────────
function AuthHeader({ step, title }) {
  return (
    <LinearGradient colors={[Colors.g1, Colors.g2]} style={styles.authHdr}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 22 }}>←</Text>
      </TouchableOpacity>
      <Text style={styles.authStep}>{step}</Text>
      <Text style={styles.authTitle}>{title}</Text>
    </LinearGradient>
  );
}

// ── Field group ───────────────────────────────────────────────
function FieldGroup({ label, children }) {
  return (
    <View style={styles.fgroup}>
      <Text style={styles.fl}>{label}</Text>
      {children}
    </View>
  );
}

function Input({ value, onChangeText, placeholder, keyboardType, secureTextEntry, maxLength }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[styles.fi, focused && styles.fiFocused]}
      value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor={Colors.g400} keyboardType={keyboardType}
      secureTextEntry={secureTextEntry} maxLength={maxLength}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      fontFamily={Fonts.bold}
    />
  );
}

// ── Register Screen ───────────────────────────────────────────
export function Register() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);

  async function next() {
    if (name.trim().length < 2) { Alert.alert('Error', 'Enter your full name'); return; }
    if (!/^\d{10}$/.test(phone)) { Alert.alert('Error', 'Enter a valid 10-digit phone number'); return; }
    if (pass.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    if (await UserStore.exists(phone)) { Alert.alert('Error', 'Phone already registered! Please login.'); return; }
    router.push({ pathname: '/(auth)/farm', params: { name: name.trim(), phone, pass, lang } });
  }

  const langs = [{ v: 'en', l: '🇮🇳 English' }, { v: 'kok', l: '🌿 Konkani' }, { v: 'mr', l: '📖 Marathi' }, { v: 'hi', l: '🔤 Hindi' }];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AuthHeader step="Step 1 of 3 · Create Account" title="Join AgroGROW 👋" />
      <ScrollView contentContainerStyle={styles.authBody} showsVerticalScrollIndicator={false}>
        <FadeIn delay={0}><FieldGroup label="Full Name"><Input value={name} onChangeText={setName} placeholder="e.g. Ramesh Naik" /></FieldGroup></FadeIn>
        <FadeIn delay={60}><FieldGroup label="Phone Number"><Input value={phone} onChangeText={setPhone} placeholder="10-digit mobile number" keyboardType="phone-pad" maxLength={10} /></FieldGroup></FadeIn>
        <FadeIn delay={120}><FieldGroup label="Password"><Input value={pass} onChangeText={setPass} placeholder="At least 6 characters" secureTextEntry /></FieldGroup></FadeIn>
        <FadeIn delay={180}><FieldGroup label="Preferred Language">
          <View style={styles.langRow}>
            {langs.map(l => (
              <TouchableOpacity key={l.v} style={[styles.langBtn, lang === l.v && styles.langBtnOn]} onPress={() => setLang(l.v)}>
                <Text style={[styles.langBtnText, lang === l.v && { color: '#fff' }]}>{l.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FieldGroup></FadeIn>
        <FadeIn delay={240}><BtnPrimary label="Next: Farm Details →" onPress={next} loading={loading} /></FadeIn>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.switchText}>Already registered? <Text style={{ color: Colors.g2, fontFamily: Fonts.black }}>Login here</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Farm Screen ───────────────────────────────────────────────
export function Farm({ route }) {
  const params = route?.params || {};
  const [taluka, setTaluka] = useState('Panaji');
  const [size, setSize] = useState('');
  const [soil, setSoil] = useState('laterite');
  const [crops, setCrops] = useState([]);

  const talukas = ['Lotoulim','Salcete','Panaji','Mapusa','Margao','Canacona','Ponda','Sattari','Bicholim','Quepem','Vasco da Gama','Calangute'];
  const cropOpts = [{ v:'cashew', l:'🥜 Cashew' }, { v:'paddy', l:'🌾 Paddy' }, { v:'coconut', l:'🥥 Coconut' }, { v:'vegetable', l:'🥬 Vegetable' }];
  const soils = [{ v:'laterite', l:'🔴 Red Laterite' }, { v:'alluvial', l:'🌊 Alluvial / Khazan' }, { v:'clay', l:'🟤 Clay' }, { v:'sandy', l:'🟡 Sandy / Coastal' }];

  function toggleCrop(v) { setCrops(c => c.includes(v) ? c.filter(x => x !== v) : [...c, v]); }

  function next() {
    if (!size || parseFloat(size) <= 0) { Alert.alert('Error', 'Enter your farm size in acres'); return; }
    if (!crops.length) { Alert.alert('Error', 'Select at least one crop'); return; }
    router.push({ pathname: '/(auth)/location', params: { ...params, taluka, farmSize: size, soil, crops: JSON.stringify(crops) } });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AuthHeader step="Step 2 of 3 · Farm Details" title="Tell us about your farm 🌾" />
      <ScrollView contentContainerStyle={styles.authBody} showsVerticalScrollIndicator={false}>
        <FadeIn delay={0}><FieldGroup label="Taluka / Village">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
            <View style={{ flexDirection: 'row', gap: 7, paddingHorizontal: 4 }}>
              {talukas.map(t => (
                <TouchableOpacity key={t} style={[styles.chipBtn, taluka === t && styles.chipBtnOn]} onPress={() => setTaluka(t)}>
                  <Text style={[styles.chipText, taluka === t && { color: '#fff' }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </FieldGroup></FadeIn>
        <FadeIn delay={60}><FieldGroup label="Farm Size (acres)"><Input value={size} onChangeText={setSize} placeholder="e.g. 2.5" keyboardType="decimal-pad" /></FieldGroup></FadeIn>
        <FadeIn delay={120}><FieldGroup label="Your Crops">
          <View style={styles.cropGrid}>
            {cropOpts.map(c => (
              <TouchableOpacity key={c.v} style={[styles.cropBtn, crops.includes(c.v) && styles.cropBtnOn]} onPress={() => toggleCrop(c.v)}>
                <Text style={[styles.cropText, crops.includes(c.v) && { color: Colors.g1 }]}>{c.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FieldGroup></FadeIn>
        <FadeIn delay={180}><FieldGroup label="Soil Type">
          <View style={{ gap: 7 }}>
            {soils.map(s => (
              <TouchableOpacity key={s.v} style={[styles.soilBtn, soil === s.v && styles.soilBtnOn]} onPress={() => setSoil(s.v)}>
                <Text style={[styles.soilText, soil === s.v && { color: Colors.g1, fontFamily: Fonts.extraBold }]}>{s.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FieldGroup></FadeIn>
        <FadeIn delay={240}><BtnPrimary label="Next: Detect Location →" onPress={next} /></FadeIn>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Location Screen ───────────────────────────────────────────
export function LocationScreen({ route }) {
  const params = route?.params || {};
  const { login } = useApp();
  const [state, setState] = useState('detecting'); // detecting | found | error
  const [locData, setLocData] = useState({ lat: 15.4909, lng: 73.8278, locName: params.taluka + ', Goa' });

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setState('error'); return; }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`);
          const d = await r.json();
          const village = d.address?.village || d.address?.suburb || d.address?.town || d.address?.city || params.taluka || 'Goa';
          setLocData({ lat, lng, locName: `${village}, Goa` });
        } catch { setLocData({ lat, lng, locName: params.taluka + ', Goa' }); }
        setState('found');
      } catch { setState('error'); }
    })();
  }, []);

  async function finish(ld) {
    const crops = JSON.parse(params.crops || '[]');
    const u = { name: params.name, phone: params.phone, pass: params.pass, lang: params.lang, taluka: params.taluka, farmSize: parseFloat(params.farmSize), soil: params.soil, crops, ...ld, joined: new Date().toISOString() };
    await UserStore.set(u.phone, u);
    await login(u);
    router.replace('/(tabs)/home');
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <AuthHeader step="Step 3 of 3 · Location" title="Find your farm 📍" />
      <View style={[styles.authBody, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
        {state === 'detecting' && (
          <FadeIn style={{ alignItems: 'center', gap: 16 }}>
            <View style={styles.locSpinner} />
            <Text style={styles.locTitle}>Detecting your GPS location...</Text>
            <Text style={styles.locSub}>Please allow location permission when asked</Text>
          </FadeIn>
        )}
        {state === 'found' && (
          <FadeIn style={{ width: '100%', gap: 13 }}>
            <View style={styles.locFoundCard}>
              <Text style={{ fontSize: 42 }}>📍</Text>
              <Text style={styles.locName}>{locData.locName}</Text>
              <Text style={styles.locCoords}>{locData.lat.toFixed(5)}°N, {locData.lng.toFixed(5)}°E</Text>
            </View>
            <BtnPrimary label="✅ Confirm & Enter App →" onPress={() => finish(locData)} />
            <TouchableOpacity onPress={() => finish({ lat: 15.4909, lng: 73.8278, locName: params.taluka + ', Goa' })}>
              <Text style={[styles.switchText, { textAlign: 'center' }]}>Use manual location instead</Text>
            </TouchableOpacity>
          </FadeIn>
        )}
        {state === 'error' && (
          <FadeIn style={{ width: '100%', gap: 13, alignItems: 'center' }}>
            <Text style={{ fontSize: 52 }}>😕</Text>
            <Text style={styles.locTitle}>Location access denied</Text>
            <Text style={styles.locSub}>No problem! We'll use your taluka as your location.</Text>
            <BtnPrimary label="Continue with Manual Location →" onPress={() => finish({ lat: 15.4909, lng: 73.8278, locName: params.taluka + ', Goa' })} style={{ width: '100%' }} />
          </FadeIn>
        )}
      </View>
    </View>
  );
}

// ── Login Screen ──────────────────────────────────────────────
export function Login() {
  const { login } = useApp();
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  async function doLogin() {
    if (!/^\d{10}$/.test(phone)) { Alert.alert('Error', 'Enter your 10-digit phone number'); return; }
    setLoading(true);
    const u = await UserStore.get(phone);
    setLoading(false);
    if (!u) { Alert.alert('Error', 'No account found. Please register first.'); return; }
    if (u.pass !== pass) { Alert.alert('Error', 'Wrong password. Try again.'); return; }
    await login(u);
    router.replace('/(tabs)/home');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AuthHeader step="Welcome back" title="Login to AgroGROW 🌱" />
      <ScrollView contentContainerStyle={styles.authBody} showsVerticalScrollIndicator={false}>
        <FadeIn delay={0}><View style={styles.infoBanner}><Text>ℹ️ Your account is saved on this device.</Text></View></FadeIn>
        <FadeIn delay={80}><FieldGroup label="Phone Number"><Input value={phone} onChangeText={setPhone} placeholder="10-digit number" keyboardType="phone-pad" maxLength={10} /></FieldGroup></FadeIn>
        <FadeIn delay={160}><FieldGroup label="Password"><Input value={pass} onChangeText={setPass} placeholder="Your password" secureTextEntry /></FieldGroup></FadeIn>
        <FadeIn delay={240}><BtnPrimary label="Login →" onPress={doLogin} loading={loading} /></FadeIn>
        <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
          <Text style={styles.switchText}>New here? <Text style={{ color: Colors.g2, fontFamily: Fonts.black }}>Create an account</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  authHdr: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 22 },
  backBtn: { marginBottom: 8, alignSelf: 'flex-start' },
  authStep: { fontFamily: Fonts.bold, fontSize: 12, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  authTitle: { fontFamily: Fonts.black, fontSize: 22, color: '#fff', lineHeight: 28 },
  authBody: { padding: 22, gap: 16, backgroundColor: Colors.white },
  fgroup: { gap: 6 },
  fl: { fontFamily: Fonts.extraBold, fontSize: 11, color: Colors.g500, textTransform: 'uppercase', letterSpacing: 0.7 },
  fi: { borderWidth: 2, borderColor: Colors.g200, borderRadius: Radius.r12, padding: 13, paddingHorizontal: 16, fontSize: 14, fontFamily: Fonts.bold, color: Colors.g900, backgroundColor: Colors.white },
  fiFocused: { borderColor: Colors.g3 },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: Radius.r99, borderWidth: 2, borderColor: Colors.g200 },
  langBtnOn: { backgroundColor: Colors.g1, borderColor: Colors.g1 },
  langBtnText: { fontFamily: Fonts.extraBold, fontSize: 12, color: Colors.g500 },
  chipBtn: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: Radius.r99, borderWidth: 2, borderColor: Colors.g200, backgroundColor: Colors.white },
  chipBtnOn: { backgroundColor: Colors.g1, borderColor: Colors.g1 },
  chipText: { fontFamily: Fonts.extraBold, fontSize: 12, color: Colors.g500 },
  cropGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cropBtn: { padding: 12, borderRadius: Radius.r12, borderWidth: 2, borderColor: Colors.g200, minWidth: '47%' },
  cropBtnOn: { borderColor: Colors.g3, backgroundColor: Colors.gp },
  cropText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.g500 },
  soilBtn: { padding: 12, borderRadius: Radius.r12, borderWidth: 2, borderColor: Colors.g200, backgroundColor: Colors.white },
  soilBtnOn: { borderColor: Colors.g3, backgroundColor: Colors.gp },
  soilText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.g500 },
  switchText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.g400, textAlign: 'center', marginTop: 4 },
  infoBanner: { backgroundColor: Colors.gb, borderRadius: Radius.r12, padding: 12, flexDirection: 'row', gap: 8 },
  locSpinner: { width: 64, height: 64, borderRadius: 32, borderWidth: 5, borderColor: Colors.gp, borderTopColor: Colors.g3 },
  locTitle: { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.g700, textAlign: 'center' },
  locSub: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.g400, textAlign: 'center', lineHeight: 20 },
  locFoundCard: { backgroundColor: Colors.gb, borderRadius: Radius.r16, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: Colors.g5 },
  locName: { fontFamily: Fonts.black, fontSize: 17, color: Colors.g1, marginTop: 8 },
  locCoords: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.g500, marginTop: 4 },
});

export default Login;
