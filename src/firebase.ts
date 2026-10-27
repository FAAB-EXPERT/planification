import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseSdkUser
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBcbHyFN15fHKtQLtW5bXeKNUJYBFU38EI",
  authDomain: "faab-projet.firebaseapp.com",
  projectId: "faab-projet",
  storageBucket: "faab-projet.firebasestorage.app",
  messagingSenderId: "739874836052",
  appId: "1:739874836052:web:acccab79a9f632a00ba7c1"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export { signInWithPopup, signOut, onAuthStateChanged };
