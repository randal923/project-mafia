import { createContext } from "react";
import type { User } from "firebase/auth";

export type AuthContextValue = {
  error: string | null;
  isLoading: boolean;
  user: User | null;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
