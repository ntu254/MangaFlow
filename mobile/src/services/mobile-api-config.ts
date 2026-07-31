import { Platform } from "react-native"
import { mobileEnv, requireMobileEnv } from "@/config/mobile-env"

const ANDROID_EMULATOR_HOST = "10.0.2.2"
const LOCALHOST_PATTERN = /\/\/(localhost|127\.0\.0\.1):/i

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "")
}

export function getMobileApiBaseUrl() {
  const configuredUrl = requireMobileEnv(mobileEnv.apiBaseUrl, "EXPO_PUBLIC_API_BASE_URL")
  const normalizedUrl = trimTrailingSlash(configuredUrl)

  if (Platform.OS === "web" && normalizedUrl.includes(ANDROID_EMULATOR_HOST)) {
    return normalizedUrl.replace(ANDROID_EMULATOR_HOST, "localhost")
  }

  if (Platform.OS === "android" && LOCALHOST_PATTERN.test(normalizedUrl)) {
    return normalizedUrl.replace(LOCALHOST_PATTERN, `//${ANDROID_EMULATOR_HOST}:`)
  }

  return normalizedUrl
}
