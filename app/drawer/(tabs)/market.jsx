import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal,
  Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar, KeyboardAvoidingView
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { createClient } from "@supabase/supabase-js";
import { collection, getDocs } from "firebase/firestore"; // Kept for Official Store
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import {
  Search, Plus, MapPin, Camera, X, ArrowLeft, Image as ImageIcon,
  Heart, Leaf, PawPrint, Wrench, Map, Sprout, FlaskConical, Tractor
} from "lucide-react-native";

import { db } from "../../../firebaseConfig"; // Firebase for Official Store
import { useCart } from "../../../src/context/CartContext";

// ─── SUPABASE CONFIG ─────────────────────────────────────────────
// Use your actual Supabase URL and Key here
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── SHARED DATA ─────────────────────────────────────────────────
const STORE_CATEGORIES = [
  { id: 'Seeds', label: 'Seeds', icon: 'leaf' },
  { id: 'Fertilizers', label: 'Fertilizers', icon: 'flask' },
  { id: 'Pesticides', label: 'Pesticides', icon: 'bug' },
  { id: 'Tools', label: 'Tools', icon: 'hardware-chip' },
];

const OLX_CATEGORIES = [
  { label: "Crops", icon: <Leaf size={16} /> },
  { label: "Livestock", icon: <PawPrint size={16} /> },
  { label: "Tools", icon: <Wrench size={16} /> },
  { label: "Land", icon: <Map size={16} /> },
  { label: "Seeds", icon: <Sprout size={16} /> },
  { label: "Fertilizers", icon: <FlaskConical size={16} /> },
  { label: "Vehicles", icon: <Tractor size={16} /> },
];

const AD_STYLES = [
  { id: "1", bg: "#064E3B", accent: "#10B981", icon: "leaf" },
  { id: "2", bg: "#D97706", accent: "#FDE68A", icon: "flower-outline" },
  { id: "3", bg: "#0284C7", accent: "#BAE6FD", icon: "bicycle-outline" },
];

