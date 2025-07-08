import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC5PANVej3sRv9SAqrbiO3_lbuzleoEqwg",
  authDomain: "vbematch.firebaseapp.com",
  projectId: "vbematch",
  storageBucket: "vbematch.firebasestorage.app",
  messagingSenderId: "302789394734",
  appId: "1:302789394734:web:599970b93f90adeb9afabf",
  measurementId: "G-F9B86KNX9W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; 