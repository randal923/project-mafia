"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { type PropsWithChildren, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { enableFirebaseAnalytics } from "../firebase/enableFirebaseAnalytics";
import { getFirebaseClientAuth } from "../firebase/getFirebaseClientAuth";

type AuthState = {
  isLoading: boolean;
  user: User | null;
};

export function AuthProvider({ children }: PropsWithChildren) {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    user: null,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void enableFirebaseAnalytics().catch((analyticsError: unknown) => {
      console.warn("Firebase Analytics failed to start.", analyticsError);
    });

    return onAuthStateChanged(
      getFirebaseClientAuth(),
      (user) => {
        setError(null);
        setAuthState({
          isLoading: false,
          user,
        });
      },
      (authError) => {
        setError(authError.message);
        setAuthState({
          isLoading: false,
          user: null,
        });
      },
    );
  }, []);

  return (
    <AuthContext.Provider
      value={{
        error,
        isLoading: authState.isLoading,
        user: authState.user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
