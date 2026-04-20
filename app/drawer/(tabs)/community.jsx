import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity,
  TextInput, Modal, Image, ActivityIndicator, RefreshControl,
  KeyboardAvoidingView, Platform, Dimensions, Alert, StatusBar, Animated, Keyboard
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Camera, Image as ImageIcon, Heart, MessageSquare,
  Send, X, Plus, ChevronLeft, Bell,
  Info, AlertTriangle, Users, Trash2
} from 'lucide-react-native';

import { useApp } from '../../../src/store/AppContext';

// ─────────────────────────────────────────────────────
// API KEYS & CONFIG
// ─────────────────────────────────────────────────────
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const PLANTID_KEY  = process.env.EXPO_PUBLIC_PLANTID_KEY;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─────────────────────────────────────────────────────
// THEME - UPDATED TO MATCH YOUR VIBRANT GREEN IMAGE
// ─────────────────────────────────────────────────────
const Colors = {
  primary: '#0D9462',   // Vibrant teal-green from your image
  gradientEnd: '#14B87E',
  bg: '#F8FAFC',        // Very soft gray for contrast
  white: '#ffffff',
  muted: '#64748B',
  border: '#E2E8F0',
  error: '#ef4444',
  warning: '#f59e0b',
  textMain: '#0F172A',
  textSub: '#475569'
};

const CATEGORIES = ['All', 'disease', 'pest', 'soil', 'weather'];

// ─────────────────────────────────────────────────────
// CHATBOT HELPERS & DATA
// ─────────────────────────────────────────────────────
function stripMd(text) {
  return (text || '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/^#{1,6}\s+/gm, '').replace(/`(.+?)`/g, '$1').trim();
}

const PRELOADED = {
  en: {
    greeting: 'Hello! I am AgroGROW AI. You can ask me about crops, fertilizers, pests, and more. 🌱',
  }
};

const INTENT_MAP = [
  { slug: 'greeting', phrases: ['hi','hello','namaste','namaskar'] },
];

function findPreloaded(text, lang) {
  const t = text.toLowerCase().trim();
  const db = PRELOADED[lang] || PRELOADED.en;
  for (const intent of INTENT_MAP) {
    for (const phrase of intent.phrases) {
      if (t.includes(phrase)) return db[intent.slug] || PRELOADED.en[intent.slug] || null;
    }
  }
  return null;
}

async function callPlantId(base64Image, lang) {
  try {
    const res = await fetch('https://plant.id/api/v3/health_assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Api-Key': PLANTID_KEY },
      body: JSON.stringify({ images: [`data:image/jpeg;base64,${base64Image}`], similar_images: false }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const healthy = data?.result?.is_healthy?.binary;
    const diseases = data?.result?.disease?.suggestions || [];
    if (healthy) return 'Your crop looks healthy in this image — no major disease detected.';
    if (!diseases.length) return null;
    const top = diseases[0];
    return stripMd(`Detected: ${top?.name || 'Unknown issue'}. ${top?.details?.description || ''}`.slice(0, 200));
  } catch (e) { return null; }
}

async function callGroq(prompt, lang) {
  const system = `You are AgroGROW AI. Respond in English. Write one helpful paragraph. Plain text only.`;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 150,
        temperature: 0.5,
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return stripMd(data?.choices?.[0]?.message?.content?.trim() || null);
  } catch (e) { return null; }
}

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const PremiumAvatar = ({ name, size = 42 }) => {
  const colors = ['#0D9462', '#2563eb', '#7c3aed', '#0f766e', '#b45309', '#be123c', '#4d7c0f'];
  const bgColor = colors[(name?.charCodeAt(0) || 65) % colors.length];
  return (
    <View style={[styles.avatar, { width: size, height: size, backgroundColor: bgColor }]}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.45 }}>{name?.charAt(0).toUpperCase() || 'F'}</Text>
    </View>
  );
};

