"use client";

import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import type { AuthContextValue } from "./AuthContext";

export function useAuth(): AuthContextValue {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return authContext;
}
