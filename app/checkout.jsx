import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Image, StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from "react-i18next";

// Contexts
import { useCart } from "../src/context/CartContext";
import { useUser } from "../src/context/UserContext";

const TAXES = 8;
const DELIVERY = 20;

function StepIndicator({ current }) {
  const { t } = useTranslation();
  const steps = [t('checkout.stepDetails'), t('checkout.stepPayment'), t('checkout.stepPreview')];

  return (
    <View style={stepStyles.row}>
      {steps.map((label, i) => {
        const num = i + 1;
        const isActive = num === current;
        const isDone = num < current;

        return (
          <React.Fragment key={num}>
            <View style={stepStyles.stepWrap}>
              <View style={[stepStyles.circle, (isActive || isDone) && stepStyles.circleActive]}>
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                ) : (
                  <Text style={[stepStyles.circleText, isActive && stepStyles.circleTextActive]}>
                    {num}
                  </Text>
                )}
              </View>
              {isActive && <Text style={stepStyles.label}>{label}</Text>}
            </View>
            {i < steps.length - 1 && (
              <View style={[stepStyles.line, isDone && stepStyles.lineActive]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function StepDetails({ onNext }) {
  const { t } = useTranslation();
  const { profile } = useUser();

  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [mobile, setMobile] = useState(profile?.phone ?? "");
  const [zip, setZip] = useState("");

  const initials = (profile?.fullName ?? "F").substring(0, 2).toUpperCase();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <Text style={styles.sectionLabel}>{t('checkout.orderingFor')}</Text>
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{profile?.fullName ?? t('checkout.farmer')}</Text>
          <Text style={styles.profileSub}>{profile?.taluka ?? ""}</Text>
        </View>
      </View>

      {profile?.selectedCrops && profile.selectedCrops.length > 0 && (
        <View style={styles.farmTag}>
          <Ionicons name="leaf" size={14} color="#059669" style={{ marginRight: 6 }} />
          <Text style={styles.farmTagText}>
            {profile.selectedCrops.join(", ")}
            {profile.farmSize ? `  •  ${profile.farmSize} ${t('checkout.acres')}` : ""}
          </Text>
        </View>
      )}

      <Text style={[styles.sectionLabel, { marginTop: 25 }]}>{t('checkout.fullName')}</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholderTextColor="#94A3B8" />

      <Text style={styles.sectionLabel}>{t('checkout.mobileNumber')}</Text>
      <TextInput style={styles.input} value={mobile} onChangeText={setMobile} keyboardType="phone-pad" placeholderTextColor="#94A3B8" />

      <Text style={styles.sectionLabel}>{t('checkout.zipCode')}</Text>
      <TextInput style={styles.input} value={zip} onChangeText={setZip} keyboardType="numeric" placeholderTextColor="#94A3B8" />

      <TouchableOpacity style={styles.continueBtn} activeOpacity={0.8} onPress={onNext}>
        <Text style={styles.continueBtnText}>{t('checkout.continue')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StepPayment({ onNext, total }) {
  const { t } = useTranslation();
  const { cartItems } = useCart();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <View style={styles.billCard}>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>{t('checkout.items')} ({cartItems.length})</Text>
          <Text style={styles.billValue}>₹ {(total - DELIVERY - TAXES).toFixed(2)}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>{t('checkout.delivery')}</Text>
          <Text style={styles.billValue}>₹ {DELIVERY.toFixed(2)}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>{t('checkout.tax')}</Text>
          <Text style={styles.billValue}>₹ {TAXES.toFixed(2)}</Text>
        </View>

        <View style={styles.billDivider} />

        <View style={styles.billRow}>
          <Text style={styles.totalLabel}>{t('checkout.total')}</Text>
          <Text style={styles.totalValue}>₹ {total.toFixed(2)}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.continueBtn} activeOpacity={0.8} onPress={onNext}>
        <Text style={styles.continueBtnText}>{t('checkout.continue')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StepOrderPreview({ onConfirm }) {
  const { t } = useTranslation();
  const { cartItems } = useCart();
  const { profile } = useUser();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <Text style={styles.sectionLabel}>{t('checkout.stepPreview')}</Text>
      {cartItems.map((item) => (
        <View key={item.id} style={styles.previewRow}>
          <View style={styles.previewImageBox}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <Ionicons name="leaf-outline" size={24} color="#10B981" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.previewName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.previewSeller}>{t('checkout.soldBy')}</Text>
            <Text style={styles.previewPrice}>₹ {item.price.toFixed(2)}</Text>
          </View>
          <View style={styles.qtyPill}>
            <Text style={styles.previewQty}>{item.quantity}x</Text>
          </View>
        </View>
      ))}

      <Text style={[styles.sectionLabel, { marginTop: 10 }]}>{t('checkout.deliveryDetails')}</Text>
      <View style={styles.farmerDetailsBox}>
        {profile ? (
          <>
            <View style={styles.farmerDetailRow}>
              <Text style={styles.farmerDetailLabel}>{t('checkout.name')}</Text>
              <Text style={styles.farmerDetailValue}>{profile.fullName}</Text>
            </View>
            <View style={styles.farmerDetailRow}>
              <Text style={styles.farmerDetailLabel}>{t('checkout.phone')}</Text>
              <Text style={styles.farmerDetailValue}>{profile.phone}</Text>
            </View>
            <View style={[styles.farmerDetailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.farmerDetailLabel}>{t('checkout.location')}</Text>
              <Text style={styles.farmerDetailValue}>{profile.taluka}{profile.location ? `, ${profile.location}` : ''}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.farmerDetailsText}>{t('checkout.noProfileInfo')}</Text>
        )}
      </View>

      <TouchableOpacity style={styles.confirmBtn} activeOpacity={0.8} onPress={onConfirm}>
        <Text style={styles.confirmBtnText}>{t('checkout.requestConfirmation')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SuccessScreen({ onViewOrder }) {
  const { t } = useTranslation();
  const { profile } = useUser();

  return (
    <View style={styles.successBox}>
      <LinearGradient colors={['#D1FAE5', '#A7F3D0']} style={styles.successCircle}>
        <Ionicons name="checkmark-done" size={48} color="#059669" />
      </LinearGradient>

      {profile?.fullName ? (
        <Text style={styles.successGreeting}>{t('checkout.thankYou')}, {profile.fullName.split(" ")[0]}!</Text>
      ) : null}

      <Text style={styles.successTextBold}>{t('checkout.successfully')}</Text>
      <Text style={styles.successText}>{t('checkout.requestCreated')}</Text>

      <TouchableOpacity style={styles.viewOrderBtn} activeOpacity={0.8} onPress={onViewOrder}>
        <Text style={styles.viewOrderText}>{t('checkout.viewOrder')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.whatsappBtn} activeOpacity={0.8}>
        <Ionicons name="logo-whatsapp" size={18} color="#059669" style={{ marginRight: 8 }} />
        <Text style={styles.whatsappText}>{t('checkout.shareWhatsapp')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function Checkout() {
  const router = useRouter();
  const { t } = useTranslation();
  const { cartItems } = useCart();
  const [step, setStep] = useState(1);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + TAXES + DELIVERY;

  // FIXED: Now properly routes to the nested market tab
  const handleBack = () => {
    if (step === 4) {
      router.replace('/drawer/market');
    } else if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#064E3B', '#10B981']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>

            <TouchableOpacity onPress={handleBack} style={styles.glassBtn}>
              <Ionicons name={step === 4 ? "close" : "chevron-back"} size={22} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {step < 4 ? t('checkout.checkoutTitle') : "Order Complete"}
            </Text>

            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {step < 4 && (
        <View style={styles.stepIndicatorWrap}>
          <StepIndicator current={step} />
        </View>
      )}

      {step === 1 && <StepDetails onNext={() => setStep(2)} />}
      {step === 2 && <StepPayment onNext={() => setStep(3)} total={total} />}
      {step === 3 && <StepOrderPreview onConfirm={() => setStep(4)} />}
      {step === 4 && <SuccessScreen onViewOrder={() => router.push("/orders")} />}
    </View>
  );
}

// ── STYLES ──
const stepStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  stepWrap: { alignItems: "center", flexDirection: "row", gap: 8 },
  circle: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center" },
  circleActive: { backgroundColor: "#10B981" },
  circleText: { fontSize: 12, color: "#64748B", fontWeight: "700" },
  circleTextActive: { color: "#FFF" },
  label: { fontSize: 13, color: "#0F172A", fontWeight: "700" },
  line: { width: 30, height: 2, backgroundColor: "#E2E8F0", marginHorizontal: 8, borderRadius: 1 },
  lineActive: { backgroundColor: "#10B981" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { paddingBottom: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 10 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFF" },
  glassBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },

  stepIndicatorWrap: { backgroundColor: "#FFF", marginHorizontal: 20, marginTop: -25, borderRadius: 20, paddingVertical: 18, elevation: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  stepContent: { padding: 20, paddingBottom: 40 },

  sectionLabel: { fontSize: 12, color: "#64748B", marginBottom: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },

  profileCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 20, padding: 16, marginBottom: 10, elevation: 2 },
  profileAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FEF3C7", justifyContent: "center", alignItems: "center", marginRight: 15 },
  profileAvatarText: { fontWeight: "800", fontSize: 16, color: "#D97706" },
  profileName: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  profileSub: { fontSize: 13, color: "#64748B", marginTop: 2, fontWeight: "500" },

  farmTag: { flexDirection: "row", alignItems: "center", backgroundColor: "#ECFDF5", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, alignSelf: "flex-start" },
  farmTagText: { fontSize: 12, color: "#059669", fontWeight: "700" },

  input: { backgroundColor: "#FFF", borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, fontSize: 15, color: "#0F172A", marginBottom: 16, fontWeight: "600", elevation: 1 },

  continueBtn: { backgroundColor: "#10B981", borderRadius: 20, paddingVertical: 18, alignItems: "center", marginTop: 20, elevation: 4, shadowColor: "#10B981", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  continueBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },

  billCard: { backgroundColor: "#FFF", borderRadius: 24, padding: 24, elevation: 2 },
  billRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  billLabel: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  billValue: { fontSize: 14, color: "#1E293B", fontWeight: "700" },
  billDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 16 },
  totalLabel: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  totalValue: { fontSize: 20, fontWeight: "900", color: "#10B981" },

  previewRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 20, padding: 16, marginBottom: 12, elevation: 1 },
  previewImageBox: { width: 64, height: 64, borderRadius: 12, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", overflow: "hidden", marginRight: 15 },
  previewImage: { width: "100%", height: "100%" },
  previewName: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  previewSeller: { fontSize: 12, color: "#94A3B8", marginTop: 2, fontWeight: "500" },
  previewPrice: { fontSize: 16, fontWeight: "800", color: "#10B981", marginTop: 6 },
  qtyPill: { backgroundColor: "#F1F5F9", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  previewQty: { fontSize: 13, fontWeight: "800", color: "#475569" },

  farmerDetailsBox: { backgroundColor: "#FFF", borderRadius: 20, padding: 20, elevation: 1 },
  farmerDetailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  farmerDetailLabel: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  farmerDetailValue: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  farmerDetailsText: { fontSize: 14, color: "#94A3B8", textAlign: "center", fontStyle: "italic" },

  confirmBtn: { backgroundColor: "#064E3B", borderRadius: 20, paddingVertical: 18, alignItems: "center", marginTop: 30, elevation: 4 },
  confirmBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },

  successBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30, backgroundColor: "#F9FAFB" },
  successCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", marginBottom: 24, elevation: 8, shadowColor: "#10B981", shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 } },
  successGreeting: { fontSize: 18, fontWeight: "700", color: "#64748B", marginBottom: 8 },
  successTextBold: { fontSize: 28, fontWeight: "900", color: "#0F172A", marginBottom: 8 },
  successText: { fontSize: 15, color: "#64748B", textAlign: "center", marginBottom: 40, fontWeight: "500" },
  viewOrderBtn: { backgroundColor: "#10B981", borderRadius: 20, width: "100%", paddingVertical: 18, alignItems: "center", marginBottom: 16 },
  viewOrderText: { color: "#FFF", fontWeight: "800", fontSize: 16 },
  whatsappBtn: { backgroundColor: "#ECFDF5", borderRadius: 20, width: "100%", paddingVertical: 18, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  whatsappText: { color: "#059669", fontWeight: "800", fontSize: 16 },
});