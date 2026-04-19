import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ScrollView, Modal, Pressable, Animated, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import * as Haptics from 'expo-haptics';

// ✅ FIXED: Using 3 dots instead of 4
import { FadeIn, PressScale, Pill } from '../../src/components/UI';
import { useApp } from '../../src/store/AppContext';
import { Colors, Fonts, Radius, Shadows } from '../../src/theme';
import { PRODS } from '../../src/data/staticData';

const CATS = [{ v:'all',l:'All' },{ v:'fertilizer',l:'🌿 Fertilizer' },{ v:'pesticide',l:'🛡️ Pesticide' },{ v:'seed',l:'🌱 Seeds' },{ v:'tool',l:'🔧 Tools' }];

function ProductCard({ prod, onAdd, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  function handleAdd() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, tension: 300 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300 }),
    ]).start();
    onAdd(prod);
  }
  return (
    <FadeIn style={{ flex: 1, margin: 5 }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity style={styles.prodCard} onPress={() => onPress(prod)} activeOpacity={0.9}>
          <View style={styles.prodImg}>
            <Text style={{ fontSize: 48 }}>{prod.emo}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.prodInfo}>
            <Text style={styles.prodName} numberOfLines={2}>{prod.nm}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
              <Text style={styles.prodPrice}>₹{prod.pr}</Text>
              {prod.mrp > 0 && <Text style={styles.prodMrp}>₹{prod.mrp}</Text>}
            </View>
            {prod.inc > 0 && <Text style={styles.prodInc}>Govt −₹{prod.inc}</Text>}
            <Text style={styles.prodLoc}>📍 {prod.sloc}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </FadeIn>
  );
}

// ── Product Detail Modal ─────────────────────────────────────
function ProductModal({ prod, visible, onClose, onAdd, onBuy }) {
  const [qty, setQty] = useState(1);
  const slideAnim = useRef(new Animated.Value(600)).current;

  React.useEffect(() => {
    if (visible) {
      setQty(1);
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 12, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 600, duration: 280, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!prod) return null;

  const stars = [1,2,3,4,5].map(s => s <= Math.floor(prod.rat) ? '★' : '☆');

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <Animated.View style={[styles.prodModal, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sheetHandle} />
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <View style={styles.prodModalImg}><Text style={{ fontSize: 80 }}>{prod.emo}</Text></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, marginTop: 6 }}>
            <Text style={{ color: Colors.amber, fontSize: 14, letterSpacing: 1 }}>{stars.join('')}</Text>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 12, color: Colors.g400 }}>{prod.rev} reviews</Text>
          </View>
          <View style={{ padding: 16, gap: 8 }}>
            <Text style={styles.prodModalName}>{prod.nm}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={styles.prodModalPrice}>₹{prod.pr}</Text>
              {prod.inc > 0 && (
                <View style={{ backgroundColor: Colors.redp, borderRadius: Radius.r99, paddingHorizontal: 9, paddingVertical: 3 }}>
                  <Text style={{ fontFamily: Fonts.extraBold, fontSize: 11, color: Colors.red }}>Govt −₹{prod.inc}</Text>
                </View>
              )}
            </View>
            <Text style={styles.prodModalLoc}>📍 {prod.sloc}</Text>
            <Text style={styles.prodModalDesc}>{prod.desc}</Text>
            {/* Features */}
            <View style={styles.featWrap}>
              {prod.feats.map((f, i) => (
                <View key={i} style={styles.featChip}>
                  <Text style={styles.featText}>✓ {f}</Text>
                </View>
              ))}
            </View>
            {/* Qty */}
            <View style={styles.qtyRow}>
              <Text style={{ fontFamily: Fonts.extraBold, fontSize: 14, color: Colors.g700 }}>Quantity</Text>
              <View style={styles.qtyControl}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => q + 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* CTA */}
            <View style={styles.ctaRow}>
              <TouchableOpacity style={styles.cartBtn} onPress={() => { onAdd(prod, qty); onClose(); }}>
                <Text style={styles.cartBtnText}>Add to Cart</Text>
              </TouchableOpacity>
              <PressScale style={{ flex: 1 }} onPress={() => { onAdd(prod, qty); onBuy(); onClose(); }}>
                <LinearGradient colors={[Colors.g3, Colors.g1]} style={styles.buyBtn}>
                  <Text style={styles.buyBtnText}>Buy Now →</Text>
                </LinearGradient>
              </PressScale>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