// ─── AD BANNER COMPONENT ─────────────────────────────────────────
function AdBanner() {
  const { t } = useTranslation();
  const rawAds = t('market.ads', { returnObjects: true }) || [];
  const AD_CARDS = rawAds.length > 0 ? rawAds.map((ad, i) => ({ ...ad, ...(AD_STYLES[i] || AD_STYLES[0]) })) : AD_STYLES;

  return (
    <View style={adStyles.wrapper}>
      <Text style={adStyles.sectionTitle}>{t('market.specialOffers', 'Special Offers')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 10 }}>
        {AD_CARDS.map((card) => (
          <View key={card.id} style={[adStyles.card, { backgroundColor: card.bg }]}>
            <View style={adStyles.circle} />
            <View style={adStyles.cardContent}>
              <View style={[adStyles.badgePill, { backgroundColor: card.accent }]}>
                <Text style={[adStyles.badgeText, { color: card.bg }]}>{card.badge || 'PROMO'}</Text>
              </View>
              <Text style={adStyles.cardTitle} numberOfLines={1}>{card.title || 'Offer'}</Text>
              <Text style={adStyles.cardSubtitle} numberOfLines={2}>{card.subtitle || 'Grab it now'}</Text>
              <TouchableOpacity style={adStyles.shopBtn} activeOpacity={0.8}>
                <Text style={adStyles.shopBtnText}>{t('market.shopNow', 'Shop Now')}</Text>
              </TouchableOpacity>
            </View>
            <View style={adStyles.iconBox}>
              <Ionicons name={card.icon} size={64} color="rgba(255,255,255,0.15)" />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── SELL MODAL (Supabase Upload Flow) ───────────────────────────
function SellModal({ visible, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [images, setImages] = useState([]);
  const [posting, setPosting] = useState(false);

  const resetForm = () => {
    setStep(1); setSelectedCategory(""); setTitle(""); setPrice("");
    setDescription(""); setLocation(""); setSellerName(""); setImages([]);
  };

  const pickImage = async (fromCamera) => {
    const perm = fromCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission needed", "Please allow access to continue.");

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, allowsEditing: true, aspect: [4, 3] })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, allowsMultipleSelection: true, selectionLimit: 1 }); // Keeping to 1 for reliable Supabase upload demo

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setImages(uris); // Set image
    }
  };

  const handlePost = async () => {
    if (!title || !price || !location || !sellerName || images.length === 0) {
       return Alert.alert("Missing Info", "Please add a photo, title, price, and location.");
    }

    setPosting(true);
    try {
      let publicUrl = null;

      // 1. UPLOAD IMAGE TO SUPABASE
      const uri = images[0];
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

      // Base64 decoding for Supabase
      const decode = (b64) => {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return bytes.buffer;
      };

      const fileExt = uri.split('.').pop().toLowerCase();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('olx-images') // Make sure this bucket exists and is public!
        .upload(fileName, decode(base64), { contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}` });

      if (uploadError) throw uploadError;

      // 2. GET PUBLIC URL
      const { data: urlData } = supabase.storage.from('olx-images').getPublicUrl(fileName);
      publicUrl = urlData.publicUrl;

      // 3. SAVE LISTING TO SUPABASE DATABASE
      const { error: dbError } = await supabase.from('farmer_listings').insert([{
        title,
        price: parseFloat(price),
        description,
        location,
        seller_name: sellerName,
        category: selectedCategory,
        image_url: publicUrl,
        created_at: new Date().toISOString()
      }]);

      if (dbError) throw dbError;

      Alert.alert("Posted Successfully!", "Your item is now visible to other farmers.", [{
        text: "Awesome",
        onPress: () => {
          resetForm();
          onClose();
          if(onSuccess) onSuccess(); // Refresh listings
        }
      }]);
    } catch (e) {
      Alert.alert("Error", e.message || "Could not post listing. Try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
        <View style={sellStyles.header}>
          <TouchableOpacity onPress={() => { resetForm(); onClose(); }} style={sellStyles.iconBtn}>
            <ArrowLeft size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={sellStyles.headerTitle}>
            {step === 1 ? "What are you selling?" : step === 2 ? "Upload Product Photo" : "Set Price & Details"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={sellStyles.stepRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={sellStyles.stepWrap}>
              <View style={[sellStyles.stepDot, step >= s && sellStyles.stepDotActive]}>
                <Text style={[sellStyles.stepNum, step >= s && { color: "#fff" }]}>{s}</Text>
              </View>
              {s < 3 && <View style={[sellStyles.stepLine, step > s && sellStyles.stepLineActive]} />}
            </View>
          ))}
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          {step === 1 && (
            <ScrollView contentContainerStyle={sellStyles.catGrid}>
              {OLX_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.label}
                  style={[sellStyles.catCard, selectedCategory === cat.label && sellStyles.catCardSelected]}
                  onPress={() => setSelectedCategory(cat.label)}
                >
                  <View style={{ opacity: selectedCategory === cat.label ? 1 : 0.6 }}>{cat.icon}</View>
                  <Text style={[sellStyles.catLabel, selectedCategory === cat.label && { color: "#fff" }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {step === 2 && (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={sellStyles.photoHint}>Upload a clear photo of what you are selling. Buyers love good pictures!</Text>
              <View style={sellStyles.photoGrid}>
                {images.map((uri, i) => (
                  <View key={i} style={sellStyles.photoThumb}>
                    <Image source={{ uri }} style={{ width: "100%", height: "100%", borderRadius: 16 }} />
                    <TouchableOpacity style={sellStyles.removeBtn} onPress={() => setImages([])}>
                      <X size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length === 0 && (
                  <TouchableOpacity style={sellStyles.addPhotoBtn} onPress={() => Alert.alert("Upload Photo", "Where is your picture?", [{ text: "Open Camera", onPress: () => pickImage(true) }, { text: "Choose from Gallery", onPress: () => pickImage(false) }, { text: "Cancel", style: "cancel" }])}>
                    <Camera size={32} color="#10B981" />
                    <Text style={sellStyles.addPhotoText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}

          {step === 3 && (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={sellStyles.inputLabel}>Ad Title *</Text>
              <TextInput style={sellStyles.input} placeholder="e.g. Fresh Wheat 50kg bag" value={title} onChangeText={setTitle} placeholderTextColor="#94A3B8"/>

              <Text style={sellStyles.inputLabel}>Selling Price (₹) *</Text>
              <TextInput style={sellStyles.input} placeholder="e.g. 450" keyboardType="numeric" value={price} onChangeText={setPrice} placeholderTextColor="#94A3B8"/>

              <Text style={sellStyles.inputLabel}>Description of Item</Text>
              <TextInput style={[sellStyles.input, { height: 100, textAlignVertical: "top" }]} placeholder="Describe the quality, quantity, or condition of your item..." multiline value={description} onChangeText={setDescription} placeholderTextColor="#94A3B8"/>

              <Text style={sellStyles.inputLabel}>Your Name *</Text>
              <TextInput style={sellStyles.input} placeholder="e.g. Ramesh Kumar" value={sellerName} onChangeText={setSellerName} placeholderTextColor="#94A3B8"/>

              <Text style={sellStyles.inputLabel}>City / Location *</Text>
              <TextInput style={sellStyles.input} placeholder="e.g. Nashik, Maharashtra" value={location} onChangeText={setLocation} placeholderTextColor="#94A3B8"/>
            </ScrollView>
          )}
        </KeyboardAvoidingView>

        <View style={sellStyles.footer}>
          {step > 1 && (
            <TouchableOpacity style={sellStyles.backBtn} onPress={() => setStep((s) => s - 1)}>
              <Text style={{ color: "#0F172A", fontWeight: "800" }}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[sellStyles.nextBtn, step === 1 && !selectedCategory && { opacity: 0.5 }]}
            disabled={(step === 1 && !selectedCategory) || posting}
            onPress={() => step < 3 ? setStep((s) => s + 1) : handlePost()}
          >
            {posting ? <ActivityIndicator color="#fff" /> : <Text style={sellStyles.nextBtnText}>{step < 3 ? "Next" : "Post Item For Sale"}</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── MAIN MARKET SCREEN ──────────────────────────────────────────
export default function Market() {
  const router = useRouter();
  const { t } = useTranslation();
  const { addToCart, totalCount } = useCart();
  const insets = useSafeAreaInsets();

  const [marketMode, setMarketMode] = useState('store'); // 'store' | 'olx'
  const [searchQuery, setSearchQuery] = useState("");

  // Store State (Firebase)
  const [storeProducts, setStoreProducts] = useState([]);
  const [storeCat, setStoreCat] = useState(null);
  const [addedId, setAddedId] = useState(null);

  // OLX State (Supabase)
  const [olxListings, setOlxListings] = useState([]);
  const [olxCat, setOlxCat] = useState("All");
  const [sellVisible, setSellVisible] = useState(false);
  const [loadingOLX, setLoadingOLX] = useState(true);

  // Fetch Firebase Store
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        setStoreProducts(querySnapshot.docs.map((doc) => ({
          id: doc.id, name: doc.data().name ?? "Product", price: Number(doc.data().price) || 0,
          image: doc.data().image ?? "", category: doc.data().category ?? "Uncategorized", description: doc.data().description ?? "",
        })));
      } catch (error) { console.log("Firebase Store Error:", error); }
    };
    fetchProducts();
  }, []);

  // Fetch Supabase OLX Listings
  const fetchOLXListings = async () => {
    setLoadingOLX(true);
    try {
      const { data, error } = await supabase
        .from('farmer_listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOlxListings(data || []);
    } catch (e) {
      console.log("Supabase OLX Error:", e);
    } finally {
      setLoadingOLX(false);
    }
  };

  useEffect(() => {
    if (marketMode === 'olx') fetchOLXListings();
  }, [marketMode]);

  // Filters
  const storeFiltered = storeProducts.filter(p =>
    (storeCat ? p.category?.toLowerCase() === storeCat.toLowerCase() : true) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const olxFiltered = olxListings.filter(l =>
    (olxCat !== "All" ? l.category?.toLowerCase() === olxCat.toLowerCase() : true) &&
    (l.title?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddToCart = (item) => {
    addToCart(item);
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 800);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── UNIFIED HEADER ── */}
      <LinearGradient colors={['#064E3B', '#10B981']} style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 40 }]}>
        <View style={styles.topBar}>
          <Text style={styles.headerTitle}>{t('market.shopTitle', 'Agro Market')}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={styles.glassBtn} onPress={() => router.push("/orders")}>
              <Ionicons name="receipt-outline" size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.glassBtn} onPress={() => router.push("/cartAdd")}>
              <Ionicons name="cart-outline" size={22} color="#FFF" />
              {totalCount > 0 && <View style={styles.badge} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.toggleWrap}>
          <TouchableOpacity style={[styles.toggleBtn, marketMode === 'store' && styles.toggleBtnActive]} onPress={() => {setMarketMode('store'); setSearchQuery("");}}>
            <Text style={[styles.toggleText, marketMode === 'store' && styles.toggleTextActive]}>Agro Store</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, marketMode === 'olx' && styles.toggleBtnActive]} onPress={() => {setMarketMode('olx'); setSearchQuery("");}}>
            <Text style={[styles.toggleText, marketMode === 'olx' && styles.toggleTextActive]}>Local OLX</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={18} color="rgba(255,255,255,0.7)" />
          <TextInput
            placeholder={marketMode === 'store' ? "Search seeds, tools..." : "Search local listings..."}
            placeholderTextColor="rgba(255,255,255,0.7)"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}><X size={18} color="rgba(255,255,255,0.7)" /></TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* ── CONDITIONAL BODY ── */}
      {marketMode === 'store' ? (
        <FlatList
          data={storeFiltered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View style={{ marginBottom: 10 }}>
              <View style={styles.categoryWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                  <TouchableOpacity style={styles.catIconBox} onPress={() => setStoreCat(null)} activeOpacity={0.7}>
                    <View style={[styles.catIconCircle, !storeCat && styles.catIconCircleActive]}>
                      <Ionicons name="grid" size={24} color={!storeCat ? "#FFF" : "#064E3B"} />
                    </View>
                    <Text style={[styles.catIconLabel, !storeCat && styles.catIconLabelActive]}>{t('market.all', 'All')}</Text>
                  </TouchableOpacity>
                  {STORE_CATEGORIES.map(cat => (
                    <TouchableOpacity key={cat.id} style={styles.catIconBox} onPress={() => setStoreCat(cat.id)} activeOpacity={0.7}>
                      <View style={[styles.catIconCircle, storeCat === cat.id && styles.catIconCircleActive]}>
                        <Ionicons name={cat.icon} size={24} color={storeCat === cat.id ? "#FFF" : "#064E3B"} />
                      </View>
                      <Text style={[styles.catIconLabel, storeCat === cat.id && styles.catIconLabelActive]}>{t(`market.cat${cat.label}`, cat.label)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <AdBanner />
              <Text style={styles.sectionHeading}>{t('market.newProducts', 'Featured Products')}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: "/productDetail", params: item })} activeOpacity={0.9}>
              <View style={styles.imgWrapper}>
                {item.image ? <Image source={{ uri: item.image }} style={styles.cardImg} resizeMode="cover" /> : <View style={[styles.cardImg, { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }]}><ImageIcon size={32} color="#CBD5E1" /></View>}
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.cardPrice}>₹{item.price.toFixed(2)}</Text>
                <TouchableOpacity style={[styles.addBtn, addedId === item.id && styles.addedBtn]} onPress={() => handleAddToCart(item)} activeOpacity={0.8}>
                  <Text style={[styles.addBtnText, addedId === item.id && styles.addedBtnText]}>{addedId === item.id ? t('market.added', 'Added ✓') : t('market.addToCart', 'Add to Cart')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={olxFiltered}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <View style={{ marginBottom: 10 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 10 }}>
                  <TouchableOpacity style={[olxStyles.catChip, olxCat === "All" && olxStyles.catChipActive]} onPress={() => setOlxCat("All")}>
                    <Search size={14} color={olxCat === "All" ? "#FFF" : "#059669"} />
                    <Text style={[olxStyles.catChipText, olxCat === "All" && { color: "#FFF" }]}>All</Text>
                  </TouchableOpacity>
                  {OLX_CATEGORIES.map((cat) => (
                    <TouchableOpacity key={cat.label} style={[olxStyles.catChip, olxCat === cat.label && olxStyles.catChipActive]} onPress={() => setOlxCat(cat.label)}>
                      {React.cloneElement(cat.icon, { color: olxCat === cat.label ? "#FFF" : "#059669", size: 14 })}
                      <Text style={[olxStyles.catChipText, olxCat === cat.label && { color: "#FFF" }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={[styles.sectionHeading, { marginLeft: 16 }]}>Local Listings</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: "/listingDetail", params: { id: item.id }})} activeOpacity={0.9}>
                <View style={[styles.imgWrapper, { height: 140, padding: 0 }]}>
                  {item.image_url ? <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <View style={{ flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}><ImageIcon size={32} color="#94A3B8" /></View>}
                  <TouchableOpacity style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.9)', padding: 6, borderRadius: 15 }}><Heart size={16} color="#64748B" /></TouchableOpacity>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardPrice}>₹{(item.price || 0).toLocaleString("en-IN")}</Text>
                  <Text style={[styles.cardName, { color: '#475569', fontWeight: '500', marginTop: 4 }]} numberOfLines={2}>{item.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }}>
                    <MapPin size={12} color="#94A3B8" />
                    <Text style={{ fontSize: 11, color: "#94A3B8", fontWeight: '600' }}>{item.location}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              loadingOLX ? <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 50 }} /> :
              <View style={{ alignItems: 'center', marginTop: 50 }}>
                <Leaf size={48} color="#CBD5E1" />
                <Text style={{ marginTop: 10, color: '#64748B', fontWeight: '600' }}>No local listings found.</Text>
              </View>
            }
          />

          <TouchableOpacity style={olxStyles.floatingAddBtn} onPress={() => setSellVisible(true)} activeOpacity={0.9}>
            <LinearGradient colors={['#10B981', '#059669']} style={olxStyles.fabCircle}>
              <Plus size={32} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* SELL MODAL (Trigger success refresh when closed) */}
      <SellModal visible={sellVisible} onClose={() => setSellVisible(false)} onSuccess={fetchOLXListings}/>
    </View>
  );
}

// ── STYLES ──
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingBottom: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 8, shadowColor: "#064E3B", shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, zIndex: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#FFF' },
  glassBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, backgroundColor: '#FDE047', borderRadius: 5, borderWidth: 2, borderColor: '#064E3B' },

  toggleWrap: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', marginHorizontal: 20, borderRadius: 16, padding: 4, marginBottom: 15 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  toggleBtnActive: { backgroundColor: '#FFF', elevation: 2 },
  toggleText: { color: 'rgba(255,255,255,0.8)', fontWeight: '700', fontSize: 14 },
  toggleTextActive: { color: '#064E3B', fontWeight: '900' },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', marginHorizontal: 20, paddingHorizontal: 16, borderRadius: 16, height: 50 },
  searchInput: { flex: 1, marginLeft: 12, color: '#FFF', fontSize: 15, fontWeight: "600" },

  listContent: { paddingHorizontal: 10, paddingTop: 15, paddingBottom: 100 },
  sectionHeading: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginTop: 5, marginBottom: 12, marginLeft: 5, letterSpacing: 0.5 },

  categoryWrapper: { marginTop: 0, marginBottom: 20 },
  categoryScroll: { paddingHorizontal: 5, paddingTop: 5 },
  catIconBox: { alignItems: 'center', marginRight: 20 },
  catIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  catIconCircleActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  catIconLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  catIconLabelActive: { color: '#064E3B', fontWeight: '900' },

  card: { flex: 1, backgroundColor: '#FFF', margin: 6, borderRadius: 24, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: '#F1F5F9' },
  imgWrapper: { padding: 10 },
  cardImg: { width: '100%', height: 130, borderRadius: 16 },
  cardInfo: { paddingHorizontal: 14, paddingBottom: 14 },
  cardName: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 6, lineHeight: 18 },
  cardPrice: { fontSize: 16, fontWeight: '900', color: '#10B981' },
  addBtn: { marginTop: 12, backgroundColor: '#F1F5F9', paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  addedBtn: { backgroundColor: '#059669' },
  addBtnText: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  addedBtnText: { color: "#FFF" }
});

const adStyles = StyleSheet.create({
  wrapper: { marginBottom: 20, marginTop: 5, paddingHorizontal: 5 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginBottom: 12, letterSpacing: 0.5 },
  card: { width: SCREEN_WIDTH * 0.8, height: 160, borderRadius: 24, marginRight: 15, overflow: "hidden", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, elevation: 4 },
  circle: { position: "absolute", width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.06)", top: -40, right: -30 },
  cardContent: { flex: 1, zIndex: 2 },
  badgePill: { alignSelf: "flex-start", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  badgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  cardTitle: { color: "white", fontSize: 18, fontWeight: "900", marginBottom: 4 },
  cardSubtitle: { color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 16, lineHeight: 18, fontWeight: "500" },
  shopBtn: { alignSelf: "flex-start", backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, elevation: 2 },
  shopBtnText: { fontSize: 12, fontWeight: "800", color: "#0F172A" },
  iconBox: { zIndex: 2, marginLeft: 10 },
});

const olxStyles = StyleSheet.create({
  catChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#ECFDF5", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#D1FAE5' },
  catChipActive: { backgroundColor: "#10B981", borderColor: '#10B981' },
  catChipText: { fontSize: 13, color: "#059669", fontWeight: "700", marginLeft: 6 },

  floatingAddBtn: { position: "absolute", bottom: 100, right: 25, elevation: 12, shadowColor: "#10B981", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  fabCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
});

const sellStyles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 20 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: "900", color: "#0F172A" },
  stepRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 20 },
  stepWrap: { flexDirection: "row", alignItems: "center" },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center" },
  stepDotActive: { backgroundColor: "#10B981" },
  stepNum: { fontSize: 14, fontWeight: "800", color: "#94A3B8" },
  stepLine: { width: 40, height: 3, backgroundColor: "#F1F5F9", marginHorizontal: 6, borderRadius: 2 },
  stepLineActive: { backgroundColor: "#10B981" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", padding: 20, gap: 15 },
  catCard: { width: (SCREEN_WIDTH - 55) / 3, aspectRatio: 1, backgroundColor: "#F8FAFC", borderRadius: 20, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  catCardSelected: { backgroundColor: "#10B981", borderColor: "#059669" },
  catLabel: { fontSize: 13, color: "#0F172A", fontWeight: "700", marginTop: 10 },
  photoHint: { color: "#64748B", fontSize: 13, marginBottom: 15, fontWeight: '500' },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  photoThumb: { width: (SCREEN_WIDTH - 64) / 3, aspectRatio: 1, borderRadius: 16, backgroundColor: "#F1F5F9" },
  coverBadge: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(16, 185, 129, 0.9)", padding: 4, alignItems: "center", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  removeBtn: { position: "absolute", top: -5, right: -5, backgroundColor: "#FFF", borderRadius: 12, padding: 2, elevation: 2 },
  addPhotoBtn: { width: (SCREEN_WIDTH - 64) / 3, aspectRatio: 1, borderRadius: 16, borderWidth: 2, borderColor: "#D1FAE5", borderStyle: "dashed", justifyContent: "center", alignItems: "center", backgroundColor: "#ECFDF5" },
  addPhotoText: { color: "#059669", fontSize: 12, marginTop: 6, fontWeight: "700" },
  inputLabel: { fontSize: 13, color: "#64748B", fontWeight: "800", marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 16, padding: 16, fontSize: 16, color: "#0F172A", backgroundColor: "#F8FAFC", fontWeight: '500' },
  footer: { flexDirection: "row", padding: 20, borderTopWidth: 1, borderTopColor: "#F1F5F9", gap: 12, backgroundColor: '#FFF' },
  backBtn: { flex: 1, backgroundColor: "#F1F5F9", borderRadius: 16, alignItems: "center", justifyContent: 'center', height: 56 },
  nextBtn: { flex: 2, backgroundColor: "#10B981", borderRadius: 16, alignItems: "center", justifyContent: 'center', height: 56 },
  nextBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});