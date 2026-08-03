import { clearMobileWorkflowAuthTokens, setMobileWorkflowAuthToken } from "@/services/mobile-workflow-data-source"
import { getMobileApiBaseUrl } from "@/services/mobile-api-config"
import { mobileApi } from "@/services/mobile-api-client"
import { mobileAuthStorage } from "@/services/mobile-auth-storage"
import { mobileEnv } from "@/config/mobile-env"

export type MobileAuthRole = "board" | "editor"

export interface MobileAuthUser {
  id: string
  name: string
  email: string
  role: "BOARD" | "EDITOR"
  isChair?: boolean
}

export interface MobileAuthSession {
  user: MobileAuthUser
  accessToken: string
  refreshToken: string
  role: MobileAuthRole
}

interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
}

interface AuthPayload {
  user: MobileAuthUser
  accessToken: string
  refreshToken: string
}

export const mobileDemoAccounts: Record<MobileAuthRole, { label: string; email: string; password: string; roleTitle: string }> = {
  board: {
    label: "Board Demo",
    email: mobileEnv.boardEmail,
    password: mobileEnv.boardPassword,
    roleTitle: "Board Chair",
  },
  editor: {
    label: "Editor Demo",
    email: mobileEnv.editorEmail,
    password: mobileEnv.editorPassword,
    roleTitle: "Tantou Editor",
  },
}

function toMobileRole(role: string): MobileAuthRole {
  if (role === "BOARD") return "board"
  if (role === "EDITOR") return "editor"
  throw new Error("This mobile build supports Board and Tantou Editor accounts only.")
}

async function fetchMobileMe(accessToken: string): Promise<MobileAuthUser> {
  const apiBaseUrl = getMobileApiBaseUrl()
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Session verification failed with status ${response.status}.`)
  }

  const envelope = await response.json() as ApiEnvelope<MobileAuthUser>
  toMobileRole(envelope.data.role)
  return envelope.data
}

export async function loginMobile(email: string, password: string): Promise<MobileAuthSession> {
  const apiBaseUrl = getMobileApiBaseUrl()
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mangaflow-e2e": "true",
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error(response.status === 401 ? "Invalid email or password." : `Login failed with status ${response.status}.`)
  }

  const envelope = await response.json() as ApiEnvelope<AuthPayload>
  const verifiedUser = await fetchMobileMe(envelope.data.accessToken)
  const role = toMobileRole(verifiedUser.role)
  await establishSession(role, envelope.data.accessToken, envelope.data.refreshToken)

  return {
    user: verifiedUser,
    accessToken: envelope.data.accessToken,
    refreshToken: envelope.data.refreshToken,
    role,
  }
}

// Wire the token into the typed API client, persist the refresh token to
// secure storage, and register a one-shot refresh for 401s.
async function establishSession(role: MobileAuthRole, accessToken: string, refreshToken: string) {
  mobileApi.setAccessToken(accessToken)
  mobileApi.setRefreshHandler(async () => {
    const stored = await mobileAuthStorage.getRefreshToken()
    if (!stored) return null
    const renewed = await refreshTokens(stored)
    if (!renewed) return null
    await mobileAuthStorage.setRefreshToken(renewed.refreshToken)
    return renewed.accessToken
  })
  await mobileAuthStorage.setRefreshToken(refreshToken)
  // Keep the legacy data-source token boundary alive until Task 7 retires it.
  setMobileWorkflowAuthToken(role, accessToken)
}

async function refreshTokens(refreshToken: string): Promise<AuthPayload | null> {
  const apiBaseUrl = getMobileApiBaseUrl()
  const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })
  if (!response.ok) return null
  const envelope = (await response.json()) as ApiEnvelope<AuthPayload>
  return envelope.data
}

// Restore a session from the stored refresh token. Returns null (and clears
// storage) when the session is expired or the role is unsupported.
export async function restoreMobileSession(): Promise<MobileAuthSession | null> {
  const stored = await mobileAuthStorage.getRefreshToken()
  if (!stored) return null

  const renewed = await refreshTokens(stored)
  if (!renewed) {
    await mobileAuthStorage.clearRefreshToken()
    return null
  }

  try {
    const role = toMobileRole(renewed.user.role)
    await establishSession(role, renewed.accessToken, renewed.refreshToken)
    return {
      user: renewed.user,
      accessToken: renewed.accessToken,
      refreshToken: renewed.refreshToken,
      role,
    }
  } catch {
    await mobileAuthStorage.clearRefreshToken()
    return null
  }
}

export async function logoutMobile(session: MobileAuthSession | null): Promise<void> {
  mobileApi.setAccessToken(null)
  mobileApi.setRefreshHandler(null)
  await mobileAuthStorage.clearRefreshToken()

  if (!session) {
    clearMobileWorkflowAuthTokens()
    return
  }

  try {
    const apiBaseUrl = getMobileApiBaseUrl()
    await fetch(`${apiBaseUrl}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
  } finally {
    clearMobileWorkflowAuthTokens()
  }
}
