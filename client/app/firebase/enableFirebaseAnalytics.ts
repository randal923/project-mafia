import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirebaseClientApp } from "./getFirebaseClientApp";

export async function enableFirebaseAnalytics(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const analyticsIsSupported = await isSupported();

  if (!analyticsIsSupported) {
    return;
  }

  getAnalytics(getFirebaseClientApp());
}
