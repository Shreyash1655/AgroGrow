import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { useUser } from "../src/context/UserContext";

const SAMPLE_ORDERS = [
  { id: "s1", status: "placed", estimatedDate: "20 Jun, 2026", productName: "Matcha 500 Cotton Seeds", image: "", quantity: 1, price: 3280, tab: "upcoming" },
  { id: "s2", status: "out_for_delivery", estimatedDate: "18 Jun, 2026", productName: "Green Bees Cotton Fresh Seeds", image: "", quantity: 1, price: 2790, tab: "upcoming" },
  { id: "s3", status: "placed", estimatedDate: "20 Jun, 2026", productName: "Coconut tree seeds premium brand", image: "", quantity: 2, price: 2295, tab: "upcoming" },
  { id: "s4", status: "delivered", estimatedDate: "10 May, 2026", productName: "Premium Organic Fertilizer 40kg", image: "", quantity: 1, price: 13500, tab: "past" },
  { id: "s5", status: "delivered", estimatedDate: "02 Apr, 2026", productName: "Neem Pesticide 5L", image: "", quantity: 3, price: 4200, tab: "past" },
];

export default function OrdersScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile } = useUser();

  const [activeTab, setActiveTab] = useState("upcoming");
  const [allOrders, setAllOrders] = useState(SAMPLE_ORDERS);

  useEffect(() => {
    const fetchNewOrders = async () => {
      try {
        const storedOrdersStr = await AsyncStorage.getItem("my_new_orders");
        if (storedOrdersStr) {
          const storedOrders = JSON.parse(storedOrdersStr);
          setAllOrders([...storedOrders, ...SAMPLE_ORDERS]);
        }
      } catch (error) {
        console.log("Error loading orders:", error);
      }
    };

    fetchNewOrders();
  }, []);

  const filtered = allOrders.filter((o) => o.tab === activeTab);

  const STATUS_META = {
    placed: { label: t('orders.placed', 'Order Placed'), icon: "cube", color: "#10B981", bg: "#ECFDF5" },
    out_for_delivery: { label: t('orders.out_for_delivery', 'Out for Delivery'), icon: "bicycle", color: "#F59E0B", bg: "#FEF3C7" },
    delivered: { label: t('orders.delivered', 'Delivered'), icon: "checkmark-circle", color: "#0EA5E9", bg: "#E0F2FE" },
    cancelled: { label: t('orders.cancelled', 'Cancelled'), icon: "close-circle", color: "#EF4444", bg: "#FEE2E2" },
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={['#064E3B', '#10B981']} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.glassBtn}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('orders.title', 'My Orders')}</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tabBtn, activeTab === "upcoming" && styles.tabBtnActive]} onPress={() => setActiveTab("upcoming")}>
              <Text style={[styles.tabText, activeTab === "upcoming" && styles.tabTextActive]}>{t('orders.upcoming', 'Upcoming')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, activeTab === "past" && styles.tabBtnActive]} onPress={() => setActiveTab("past")}>
              <Text style={[styles.tabText, activeTab === "past" && styles.tabTextActive]}>{t('orders.past', 'Past Orders')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="receipt-outline" size={40} color="#10B981" />
            </View>
            <Text style={styles.emptyText}>{t('orders.noOrders', { tab: activeTab === 'upcoming' ? t('orders.upcoming') : t('orders.past') })}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = STATUS_META[item.status] || STATUS_META.placed;
          return (
            <View style={styles.orderCard}>
              <View style={styles.statusRow}>
                <View style={[styles.statusIconBox, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={16} color={meta.color} />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>

                  {/* ✨ BEAUTIFIED DATE ROW ✨ */}
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
                    <Text style={styles.estimatedDate}>
                      {activeTab === "past" ? "Delivered" : "Est. Delivery"} <Text style={{color: '#CBD5E1'}}>•</Text> {item.estimatedDate}
                    </Text>
                  </View>

                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>

              <View style={styles.divider} />

              <View style={styles.productRow}>
                <View style={styles.imageBox}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.thumb} resizeMode="cover" />
                  ) : (
                    <Ionicons name="leaf" size={24} color="#A7F3D0" />
                  )}
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{item.productName}</Text>
                  <View style={styles.detailsRow}>
                    <View style={styles.detailPill}>
                      <Text style={styles.detailLabel}>{t('orders.qty', 'Qty')}: </Text>
                      <Text style={styles.detailValue}>{String(item.quantity).padStart(2, "0")}</Text>
                    </View>
                    <View style={[styles.detailPill, { backgroundColor: '#F8FAFC' }]}>
                      <Text style={styles.detailLabel}>Total: </Text>
                      <Text style={[styles.detailValue, { color: '#0F172A' }]}>₹{item.price.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  header: { paddingBottom: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 10 },
  glassBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "800" },
  tabContainer: { flexDirection: "row", backgroundColor: "rgba(0,0,0,0.15)", marginHorizontal: 20, marginTop: 24, borderRadius: 16, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 12 },
  tabBtnActive: { backgroundColor: "#FFF", elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  tabText: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "800", letterSpacing: 1 },
  tabTextActive: { color: "#064E3B" },
  list: { padding: 20, paddingBottom: 40 },
  emptyBox: { alignItems: "center", marginTop: 80, gap: 16 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#ECFDF5", justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#64748B", fontSize: 16, fontWeight: "600" },
  orderCard: { backgroundColor: "#FFF", borderRadius: 24, padding: 20, marginBottom: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },

  statusRow: { flexDirection: "row", alignItems: "center" },
  statusIconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  statusLabel: { fontSize: 15, fontWeight: "800" },

  // ✨ New Date Styling ✨
  dateRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 5 },
  estimatedDate: { fontSize: 12, color: "#64748B", fontWeight: "600" },

  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 16 },
  productRow: { flexDirection: "row", alignItems: "center" },
  imageBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", marginRight: 16, overflow: "hidden" },
  thumb: { width: "100%", height: "100%" },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 10, lineHeight: 20 },
  detailsRow: { flexDirection: "row", gap: 8 },
  detailPill: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  detailLabel: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  detailValue: { fontSize: 13, fontWeight: "800", color: "#10B981" },
});