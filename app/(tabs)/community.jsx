import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Modal, Pressable, Animated, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { FadeIn, PressScale, Pill, SectionLabel } from '../../src/components/UI';
import { useApp } from '../../src/store/AppContext';
import { Colors, Fonts, Radius, Shadows } from '../../src/theme';
import { PostStore, supabase } from '../../src/utils/store';
import { timeAgo } from '../../src/data/staticData';

const CAT_EMOJI = { disease:'🦠', soil:'🌍', pest:'🐛', weather:'🌧️', market:'📊', general:'💬' };
const CATS = [{ v:'all',l:'All' },{ v:'disease',l:'🦠 Disease' },{ v:'soil',l:'🌍 Soil' },{ v:'pest',l:'🐛 Pest' },{ v:'weather',l:'🌧️ Weather' },{ v:'market',l:'📊 Market' }];

async function getAIDiag(desc, crop, apiKey) {
  if (!apiKey) return { cond:'Possible fungal infection', cause:'High humidity promotes fungal growth.', act:'Apply Copper Oxychloride 3g/L and improve air circulation.', conf:75 };
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key':apiKey, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-allow-browser':'true' },
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:200, messages:[{ role:'user', content:`You are a crop pathologist for Goa, India. Farmer reports: "${desc}" on ${crop}. Diagnose and respond ONLY in JSON: {"cond":"disease name","cause":"1 sentence","act":"immediate action 1-2 sentences","conf":75-95}` }] }),
    });
    const d = await r.json();
    return JSON.parse((d.content?.[0]?.text || '{}').replace(/```json|```/g,'').trim());
  } catch { return { cond:'Possible fungal infection', cause:'High humidity promotes fungal growth.', act:'Apply Copper Oxychloride 3g/L and improve air circulation.', conf:72 }; }
}

// ── Post card ─────────────────────────────────────────────────
function PostCard({ post, onLike, onComment, onAskAI }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  function handleLike() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.3, useNativeDriver: true, tension: 300 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300 }),
    ]).start();
    onLike(post.id);
  }
  return (
    <FadeIn style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={styles.postAvatar}><Text style={styles.postAvatarText}>{post.init || 'F'}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.postAuthor}>{post.author || 'Farmer'}</Text>
          <Text style={styles.postMeta}>📍 {post.loc} · {CAT_EMOJI[post.cat]} {post.cat} · {timeAgo(post.ts)}</Text>
        </View>
      </View>
      {/* Body */}
      <Text style={styles.postBody}>{post.txt}</Text>
      {/* AI loading */}
      {post.diagLoading && (
        <View style={styles.diagLoading}>
          <View style={styles.diagLoadingDot} />
          <Text style={styles.diagLoadingText}>🤖 AI analysing your crop problem...</Text>
        </View>
      )}
      {/* AI diagnosis */}
      {post.diag && (
        <View style={styles.diagBox}>
          <View style={styles.diagHeader}>
            <Text style={styles.diagTitle}>🤖 AI Diagnosis</Text>
            <Text style={styles.diagConf}>{post.diag.conf}% confidence</Text>
          </View>
          <Text style={styles.diagCond}>{post.diag.cond}</Text>
          <Text style={styles.diagText}><Text style={{ color: Colors.g400 }}>Cause: </Text>{post.diag.cause}</Text>
          <Text style={styles.diagText}><Text style={{ fontFamily: Fonts.extraBold }}>Action: </Text>{post.diag.act}</Text>
          <TouchableOpacity onPress={() => onAskAI(post.diag.cond)} style={styles.askMoreBtn}>
            <Text style={styles.askMoreText}>Ask AI More →</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Footer */}
      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.postAction} onPress={handleLike}>
          <Animated.Text style={{ fontSize: 15, transform: [{ scale: scaleAnim }] }}>❤️</Animated.Text>
          <Text style={styles.postActionCount}>{post.likes || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction} onPress={() => onComment(post)}>
          <Text style={{ fontSize: 15 }}>💬</Text>
          <Text style={styles.postActionCount}>{(post.comms || []).length}</Text>
        </TouchableOpacity>
        {post.sic > 0 && (
          <View style={styles.sameIssuePill}>
            <Text style={styles.sameIssueText}>👥 {post.sic} same issue</Text>
          </View>
        )}
      </View>
    </FadeIn>
  );
}

