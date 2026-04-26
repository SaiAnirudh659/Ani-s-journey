import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Paste YOUR config here
const firebaseConfig = {
  apiKey: "AIzaSyDbrh0z92A_SBLy0pq2D04KjJ6CZVwAobw",
  authDomain: "anis-journey.firebaseapp.com",
  projectId: "anis-journey",
  storageBucket: "anis-journey.firebasestorage.app",
  messagingSenderId: "73190023991",
  appId: "1:73190023991:web:ac3e757993c0d2bef0f0b2",
  measurementId: "G-GVL3X71Y16"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Set persistence to local storage
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting auth persistence:", error);
});