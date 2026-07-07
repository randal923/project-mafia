import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { firebaseConfig } from "./firebaseConfig";

export function getFirebaseClientApp(): FirebaseApp {
  const existingApp = getApps()[0];

  if (existingApp) {
    return existingApp;
  }

  return initializeApp(firebaseConfig);
}
