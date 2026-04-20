import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList,
  ActivityIndicator, StyleSheet, Alert, StatusBar, KeyboardAvoidingView, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft, MapPin, Landmark, Banknote, FileText,
  CheckCircle, Star, Search, ArrowLeft, CheckCircle2,
  FileCheck
} from "lucide-react-native";
import { router } from "expo-router";

// ⚠️ REPLACE THIS WITH YOUR LIVE RENDER URL
const API_BASE = "https://agrogrow-schemes-api.onrender.com";
const CACHE_KEY = "agrogrow_schemes_cache";

// ── Colors ───────────────────────────────────────────────────
const Colors = {
  primary: "#064E3B",
  accent: "#10B981",
  bg: "#F4F7F6",
  white: "#FFFFFF",
  card: "#FFFFFF",
  textMain: "#0F172A",
  textSub: "#64748B",
  border: "#E2E8F0",
  gold: "#F59E0B",
  goldLight: "#FEF3C7",
  greenLight: "#ECFDF5",
};

export default function SchemesScreen() {
  const [tab, setTab] = useState("browse");
  const [schemes, setSchemes] = useState([]);
  const [filteredSchemes, setFilteredSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  // Eligibility Form State
  const [formState, setFormState] = useState("Goa");
  const [formLand, setFormLand] = useState("");
  const [formCategory, setFormCategory] = useState("general");
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchSchemes();
  }, []);

  useEffect(() => {
    let result = [...schemes];
    if (selectedCategory !== "all") {
      result = result.filter((s) => s.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
    }
    setFilteredSchemes(result);
  }, [schemes, selectedCategory, searchQuery]);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/schemes`);
      const data = await res.json();
      if (data.success) {
        setSchemes(data.schemes);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data.schemes));
      }
    } catch (err) {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) setSchemes(JSON.parse(cached));
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    if (!formState || !formLand) {
      return Alert.alert("Missing Info", "Please enter your state and land size");
    }
    setChecking(true);
    try {
      const res = await fetch(`${API_BASE}/check-eligibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: formState, landSize: parseFloat(formLand), category: formCategory }),
      });
      const data = await res.json();
      setEligibilityResult(data);
    } catch (err) {
      Alert.alert("Error", "Could not reach server. Check internet connection.");
    } finally {
      setChecking(false);
    }
  };

  const SchemeCard = ({ scheme, isTop = false, reasons = [] }) => {
    const isExpanded = expandedId === scheme.id;
    return (
      <View style={[styles.card, isTop && styles.cardTop]}>
        {isTop && (
          <View style={styles.topBadge}>
            <Star size={12} color={Colors.white} fill={Colors.white} />
            <Text style={styles.topBadgeText}>TOP MATCH</Text>
          </View>
        )}

        <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : scheme.id)} activeOpacity={0.7}>
          <View style={styles.cardHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{scheme.category.replace('_', ' ')}</Text>
            </View>
            <View style={styles.stateBadgeRow}>
              {scheme.state === "All" ? (
                <Landmark size={14} color={Colors.textSub} />
              ) : (
                <MapPin size={14} color={Colors.textSub} />
              )}
              <Text style={styles.stateBadgeText}>
                {scheme.state === "All" ? "Central" : scheme.state}
              </Text>
            </View>
          </View>

          <Text style={styles.schemeName}>{scheme.name}</Text>
          <Text style={styles.schemeDesc} numberOfLines={isExpanded ? 10 : 2}>{scheme.description}</Text>

          <View style={styles.benefitRow}>
            <Banknote size={18} color="#059669" />
            <Text style={styles.benefitText} numberOfLines={isExpanded ? 10 : 1}>{scheme.benefit}</Text>
          </View>
        </TouchableOpacity>

        {reasons.length > 0 && (
          <View style={styles.reasonsBox}>
            <Text style={styles.reasonsTitle}>Eligibility Confirmed:</Text>
            {reasons.map((r, i) => (
              <View key={i} style={styles.reasonRow}>
                <CheckCircle2 size={14} color="#B45309" />
                <Text style={styles.reasonText}>{r.replace('✅ ', '')}</Text>
              </View>
            ))}
          </View>
        )}

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.sectionHeaderRow}>
              <FileText size={16} color={Colors.textMain} />
              <Text style={styles.sectionTitle}>Documents Needed</Text>
            </View>
            {scheme.documents.map((doc, i) => (
              <View key={i} style={styles.listItemRow}>
                <View style={styles.listDot} />
                <Text style={styles.bulletItem}>{doc}</Text>
              </View>
            ))}

            <View style={[styles.sectionHeaderRow, { marginTop: 16 }]}>
              <FileCheck size={16} color={Colors.textMain} />
              <Text style={styles.sectionTitle}>How to Apply</Text>
            </View>
            {(scheme.applySteps || []).map((step, i) => (
              <View key={i} style={styles.listItemRow}>
                <View style={styles.listNumberBox}>
                  <Text style={styles.listNumber}>{i + 1}</Text>
                </View>
                <Text style={styles.bulletItem}>{step}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Premium Header */}
      <LinearGradient colors={['#022C22', '#064E3B', '#10B981']} style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft color={Colors.white} size={28} />
          </TouchableOpacity>
          <View style={{marginLeft: 15}}>
              <Text style={styles.headerTitle}>AgroGROW Schemes</Text>
              <Text style={styles.headerSubtitle}>Discover your subsidies</Text>
          </View>
        </View>

        {/* Tabs inside Header for Premium Look */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === "browse" && styles.tabActive]} onPress={() => setTab("browse")}>
            <Text style={[styles.tabText, tab === "browse" && styles.tabTextActive]}>Directory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === "check" && styles.tabActive]} onPress={() => setTab("check")}>
            <Text style={[styles.tabText, tab === "check" && styles.tabTextActive]}>Check Eligibility</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        {tab === "browse" ? (
          <View style={{ flex: 1 }}>
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <Search size={20} color={Colors.textSub} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search schemes..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor={Colors.textSub}
                />
              </View>
            </View>
            {loading ? (
              <ActivityIndicator size="large" color={Colors.accent} style={{marginTop: 50}} />
            ) : (
              <FlatList
                data={filteredSchemes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <SchemeCard scheme={item} />}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.eligibilityContainer} showsVerticalScrollIndicator={false}>
              {!eligibilityResult ? (
                <View style={styles.formCard}>
                  <View style={styles.formHeader}>
                    <CheckCircle size={28} color={Colors.accent} />
                    <Text style={styles.formTitle}>Find Your Matches</Text>
                  </View>
                  <Text style={styles.formSub}>Enter your details to discover government schemes tailored for you.</Text>

                  <Text style={styles.label}>Your State</Text>
                  <View style={styles.inputWrapper}>
                    <MapPin size={20} color={Colors.textSub} />
                    <TextInput style={styles.inputField} placeholder="e.g. Goa" value={formState} onChangeText={setFormState} placeholderTextColor={Colors.textSub}/>
                  </View>

                  <Text style={styles.label}>Land Size (Acres/Hectares)</Text>
                  <View style={styles.inputWrapper}>
                    <Landmark size={20} color={Colors.textSub} />
                    <TextInput style={styles.inputField} placeholder="e.g. 2.5" value={formLand} onChangeText={setFormLand} keyboardType="decimal-pad" placeholderTextColor={Colors.textSub}/>
                  </View>

                  <TouchableOpacity style={styles.submitBtn} onPress={checkEligibility} disabled={checking} activeOpacity={0.8}>
                    <LinearGradient colors={['#10B981', '#059669']} style={styles.btnGrad}>
                      {checking ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Analyze Eligibility</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <LinearGradient colors={['#064E3B', '#10B981']} style={styles.summaryBanner}>
                    <Text style={styles.summaryCount}>{eligibilityResult.summary?.totalMatched || 0}</Text>
                    <Text style={styles.summaryLabel}>Schemes Found</Text>
                  </LinearGradient>

                  <TouchableOpacity style={styles.resetBtn} onPress={() => setEligibilityResult(null)}>
                    <ArrowLeft size={18} color={Colors.textMain} />
                    <Text style={styles.resetBtnText}>Back to Form</Text>
                  </TouchableOpacity>

                  {eligibilityResult.schemes?.map((scheme, idx) => (
                    <SchemeCard key={scheme.id} scheme={scheme} isTop={idx < 3} reasons={scheme.eligibilityReasons || []} />
                  ))}
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primary },
  header: { paddingTop: 15, paddingBottom: 0, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  headerTopRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: "900", color: Colors.white, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: "#D1FAE5", marginTop: 2, fontWeight: '500' },

  tabs: { flexDirection: "row", marginHorizontal: 20, marginBottom: -1 }, // -1 connects tab bottom to the list view
  tab: { flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: Colors.accent },
  tabText: { color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: "600" },
  tabTextActive: { color: Colors.white, fontWeight: "800" },

  searchContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: Colors.bg },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 16, paddingHorizontal: 16, height: 54, borderWidth: 1, borderColor: Colors.border, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 5 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: Colors.textMain, fontWeight: '500' },

  card: { backgroundColor: Colors.card, borderRadius: 24, marginBottom: 16, padding: 20, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, borderWidth: 1, borderColor: Colors.border },
  cardTop: { borderColor: Colors.gold, borderWidth: 2 },
  topBadge: { backgroundColor: Colors.gold, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  topBadgeText: { color: Colors.white, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },

  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  categoryBadge: { backgroundColor: Colors.greenLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  categoryText: { fontSize: 10, fontWeight: "800", color: Colors.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
  stateBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stateBadgeText: { fontSize: 13, color: Colors.textSub, fontWeight: '600' },

  schemeName: { fontSize: 18, fontWeight: "900", color: Colors.textMain, marginBottom: 6, letterSpacing: -0.3 },
  schemeDesc: { fontSize: 14, color: Colors.textSub, lineHeight: 22, marginBottom: 16 },

  benefitRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#F0FDF4", padding: 12, borderRadius: 12, gap: 8 },
  benefitText: { fontSize: 14, color: "#065F46", fontWeight: "700", flex: 1 },

  reasonsBox: { marginTop: 16, backgroundColor: Colors.goldLight, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#FDE68A" },
  reasonsTitle: { fontSize: 13, fontWeight: "800", color: "#B45309", marginBottom: 8 },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  reasonText: { fontSize: 13, color: "#92400E", flex: 1, lineHeight: 18, fontWeight: '500' },

  expandedContent: { marginTop: 20, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: Colors.textMain },
  listItemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, paddingRight: 10 },
  listDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent, marginTop: 8, marginRight: 10 },
  listNumberBox: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center', marginTop: 1, marginRight: 10 },
  listNumber: { fontSize: 10, fontWeight: '800', color: Colors.accent },
  bulletItem: { fontSize: 14, color: Colors.textSub, lineHeight: 22, flex: 1 },

  eligibilityContainer: { padding: 20, paddingBottom: 100 },
  formCard: { backgroundColor: Colors.card, borderRadius: 28, padding: 24, elevation: 6, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: {width: 0, height: 6} },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  formTitle: { fontSize: 24, fontWeight: "900", color: Colors.textMain, letterSpacing: -0.5 },
  formSub: { fontSize: 14, color: Colors.textSub, marginBottom: 24, lineHeight: 20 },

  label: { fontSize: 13, fontWeight: "800", color: Colors.textSub, textTransform: 'uppercase', marginBottom: 8, marginTop: 16, letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#F8FAFC", borderRadius: 16, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, height: 56 },
  inputField: { flex: 1, marginLeft: 12, fontSize: 16, color: Colors.textMain, fontWeight: '600' },

  submitBtn: { height: 56, borderRadius: 16, overflow: 'hidden', marginTop: 35, elevation: 4, shadowColor: Colors.accent, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: {width: 0, height: 4} },
  btnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },

  summaryBanner: { borderRadius: 24, padding: 30, alignItems: "center", marginBottom: 20, elevation: 8, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: {width: 0, height: 8} },
  summaryCount: { fontSize: 72, fontWeight: "900", color: Colors.white, letterSpacing: -2 },
  summaryLabel: { fontSize: 16, color: "#D1FAE5", fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  resetBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: Colors.white, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: Colors.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  resetBtnText: { fontWeight: '800', color: Colors.textMain, fontSize: 14 }
});