# 🌱 AgroGROW — React Native App

Smart farming app for Goa's cashew, paddy & coconut farmers.
Built with **Expo SDK 51 + React Native 0.74 + Supabase + Claude AI**.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start on Android emulator
npx expo start --android

# 3. Start on iOS simulator  
npx expo start --ios

# 4. Start on physical device (scan QR with Expo Go)
npx expo start
```

## 📱 Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Splash | `/` | Animated logo entrance |
| Onboard | `/(auth)/onboard` | App intro with features |
| Register | `/(auth)/register` | 3-step sign up |
| Login | `/(auth)/login` | Phone + password |
| Home | `/(tabs)/home` | Weather, AI tip, forecast |
| Community | `/(tabs)/community` | Posts + AI crop diagnosis |
| AgroBot | `/(tabs)/chatbot` | Claude AI farming chatbot |
| Marketplace | `/(tabs)/market` | Products with cart |
| Profile | `/(tabs)/profile` | Settings, API key, stats |
| Pest Alerts | `/pest` | Weather-based risk |
| Soil Advisor | `/soil` | AI soil analysis |
| Irrigation | `/irrigation` | Smart watering AI |
| Calendar | `/calendar` | Monthly crop tasks |
| Alerts | `/alerts` | Disease & weather alerts |
| Cart | `/cart` | Shopping cart + checkout |

## 🔑 Environment Setup

### Anthropic API Key (for AI features)
1. Go to `console.anthropic.com` → API Keys
2. Create a key starting with `sk-ant-...`  
3. In the app: **Profile → AI API Key** → paste your key

### Supabase (for multi-user data sync)
Run this SQL once in your Supabase SQL Editor:

```sql
create table if not exists farmers (
  phone text primary key,
  name text, taluka text, crops text[], farm_size float,
  soil text, lat float, lng float, loc_name text, lang text,
  joined timestamptz default now()
);

create table if not exists community_posts (
  id text primary key, phone text, author text, loc text,
  txt text, cat text, crop text, likes int default 0,
  sic int default 0, diag jsonb, comms jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table farmers enable row level security;
alter table community_posts enable row level security;
create policy "public read" on farmers for select using (true);
create policy "public insert" on farmers for insert with check (true);
create policy "public update" on farmers for update using (true);
create policy "public read" on community_posts for select using (true);
create policy "public insert" on community_posts for insert with check (true);
create policy "public update" on community_posts for update using (true);
```

## 🎨 Design System

- **Fonts**: Nunito (all weights) + Playfair Display (headings)
- **Colors**: Green palette (`#0d3b22` → `#6dc993`) + semantic colors
- **Animations**: Spring physics, fade-in on mount, scale on press, skeleton loaders
- **Components**: `FadeIn`, `PressScale`, `Toast`, `Skeleton`, `Pill`, `Card`

## 📦 Key Dependencies

```
expo ~51.0.0
react-native 0.74.1
@supabase/supabase-js ^2.39.0
expo-router ~3.5.0
expo-linear-gradient ~13.0.0
expo-haptics ~13.0.0
expo-location ~17.0.0
react-native-reanimated ~3.10.0
@expo-google-fonts/nunito
@expo-google-fonts/playfair-display
```

## 🏗️ Architecture

```
app/                    ← Expo Router file-based routing
├── _layout.jsx         ← Root (fonts, providers)
├── index.jsx           ← Animated splash
├── (auth)/             ← Auth flow (no bottom nav)
├── (tabs)/             ← Main app (with bottom nav)
└── *.jsx               ← Sub-screens (pest, soil, etc.)

src/
├── theme.js            ← Design tokens
├── store/AppContext.js ← Global state (React Context)
├── utils/store.js      ← AsyncStorage + Supabase
├── components/UI.js    ← Shared animated components
└── data/staticData.js  ← Products, pests, soil data
```
