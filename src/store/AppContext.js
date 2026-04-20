import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, UserStore, ApiKeyStore } from '../utils/store';
// 1. Import your supabase client
import { supabase } from '../utils/store';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [apiKey, setApiKeyState] = useState('');
  const [weather, setWeather] = useState(null);
  const [lat, setLat] = useState(15.4909);
  const [lng, setLng] = useState(73.8278);
  const [locName, setLocName] = useState('Panaji, Goa');
  const [cart, setCart] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const phone = await Session.get();
      if (phone) {
        const u = await UserStore.get(phone);
        if (u) {
          setUser(u);
          setLat(u.lat || 15.4909);
          setLng(u.lng || 73.8278);
          setLocName(u.locName || u.taluka + ', Goa');

          // 2. Optional: Pull fresh data from Supabase on startup to keep it synced
          refreshUserFromSupabase(u.phone);
        }
      }
      const key = await ApiKeyStore.get();
      if (key) setApiKeyState(key);
      setReady(true);
    })();
  }, []);

  // 3. NEW: Function to push local state to Supabase
  async function syncUserToSupabase(userData) {
    try {
      const { error } = await supabase
        .from('farmers')
        .upsert({
          phone: userData.phone, // Using phone as unique identifier
          name: userData.name,
          taluka: userData.taluka,
          farm_size: userData.farmSize,
          soil_type: userData.soil,
          crops: userData.crops,
          last_online: new Date()
        }, { onConflict: 'phone' }); // If phone exists, update. If not, insert.

      if (error) throw error;
      console.log("📊 Supabase Sync Successful");
    } catch (err) {
      console.error("📊 Supabase Sync Failed:", err.message);
    }
  }

  // 4. NEW: Function to pull latest data from Supabase
  async function refreshUserFromSupabase(phone) {
    const { data, error } = await supabase
      .from('farmers')
      .select('*')
      .eq('phone', phone)
      .single();

    if (data && !error) {
       setUser(prev => ({ ...prev, ...data }));
       await UserStore.set(phone, { ...user, ...data });
    }
  }

  async function login(u) {
    setUser(u);
    setLat(u.lat || 15.4909);
    setLng(u.lng || 73.8278);
    setLocName(u.locName || u.taluka + ', Goa');

    // Save locally
    await Session.set(u.phone);
    await UserStore.set(u.phone, u);

    // 5. TRIGGER SYNC: Push to Supabase immediately on login/registration
    await syncUserToSupabase(u);
  }

  async function logout() {
    setUser(null);
    setCart([]);
    setWeather(null);
    await Session.clear();
  }

  async function setApiKey(key) {
    setApiKeyState(key);
    await ApiKeyStore.set(key);
  }

  /* ─── Cart Logic (Stays Local) ─── */
  function addToCart(prod) {
    setCart(c => {
      const ex = c.find(x => x.id === prod.id);
      if (ex) return c.map(x => x.id === prod.id ? { ...x, qty: x.qty + 1 } : x);
      return [...c, { ...prod, qty: 1 }];
    });
  }

  function updateCartQty(id, delta) {
    setCart(c => c.map(x => x.id === id ? { ...x, qty: Math.max(1, x.qty + delta) } : x));
  }

  function removeFromCart(id) {
    setCart(c => c.filter(x => x.id !== id));
  }

  function clearCart() { setCart([]); }
  const cartTotal = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <AppContext.Provider value={{
      user, login, logout,
      apiKey, setApiKey,
      weather, setWeather,
      lat, setLat, lng, setLng,
      locName, setLocName,
      cart, addToCart, updateCartQty, removeFromCart, clearCart, cartTotal,
      ready,
      syncUserToSupabase // Exporting this so you can call it from Profile too
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);