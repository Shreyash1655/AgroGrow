import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from "react-i18next";

import { useCart } from "../src/context/CartContext";

const TAXES = 8;
const DELIVERY = 20;

export default function CartAdd() {
  const router = useRouter();
  const { t } = useTranslation();
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const amountToPay = subtotal > 0 ? subtotal + TAXES + DELIVERY : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient colors={['#064E3B', '#10B981']} style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.glassBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('cart.myCart')}</Text>
          <View style={{ width: 44 }} />
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="cart-outline" size={48} color="#10B981" />
            </View>
            <Text style={styles.emptyText}>{t('cart.emptyCart')}</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={styles.shopBtnText}>{t('cart.continueShopping')}</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cartRow}>
            <View style={styles.imageBox}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.productImg} resizeMode="cover" />
              ) : (
                <Ionicons name="leaf-outline" size={24} color="#10B981" />
              )}
            </View>

            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>

              <View style={styles.qtyRow}>
                <View style={styles.qtyControls}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, -1)}>
                    <Ionicons name="remove" size={16} color="#0F172A" />
                  </TouchableOpacity>
                  <Text style={styles.qtyCount}>{String(item.quantity).padStart(2, "0")}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, 1)}>
                    <Ionicons name="add" size={16} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          cartItems.length > 0 ? (
            <View style={styles.footerWrap}>
              <Text style={styles.sectionLabel}>Order Summary</Text>
              <View style={styles.totalsBox}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t('cart.subTotal')}</Text>
                  <Text style={styles.totalValue}>₹{subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t('cart.taxes')}</Text>
                  <Text style={styles.totalValue}>₹{TAXES.toFixed(2)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t('cart.deliveryCharges')}</Text>
                  <Text style={styles.totalValue}>₹{DELIVERY.toFixed(2)}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                  <Text style={styles.amountLabel}>{t('cart.amountToPay')}</Text>
                  <Text style={styles.amountValue}>₹{amountToPay.toFixed(2)}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.checkoutBtn} activeOpacity={0.85} onPress={() => router.push("/checkout")}>
                <Text style={styles.checkoutText}>{t('cart.checkout')}</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { paddingBottom: 25, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 8, shadowColor: "#064E3B", shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  headerContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 15 },
  glassBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "white", fontSize: 20, fontWeight: "800" },
  listContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  emptyBox: { alignItems: "center", marginTop: 100, gap: 16 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#ECFDF5", justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#64748B", fontSize: 16, fontWeight: "600" },
  shopBtn: { marginTop: 10, backgroundColor: "#064E3B", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, elevation: 2 },
  shopBtnText: { color: "white", fontWeight: "800", fontSize: 15 },
  cartRow: { flexDirection: "row", backgroundColor: "#FFF", borderRadius: 24, padding: 16, marginBottom: 16, alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  imageBox: { width: 80, height: 80, borderRadius: 16, overflow: "hidden", marginRight: 16, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center" },
  productImg: { width: "100%", height: "100%" },
  itemInfo: { flex: 1, justifyContent: "space-between" },
  itemName: { fontSize: 15, fontWeight: "800", color: "#0F172A", marginBottom: 6, lineHeight: 20 },
  itemPrice: { fontSize: 16, fontWeight: "900", color: "#10B981", marginBottom: 12 },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qtyControls: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 12, padding: 4 },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#FFF", justifyContent: "center", alignItems: "center", elevation: 1 },
  qtyCount: { fontSize: 14, fontWeight: "800", color: "#0F172A", width: 36, textAlign: "center" },
  deleteBtn: { backgroundColor: "#FEF2F2", padding: 10, borderRadius: 12 },
  footerWrap: { marginTop: 10 },
  sectionLabel: { fontSize: 14, fontWeight: "800", color: "#0F172A", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1, marginLeft: 4 },
  totalsBox: { backgroundColor: "#FFF", borderRadius: 24, padding: 24, marginBottom: 24, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  totalLabel: { fontSize: 14, color: "#64748B", fontWeight: "600" },
  totalValue: { fontSize: 14, fontWeight: "800", color: "#1E293B" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 16 },
  amountLabel: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  amountValue: { fontSize: 22, fontWeight: "900", color: "#10B981" },
  checkoutBtn: { flexDirection: "row", backgroundColor: "#064E3B", borderRadius: 20, paddingVertical: 18, alignItems: "center", justifyContent: "center", elevation: 4, shadowColor: "#064E3B", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  checkoutText: { color: "white", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
});