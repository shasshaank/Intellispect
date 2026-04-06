// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBmvtHFoNbwj0ttS5DWGXKRiSZ7z1A3-jQ",
  authDomain: "anomaly-detection-fec64.firebaseapp.com",
  projectId: "anomaly-detection-fec64",
  storageBucket: "anomaly-detection-fec64.appspot.com", // fix the wrong domain you had
  messagingSenderId: "204441046202",
  appId: "1:204441046202:web:f793dd81434cd6b3b44683",
  measurementId: "G-NV8HG8FWCX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
