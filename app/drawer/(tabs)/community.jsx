import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Image, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, Radius, Shadows } from '../../src/theme';

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;

// ─── Gemini helper ────────────────────────────────────────────────────
async function diagnoseWithGemini(text, imageBase64 = null) {
  const prompt = `You are AgoBot, a smart farming AI for Goa farmers.
Analyse this farmer's post and provide a diagnosis.
Post: "${text}"

Respond ONLY in this exact JSON format, no markdown:
{
  "title": "Disease/Issue Name",
  "cause": "One sentence cause explanation",
  "immediateAction": "Specific action to take now",
  "followUp": "What to do if no improvement in 5 days",
  "severity": "low|medium|high",
  "fertilizer": "Optional fertilizer tip if relevant, else null"
}`;

  const parts = [];
  if (imageBase64) {
    parts.push({ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } });
  }
  parts.push({ text: prompt });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] }),
    }
  );
  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ─── Static seed posts ─────────────────────────────────────────────────
const SEED_POSTS = [
  {
    id: '1',
    author: 'Mangesh Sawant',
    initials: 'MS',
    location: 'Ponda',
    crop: 'Paddy',
    time: '2 hrs ago',
    tag: 'Disease',
    tagColor: '#fef2f2',
    tagText: '#ef4444',
    text: 'My paddy leaves are turning yellow from the tips, spreading inward near the water channel.',
    image: null,
    likes: 4,
    comments: 2,
    farmerCount: 5,
    diagnosis: {
      title: 'Nitrogen deficiency + waterlogging stress',
      cause: 'Yellow tips spreading inward near water channels = nitrogen leaching from waterlogged soil.',
      immediateAction: 'Drain excess water from the channel section. Apply 20kg urea per acre.',
      followUp: 'Spray mancozeb 0.2% — could be early blight alongside deficiency.',
      severity: 'high',
      fertilizer: null,
    },
  },
  {
    id: '2',
    author: 'Loutolim Farmer',
    initials: 'LF',
    location: 'Loutolim',
    crop: 'Paddy',
    time: '6 days ago',
    tag: 'Soil',
    tagColor: '#fef9c3',
    tagText: '#92400e',
    text: 'Soil feels very compact before monsoon. Water is not absorbing properly.',
    image: null,
    likes: 7,
    comments: 3,
    farmerCount: 3,
    diagnosis: {
      title: 'Soil compaction + poor aeration',
      cause: 'Heavy clay content and lack of organic matter causes hardpan formation.',
      immediateAction: 'Deep till 6–8 inches before monsoon. Add compost 2 tons/acre.',
      followUp: 'If still compact, consider subsoil ploughing and green manure crop.',
      severity: 'medium',
      fertilizer: 'Apply 500kg FYM per acre to improve soil structure.',
    },
  },
];

const FILTERS = ['All', 'Disease', 'Soil', 'Pest', 'Weather'];

