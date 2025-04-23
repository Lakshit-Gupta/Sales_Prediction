import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCDDGIoPswqFPhMATT0kC710KgoV5yjit8",
  authDomain: "multihorizonforecast.firebaseapp.com",
  projectId: "multihorizonforecast",
  storageBucket: "multihorizonforecast.firebasestorage.app",
  messagingSenderId: "700644976114",
  appId: "1:700644976114:web:fcca14b3ac208cccdf776b",
  measurementId: "G-Q9L976K2VG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };