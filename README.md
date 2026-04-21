# 🌱 AgroGROW
**The Complete Agricultural Intelligence & Commerce Ecosystem**

AgroGROW is a highly sophisticated, full-stack mobile application designed to transform farmers from "price takers" into "market strategists." It bridges the gap between precision farming, B2C e-commerce, peer-to-peer (P2P) networking, and government assistance.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)

---

## 🚀 Key Features

* **Unified Agro Market & Local OLX**
  * **Agro Store (B2C):** Purchase official agricultural inputs (seeds, fertilizers, tools) seamlessly.
  * **Local OLX (P2P):** A community marketplace allowing farmers to list, upload photos, and sell crops, livestock, or machinery directly to others.
* **AI Market Arbitrage & Price Prediction**
  * Analyzes historical pricing, seasonality, and weather using **LSTM Neural Networks**.
  * Calculates real-time geographical arbitrage by factoring in logistics, spoilage, and distant Mandi prices to maximize farmer profit.
* **Government Schemes Portal**
  * An offline-capable eligibility engine that matches farmers with state and federal subsidies based on land size, crop type, and demographics.
* **Smart Order Tracking**
  * Dynamic, real-time order tracking with a premium Glassmorphic UI from "Placed" to "Delivered".
* **Command Center Dashboard**
  * Custom drawer navigation featuring live environmental data, soil analytics, and access to the Goa Agri Forum.

---

## 🏗️ System Architecture & Tech Stack

AgroGROW utilizes a modern hybrid client-server architecture with specialized microservices.

### Frontend (Mobile App)
* **Framework:** React Native via Expo
* **Routing:** Expo Router (File-based routing)
* **State Management:** React Context API + AsyncStorage
* **UI/UX:** Custom Glassmorphism, `expo-linear-gradient`, `lucide-react-native`

### Backend Databases (Hybrid Approach)
* **Firebase Firestore:** NoSQL document store for official B2C store inventory and cart management.
* **Supabase (PostgreSQL):** Relational database managing user profiles and OLX listings. Secured via strict Row Level Security (RLS).
* **Supabase Storage:** Public buckets for P2P image hosting (`expo-file-system` & `expo-image-picker`).

### Microservices & AI
* **Schemes API:** Node.js + Express backend (hosted on Render) for the subsidy eligibility engine.
* **Arbitrage Engine:** Python, FastAPI, and Uvicorn.
* **Machine Learning:** TensorFlow (LSTM) ingesting live data from the AGMARKNET API (`api.data.gov.in`).

---

## 🛠️ Installation & Setup

### Prerequisites
* [Node.js & npm](https://nodejs.org/)
* [Expo CLI](https://docs.expo.dev/get-started/installation/)
* Firebase Project
* Supabase Project
* Python 3.9+ (for the Arbitrage Engine)

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/AgroGROW.git](https://github.com/yourusername/AgroGROW.git)
cd AgroGROW
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add your API keys:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Node.js Schemes API (Local or Render URL)
EXPO_PUBLIC_SCHEMES_API=http://your_server_ip:3000
```

### 4. Supabase Database Configuration
Before running the app, ensure your Supabase project is configured correctly:

* **Storage Bucket:** Create a public bucket named `olx-images`. Add `INSERT` and `SELECT` policies for `anon` and `authenticated` roles.
* **Tables:** Create the `farmer_listings` and `farmers` tables.
* **Row Level Security (RLS):** * Add an `INSERT` policy (`true`) to allow posting ads.
  * Add a `SELECT` policy (`true`) to allow reading ads.
* **Primary Keys:** Ensure the `id` column in your tables is set to type `uuid` with the default value `gen_random_uuid()`.

### 5. Run the Application
```bash
# Start the Expo bundler
npx expo start
```
*Scan the QR code with the Expo Go app on your physical device (ensure your phone and computer are on the same Wi-Fi network).*

---

## 🧠 AI Model Deployment (Optional)
To run the local arbitrage engine:

```bash
cd arbitrage-engine
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 🛡️ Security & Privacy
* **API Keys:** Hidden securely via environment variables.
* **Database Access:** Locked down using PostgreSQL Row Level Security (RLS). User inserts are handled via `.upsert()` to prevent primary key constraint crashes.

---

## 📥 Download & Test
Want to try it out immediately? You can download the latest compiled Android APK directly from Expo:

[**Download AgroGROW APK**](https://expo.dev/accounts/shreyash1655/projects/agrogrow/builds/d597f96d-a52c-4d8f-9978-819595f5a901)
