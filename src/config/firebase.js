import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAoXRxd1QqTeFDFBLTfyzRB4G5zbv4ESps",
  authDomain: "adote-boleto.firebaseapp.com",
  projectId: "adote-boleto",
  storageBucket: "adote-boleto.firebasestorage.app",
  messagingSenderId: "139472865747",
  appId: "1:139472865747:web:fe25a7296d0e82941a0726"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);