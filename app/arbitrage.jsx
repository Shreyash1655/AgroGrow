import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Dimensions,
  ScrollView, TouchableOpacity, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// The crops we want to support
const CROPS = ['Cashew', 'Coconut', 'Arecanut', 'Black Pepper', 'Mango'];

export default function ArbitrageScreen() {
  const [selectedCrop, setSelectedCrop] = useState(CROPS[0]);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Updates dynamically based on the selected crop!
  const getBackendUrl = (crop) => `http://192.168.1.35:8082/api/arbitrage/test-ml?commodity=${crop}&mandi=Panaji`;

  useEffect(() => {
    fetchPrediction(selectedCrop);
  }, [selectedCrop]);

  const fetchPrediction = async (crop) => {
    setLoading(true);
    try {
      // Simulate network request for UI testing if backend isn't ready for all crops yet
      const response = await fetch(getBackendUrl(crop));
      const data = await response.json();
      setForecastData(data);
    } catch (err) {
      console.log("Using fallback data for UI testing due to connection error");
      // Fallback dummy data so you can see the UI even if the backend fails
      setForecastData({
        commodity: crop,
        mandi_name: 'Panaji Mandi',
        current_price: crop === 'Cashew' ? 14500 : crop === 'Coconut' ? 3200 : 45000,
        confidence_score: 0.82,
        predictions: Array.from({length: 7}, (_, i) => ({
          date: `2026-04-${20+i}`,
          modal_price: (crop === 'Cashew' ? 14500 : 3200) + (Math.random() * 500 - 100) + (i * 150)
        }))
      });
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Market Intelligence</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderCropSelector = () => (
    <View style={styles.selectorContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {CROPS.map((crop) => {
          const isActive = selectedCrop === crop;
          return (
            <TouchableOpacity
              key={crop}
              onPress={() => setSelectedCrop(crop)}
              style={[styles.cropPill, isActive && styles.cropPillActive]}
            >
              <Text style={[styles.cropPillText, isActive && styles.cropPillTextActive]}>{crop}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  if (loading || !forecastData) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderCropSelector()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Running AI Models for {selectedCrop}...</Text>
          <Text style={styles.loadingSub}>This may take a moment on the first run.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate trends for the UI
  const prices = forecastData.predictions.map(p => p.modal_price);
  const labels = forecastData.predictions.map(p => p.date.split('-')[2] + '/' + p.date.split('-')[1]);
  const startPrice = forecastData.current_price || prices[0];
  const endPrice = prices[prices.length - 1];
  const priceDiff = endPrice - startPrice;
  const isUp = priceDiff >= 0;
  const confidence = Math.round((forecastData.confidence_score || 0.85) * 100);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      {renderHeader()}
      {renderCropSelector()}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* CURRENT PRICE SPOTLIGHT */}
        <View style={styles.currentPriceCard}>
          <Text style={styles.mandiName}>📍 {forecastData.mandi_name || 'Panaji Mandi'}</Text>
          <Text style={styles.currentPriceLabel}>Live Market Rate</Text>
          <View style={styles.priceRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.currentPriceValue}>{Math.round(startPrice).toLocaleString()}</Text>
            <Text style={styles.perQuintal}>/ Quintal</Text>
          </View>
          <View style={[styles.trendBadge, { backgroundColor: isUp ? '#D1FAE5' : '#FEE2E2' }]}>
            <Ionicons name={isUp ? "trending-up" : "trending-down"} size={16} color={isUp ? "#059669" : "#DC2626"} />
            <Text style={[styles.trendText, { color: isUp ? "#059669" : "#DC2626" }]}>
              {isUp ? '+' : ''}₹{Math.abs(Math.round(priceDiff))} predicted in 7 days
            </Text>
          </View>
        </View>

        {/* AI INSIGHTS CARD */}
        <LinearGradient colors={['#064E3B', '#022C22']} style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <FontAwesome5 name="robot" size={18} color="#10B981" />
            <Text style={styles.insightTitle}>AgroGROW AI Advice</Text>
            <Text style={styles.confidenceScore}>{confidence}% Accuracy</Text>
          </View>
          <Text style={styles.insightAction}>
            {isUp ? `HOLD your ${selectedCrop}.` : `SELL your ${selectedCrop} NOW.`}
          </Text>
          <Text style={styles.insightReason}>
            {isUp
              ? `Prices are projected to rise by ₹${Math.abs(Math.round(priceDiff))} by next week due to market demand.`
              : `Prices are projected to drop. Secure your profits at today's rate before the market cools.`}
          </Text>
        </LinearGradient>

        {/* THE CHART */}
        <View style={styles.chartWrapper}>
          <Text style={styles.sectionTitle}>7-Day Price Forecast</Text>
          <LineChart
            data={{
              labels: labels,
              datasets: [{ data: prices }]
            }}
            width={width - 40}
            height={220}
            withInnerLines={false}
            withOuterLines={false}
            yAxisLabel="₹"
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => isUp ? `rgba(16, 185, 129, ${opacity})` : `rgba(239, 68, 68, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: "0" }, // Hides dots for a cleaner, modern look
              fillShadowGradientFrom: isUp ? '#10B981' : '#EF4444',
              fillShadowGradientTo: '#FFFFFF',
              fillShadowGradientFromOpacity: 0.3,
              fillShadowGradientToOpacity: 0.0,
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* DETAILED BREAKDOWN */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Daily Breakdown</Text>
        <View style={styles.tableCard}>
          {forecastData.predictions.map((item, index) => (
            <View key={index} style={[styles.tableRow, index === 6 && { borderBottomWidth: 0 }]}>
              <Text style={styles.dateCell}>{item.date}</Text>
              <Text style={styles.priceCell}>₹{Math.round(item.modal_price).toLocaleString()}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  selectorContainer: { paddingVertical: 10, backgroundColor: '#F9FAFB' },
  cropPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFFFFF', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  cropPillActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  cropPillText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  cropPillTextActive: { color: '#FFFFFF', fontWeight: '800' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, fontWeight: '700', color: '#0F172A' },
  loadingSub: { marginTop: 8, fontSize: 13, color: '#64748B' },
  currentPriceCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 20 },
  mandiName: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  currentPriceLabel: { fontSize: 14, color: '#475569', fontWeight: '500' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  currencySymbol: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginRight: 4 },
  currentPriceValue: { fontSize: 42, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  perQuintal: { fontSize: 14, color: '#64748B', marginLeft: 8, fontWeight: '500' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 16 },
  trendText: { fontSize: 13, fontWeight: '700', marginLeft: 6 },
  insightCard: { borderRadius: 24, padding: 24, marginBottom: 24, elevation: 8, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 12 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  insightTitle: { fontSize: 14, fontWeight: '800', color: '#D1FAE5', marginLeft: 8, flex: 1, textTransform: 'uppercase', letterSpacing: 1 },
  confidenceScore: { fontSize: 12, fontWeight: '800', color: '#34D399', backgroundColor: 'rgba(52, 211, 153, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  insightAction: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', marginBottom: 8 },
  insightReason: { fontSize: 14, color: '#A7F3D0', lineHeight: 20, fontWeight: '500' },
  chartWrapper: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, paddingTop: 24, marginBottom: 24, elevation: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  chart: { marginLeft: -10 },
  tableCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, elevation: 2 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dateCell: { fontSize: 15, color: '#475569', fontWeight: '600' },
  priceCell: { fontSize: 15, color: '#0F172A', fontWeight: '800' }
});