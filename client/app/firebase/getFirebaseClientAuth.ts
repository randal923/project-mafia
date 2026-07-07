import { getAuth, type Auth } from "firebase/auth";
import { getFirebaseClientApp } from "./getFirebaseClientApp";

export function getFirebaseClientAuth(): Auth {
  return getAuth(getFirebaseClientApp());
}
