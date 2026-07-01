import * as SecureStore from "expo-secure-store";
import { createContext, useContext } from "react";

export type AuthUser = {
  id: string; name: string; email: string; role: string;
};

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
  signIn: (token: string, user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState>({
  user: null, token: null,
  signIn: async () => {}, signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export const TOKEN_KEY = "sentinel_token";
export const USER_KEY  = "sentinel_user";
