import { Platform } from "react-native";

/**
 * Backend base URL.
 *
 * Pick the right host for where the app runs:
 *  - Android emulator           -> http://10.0.2.2:8000
 *  - iOS simulator / web        -> http://localhost:8000
 *  - Physical device (Expo Go)  -> http://<YOUR-LAN-IP>:8000
 *
 * Detected LAN IP at scaffold time: 192.168.31.84
 * Override anytime by setting EXPO_PUBLIC_API_URL in your shell/.env.
 */
const LAN_IP = "192.168.31.84";

function defaultBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === "android") return `http://${LAN_IP}:8000`;
  if (Platform.OS === "ios") return `http://${LAN_IP}:8000`;
  return "http://localhost:8000";
}

export const API_BASE_URL = defaultBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;
