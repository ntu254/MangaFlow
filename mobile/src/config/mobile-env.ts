type MobilePublicEnvName =
  | "EXPO_PUBLIC_API_BASE_URL"
  | "EXPO_PUBLIC_BOARD_EMAIL"
  | "EXPO_PUBLIC_BOARD_PASSWORD"
  | "EXPO_PUBLIC_EDITOR_EMAIL"
  | "EXPO_PUBLIC_EDITOR_PASSWORD"
  | "EXPO_PUBLIC_ENABLE_MOBILE_MOCK_FALLBACK"

function readPublicEnv(name: MobilePublicEnvName) {
  return process.env[name]?.trim() ?? ""
}

export const mobileEnv = {
  apiBaseUrl: readPublicEnv("EXPO_PUBLIC_API_BASE_URL"),
  boardEmail: readPublicEnv("EXPO_PUBLIC_BOARD_EMAIL"),
  boardPassword: readPublicEnv("EXPO_PUBLIC_BOARD_PASSWORD"),
  editorEmail: readPublicEnv("EXPO_PUBLIC_EDITOR_EMAIL"),
  editorPassword: readPublicEnv("EXPO_PUBLIC_EDITOR_PASSWORD"),
  enableMockFallback: readPublicEnv("EXPO_PUBLIC_ENABLE_MOBILE_MOCK_FALLBACK") === "true",
}

export function requireMobileEnv(value: string, name: MobilePublicEnvName) {
  if (!value) {
    throw new Error(`Missing ${name}. Copy mobile/.env.example to mobile/.env and configure it.`)
  }

  return value
}
