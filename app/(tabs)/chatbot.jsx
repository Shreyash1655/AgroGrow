import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { FadeIn, PressScale } from '../../src/components/UI';
import { useApp } from '../../src/store/AppContext';
import { Colors, Fonts, Radius, Shadows } from '../../src/theme';

function getTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const FALLBACKS = {
  disease: "🌾 Current disease risks in Goa:\n\n🔴 Rice Blast — Apply Tricyclazole 75% WP @ 0.6g/L immediately if humidity >80%\n🟡 Cashew Powdery Mildew — Spray Wettable Sulfur 2g/L before 9am\n🟢 Coconut Bud Rot — Preventive Copper Oxychloride 3g/L during monsoon\n\nPost a crop photo in Community for AI diagnosis.",
  irrigation: "💧 Smart irrigation advice:\n\n• Humidity >80%: Hold off — soil moisture sufficient\n• Humidity 60-80%: Light irrigation 30-45 min\n• Humidity <60%: Irrigate 45-60 min early morning\n\nBest time: 5:30–8:00 AM to minimize evaporation.",
  market: "📊 Approximate Goa market prices:\n\n🥜 Raw Cashew: ₹120–145/kg\n🌾 Paddy (MSP): ₹2015–2100/quintal\n🥥 Coconut: ₹18–25/nut\n\nVisit nearest APMC for exact rates.",
  scheme: "🏛️ Key govt schemes for Goa farmers:\n\n• PM-KISAN: ₹6,000/year — pmkisan.gov.in\n• NABARD Drip: 50% subsidy on drip irrigation\n• PKVY: ₹50,000/ha for organic farming\n• Fasal Bima: Crop insurance at low premium\n\nVisit KVK or Goa Agriculture Dept office.",
};

