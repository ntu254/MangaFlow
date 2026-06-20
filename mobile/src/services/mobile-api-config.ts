import { Platform } from "react-native"

const DEFAULT_API_BASE_URL = "http://localhost:3001/api"
const ANDROID_EMULATOR_HOST = "10.0.2.2"
const LOCALHOST_PATTERN = /\/\/(localhost|127\.0\.0\.1):/i

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "")
}

export function getMobileApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
  const normalizedUrl = trimTrailingSlash(configuredUrl)

  if (Platform.OS === "web" && normalizedUrl.includes(ANDROID_EMULATOR_HOST)) {
    return normalizedUrl.replace(ANDROID_EMULATOR_HOST, "localhost")
  }

  if (Platform.OS === "android" && LOCALHOST_PATTERN.test(normalizedUrl)) {
    return normalizedUrl.replace(LOCALHOST_PATTERN, `//${ANDROID_EMULATOR_HOST}:`)
  }

  return normalizedUrl
}
