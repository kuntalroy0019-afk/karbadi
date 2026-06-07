import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import { API_URL } from "../config";

export const ACCESS_KEY = "karbadi.seller.access";
export const REFRESH_KEY = "karbadi.seller.refresh";

export const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(ACCESS_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refresh = await AsyncStorage.getItem(REFRESH_KEY);
  if (!refresh) return null;
  try {
    const res = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
    const access = res.data.access as string;
    await AsyncStorage.setItem(ACCESS_KEY, access);
    if (res.data.refresh) await AsyncStorage.setItem(REFRESH_KEY, res.data.refresh);
    return access;
  } catch {
    await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      refreshing = refreshing || doRefresh();
      const access = await refreshing;
      refreshing = null;
      if (access) {
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export function apiError(e: any): string {
  const data = e?.response?.data;
  if (!data) return e?.message || "Network error. Is the backend running?";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const first = Object.values(data)[0];
  if (Array.isArray(first)) return String(first[0]);
  return typeof first === "string" ? first : "Something went wrong.";
}
