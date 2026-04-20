import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions, Image, ScrollView, StyleSheet, Text,
  TouchableOpacity, View, StatusBar
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from "react-i18next";
import {
  ChevronLeft, Heart, ShoppingCart, Minus, Plus,
  CheckCircle2, Sparkles, Star, Leaf
} from "lucide-react-native";

import { useCart } from "../src/context/CartContext";
import { useUser } from "../src/context/UserContext";

const { width } = Dimensions.get("window");
const STARS = 4;
const REVIEW_COUNT = 253;

export default function ProductDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { addToCart, totalCount } = useCart();
  const { profile } = useUser();
  const params = useLocalSearchParams();

  const price = parseFloat(params.price ?? "0");
  const originalPrice = Math.round(price * 1.15);
  const incentiveAmount = Math.round(price * 0.37);

  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [addedFlash, setAddedFlash] = useState(false);

  const PRODUCT_FEATURES = t('productDetail.features', { returnObjects: true }) || [
    "Higher Yield", "Soil Health", "Strong Roots", "Better Growth", "Eco Friendly", "100% Organic"
  ];

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      addToCart({ id: params.id ?? Date.now().toString(), name: params.name ?? "", price, image: params.image ?? "" });
    }
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 900);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floating Glass Navigation */}
      <View style={styles.floatingNavContainer}>
        {/* Subtle gradient to ensure buttons are visible over light images */}
        <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.floatingNav} edges={['top']}>
          <TouchableOpacity onPress={() => router.back()} style={styles.glassBtn} activeOpacity={0.8}>
            <ChevronLeft size={24} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.navRight}>
            <TouchableOpacity style={styles.glassBtn} onPress={() => setWishlisted(!wishlisted)} activeOpacity={0.8}>
              <Heart size={22} color={wishlisted ? "#EF4444" : "#0F172A"} fill={wishlisted ? "#EF4444" : "transparent"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.glassBtn} onPress={() => router.push("/cartAdd")} activeOpacity={0.8}>
              <ShoppingCart size={22} color="#0F172A" />
              {totalCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Edge-to-Edge Image Header */}
        <View style={styles.heroBox}>
          {params.image ? (
            <Image source={{ uri: params.image }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Leaf size={60} color="#A7F3D0" />
            </View>
          )}
        </View>

        <View style={styles.contentSheet}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              {params.category ? (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{params.category.toUpperCase()}</Text>
                </View>
              ) : null}
              <Text style={styles.productName}>{params.name || "Premium Agri Product"}</Text>
            </View>
          </View>

          <View style={styles.ratingRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} color="#F59E0B" fill={i < STARS ? "#F59E0B" : "transparent"} style={{ marginRight: 4 }} />
            ))}
            <Text style={styles.reviewCount}>{REVIEW_COUNT} Reviews</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.mainPrice}>₹{price.toFixed(2)}</Text>
            <Text style={styles.strikePrice}>₹{originalPrice.toFixed(0)}</Text>
            <View style={styles.incentivePill}>
              <Sparkles size={14} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={styles.incentiveText}>{t('productDetail.incentive', 'Save')} ₹{incentiveAmount}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.qtyBox}>
            <Text style={styles.qtyLabel}>{t('productDetail.qty', 'Select Quantity')}</Text>
            <View style={styles.qtyControls}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))} activeOpacity={0.7}>
                <Minus size={20} color="#0F172A" />
              </TouchableOpacity>
              <View style={styles.qtyValueBox}>
                <Text style={styles.qtyValue}>{qty}</Text>
              </View>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => q + 1)} activeOpacity={0.7}>
                <Plus size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionLabel}>{t('productDetail.about', 'Product Details')}</Text>
          <Text style={styles.description}>
            {params.description && params.description.trim().length > 0
              ? params.description
              : t('productDetail.defaultDesc', 'Premium agricultural input designed to maximize your farm yield while maintaining soil health and sustainability.')}
          </Text>

          <Text style={styles.sectionLabel}>{t('productDetail.featuresHeading', 'Key Benefits')}</Text>
          <View style={styles.featureGrid}>
            {PRODUCT_FEATURES.map((feat, i) => (
              <View key={i} style={styles.featureRow}>
                <CheckCircle2 size={18} color="#10B981" />
                <Text style={styles.featureText}>{feat}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar with Safe Area Padding */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
        <TouchableOpacity style={[styles.addBtn, addedFlash && styles.addBtnFlash]} onPress={handleAddToCart} activeOpacity={0.8}>
          <Text style={[styles.addBtnText, addedFlash && styles.addBtnTextFlash]}>
            {addedFlash ? t('productDetail.added', 'Added!') : t('productDetail.addToCart', 'Add to Cart')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buyBtn} activeOpacity={0.8} onPress={handleBuyNow}>
          <LinearGradient colors={['#064E3B', '#10B981']} style={styles.buyBtnGradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
            <Text style={styles.buyBtnText}>{t('productDetail.buyNow', 'Buy Now')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },

  floatingNavContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  floatingNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  glassBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  navRight: { flexDirection: 'row', gap: 12 },
  badge: { position: 'absolute', top: -2, right: -4, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  scrollContent: { paddingBottom: 120 }, // Leaves room for the bottom bar
  heroBox: { width, height: 380, backgroundColor: "#F8FAFC" },
  heroImage: { width: "100%", height: "100%" },
  heroPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#ECFDF5' },

  contentSheet: { backgroundColor: "#FFF", borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -36, padding: 24, minHeight: 500, elevation: 10, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: -5 } },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  categoryPill: { alignSelf: "flex-start", backgroundColor: "#ECFDF5", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 12 },
  categoryPillText: { color: "#059669", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  productName: { fontSize: 26, fontWeight: "900", color: "#0F172A", lineHeight: 34, letterSpacing: -0.5 },

  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  reviewCount: { fontSize: 14, color: "#64748B", marginLeft: 8, fontWeight: "700" },

  priceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 24, flexWrap: "wrap", gap: 10 },
  mainPrice: { fontSize: 34, fontWeight: "900", color: "#10B981", lineHeight: 34, letterSpacing: -1 },
  strikePrice: { fontSize: 18, color: "#94A3B8", textDecorationLine: "line-through", marginBottom: 4, fontWeight: "600" },
  incentivePill: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginLeft: 'auto', borderWidth: 1, borderColor: '#FDE68A' },
  incentiveText: { fontSize: 13, color: "#B45309", fontWeight: "800" },

  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 24 },

  qtyBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28, backgroundColor: "#F8FAFC", padding: 14, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  qtyLabel: { fontSize: 15, color: "#0F172A", fontWeight: "800", marginLeft: 4 },
  qtyControls: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  qtyBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  qtyValueBox: { width: 40, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontSize: 18, fontWeight: "900", color: "#0F172A" },

  sectionLabel: { fontSize: 14, color: "#64748B", fontWeight: "800", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1.5 },
  description: { fontSize: 16, color: "#475569", lineHeight: 26, marginBottom: 32, fontWeight: "500" },

  // Premium 2-Column Feature Grid
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  featureRow: { flexDirection: "row", alignItems: "center", width: '48%', backgroundColor: "#F8FAFC", padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  featureText: { fontSize: 14, color: "#1E293B", fontWeight: "700", marginLeft: 10 },

  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", paddingHorizontal: 20, paddingTop: 16, gap: 12, backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: '#F1F5F9', elevation: 20, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: -5 } },
  addBtn: { flex: 1, backgroundColor: "#F1F5F9", borderRadius: 20, justifyContent: "center", alignItems: "center", height: 60, borderWidth: 2, borderColor: "transparent" },
  addBtnFlash: { backgroundColor: "#ECFDF5", borderColor: "#10B981" },
  addBtnText: { color: "#0F172A", fontWeight: "800", fontSize: 16 },
  addBtnTextFlash: { color: "#059669" },

  buyBtn: { flex: 1.5, borderRadius: 20, overflow: "hidden", height: 60, elevation: 4, shadowColor: "#10B981", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  buyBtnGradient: { flex: 1, justifyContent: "center", alignItems: "center" },
  buyBtnText: { color: "#FFF", fontWeight: "900", fontSize: 16, letterSpacing: 0.5 },
});