export default function MarketScreen() {
  const { addToCart, cartTotal } = useApp();
  const [mCat, setMCat] = useState('all');
  const [search, setSearch] = useState('');
  const [selProd, setSelProd] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filtered = PRODS.filter(p => (mCat === 'all' || p.cat === mCat) && (!search || p.nm.toLowerCase().includes(search.toLowerCase())));

  function openProd(prod) { setSelProd(prod); setModalVisible(true); }
  function handleAdd(prod, qty = 1) {
    for (let i = 0; i < qty; i++) addToCart(prod);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <LinearGradient colors={[Colors.white, Colors.white]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View style={styles.searchBar}>
              <Text style={{ fontSize: 16, color: Colors.g400 }}>🔍</Text>
              <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search products..." placeholderTextColor={Colors.g400} />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}><Text style={{ color: Colors.g400 }}>✕</Text></TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.cartIconBtn} onPress={() => router.push('/cart')}>
              <Text style={{ fontSize: 22 }}>🛒</Text>
              {cartTotal > 0 && (
                <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartTotal}</Text></View>
              )}
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {CATS.map(c => (
              <TouchableOpacity key={c.v} style={[styles.catChip, mCat === c.v && styles.catChipOn]} onPress={() => setMCat(c.v)}>
                <Text style={[styles.catText, mCat === c.v && { color: '#fff' }]}>{c.l}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Govt banner */}
      <View style={styles.govtBanner}>
        <Text style={styles.govtBannerText}>🏛️ Govt incentive prices available on select products</Text>
      </View>

      {/* Grid */}
      <FlatList
        data={filtered} keyExtractor={i => i.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 9, paddingTop: 4, paddingBottom: 90 }}
        renderItem={({ item }) => <ProductCard prod={item} onAdd={handleAdd} onPress={openProd} />}
        showsVerticalScrollIndicator={false}
      />

      <ProductModal
        prod={selProd} visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAdd}
        onBuy={() => router.push('/cart')}
      />
    </View>
  );
}