export default function CommunityScreen() {
  const { user, apiKey } = useApp();
  const [tab, setTab] = useState('my');
  const [cat, setCat] = useState('all');
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [commInput, setCommInput] = useState('');
  const [npText, setNpText] = useState('');
  const [npCat, setNpCat] = useState('disease');
  const [npCrop, setNpCrop] = useState('cashew');
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    await PostStore.fetchFromSupabase();
    setPosts(await PostStore.getAll());
  }

  async function onRefresh() { setRefreshing(true); await loadPosts(); setRefreshing(false); }

  function openModal(anim, setter) {
    setter(true);
    Animated.spring(anim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }).start();
  }
  function closeModal(anim, setter) {
    Animated.timing(anim, { toValue: 300, duration: 250, useNativeDriver: true }).start(() => setter(false));
  }

  async function submitPost() {
    if (!npText.trim() || npText.length < 10) return;
    const post = { id:'p'+Date.now(), phone:user.phone, author:user.name, init:user.name[0].toUpperCase(), loc:user.taluka+', Goa', txt:npText, cat:npCat, crop:npCrop, likes:0, comms:[], sic:Math.floor(Math.random()*5), ts:new Date().toISOString(), diagLoading:['disease','pest','soil'].includes(npCat) };
    setNpText('');
    closeModal(slideAnim, setShowNewPost);
    await PostStore.add(post);
    setPosts(await PostStore.getAll());
    if (['disease','pest','soil'].includes(npCat)) {
      const diag = await getAIDiag(post.txt, post.crop, apiKey);
      await PostStore.update(post.id, p => { p.diag = diag; delete p.diagLoading; });
      setPosts(await PostStore.getAll());
    }
  }

  async function likePost(id) {
    await PostStore.update(id, p => { p.likes = (p.likes||0)+1; });
    setPosts(await PostStore.getAll());
  }

  function openComments(post) {
    setActivePost(post);
    openModal(slideAnim, setShowComments);
  }

  async function addComment() {
    if (!commInput.trim()) return;
    await PostStore.update(activePost.id, p => {
      if (!p.comms) p.comms = [];
      p.comms.push({ id:'c'+Date.now(), author:user.name, init:user.name[0].toUpperCase(), txt:commInput, ts:new Date().toISOString() });
    });
    setCommInput('');
    const updated = await PostStore.getAll();
    setPosts(updated);
    setActivePost(updated.find(p => p.id === activePost.id));
  }

  let filtered = [...posts].reverse();
  if (tab === 'my' && user) filtered = filtered.filter(p => p.phone === user.phone);
  if (cat !== 'all') filtered = filtered.filter(p => p.cat === cat);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <LinearGradient colors={[Colors.white, Colors.white]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Explore Page</Text>
            <PressScale onPress={() => openModal(slideAnim, setShowNewPost)}>
              <View style={styles.newPostBtn}><Text style={styles.newPostBtnText}>+ Post</Text></View>
            </PressScale>
          </View>
          {/* Tabs */}
          <View style={styles.tabRow}>
            {[{ v:'comm',l:'Community' },{ v:'my',l:'My Posts' }].map(t => (
              <TouchableOpacity key={t.v} style={[styles.tabBtn, tab===t.v && styles.tabBtnOn]} onPress={() => setTab(t.v)}>
                <Text style={[styles.tabBtnText, tab===t.v && styles.tabBtnTextOn]}>{t.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Category filter */}
          <FlatList
            horizontal showsHorizontalScrollIndicator={false}
            data={CATS} keyExtractor={i=>i.v}
            contentContainerStyle={styles.catRow}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.catChip, cat===item.v && styles.catChipOn]} onPress={() => setCat(item.v)}>
                <Text style={[styles.catText, cat===item.v && styles.catTextOn]}>{item.l}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </LinearGradient>

      {/* Feed */}
      <FlatList
        data={filtered} keyExtractor={i=>i.id}
        renderItem={({ item }) => <PostCard post={item} onLike={likePost} onComment={openComments} onAskAI={cond => {}} />}
        contentContainerStyle={{ paddingBottom: 90, gap: 2 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>{tab==='my'?'📝':'👥'}</Text>
            <Text style={styles.emptyTitle}>{tab==='my'?'No posts yet':'No community posts'}</Text>
            <Text style={styles.emptySub}>{tab==='my'?'Share your crop problem for AI diagnosis':'Switch to Community tab to see all farmers\' posts'}</Text>
          </View>
        }
      />

      {/* New Post Modal */}
      <Modal visible={showNewPost} transparent animationType="none" onRequestClose={() => closeModal(slideAnim, setShowNewPost)}>
        <Pressable style={styles.modalOverlay} onPress={() => closeModal(slideAnim, setShowNewPost)} />
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Share with Community</Text>
          <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined}>
            <View style={{ gap: 12, padding: 16 }}>
              <View style={styles.npTopRow}>
                <View style={styles.npAvatar}><Text style={styles.npAvatarText}>{user?.name?.[0]?.toUpperCase()||'F'}</Text></View>
                <View style={styles.npCatRow}>
                  {Object.entries(CAT_EMOJI).map(([v,e]) => (
                    <TouchableOpacity key={v} style={[styles.catSmallChip, npCat===v && styles.catSmallChipOn]} onPress={() => setNpCat(v)}>
                      <Text style={{ fontSize: 11, fontFamily: Fonts.extraBold, color: npCat===v ? '#fff' : Colors.g500 }}>{e} {v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TextInput
                style={styles.npInput} value={npText} onChangeText={setNpText} multiline
                placeholder="Describe your crop problem or question..." placeholderTextColor={Colors.g400}
              />
              <View style={styles.cropRow}>
                {['cashew','paddy','coconut','vegetable'].map(c => (
                  <TouchableOpacity key={c} style={[styles.cropSmall, npCrop===c && styles.cropSmallOn]} onPress={() => setNpCrop(c)}>
                    <Text style={{ fontSize: 11, fontFamily: Fonts.extraBold, color: npCrop===c ? Colors.g1 : Colors.g400 }}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <PressScale onPress={submitPost}>
                <LinearGradient colors={[Colors.g3, Colors.g1]} style={styles.submitBtn}>
                  <Text style={styles.submitBtnText}>Post to Community →</Text>
                </LinearGradient>
              </PressScale>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>

      {/* Comments Modal */}
      <Modal visible={showComments} transparent animationType="none" onRequestClose={() => closeModal(slideAnim, setShowComments)}>
        <Pressable style={styles.modalOverlay} onPress={() => closeModal(slideAnim, setShowComments)} />
        <Animated.View style={[styles.bottomSheet, { height: '70%', transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Comments</Text>
          <FlatList
            data={activePost?.comms || []} keyExtractor={i=>i.id}
            contentContainerStyle={{ padding: 14, gap: 10 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.commentRow}>
                <View style={styles.commAvatar}><Text style={{ color:'#fff', fontFamily:Fonts.black, fontSize:12 }}>{item.init}</Text></View>
                <View style={styles.commBubble}>
                  <Text style={styles.commAuthor}>{item.author}</Text>
                  <Text style={styles.commText}>{item.txt}</Text>
                  <Text style={styles.commTime}>{timeAgo(item.ts)}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={{ textAlign:'center', color:Colors.g400, fontFamily:Fonts.bold, padding:20 }}>No comments yet. Be the first!</Text>}
          />
          <View style={styles.commInputRow}>
            <TextInput style={styles.commInput} value={commInput} onChangeText={setCommInput} placeholder="Add a comment..." placeholderTextColor={Colors.g400} onSubmitEditing={addComment} />
            <PressScale onPress={addComment}>
              <View style={styles.commSend}><Text style={{ color:'#fff', fontSize:16 }}>↑</Text></View>
            </PressScale>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { borderBottomWidth: 1, borderBottomColor: Colors.g100 },
  headerRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:14, paddingTop:8, paddingBottom:6 },
  headerTitle: { fontFamily:Fonts.black, fontSize:20, color:Colors.g900 },
  newPostBtn: { backgroundColor:Colors.g1, borderRadius:Radius.r99, paddingHorizontal:14, paddingVertical:7 },
  newPostBtnText: { fontFamily:Fonts.extraBold, fontSize:13, color:'#fff' },
  tabRow: { flexDirection:'row', backgroundColor:Colors.g100, marginHorizontal:14, borderRadius:Radius.r12, overflow:'hidden', marginBottom:8 },
  tabBtn: { flex:1, paddingVertical:9, alignItems:'center', borderRadius:Radius.r12 },
  tabBtnOn: { backgroundColor:Colors.g1 },
  tabBtnText: { fontFamily:Fonts.extraBold, fontSize:13, color:Colors.g500 },
  tabBtnTextOn: { color:'#fff' },
  catRow: { paddingHorizontal:14, gap:7, paddingBottom:10 },
  catChip: { paddingHorizontal:13, paddingVertical:6, borderRadius:Radius.r99, borderWidth:2, borderColor:Colors.g200, backgroundColor:Colors.white },
  catChipOn: { backgroundColor:Colors.g1, borderColor:Colors.g1 },
  catText: { fontFamily:Fonts.extraBold, fontSize:12, color:Colors.g500 },
  catTextOn: { color:'#fff' },
  postCard: { backgroundColor:Colors.white, marginHorizontal:14, marginVertical:5, borderRadius:Radius.r16, ...Shadows.sh1, overflow:'hidden' },
  postHeader: { flexDirection:'row', gap:10, padding:12, paddingBottom:6 },
  postAvatar: { width:38, height:38, borderRadius:19, backgroundColor:Colors.g2, alignItems:'center', justifyContent:'center' },
  postAvatarText: { fontFamily:Fonts.black, fontSize:14, color:'#fff' },
  postAuthor: { fontFamily:Fonts.extraBold, fontSize:13, color:Colors.g900 },
  postMeta: { fontFamily:Fonts.medium, fontSize:11, color:Colors.g400, marginTop:1 },
  postBody: { fontFamily:Fonts.medium, fontSize:13.5, color:Colors.g700, lineHeight:21, paddingHorizontal:12, paddingBottom:8 },
  diagLoading: { flexDirection:'row', alignItems:'center', gap:9, margin:10, padding:10, backgroundColor:Colors.gb, borderRadius:Radius.r12 },
  diagLoadingDot: { width:20, height:20, borderRadius:10, backgroundColor:Colors.g200 },
  diagLoadingText: { fontFamily:Fonts.bold, fontSize:12, color:Colors.g2 },
  diagBox: { margin:10, padding:12, backgroundColor:Colors.gb, borderRadius:Radius.r12, borderLeftWidth:3, borderLeftColor:Colors.g3 },
  diagHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:5 },
  diagTitle: { fontFamily:Fonts.extraBold, fontSize:12, color:Colors.g1 },
  diagConf: { fontFamily:Fonts.bold, fontSize:11, color:Colors.g400 },
  diagCond: { fontFamily:Fonts.black, fontSize:13, color:Colors.g1, marginBottom:4 },
  diagText: { fontFamily:Fonts.medium, fontSize:12, color:Colors.g700, lineHeight:18, marginBottom:3 },
  askMoreBtn: { marginTop:8, alignSelf:'flex-start', backgroundColor:Colors.g1, borderRadius:Radius.r99, paddingHorizontal:12, paddingVertical:5 },
  askMoreText: { fontFamily:Fonts.extraBold, fontSize:11, color:'#fff' },
  postFooter: { flexDirection:'row', alignItems:'center', gap:14, padding:10, paddingTop:8, borderTopWidth:1, borderTopColor:Colors.g100 },
  postAction: { flexDirection:'row', alignItems:'center', gap:5 },
  postActionCount: { fontFamily:Fonts.extraBold, fontSize:12, color:Colors.g400 },
  sameIssuePill: { marginLeft:'auto', backgroundColor:Colors.gp, borderRadius:Radius.r99, paddingHorizontal:9, paddingVertical:3 },
  sameIssueText: { fontFamily:Fonts.extraBold, fontSize:11, color:Colors.g2 },
  empty: { padding:40, alignItems:'center' },
  emptyTitle: { fontFamily:Fonts.extraBold, fontSize:16, color:Colors.g700 },
  emptySub: { fontFamily:Fonts.medium, fontSize:13, color:Colors.g400, textAlign:'center', marginTop:6, lineHeight:20 },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,.5)' },
  bottomSheet: { backgroundColor:Colors.white, borderTopLeftRadius:24, borderTopRightRadius:24, ...Shadows.sh3 },
  sheetHandle: { width:36, height:4, backgroundColor:Colors.g200, borderRadius:2, alignSelf:'center', marginTop:10, marginBottom:4 },
  sheetTitle: { fontFamily:Fonts.black, fontSize:16, color:Colors.g900, paddingHorizontal:16, paddingVertical:10, borderBottomWidth:1, borderBottomColor:Colors.g100 },
  npTopRow: { flexDirection:'row', gap:10, alignItems:'flex-start' },
  npAvatar: { width:36, height:36, borderRadius:18, backgroundColor:Colors.g2, alignItems:'center', justifyContent:'center', flexShrink:0 },
  npAvatarText: { fontFamily:Fonts.black, fontSize:14, color:'#fff' },
  npCatRow: { flex:1, flexDirection:'row', flexWrap:'wrap', gap:5 },
  catSmallChip: { paddingHorizontal:9, paddingVertical:4, borderRadius:Radius.r99, borderWidth:1.5, borderColor:Colors.g200 },
  catSmallChipOn: { backgroundColor:Colors.g1, borderColor:Colors.g1 },
  npInput: { borderWidth:2, borderColor:Colors.g200, borderRadius:Radius.r12, padding:12, minHeight:90, fontSize:14, fontFamily:Fonts.medium, color:Colors.g900, textAlignVertical:'top' },
  cropRow: { flexDirection:'row', gap:7 },
  cropSmall: { paddingHorizontal:12, paddingVertical:6, borderRadius:Radius.r99, borderWidth:2, borderColor:Colors.g200 },
  cropSmallOn: { borderColor:Colors.g3, backgroundColor:Colors.gp },
  submitBtn: { borderRadius:Radius.r99, paddingVertical:14, alignItems:'center' },
  submitBtnText: { fontFamily:Fonts.black, fontSize:15, color:'#fff' },
  commentRow: { flexDirection:'row', gap:9 },
  commAvatar: { width:32, height:32, borderRadius:16, backgroundColor:Colors.g3, alignItems:'center', justifyContent:'center', flexShrink:0 },
  commBubble: { flex:1, backgroundColor:Colors.g50, borderRadius:Radius.r12, padding:10, borderTopLeftRadius:2 },
  commAuthor: { fontFamily:Fonts.extraBold, fontSize:12, color:Colors.g1, marginBottom:3 },
  commText: { fontFamily:Fonts.medium, fontSize:13, color:Colors.g700, lineHeight:19 },
  commTime: { fontFamily:Fonts.medium, fontSize:10, color:Colors.g400, marginTop:4 },
  commInputRow: { flexDirection:'row', gap:8, padding:12, borderTopWidth:1, borderTopColor:Colors.g100 },
  commInput: { flex:1, backgroundColor:Colors.g50, borderWidth:2, borderColor:Colors.g200, borderRadius:Radius.r99, paddingHorizontal:14, paddingVertical:9, fontSize:13, fontFamily:Fonts.medium },
  commSend: { width:38, height:38, backgroundColor:Colors.g1, borderRadius:19, alignItems:'center', justifyContent:'center' },
});