export default function ChatbotScreen() {
  const { user, weather, apiKey } = useApp();
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(true);
  const flatRef = useRef();
  const dotAnim = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const greet = `Hello ${user?.name?.split(' ')[0] || 'Farmer'}! 🌱 I'm AgroBot, your AI farming assistant.\n\nI can help with:\n🌾 Crop diseases for Goa (cashew, paddy, coconut)\n💧 Smart irrigation timing\n🐛 Pest management with exact doses\n🌍 Soil management for Goa's laterite soils\n🏛️ Govt schemes — PM-KISAN, NABARD, PKVY\n📊 Mandi prices for Goa crops\n\nAsk me anything in English, Konkani, Marathi or Hindi!`;
    setMessages([{ role: 'bot', text: greet, time: getTime(), id: 'welcome' }]);
  }, []);

  useEffect(() => {
    // Animate typing dots
    if (loading) {
      dotAnim.forEach((d, i) => {
        Animated.loop(Animated.sequence([
          Animated.timing(d, { toValue: -6, duration: 300, delay: i * 120, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])).start();
      });
    } else {
      dotAnim.forEach(d => d.stopAnimation?.());
    }
  }, [loading]);

  async function sendMsg(text) {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    setShowQR(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg = { role: 'user', text: msg, time: getTime(), id: Date.now().toString() };
    setMessages(m => [...m, userMsg]);
    const newHist = [...history, { role: 'user', content: msg }];
    setHistory(newHist);
    setLoading(true);

    if (!apiKey) {
      setTimeout(() => {
        const ml = msg.toLowerCase();
        let rep = FALLBACKS.disease;
        if (ml.includes('irrigat') || ml.includes('water')) rep = FALLBACKS.irrigation;
        else if (ml.includes('market') || ml.includes('price')) rep = FALLBACKS.market;
        else if (ml.includes('scheme') || ml.includes('subsid')) rep = FALLBACKS.scheme;
        setMessages(m => [...m, { role: 'bot', text: rep, time: getTime(), id: Date.now().toString() }]);
        setHistory(h => [...h, { role: 'assistant', content: rep }]);
        setLoading(false);
      }, 1200);
      return;
    }

    const wx = weather?.current;
    const sys = `You are AgroBot, expert AI farming assistant for Goa, India. Specialize in cashew, paddy, coconut cultivation.\n\nFarmer: ${user?.name || 'Unknown'}, ${user?.taluka || 'Goa'}\nCrops: ${(user?.crops || ['cashew']).join(', ')}\nFarm: ${user?.farmSize || 1} acres, ${user?.soil || 'laterite'} soil\nWeather: ${wx ? `${Math.round(wx.temperature_2m)}°C, ${wx.relativehumidity_2m}% humidity, ${Math.round(wx.windspeed_10m)}km/h wind` : 'unavailable'}\nMonth: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}\n\nGive specific, actionable advice. Mention exact doses, product names, timing. Reference govt schemes when relevant. Respond in farmer's language. Max 200 words.`;

    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-allow-browser': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 450, system: sys, messages: newHist.slice(-12) }),
      });
      const d = await r.json();
      const reply = d.content?.[0]?.text || "Sorry, couldn't process that. Please try again!";
      setMessages(m => [...m, { role: 'bot', text: reply, time: getTime(), id: Date.now().toString() }]);
      setHistory(h => [...h, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(m => [...m, { role: 'bot', text: "Network error. Please check your connection.", time: getTime(), id: Date.now().toString() }]);
    }
    setLoading(false);
  }

  const qrs = [{ l: '🌿 Disease risk today', q: 'What diseases are affecting my crop right now?' }, { l: '💧 Irrigation advice', q: 'Should I irrigate today?' }, { l: '🏛️ Govt schemes', q: 'What government schemes can I apply for?' }, { l: '📊 Market prices', q: 'What is current cashew price in Goa?' }];

  function renderItem({ item }) {
    const isUser = item.role === 'user';
    return (
      <FadeIn style={[styles.msgWrap, isUser && styles.msgWrapUser]}>
        {!isUser && <View style={styles.botAvatar}><Text style={{ fontSize: 14 }}>🤖</Text></View>}
        <View style={{ maxWidth: '82%' }}>
          <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
            <Text style={[styles.bubbleText, isUser && { color: '#fff' }]}>{item.text}</Text>
          </View>
          <Text style={[styles.msgTime, isUser && { textAlign: 'right' }]}>{item.time}</Text>
        </View>
      </FadeIn>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      {/* Header */}
      <LinearGradient colors={[Colors.g1, Colors.g2]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View style={styles.botAv}><Text style={{ fontSize: 22 }}>🤖</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerName}>AgroBot</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 }}>
                <View style={styles.onDot} />
                <Text style={styles.headerSub}>{apiKey ? 'Powered by Claude AI · Active' : 'Offline fallback mode'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => { setMessages([]); setHistory([]); setShowQR(true); }} style={styles.clearBtn}>
              <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 18 }}>🗑</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.msgsList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={loading ? (
          <View style={styles.msgWrap}>
            <View style={styles.botAvatar}><Text style={{ fontSize: 14 }}>🤖</Text></View>
            <View style={styles.bubbleBot}>
              <View style={{ flexDirection: 'row', gap: 5, padding: 4 }}>
                {dotAnim.map((d, i) => (
                  <Animated.View key={i} style={[styles.dot, { transform: [{ translateY: d }] }]} />
                ))}
              </View>
            </View>
          </View>
        ) : null}
      />

      {/* Quick replies */}
      {showQR && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.qrRow}>
          {qrs.map((q, i) => (
            <PressScale key={i} onPress={() => sendMsg(q.q)}>
              <View style={styles.qrBtn}><Text style={styles.qrText}>{q.l}</Text></View>
            </PressScale>
          ))}
        </ScrollView>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything about farming..."
          placeholderTextColor={Colors.g400}
          onSubmitEditing={() => sendMsg()}
          returnKeyType="send"
          multiline
        />
        <PressScale onPress={() => sendMsg()}>
          <LinearGradient colors={[Colors.g3, Colors.g1]} style={styles.sendBtn}>
            <Text style={{ color: '#fff', fontSize: 16 }}>↑</Text>
          </LinearGradient>
        </PressScale>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8 },
  botAv: { width: 42, height: 42, backgroundColor: Colors.amber, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  headerName: { fontFamily: Fonts.black, fontSize: 16, color: '#fff' },
  headerSub: { fontFamily: Fonts.medium, fontSize: 11, color: 'rgba(255,255,255,.65)' },
  onDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  clearBtn: { padding: 8 },
  msgsList: { padding: 14, gap: 10 },
  msgWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgWrapUser: { flexDirection: 'row-reverse' },
  botAvatar: { width: 28, height: 28, backgroundColor: Colors.amber, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { borderRadius: 18, paddingHorizontal: 13, paddingVertical: 10, maxWidth: '100%' },
  bubbleBot: { backgroundColor: Colors.white, borderBottomLeftRadius: 4, ...Shadows.sh1 },
  bubbleUser: { backgroundColor: Colors.g1, borderBottomRightRadius: 4 },
  bubbleText: { fontFamily: Fonts.medium, fontSize: 13.5, color: Colors.g700, lineHeight: 22 },
  msgTime: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.g400, marginTop: 3, paddingHorizontal: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.g300 },
  qrRow: { paddingHorizontal: 14, paddingVertical: 8, gap: 7 },
  qrBtn: { paddingHorizontal: 13, paddingVertical: 7, backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.g4, borderRadius: Radius.r99 },
  qrText: { fontFamily: Fonts.extraBold, fontSize: 12, color: Colors.g2 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, paddingHorizontal: 14, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.g100 },
  textInput: { flex: 1, backgroundColor: Colors.g50, borderWidth: 2, borderColor: Colors.g200, borderRadius: Radius.r99, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, fontFamily: Fonts.medium, color: Colors.g900, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
