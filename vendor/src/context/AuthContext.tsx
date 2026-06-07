import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import { ACCESS_KEY, REFRESH_KEY, api } from "../api/client";
import { Auth } from "../api/endpoints";
import { User } from "../types";

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  register: (payload: Record<string, any>) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem(ACCESS_KEY);
      if (token) {
        try {
          setUser((await Auth.me()).data);
        } catch {
          await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
        }
      }
      setLoading(false);
    })();
  }, []);

  async function persist(access: string, refresh: string) {
    await AsyncStorage.multiSet([[ACCESS_KEY, access], [REFRESH_KEY, refresh]]);
  }

  async function signIn(username: string, password: string) {
    const { data } = await Auth.login(username, password);
    await persist(data.access, data.refresh);
    setUser(data.user);
  }

  async function register(payload: Record<string, any>) {
    await Auth.register({ ...payload, role: "seller" });
    await signIn(payload.username, payload.password);
  }

  async function signOut() {
    await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  }

  async function refreshUser() {
    try {
      setUser((await Auth.me()).data);
    } catch {
      /* ignore */
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, register, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
