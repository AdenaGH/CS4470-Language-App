import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: "reactchat-2670f.firebaseapp.com",
    projectId: "reactchat-2670f",
    storageBucket: "reactchat-2670f.appspot.com",
    messagingSenderId: "356117307449",
    appId: "1:356117307449:web:e8e32c3c281ef51a062de8"
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);


export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()