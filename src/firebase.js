import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCgkNoF_HNJd0Hu-OsMdgMeSDWCFZ0zD_Q",
  authDomain: "budgetapp-7cb2a.firebaseapp.com",
  projectId: "budgetapp-7cb2a",
  storageBucket: "budgetapp-7cb2a.firebasestorage.app",
  messagingSenderId: "368743126277",
  appId: "1:368743126277:web:427a6ef0a221f268d4536c",
  measurementId: "G-B71ZBR2N9Z"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs
};
