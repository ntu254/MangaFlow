import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"

const REFRESH_TOKEN_KEY = "mangaflow.refreshToken"

// Native builds keep the refresh token in the OS keystore via SecureStore.
// Web has no SecureStore, so it uses sessionStorage (cleared on tab close),
// never localStorage, to avoid a long-lived token in shared storage.
function webStorage(): Storage | null {
  return typeof sessionStorage === "undefined" ? null : sessionStorage
}

export const mobileAuthStorage = {
  async getRefreshToken(): Promise<string | null> {
    if (Platform.OS === "web") return webStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
  },
  async setRefreshToken(value: string): Promise<void> {
    if (Platform.OS === "web") {
      webStorage()?.setItem(REFRESH_TOKEN_KEY, value)
      return
    }
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, value)
  },
  async clearRefreshToken(): Promise<void> {
    if (Platform.OS === "web") {
      webStorage()?.removeItem(REFRESH_TOKEN_KEY)
      return
    }
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
  },
}