const AIDiagnosisBadge = ({ diagnosis, severity }) => {
  if (!diagnosis) return null;
  const isHigh = severity === 'high';
  return (
    <View style={[styles.aiBadge, isHigh ? styles.aiHigh : styles.aiMed]}>
      <View style={styles.aiHeader}>
        <View style={[styles.aiIconWrap, { backgroundColor: isHigh ? '#FEE2E2' : '#FEF3C7' }]}>
            {isHigh ? <AlertTriangle size={18} color={Colors.error} /> : <Info size={18} color={Colors.warning} />}
        </View>
        <Text style={[styles.aiTitle, { color: isHigh ? Colors.error : Colors.warning }]}>AI DIAGNOSIS • {severity?.toUpperCase()}</Text>
      </View>
      <Text style={styles.aiText}>{diagnosis}</Text>
    </View>
  );
};

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  if (isUser) {
    return (
      <View style={styles.userWrapper}>
        <LinearGradient colors={[Colors.primary, Colors.gradientEnd]} style={styles.userBubble}>
          {msg.image && <Image source={{ uri: msg.image }} style={styles.msgImage} />}
          <Text style={styles.userText}>{msg.text}</Text>
        </LinearGradient>
      </View>
    );
  }
  return (
    <View style={styles.botWrapper}>
      <View style={styles.botAvatar}>
        <MaterialCommunityIcons name="robot-confused-outline" size={20} color="#FFF" />
      </View>
      <View style={styles.botBubble}>
        <Text style={styles.botText}>{msg.text}</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// AI COMMUNITY ROOM COMPONENT
// ─────────────────────────────────────────────────────
function CommunityRoomAI({ post, onBack }) {
  const { user } = useApp();
  const [lang, setLang] = useState(user?.lang || 'en');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const [messages, setMessages] = useState([
    { id: '0', role: 'bot', text: `Hi ${user?.name || 'Farmer'}! I'm AgroGROW AI. I see you're discussing the issue: "${post.content}". How can I help you analyze or treat this? 🌱` },
  ]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  }, [messages, loading]);

  async function handleSend(text = input, imageUri = null, imageBase64 = null) {
    const trimmed = (text || '').trim();
    if (!trimmed && !imageUri) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text: trimmed || 'Analyzing photo...', image: imageUri || null };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    Keyboard.dismiss();

    let reply = null;
    if (imageBase64) {
      reply = await callPlantId(imageBase64, lang);
      if (!reply) reply = await callGroq(`Analyze this crop image regarding: ${post.content}`, lang);
    } else {
      reply = findPreloaded(trimmed, lang);
      if (!reply) reply = await callGroq(`Context: ${post.content}. User asks: ${trimmed}`, lang);
    }

    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', text: reply || "I'm having trouble connecting right now. Please try again." }]);
    setLoading(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={[Colors.primary, Colors.gradientEnd]} style={styles.chatHeader}>
        <View style={styles.chatHeaderTop}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <ChevronLeft color="#FFF" size={24} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.chatHeaderTitle}>{post.category} Expert AI</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>Live Assistant</Text>
            </View>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.roomPostBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <MaterialCommunityIcons name="bullhorn-outline" size={16} color={Colors.primary} />
            <Text style={styles.roomPostLabel}>Discussing Problem:</Text>
          </View>
          <Text style={styles.roomPostText} numberOfLines={2}>"{post.content}"</Text>
        </View>
      </LinearGradient>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {loading && (
          <View style={styles.botWrapper}>
            <View style={styles.botAvatar}><ActivityIndicator size="small" color="#FFF" /></View>
            <View style={styles.botBubble}><Text style={styles.typingText}>Analyzing issue...</Text></View>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputContainer, { paddingBottom: 110 }]}>
          <View style={styles.inputPill}>
            <TouchableOpacity
              onPress={async () => {
                const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6 });
                if (!res.canceled) handleSend('', res.assets[0].uri, res.assets[0].base64);
              }}
              style={styles.cameraBtn}
            >
              <Ionicons name="camera-outline" size={24} color={Colors.muted} />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Ask AI for solutions..."
              placeholderTextColor={Colors.muted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={() => handleSend()} style={styles.sendBtn}>
              <LinearGradient colors={[Colors.primary, Colors.gradientEnd]} style={styles.sendBtnGrad}>
                <Ionicons name="send" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────
// INDIVIDUAL POST ITEM
// ─────────────────────────────────────────────────────
const PostItem = ({ item, onLike, onConnect, onPressDetail, onJoin, onMessage, onDelete, connectionStatus, currentUser }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const isMyPost = item.user_name === (currentUser?.name || 'Farmer');

  const handleLikePress = () => {
    Animated.sequence([
      Animated.timing(scaleValue, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleValue, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
    onLike(item.id);
  };

  return (
    <View style={styles.postCard}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => onPressDetail(item)}>
        <View style={styles.postHeader}>
          <PremiumAvatar name={item.user_name} size={46} />
          <View style={styles.postHeaderText}>
            <Text style={styles.userNameText}>{item.user_name}</Text>
            <Text style={styles.metaText}>{item.user_location} • {timeAgo(item.created_at)}</Text>
          </View>

          {isMyPost ? (
            <TouchableOpacity style={styles.iconBtnMinimal} onPress={() => onDelete(item.id)}>
              <Trash2 size={18} color={Colors.error} />
            </TouchableOpacity>
          ) : connectionStatus === 'connected' ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={styles.msgBtn} onPress={() => onMessage(item)}>
                <MessageSquare size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.connBtn, connectionStatus === 'pending' && styles.connBtnPending]} onPress={() => onConnect(item.id)}>
              <Text style={[styles.connBtnText, connectionStatus === 'pending' && styles.connBtnTextPending]}>
                {connectionStatus === 'pending' ? 'Pending' : 'Connect'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.postContent} numberOfLines={4}>{item.content}</Text>
        {item.image_url && <Image source={{ uri: item.image_url }} style={styles.postImage} />}

        <View style={styles.communityBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Users size={16} color={Colors.primary} />
            <Text style={styles.communityBannerText}>{item.likes_count || 0} facing this issue</Text>
          </View>
          <TouchableOpacity onPress={() => onJoin(item)} style={styles.joinBtn}>
            <Text style={styles.communityBannerAction}>Ask AI</Text>
            <ChevronLeft style={{ transform: [{ rotate: '180deg' }] }} size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionItem} onPress={handleLikePress}>
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <Heart size={22} color={item.isLiked ? Colors.error : Colors.muted} fill={item.isLiked ? Colors.error : 'transparent'} />
          </Animated.View>
          <Text style={[styles.actionLabel, item.isLiked && { color: Colors.error }]}>{item.likes_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={() => onPressDetail(item)}>
          <MessageSquare size={22} color={Colors.muted} />
          <Text style={styles.actionLabel}>{item.comments_count || 0}</Text>
        </TouchableOpacity>

        {/* Post Category Tag */}
        <View style={styles.postTag}>
           <Text style={styles.postTagText}>{item.category}</Text>
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────
// MODAL: POST DETAIL (COMMENTS)
// ─────────────────────────────────────────────────────
function PostDetailModal({ post, visible, onClose }) {
  const { user } = useApp();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (visible && post) fetchComments(); }, [visible, post]);

  const fetchComments = async () => {
    const { data } = await supabase.from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('comments').insert([{
      post_id: post.id,
      user_name: user?.name || 'Farmer',
      content: newComment
    }]);

    if (!error) {
      setNewComment('');
      fetchComments();
      await supabase.rpc('increment_comments', { row_id: post.id });
    } else {
      Alert.alert("Error", "Could not post comment.");
    }
    setLoading(false);
  };

  if (!post) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
        <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
        </View>

        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtnMinimal}><X color={Colors.textMain} size={24} /></TouchableOpacity>
          <Text style={styles.modalTitle}>Discussion</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.detailCard}>
            <View style={styles.postHeader}>
              <PremiumAvatar name={post.user_name} size={50} />
              <View style={styles.postHeaderText}>
                <Text style={[styles.userNameText, { fontSize: 18 }]}>{post.user_name}</Text>
                <Text style={styles.metaText}>{post.user_location} • {timeAgo(post.created_at)}</Text>
              </View>
            </View>
            <Text style={styles.detailContent}>{post.content}</Text>
            {post.image_url && <Image source={{ uri: post.image_url }} style={styles.detailImage} />}
            <AIDiagnosisBadge diagnosis={post.ai_diagnosis} severity={post.ai_severity} />
          </View>

          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>Responses ({comments.length})</Text>
            {comments.length === 0 && <Text style={styles.emptyText}>Be the first to share your thoughts.</Text>}
            {comments.map((c) => (
              <View key={c.id} style={styles.commentRow}>
                <PremiumAvatar name={c.user_name} size={36} />
                <View style={styles.commentBubble}>
                  <Text style={styles.commentUser}>{c.user_name}</Text>
                  <Text style={styles.commentText}>{c.content}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.inputBarNormal}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add your advice..."
              value={newComment}
              onChangeText={setNewComment}
              placeholderTextColor={Colors.muted}
              onSubmitEditing={addComment}
            />
            <TouchableOpacity onPress={addComment} disabled={loading} style={styles.sendBtnSolid}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────
// MODAL: CREATE POST
// ─────────────────────────────────────────────────────
function CreatePostModal({ visible, onClose, onPostSuccess }) {
  const { user } = useApp();
  const [text, setText] = useState('');
  const [category, setCategory] = useState('disease');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (useCamera = false) => {
    const result = useCamera ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.6 }) : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.6 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleUpload = async () => {
    if (!text.trim()) return;
    setUploading(true);
    try {
      let publicUrl = null;
      if (image) {
        const base64 = await FileSystem.readAsStringAsync(image, { encoding: FileSystem.EncodingType.Base64 });
        const decode = (b64) => {
          const bin = atob(b64);
          const len = bin.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
          return bytes.buffer;
        };
        const fileExt = image.split('.').pop().toLowerCase();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('post-images').upload(fileName, decode(base64), {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`, upsert: true
        });
        if (uploadError) throw uploadError;
        publicUrl = supabase.storage.from('post-images').getPublicUrl(fileName).data.publicUrl;
      }

      const { error } = await supabase.from('posts').insert([{
        user_name: user?.name || 'Farmer',
        user_location: user?.locName || 'Goa, India',
        category,
        content: text,
        image_url: publicUrl,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
      onPostSuccess();
      onClose();
      setText('');
      setImage(null);
    } catch (err) { Alert.alert("Upload Error", err.message); } finally { setUploading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
        <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
        </View>

        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtnMinimal}><X color={Colors.textMain} size={24} /></TouchableOpacity>
          <Text style={styles.modalTitle}>New Topic</Text>
          <TouchableOpacity onPress={handleUpload} disabled={uploading} style={styles.postActionBtn}>
            {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postBtnText}>Publish</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>

          <Text style={styles.label}>Select Category</Text>
          <View style={styles.categoryRow}>
            {['disease', 'soil', 'pest', 'weather'].map(c => (
              <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.catChip, category === c && styles.catChipActive]}>
                <Text style={[styles.catChipText, category === c && { color: '#fff' }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Describe the issue you are facing..." multiline value={text} onChangeText={setText} autoFocus placeholderTextColor={Colors.muted} />
          {image && <View style={styles.previewContainer}><Image source={{ uri: image }} style={styles.previewImg} /><TouchableOpacity style={styles.removeImgBtn} onPress={() => setImage(null)}><X color="#fff" size={20}/></TouchableOpacity></View>}

          <View style={styles.mediaRow}>
            <TouchableOpacity style={styles.mediaBtn} onPress={() => pickImage(true)}><Camera color={Colors.primary} size={22} /><Text style={styles.mediaBtnText}>Take Photo</Text></TouchableOpacity>
            <TouchableOpacity style={styles.mediaBtn} onPress={() => pickImage(false)}><ImageIcon color={Colors.primary} size={22} /><Text style={styles.mediaBtnText}>Upload</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────
// MAIN APP COMPONENT
// ─────────────────────────────────────────────────────
export default function App() {
  const { user } = useApp();
  const userName = user?.name || 'Farmer';

  const [tab, setTab] = useState('community');
  const [activeCategory, setActiveCategory] = useState('All'); // NEW: Category Filter State
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const [connections, setConnections] = useState({});
  const [screen, setScreen] = useState('feed');
  const [communityPost, setCommunityPost] = useState(null);
  const [activeChat, setActiveChat] = useState(null);

  const [chatText, setChatText] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', sender: 'them', text: 'Hello farmer 👋' },
  ]);

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  };

  const handleLike = async (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1, isLiked: true } : p));
    await supabase.rpc('increment_likes', { row_id: postId });
  };

  const handleConnect = (id) => {
    setConnections(prev => ({ ...prev, [id]: prev[id] === 'connected' ? 'none' : prev[id] === 'pending' ? 'connected' : 'pending' }));
  };

  const handleDeletePost = (postId) => {
    Alert.alert("Delete Post", "Are you sure you want to permanently delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setPosts(prev => prev.filter(p => p.id !== postId));
          const { error } = await supabase.from('posts').delete().eq('id', postId);
          if (error) { Alert.alert("Error", "Could not delete post."); fetchPosts(); }
        }
      }
    ]);
  };

  if (screen === 'room' && communityPost) {
    return <CommunityRoomAI post={communityPost} onBack={() => setScreen('feed')} />;
  }

  if (screen === 'chat' && activeChat) {
    const sendMessage = () => {
      if (!chatText.trim()) return;
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'me', text: chatText }]);
      setChatText('');
    };

    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setScreen('feed')} style={styles.iconBtnMinimal}><ChevronLeft color={Colors.textMain} size={28} /></TouchableOpacity>
            <Text style={styles.modalTitle}>{activeChat.user_name}</Text>
            <View style={{ width: 40 }} />
          </View>
          <FlatList
            data={messages}
            keyExtractor={item => item.id}
            style={{ flex: 1, backgroundColor: Colors.bg }}
            contentContainerStyle={{ padding: 20 }}
            renderItem={({ item }) => (
              <View style={{ alignSelf: item.sender === 'me' ? 'flex-end' : 'flex-start', backgroundColor: item.sender === 'me' ? Colors.primary : '#FFF', padding: 14, borderRadius: 20, marginBottom: 12, maxWidth: '75%', borderBottomRightRadius: item.sender === 'me' ? 4 : 20, borderBottomLeftRadius: item.sender === 'me' ? 20 : 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 }}>
                <Text style={{ color: item.sender === 'me' ? '#fff' : Colors.textMain, fontSize: 15 }}>{item.text}</Text>
              </View>
            )}
          />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.inputBarCleared}>
              <TextInput value={chatText} onChangeText={setChatText} placeholder="Type message..." style={styles.commentInput} />
              <TouchableOpacity onPress={sendMessage} style={styles.sendBtnSolid}><Send size={18} color="#fff" /></TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Filter Logic: Filters by Tab (Community vs MyPost) AND by Category (All vs specific)
  const filteredPosts = posts.filter(p => {
    const matchesTab = tab === 'community' || p.user_name === userName;
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    return matchesTab && matchesCat;
  });

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>

        {/* PREMIUM VIBRANT HEADER */}
        <LinearGradient colors={[Colors.primary, Colors.gradientEnd]} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.topBar}>
              <View>
                <Text style={styles.logo}>Community</Text>
                <Text style={styles.subLogo}>Learn & Grow Together</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={styles.iconBtn}><Bell color="#fff" size={22} /></TouchableOpacity>
              </View>
            </View>

            <View style={styles.tabBar}>
              {['community', 'mypost'].map(t => (
                <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.activeTab]}>
                  <Text style={[styles.tabText, tab === t && styles.activeTabText]}>{t === 'community' ? 'Global Feed' : 'My Journal'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* NEW: HORIZONTAL CATEGORY CHIPS */}
            {tab === 'community' && (
              <View style={{ marginTop: 15, paddingLeft: 20 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setActiveCategory(cat)}
                      style={[styles.headerCatChip, activeCategory === cat && styles.headerCatChipActive]}
                    >
                      <Text style={[styles.headerCatText, activeCategory === cat && styles.headerCatTextActive]}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.postEntryWrapper}>
            <TouchableOpacity style={styles.postEntryBar} onPress={() => setShowCreate(true)} activeOpacity={0.8}>
            <PremiumAvatar name={userName} size={40} />
            <View style={styles.fakeInput}><Text style={styles.fakeInputText}>Share a crop update...</Text></View>
            <View style={styles.miniFab}><ImageIcon color={Colors.primary} size={20} /></View>
            </TouchableOpacity>
        </View>

        <FlatList
          data={filteredPosts}
          keyExtractor={item => item.id.toString()}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPosts} tintColor={Colors.primary} />}
          contentContainerStyle={{ paddingBottom: 150 }}
          renderItem={({ item }) => (
            <PostItem
              item={item}
              currentUser={user}
              onLike={handleLike}
              onConnect={handleConnect}
              onDelete={handleDeletePost}
              connectionStatus={connections[item.id]}
              onPressDetail={(post) => { setSelectedPost(post); setShowDetail(true); }}
              onJoin={(post) => { setCommunityPost(post); setScreen('room'); }}
              onMessage={(post) => { setActiveChat(post); setScreen('chat'); }}
            />
          )}
          ListEmptyComponent={!loading && <Text style={styles.emptyFeedText}>No posts found in this category.</Text>}
        />

        <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}>
          <LinearGradient colors={[Colors.primary, Colors.gradientEnd]} style={styles.fabGrad}>
             <Plus color="#fff" size={28} />
          </LinearGradient>
        </TouchableOpacity>

        <PostDetailModal post={selectedPost} visible={showDetail} onClose={() => setShowDetail(false)} />
        <CreatePostModal visible={showCreate} onClose={() => setShowCreate(false)} onPostSuccess={fetchPosts} />
      </View>
    </SafeAreaProvider>
  );
}

// ─────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 20, elevation: 8, shadowColor: Colors.primary, shadowOpacity: 0.2, shadowRadius: 15, zIndex: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 10 },
  logo: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  subLogo: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', marginTop: -2 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  iconBtnMinimal: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },

  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 24, marginTop: 20, borderRadius: 20, padding: 5 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 16 },
  activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  tabText: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 14 },
  activeTabText: { color: Colors.primary, fontWeight: '800' },

  // NEW: Header Category Chips
  headerCatChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerCatChipActive: { backgroundColor: '#FFF' },
  headerCatText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  headerCatTextActive: { color: Colors.primary, fontWeight: '800' },

  postEntryWrapper: { paddingHorizontal: 16, marginTop: 15, marginBottom: 5, zIndex: 5 },
  postEntryBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 24, elevation: 5, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, shadowOffset: { width: 0, height: 4 } },
  fakeInput: { flex: 1, marginHorizontal: 12, backgroundColor: '#F8FAFC', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 20 },
  fakeInputText: { color: Colors.muted, fontSize: 15, fontWeight: '500' },
  miniFab: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' },

  postCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 24, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, borderWidth: 1, borderColor: '#F1F5F9' },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: { borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  postHeaderText: { flex: 1, marginLeft: 12 },
  userNameText: { fontWeight: '800', fontSize: 16, color: Colors.textMain },
  metaText: { fontSize: 12, color: Colors.muted, marginTop: 2, fontWeight: '500' },

  connBtn: { backgroundColor: '#F0FDF4', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#BBF7D0' },
  connBtnPending: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  connBtnText: { color: Colors.primary, fontSize: 12, fontWeight: '800' },
  connBtnTextPending: { color: '#D97706' },
  msgBtn: { backgroundColor: '#EFF6FF', width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { backgroundColor: '#FEF2F2', padding: 10, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  communityBanner: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  communityBannerText: { fontSize: 13, color: Colors.textSub, fontWeight: '600' },
  joinBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  communityBannerAction: { fontSize: 13, color: Colors.primary, fontWeight: '800' },

  postContent: { fontSize: 15, lineHeight: 24, color: '#334155', marginBottom: 15 },
  postImage: { width: '100%', height: 220, borderRadius: 16, marginBottom: 15, backgroundColor: '#F1F5F9' },

  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16, alignItems: 'center' },
  actionItem: { flexDirection: 'row', alignItems: 'center', marginRight: 24, gap: 6 },
  actionLabel: { fontSize: 15, color: Colors.muted, fontWeight: '700' },

  postTag: { marginLeft: 'auto', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  postTagText: { fontSize: 11, color: Colors.muted, fontWeight: '700', textTransform: 'uppercase' },

  fab: { position: 'absolute', bottom: 110, right: 24, width: 56, height: 56, borderRadius: 28, elevation: 8, shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  fabGrad: { width: '100%', height: '100%', borderRadius: 28, alignItems: 'center', justifyContent: 'center' },

  // AI Community Room UI
  chatHeader: { paddingHorizontal: 20, paddingBottom: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  chatHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  chatHeaderTitle: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  statusText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80', marginRight: 6 },
  roomPostBanner: { backgroundColor: 'rgba(255,255,255,0.95)', marginTop: 20, padding: 15, borderRadius: 16 },
  roomPostLabel: { fontSize: 12, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  roomPostText: { fontSize: 14, color: Colors.textMain, fontWeight: '500', fontStyle: 'italic', lineHeight: 20 },

  userWrapper: { alignItems: 'flex-end', marginBottom: 20 },
  userBubble: { padding: 15, borderRadius: 20, borderBottomRightRadius: 4, maxWidth: '85%', shadowColor: Colors.primary, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: {width:0, height:4} },
  userText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  botWrapper: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  botAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10, elevation: 2 },
  botBubble: { backgroundColor: '#FFF', padding: 16, borderRadius: 20, borderBottomLeftRadius: 4, maxWidth: '80%', borderWidth: 1, borderColor: '#E2E8F0', elevation: 1 },
  botText: { color: '#1E293B', fontSize: 15, fontWeight: '500', lineHeight: 23 },
  typingText: { fontSize: 13, color: Colors.muted, fontStyle: 'italic' },

  inputContainer: { padding: 15, paddingBottom: 110, backgroundColor: Colors.bg },
  inputPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 30, padding: 6, paddingHorizontal: 12, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  cameraBtn: { padding: 8 },
  textInput: { flex: 1, paddingHorizontal: 12, fontSize: 16, color: '#1E293B', maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendBtnGrad: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  msgImage: { width: 220, height: 160, borderRadius: 16, marginBottom: 10 },

  // Normal Comments & 1-on-1 Chat Inputs
  inputBarCleared: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9', alignItems: 'center', paddingBottom: 110 },
  inputBarNormal: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 30 : 16 },
  commentInput: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, fontSize: 15, color: '#111827', marginRight: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  sendBtnSolid: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 5 },

  // Modals
  dragHandleContainer: { alignItems: 'center', paddingTop: 12, paddingBottom: 5, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  dragHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#CBD5E1' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.textMain },

  detailCard: { backgroundColor: '#fff', padding: 24 },
  detailContent: { fontSize: 16, lineHeight: 26, color: '#334155', marginVertical: 20 },
  detailImage: { width: '100%', height: 300, borderRadius: 20 },

  aiBadge: { marginTop: 20, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  aiHigh: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  aiMed: { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  aiIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  aiTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  aiText: { fontSize: 14, color: Colors.textSub, fontStyle: 'italic', lineHeight: 22 },

  commentSection: { padding: 24, backgroundColor: Colors.bg, flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 20, color: Colors.textMain },
  commentRow: { flexDirection: 'row', marginBottom: 20, gap: 12 },
  commentBubble: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 20, borderTopLeftRadius: 4, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5, elevation: 1, borderWidth: 1, borderColor: '#F1F5F9' },
  commentUser: { fontWeight: '800', fontSize: 14, color: Colors.textMain, marginBottom: 4 },
  commentText: { fontSize: 15, color: '#475569', lineHeight: 22 },

  postActionBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, elevation: 2, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 5 },
  postBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  label: { fontSize: 13, fontWeight: '800', color: Colors.muted, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  categoryRow: { flexDirection: 'row', marginBottom: 24, flexWrap: 'wrap', gap: 10 },
  catChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { fontSize: 14, fontWeight: '700', color: Colors.muted, textTransform: 'capitalize' },
  input: { fontSize: 18, minHeight: 160, textAlignVertical: 'top', color: Colors.textMain, fontWeight: '500' },
  previewContainer: { position: 'relative', marginVertical: 20 },
  previewImg: { width: '100%', height: 250, borderRadius: 20 },
  removeImgBtn: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  mediaRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  mediaBtn: { flex: 1, flexDirection: 'row', padding: 14, backgroundColor: '#F0FDF4', borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#BBF7D0' },
  mediaBtnText: { fontWeight: '800', color: Colors.primary, fontSize: 15 },
  emptyFeedText: { textAlign: 'center', marginTop: 60, color: Colors.muted, fontSize: 15, fontWeight: '600' },
  emptyText: { color: Colors.muted, fontStyle: 'italic', textAlign: 'center', marginTop: 20 }
});