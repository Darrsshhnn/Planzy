"use client";

/**
 * Firebase, used only for "Continue with Google". Firebase owns the Google
 * OAuth client, so no Google Cloud setup is needed. The web config below is
 * public by design (it identifies the project, it is not a secret); env vars
 * can override it for another Firebase project.
 */
import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAgk9t2KG0ks7Gca8JCgDgDkmO0aS7V0hw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "planzy-01.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "planzy-01",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "planzy-01.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "774732824106",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:774732824106:web:7f21740dbff7384480cd53",
};

export function firebaseAuth(): Auth {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}

/** Google provider that always shows the account chooser (even with one account signed in). */
export function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}
