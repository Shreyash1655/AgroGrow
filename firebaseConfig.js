import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvBx6IsCKyGbAKrUjvrEVTN-826gh9H2s",
  authDomain: "shopping-2371f.firebaseapp.com",
  projectId: "shopping-2371f",
  storageBucket: "shopping-2371f.firebasestorage.app",
  messagingSenderId: "204969861655",
  appId: "1:204969861655:web:f7ec9670447f431c993252",
  measurementId: "G-Q1T8P3ZXWF"
};

let app, auth;

// Check if Firebase is already initialized (This safely handles Expo Fast Refresh)
if (getApps().length === 0) {
  // 1. Initialize the app
  app = initializeApp(firebaseConfig);

  // 2. Initialize Auth WITH persistence on the very first run
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  // If Expo hot-reloads, just get the existing app and auth instances
  app = getApp();
  auth = getAuth(app);
}

export const db = getFirestore(app);
export { auth };