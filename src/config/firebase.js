// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration 
// TODO: Replace with your actual Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBWk4zNbXTglkvqPPA3UC-6D-MhzkhF2YY",
  authDomain: "orchestrate-3fede.firebaseapp.com",
  projectId: "orchestrate-3fede",
  storageBucket: "orchestrate-3fede.firebasestorage.app",
  messagingSenderId: "115667029095",
  appId: "1:115667029095:web:bbe5e6f5730dfd69e218c2",
  measurementId: "G-VFGB907SCX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
