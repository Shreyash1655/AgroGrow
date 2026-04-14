import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Session, UserStore, ApiKeyStore } from '../utils/store';

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
        }
      }
      const key = await ApiKeyStore.get();
      if (key) setApiKeyState(key);
      setReady(true);
    })();
  }, []);

  async function login(u) {
    setUser(u);
    setLat(u.lat || 15.4909);
    setLng(u.lng || 73.8278);
    setLocName(u.locName || u.taluka + ', Goa');
    await Session.set(u.phone);
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
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