// ── Cart Screen ───────────────────────────────────────────────
export function CartScreen() {
  const { cart, updateCartQty, removeFromCart, clearCart } = useApp();
  const [ordered, setOrdered] = useState(false);

  const tot = cart.reduce((s, i) => s + i.pr * i.qty, 0);
  const disc = cart.reduce((s, i) => s + (i.inc || 0) * i.qty, 0);

  function placeOrder() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOrdered(true);
    clearCart();
    setTimeout(() => { setOrdered(false); router.back(); }, 2500);
  }

  if (ordered) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <FadeIn style={{ alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 72 }}>🎉</Text>
          <Text style={{ fontFamily: Fonts.displayBold, fontSize: 24, color: Colors.g1 }}>Order Placed!</Text>
          <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: Colors.g500 }}>Delivery in 3–5 working days</Text>
        </FadeIn>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <LinearGradient colors={[Colors.g1, Colors.g2]} style={styles.cartHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.cartHeaderRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 22 }}>←</Text>
            </TouchableOpacity>
            <Text style={styles.cartHeaderTitle}>My Cart ({cart.length})</Text>
            <View style={{ width: 30 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {cart.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 64 }}>🛒</Text>
          <Text style={{ fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.g700 }}>Your cart is empty</Text>
          <PressScale onPress={() => router.back()}>
            <LinearGradient colors={[Colors.g3, Colors.g1]} style={{ borderRadius: Radius.r99, paddingHorizontal: 24, paddingVertical: 13 }}>
              <Text style={{ fontFamily: Fonts.extraBold, fontSize: 14, color: '#fff' }}>Browse Marketplace →</Text>
            </LinearGradient>
          </PressScale>
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false}>
            {cart.map((item, i) => (
              <FadeIn key={item.id} delay={i * 50} style={styles.cartItem}>
                <View style={styles.cartItemImg}><Text style={{ fontSize: 28 }}>{item.emo}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName} numberOfLines={2}>{item.nm}</Text>
                  <Text style={styles.cartItemLoc}>{item.sloc}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
                    <Text style={styles.cartItemPrice}>₹{item.pr}</Text>
                    <View style={styles.qtyControl}>
                      <TouchableOpacity style={styles.qtySmBtn} onPress={() => updateCartQty(item.id, -1)}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
                      <Text style={styles.qtyNum}>{item.qty}</Text>
                      <TouchableOpacity style={styles.qtySmBtn} onPress={() => updateCartQty(item.id, 1)}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
                    </View>
                  </View>
                </View>
                <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{ padding: 8 }}>
                  <Text style={{ fontSize: 18, color: Colors.g400 }}>✕</Text>
                </TouchableOpacity>
              </FadeIn>
            ))}
            {/* Summary */}
            <View style={styles.summary}>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryVal}>₹{tot.toFixed(0)}</Text></View>
              {disc > 0 && <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Govt Incentive</Text><Text style={[styles.summaryVal, { color: Colors.g3 }]}>−₹{disc.toFixed(0)}</Text></View>}
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Delivery</Text><Text style={[styles.summaryVal, { color: Colors.g3 }]}>Free</Text></View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalVal}>₹{(tot - disc).toFixed(0)}</Text>
              </View>
            </View>
            <View style={{ height: 110 }} />
          </ScrollView>
          <View style={styles.checkoutBar}>
            <PressScale style={{ flex: 1 }} onPress={placeOrder}>
              <LinearGradient colors={[Colors.g4, Colors.g1]} style={styles.checkoutBtn}>
                <Text style={styles.checkoutBtnText}>Place Order · ₹{(tot - disc).toFixed(0)} →</Text>
              </LinearGradient>
            </PressScale>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { borderBottomWidth: 1, borderBottomColor: Colors.g100 },
  headerRow: { flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:14, paddingTop:8, paddingBottom:6 },
  searchBar: { flex:1, flexDirection:'row', alignItems:'center', gap:8, backgroundColor:Colors.g100, borderRadius:Radius.r99, paddingHorizontal:14, paddingVertical:9 },
  searchInput: { flex:1, fontSize:13, fontFamily:Fonts.bold, color:Colors.g900 },
  cartIconBtn: { position:'relative', padding:4 },
  cartBadge: { position:'absolute', top:0, right:0, width:16, height:16, backgroundColor:Colors.red, borderRadius:8, alignItems:'center', justifyContent:'center' },
  cartBadgeText: { fontFamily:Fonts.black, fontSize:9, color:'#fff' },
  catRow: { paddingHorizontal:14, gap:7, paddingBottom:10 },
  catChip: { paddingHorizontal:13, paddingVertical:6, borderRadius:Radius.r99, borderWidth:2, borderColor:Colors.g200, backgroundColor:Colors.white },
  catChipOn: { backgroundColor:Colors.g1, borderColor:Colors.g1 },
  catText: { fontFamily:Fonts.extraBold, fontSize:12, color:Colors.g500 },
  govtBanner: { backgroundColor:Colors.amberp, paddingHorizontal:14, paddingVertical:7 },
  govtBannerText: { fontFamily:Fonts.bold, fontSize:12, color:'#92600a' },
  prodCard: { backgroundColor:Colors.white, borderRadius:Radius.r16, overflow:'hidden', ...Shadows.sh1 },
  prodImg: { height:110, backgroundColor:Colors.g50, alignItems:'center', justifyContent:'center', position:'relative' },
  addBtn: { position:'absolute', bottom:7, left:7, right:7, backgroundColor:Colors.g1, borderRadius:Radius.r99, paddingVertical:6, alignItems:'center' },
  addBtnText: { fontFamily:Fonts.extraBold, fontSize:11, color:'#fff' },
  prodInfo: { padding:9, gap:2 },
  prodName: { fontFamily:Fonts.extraBold, fontSize:12, color:Colors.g900, lineHeight:17 },
  prodPrice: { fontFamily:Fonts.black, fontSize:15, color:Colors.g2 },
  prodMrp: { fontFamily:Fonts.bold, fontSize:11, color:Colors.g400, textDecorationLine:'line-through' },
  prodInc: { fontFamily:Fonts.extraBold, fontSize:10, color:Colors.red },
  prodLoc: { fontFamily:Fonts.medium, fontSize:10, color:Colors.g400 },
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,.5)' },
  prodModal: { backgroundColor:Colors.white, borderTopLeftRadius:28, borderTopRightRadius:28, maxHeight:'88%', ...Shadows.sh3 },
  sheetHandle: { width:36, height:4, backgroundColor:Colors.g200, borderRadius:2, alignSelf:'center', marginTop:10, marginBottom:2 },
  prodModalImg: { height:200, backgroundColor:Colors.g50, alignItems:'center', justifyContent:'center' },
  prodModalName: { fontFamily:Fonts.black, fontSize:18, color:Colors.g900, lineHeight:25 },
  prodModalPrice: { fontFamily:Fonts.black, fontSize:26, color:Colors.g2 },
  prodModalLoc: { fontFamily:Fonts.medium, fontSize:12, color:Colors.g400 },
  prodModalDesc: { fontFamily:Fonts.medium, fontSize:13.5, color:Colors.g500, lineHeight:21 },
  featWrap: { flexDirection:'row', flexWrap:'wrap', gap:6 },
  featChip: { backgroundColor:Colors.gp, borderRadius:Radius.r99, paddingHorizontal:11, paddingVertical:4 },
  featText: { fontFamily:Fonts.extraBold, fontSize:11, color:Colors.g2 },
  qtyRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  qtyControl: { flexDirection:'row', alignItems:'center', borderWidth:2, borderColor:Colors.g200, borderRadius:Radius.r99, overflow:'hidden' },
  qtyBtn: { width:34, height:34, backgroundColor:Colors.g50, alignItems:'center', justifyContent:'center' },
  qtySmBtn: { width:28, height:28, backgroundColor:Colors.g50, alignItems:'center', justifyContent:'center' },
  qtyBtnText: { fontFamily:Fonts.bold, fontSize:18, color:Colors.g700 },
  qtyNum: { width:34, textAlign:'center', fontFamily:Fonts.black, fontSize:14, color:Colors.g900 },
  ctaRow: { flexDirection:'row', gap:10 },
  cartBtn: { flex:1, backgroundColor:Colors.gp, borderRadius:Radius.r99, paddingVertical:13, alignItems:'center', borderWidth:2, borderColor:Colors.g5 },
  cartBtnText: { fontFamily:Fonts.extraBold, fontSize:14, color:Colors.g1 },
  buyBtn: { borderRadius:Radius.r99, paddingVertical:14, alignItems:'center' },
  buyBtnText: { fontFamily:Fonts.black, fontSize:14, color:'#fff' },
  cartHeader: { paddingBottom:16 },
  cartHeaderRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingTop:10 },
  cartHeaderTitle: { fontFamily:Fonts.black, fontSize:18, color:'#fff' },
  cartItem: { flexDirection:'row', alignItems:'flex-start', gap:12, padding:14, backgroundColor:Colors.white, borderBottomWidth:1, borderBottomColor:Colors.g100 },
  cartItemImg: { width:56, height:56, backgroundColor:Colors.g100, borderRadius:Radius.r12, alignItems:'center', justifyContent:'center' },
  cartItemName: { fontFamily:Fonts.extraBold, fontSize:13, color:Colors.g900, lineHeight:18 },
  cartItemLoc: { fontFamily:Fonts.medium, fontSize:11, color:Colors.g400, marginTop:2 },
  cartItemPrice: { fontFamily:Fonts.black, fontSize:15, color:Colors.g2 },
  summary: { backgroundColor:Colors.white, borderTopWidth:1, borderTopColor:Colors.g200, padding:16, gap:8 },
  summaryRow: { flexDirection:'row', justifyContent:'space-between' },
  summaryLabel: { fontFamily:Fonts.bold, fontSize:13, color:Colors.g500 },
  summaryVal: { fontFamily:Fonts.extraBold, fontSize:13, color:Colors.g500 },
  summaryTotal: { borderTopWidth:1, borderTopColor:Colors.g200, paddingTop:10, marginTop:4 },
  totalLabel: { fontFamily:Fonts.black, fontSize:16, color:Colors.g900 },
  totalVal: { fontFamily:Fonts.black, fontSize:16, color:Colors.g1 },
  checkoutBar: { position:'absolute', bottom:0, left:0, right:0, padding:16, backgroundColor:Colors.white, borderTopWidth:1, borderTopColor:Colors.g100 },
  checkoutBtn: { borderRadius:Radius.r99, paddingVertical:16, alignItems:'center', ...Shadows.sh2 },
  checkoutBtnText: { fontFamily:Fonts.black, fontSize:15, color:'#fff', letterSpacing:0.3 },
});