// ─── Diagnosis card ────────────────────────────────────────────────────
function DiagCard({ diag, loading }) {
  if (loading) {
    return (
      <View style={dc.wrap}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 20 }}>🤖</Text>
          <ActivityIndicator color={Colors.g1} />
          <Text style={dc.analysing}>AI is analysing it right now...</Text>
        </View>
      </View>
    );
  }
  if (!diag) return null;
  const sevColor = diag.severity === 'high' ? '#ef4444' : diag.severity === 'medium' ? '#f59e0b' : '#22c55e';
  const sevBg = diag.severity === 'high' ? '#fef2f2' : diag.severity === 'medium' ? '#fffbeb' : '#f0fdf4';

  return (
    <View style={dc.wrap}>
      <View style={dc.topRow}>
        <Text style={{ fontSize: 20 }}>🤖</Text>
        <View style={{ flex: 1 }}>
          <Text style={dc.readyLabel}>Diagnosis ready</Text>
          <Text style={dc.title}>{diag.title}</Text>
        </View>
        <View style={[dc.sevPill, { backgroundColor: sevBg }]}>
          <Text style={[dc.sevText, { color: sevColor }]}>
            {diag.severity === 'high' ? '🔴' : diag.severity === 'medium' ? '🟡' : '🟢'} {diag.severity?.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={dc.body}>
        <Text style={dc.fieldLabel}>Cause:</Text>
        <Text style={dc.fieldVal}>{diag.cause}</Text>
        <Text style={[dc.fieldLabel, { marginTop: 7 }]}>Immediate action:</Text>
        <Text style={dc.fieldVal}>{diag.immediateAction}</Text>
        {diag.followUp ? (
          <>
            <Text style={[dc.fieldLabel, { marginTop: 7 }]}>If no improvement in 5 days:</Text>
            <Text style={dc.fieldVal}>{diag.followUp}</Text>
          </>
        ) : null}
        {diag.fertilizer ? (
          <View style={dc.fertRow}>
            <Text style={{ fontSize: 14 }}>🌿</Text>
            <Text style={dc.fertText}>{diag.fertilizer}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ─── Post card ─────────────────────────────────────────────────────────
function PostCard({ post, onExpand }) {
  const [liked, setLiked] = useState(false);
  return (
    <TouchableOpacity style={pc.card} activeOpacity={0.92} onPress={() => onExpand(post)}>
      {/* Author */}
      <View style={pc.authorRow}>
        <View style={[pc.avatar, { backgroundColor: Colors.gp }]}>
          <Text style={pc.avatarText}>{post.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={pc.authorName}>{post.author}</Text>
          <Text style={pc.meta}>{post.location} · {post.crop} · {post.time}</Text>
        </View>
        <View style={[pc.tagPill, { backgroundColor: post.tagColor }]}>
          <Text style={[pc.tagText, { color: post.tagText }]}>{post.tag}</Text>
        </View>
      </View>

      {/* Post text */}
      <Text style={pc.postText}>{post.text}</Text>

      {/* Post image */}
      {post.image && <Image source={{ uri: post.image }} style={pc.postImg} />}

      {/* AI quick reply */}
      {post.diagnosis && (
        <View style={pc.aiBubble}>
          <Text style={{ fontSize: 16 }}>🤖</Text>
          <Text style={pc.aiText} numberOfLines={2}>
            {post.diagnosis.title} — {post.diagnosis.immediateAction}
          </Text>
        </View>
      )}

      {/* Farmer group */}
      {post.farmerCount > 0 && (
        <TouchableOpacity style={pc.farmerRow}>
          <View style={{ flexDirection: 'row' }}>
            {['🧑‍🌾', '👩‍🌾', '🧑‍🌾'].slice(0, Math.min(post.farmerCount, 3)).map((e, i) => (
              <Text key={i} style={{ fontSize: 16, marginLeft: i > 0 ? -4 : 0 }}>{e}</Text>
            ))}
          </View>
          <Text style={pc.farmerText}>{post.farmerCount} farmers facing same issue — Join?</Text>
          <Text style={pc.chevron}>›</Text>
        </TouchableOpacity>
      )}

      {/* Actions */}
      <View style={pc.actRow}>
        <TouchableOpacity style={pc.actBtn} onPress={() => setLiked(l => !l)}>
          <Text style={{ fontSize: 16 }}>{liked ? '❤️' : '🤍'}</Text>
          <Text style={pc.actLabel}>{post.likes + (liked ? 1 : 0)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={pc.actBtn}>
          <Text style={{ fontSize: 16 }}>💬</Text>
          <Text style={pc.actLabel}>{post.comments}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── New Post Modal ─────────────────────────────────────────────────────
function NewPostModal({ visible, onClose, onSubmit }) {
  const [text, setText] = useState('');
  const [tag, setTag] = useState('Disease');
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: true, allowsEditing: true });
    if (!res.canceled) { setImage(res.assets[0].uri); setImageBase64(res.assets[0].base64); }
  }

  function submit() {
    if (!text.trim()) return;
    onSubmit({ text, tag, image, imageBase64 });
    setText(''); setTag('Disease'); setImage(null); setImageBase64(null);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={nm.overlay}>
          <View style={nm.sheet}>
            <View style={nm.handleBar} />
            <Text style={nm.title}>Share with Community</Text>
            <Text style={nm.sub}>AgoBot will instantly analyse your issue 🤖</Text>

            <Text style={nm.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['Disease', 'Soil', 'Pest', 'Weather', 'General'].map(t => (
                  <TouchableOpacity key={t} style={[nm.tagChip, tag === t && nm.tagChipOn]} onPress={() => setTag(t)}>
                    <Text style={[nm.tagChipText, tag === t && { color: '#fff' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={nm.label}>Describe your issue</Text>
            <TextInput
              style={nm.input}
              value={text}
              onChangeText={setText}
              placeholder="e.g. My paddy leaves are yellowing from tips..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={4}
            />

            {image && <Image source={{ uri: image }} style={nm.previewImg} />}

            <TouchableOpacity style={nm.photoBtn} onPress={pickImage}>
              <Text style={{ fontSize: 18 }}>📷</Text>
              <Text style={nm.photoBtnText}>{image ? 'Change Photo' : 'Add Plant Photo (for better diagnosis)'}</Text>
            </TouchableOpacity>

            <View style={nm.btnRow}>
              <TouchableOpacity style={nm.cancelBtn} onPress={onClose}>
                <Text style={nm.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[nm.postBtn, !text.trim() && { opacity: 0.5 }]} onPress={submit} disabled={!text.trim()}>
                <LinearGradient colors={[Colors.g3, Colors.g1]} style={nm.postGrad}>
                  <Text style={nm.postBtnText}>Post & Diagnose 🤖</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Expanded post modal ───────────────────────────────────────────────
function ExpandedModal({ post, onClose }) {
  if (!post) return null;
  const sevColor = post.diagnosis?.severity === 'high' ? '#ef4444' : post.diagnosis?.severity === 'medium' ? '#f59e0b' : '#22c55e';

  return (
    <Modal visible={!!post} animationType="slide" transparent>
      <View style={em.overlay}>
        <View style={em.sheet}>
          <View style={em.handleBar} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={em.title}>{post.text}</Text>
            {post.image && <Image source={{ uri: post.image }} style={em.img} />}
            <DiagCard diag={post.diagnosis} loading={false} />
            <View style={em.metaRow}>
              <View style={[em.tagPill, { backgroundColor: post.tagColor }]}>
                <Text style={[em.tagText, { color: post.tagText }]}>{post.tag}</Text>
              </View>
            </View>
            {post.farmerCount > 0 && (
              <TouchableOpacity style={em.farmerRow}>
                <Text style={{ fontSize: 16 }}>👥</Text>
                <Text style={em.farmerText}>{post.farmerCount} farmers facing same issue — Join?</Text>
                <Text style={em.chevron}>›</Text>
              </TouchableOpacity>
            )}
            <View style={{ height: 30 }} />
          </ScrollView>
          <TouchableOpacity style={em.closeBtn} onPress={onClose}>
            <Text style={em.closeTxt}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────
export default function CommunityScreen() {
  const [posts, setPosts] = useState(SEED_POSTS);
  const [filter, setFilter] = useState('All');
  const [tab, setTab] = useState('Community');
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [myPosts, setMyPosts] = useState([]);

  const filtered = (tab === 'My Post' ? myPosts : posts).filter(p =>
    filter === 'All' || p.tag === filter
  );

  async function handleNewPost({ text, tag, image, imageBase64 }) {
    const newPost = {
      id: Date.now().toString(),
      author: 'You',
      initials: 'YO',
      location: 'Goa',
      crop: 'General',
      time: 'Just now',
      tag,
      tagColor: tag === 'Disease' ? '#fef2f2' : tag === 'Soil' ? '#fef9c3' : '#f0fdf4',
      tagText: tag === 'Disease' ? '#ef4444' : tag === 'Soil' ? '#92400e' : '#166534',
      text,
      image,
      likes: 0,
      comments: 0,
      farmerCount: 0,
      diagnosis: null,
      diagLoading: true,
    };

    setPosts(prev => [newPost, ...prev]);
    setMyPosts(prev => [newPost, ...prev]);

    // Get AI diagnosis
    try {
      const diag = await diagnoseWithGemini(text, imageBase64);
      setPosts(prev => prev.map(p => p.id === newPost.id ? { ...p, diagnosis: diag, diagLoading: false } : p));
      setMyPosts(prev => prev.map(p => p.id === newPost.id ? { ...p, diagnosis: diag, diagLoading: false } : p));
    } catch {
      setPosts(prev => prev.map(p => p.id === newPost.id ? { ...p, diagLoading: false } : p));
      setMyPosts(prev => prev.map(p => p.id === newPost.id ? { ...p, diagLoading: false } : p));
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8faf7' }}>
      {/* Header */}
      <LinearGradient colors={[Colors.g1, Colors.g2]} style={s.header}>
        <SafeAreaView edges={['top']}>
          <View style={s.tabRow}>
            {['Community', 'My Post'].map(t => (
              <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnOn]} onPress={() => setTab(t)}>
                <Text style={[s.tabText, tab === t && s.tabTextOn]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.locRow}>
            <Text style={{ fontSize: 14 }}>📍</Text>
            <Text style={s.locText}>Salcete, Goa</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 8, paddingBottom: 10 }}>
            {FILTERS.map(f => (
              <TouchableOpacity key={f} style={[s.filterChip, filter === f && s.filterChipOn]} onPress={() => setFilter(f)}>
                <Text style={[s.filterText, filter === f && { color: Colors.g1, fontFamily: Fonts.extraBold }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 12, paddingBottom: 100 }}>
        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🌱</Text>
            <Text style={{ fontFamily: Fonts.extraBold, fontSize: 15, color: Colors.g400 }}>No posts yet</Text>
            <Text style={{ fontFamily: Fonts.medium, fontSize: 13, color: Colors.g400, marginTop: 4 }}>Be the first to share an issue!</Text>
          </View>
        )}
        {filtered.map(post => (
          <View key={post.id}>
            <PostCard post={post} onExpand={setExpanded} />
            {post.diagLoading && <DiagCard diag={null} loading={true} />}
          </View>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setShowNew(true)}>
        <LinearGradient colors={[Colors.g3, Colors.g1]} style={s.fabGrad}>
          <Text style={{ fontSize: 22, color: '#fff' }}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      <NewPostModal visible={showNew} onClose={() => setShowNew(false)} onSubmit={handleNewPost} />
      <ExpandedModal post={expanded} onClose={() => setExpanded(null)} />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: { paddingBottom: 0 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 10, gap: 10 },
  tabBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 99 },
  tabBtnOn: { backgroundColor: '#fff' },
  tabText: { fontFamily: Fonts.extraBold, fontSize: 14, color: 'rgba(255,255,255,.7)' },
  tabTextOn: { color: Colors.g1 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 6 },
  locText: { fontFamily: Fonts.bold, fontSize: 13, color: 'rgba(255,255,255,.85)' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,.3)' },
  filterChipOn: { backgroundColor: '#fff' },
  filterText: { fontFamily: Fonts.bold, fontSize: 12, color: 'rgba(255,255,255,.85)' },
  fab: { position: 'absolute', bottom: 80, right: 18 },
  fabGrad: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', ...Shadows.sh2 },
});

const pc = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, ...Shadows.sh1 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Fonts.black, fontSize: 13, color: Colors.g1 },
  authorName: { fontFamily: Fonts.extraBold, fontSize: 13, color: '#111' },
  meta: { fontFamily: Fonts.medium, fontSize: 11, color: '#9ca3af' },
  tagPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99 },
  tagText: { fontFamily: Fonts.extraBold, fontSize: 11 },
  postText: { fontFamily: Fonts.medium, fontSize: 13.5, color: '#374151', lineHeight: 21, marginBottom: 10 },
  postImg: { width: '100%', height: 160, borderRadius: 12, marginBottom: 10 },
  aiBubble: { flexDirection: 'row', gap: 8, backgroundColor: '#f0fdf4', borderRadius: 12, padding: 10, marginBottom: 10, alignItems: 'flex-start' },
  aiText: { flex: 1, fontFamily: Fonts.medium, fontSize: 12.5, color: Colors.g1, lineHeight: 19 },
  farmerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f9fafb', borderRadius: 10, padding: 9, marginBottom: 10 },
  farmerText: { flex: 1, fontFamily: Fonts.bold, fontSize: 12, color: '#374151' },
  chevron: { fontFamily: Fonts.black, fontSize: 18, color: '#9ca3af' },
  actRow: { flexDirection: 'row', gap: 16, paddingTop: 4 },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actLabel: { fontFamily: Fonts.bold, fontSize: 13, color: '#6b7280' },
});

const dc = StyleSheet.create({
  wrap: { backgroundColor: '#f0fdf4', borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#d1fae5' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  analysing: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.g400 },
  readyLabel: { fontFamily: Fonts.medium, fontSize: 10, color: '#6b7280' },
  title: { fontFamily: Fonts.black, fontSize: 13, color: Colors.g1 },
  sevPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  sevText: { fontFamily: Fonts.extraBold, fontSize: 10 },
  body: {},
  fieldLabel: { fontFamily: Fonts.extraBold, fontSize: 12, color: '#374151', marginBottom: 2 },
  fieldVal: { fontFamily: Fonts.medium, fontSize: 12.5, color: '#4b5563', lineHeight: 19, marginBottom: 4 },
  fertRow: { flexDirection: 'row', gap: 6, marginTop: 4, backgroundColor: '#dcfce7', borderRadius: 8, padding: 8, alignItems: 'flex-start' },
  fertText: { flex: 1, fontFamily: Fonts.medium, fontSize: 12, color: Colors.g1 },
});

const nm = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 16 },
  title: { fontFamily: Fonts.black, fontSize: 18, color: '#111', marginBottom: 4 },
  sub: { fontFamily: Fonts.medium, fontSize: 13, color: '#6b7280', marginBottom: 16 },
  label: { fontFamily: Fonts.extraBold, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  tagChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1.5, borderColor: '#e5e7eb' },
  tagChipOn: { backgroundColor: Colors.g1, borderColor: Colors.g1 },
  tagChipText: { fontFamily: Fonts.bold, fontSize: 13, color: '#374151' },
  input: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontFamily: Fonts.medium, fontSize: 14, color: '#111', minHeight: 90, textAlignVertical: 'top', marginBottom: 12 },
  previewImg: { width: '100%', height: 140, borderRadius: 12, marginBottom: 10 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#d1fae5', backgroundColor: '#f0fdf4', marginBottom: 16 },
  photoBtnText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.g1 },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 99, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  cancelText: { fontFamily: Fonts.extraBold, fontSize: 14, color: '#6b7280' },
  postBtn: { flex: 2 },
  postGrad: { borderRadius: 99, padding: 14, alignItems: 'center' },
  postBtnText: { fontFamily: Fonts.black, fontSize: 14, color: '#fff' },
});

const em = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.5)' },
  sheet: { backgroundColor: '#f8faf7', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, maxHeight: '90%' },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 14 },
  title: { fontFamily: Fonts.extraBold, fontSize: 15, color: '#111', marginBottom: 10, lineHeight: 22 },
  img: { width: '100%', height: 180, borderRadius: 14, marginBottom: 12 },
  metaRow: { flexDirection: 'row', marginTop: 10, marginBottom: 10 },
  tagPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  tagText: { fontFamily: Fonts.extraBold, fontSize: 12 },
  farmerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 8 },
  farmerText: { flex: 1, fontFamily: Fonts.bold, fontSize: 13, color: '#374151' },
  chevron: { fontFamily: Fonts.black, fontSize: 20, color: '#9ca3af' },
  closeBtn: { backgroundColor: Colors.g1, borderRadius: 99, padding: 14, alignItems: 'center', marginTop: 10 },
  closeTxt: { fontFamily: Fonts.black, fontSize: 15, color: '#fff' },
});
