// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import env from "react-dotenv";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: env.KEY,
  authDomain: env.DOMAIN,
  projectId: env.ID,
  storageBucket: env.BUCKET,
  messagingSenderId: env.SENDER,
  appId: env.APP
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();