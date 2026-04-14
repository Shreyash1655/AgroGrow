import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://aherolrnzwlokkuwwrmq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hH6fuO-fWbhw-fZWQMZygw_xe7bjTKJ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Keys ──────────────────────────────────────────────────────
const USERS_KEY = 'agrogrow_users_v3';
const SESSION_KEY = 'agrogrow_session_v3';
const POSTS_KEY = 'agrogrow_posts_v3';
const API_KEY = 'agrogrow_apikey';

// ── User Store ────────────────────────────────────────────────
export const UserStore = {
  async getAll() {
    try { return JSON.parse((await AsyncStorage.getItem(USERS_KEY)) || '{}'); } catch { return {}; }
  },
  async get(phone) { return (await this.getAll())[phone] || null; },
  async set(phone, user) {
    const all = await this.getAll();
    all[phone] = user;
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(all));
    // Sync to Supabase
    try {
      await supabase.from('farmers').upsert({
        phone, name: user.name, taluka: user.taluka,
        crops: user.crops, farm_size: user.farmSize,
        soil: user.soil, lat: user.lat, lng: user.lng,
        loc_name: user.locName, lang: user.lang, joined: user.joined,
      }, { onConflict: 'phone' });
    } catch (e) { console.warn('Supabase user sync:', e.message); }
  },
  async exists(phone) { return !!(await this.get(phone)); },
};

// ── Session Store ─────────────────────────────────────────────
export const Session = {
  async get() { return AsyncStorage.getItem(SESSION_KEY); },
  async set(phone) { return AsyncStorage.setItem(SESSION_KEY, phone); },
  async clear() { return AsyncStorage.removeItem(SESSION_KEY); },
};

// ── Post Store ────────────────────────────────────────────────
export const PostStore = {
  async getAll() {
    try { return JSON.parse((await AsyncStorage.getItem(POSTS_KEY)) || '[]'); } catch { return []; }
  },
  async save(posts) { await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(posts)); },
  async add(post) {
    const all = await this.getAll();
    all.push(post);
    await this.save(all);
    try {
      await supabase.from('community_posts').insert({
        id: post.id, phone: post.phone, author: post.author,
        loc: post.loc, txt: post.txt, cat: post.cat, crop: post.crop,
        likes: 0, sic: post.sic || 0, created_at: post.ts,
      });
    } catch (e) { console.warn('Post sync:', e.message); }
    return post;
  },
  async update(id, fn) {
    const all = await this.getAll();
    const i = all.findIndex(p => p.id === id);
    if (i >= 0) {
      fn(all[i]);
      await this.save(all);
      try {
        await supabase.from('community_posts')
          .update({ diag: all[i].diag, likes: all[i].likes, comms: all[i].comms })
          .eq('id', id);
      } catch (e) { console.warn('Post update sync:', e.message); }
    }
  },
  async fetchFromSupabase() {
    try {
      const { data } = await supabase.from('community_posts')
        .select('*').order('created_at', { ascending: false }).limit(60);
      if (!data?.length) return;
      const local = await this.getAll();
      const localIds = new Set(local.map(p => p.id));
      let added = 0;
      data.forEach(row => {
        if (!localIds.has(row.id)) {
          local.push({ id: row.id, phone: row.phone, author: row.author, loc: row.loc, txt: row.txt, cat: row.cat, crop: row.crop, likes: row.likes || 0, comms: row.comms || [], sic: row.sic || 0, ts: row.created_at, diag: row.diag || null });
          added++;
        }
      });
      if (added > 0) await this.save(local);
    } catch (e) { console.warn('Fetch posts:', e.message); }
  },
};

// ── API Key ───────────────────────────────────────────────────
export const ApiKeyStore = {
  async get() { return AsyncStorage.getItem(API_KEY); },
  async set(key) { return AsyncStorage.setItem(API_KEY, key); },
  async clear() { return AsyncStorage.removeItem(API_KEY); },
};

// ── Alerts ────────────────────────────────────────────────────
export const DEFAULT_ALERTS = [
  { id: 'a1', type: 'risk', sev: 'critical', title: 'Rice Blast Outbreak Detected', msg: 'Rice Blast detected near Canacona. Humidity critically high. 7 farms affected within 5km. Take action immediately.', area: 'Canacona, Goa', pill: 'Outbreak', pc: 'r', ico: '⚠️', t: 'Just now', actions: [{ l: 'View Map', s: 'map' }, { l: 'Dismiss', d: true }] },
  { id: 'a2', type: 'risk', sev: 'high', title: 'Cashew Dieback Risk Rising', msg: 'Cashew dieback conditions developing in Mapusa belt. Monitor your cashew crop closely.', area: 'Mapusa, Goa', pill: 'Caution', pc: 'y', ico: '📈', t: '11 min ago' },
  { id: 'a3', type: 'weather', sev: 'medium', title: 'Heavy Rain Alert Tomorrow', msg: 'Heavy rain forecast with 92% humidity. Avoid fungicide/pesticide spray today. Cover harvested cashew.', area: 'All of Goa', pill: 'Weather', pc: 'b', ico: '🌧️', t: '3 hrs ago' },
  { id: 'a4', type: 'tip', sev: 'low', title: 'Zone Cleared — Panaji & Vasco Safe', msg: 'No active disease threats in Panaji and Vasco zones. Conditions are stable.', area: 'Panaji, Goa', pill: 'Safe ✅', pc: 'g', ico: '✅', t: 'Yesterday' },
];
