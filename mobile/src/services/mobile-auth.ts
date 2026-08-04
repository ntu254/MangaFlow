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
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error(response.status === 401 ? "Invalid email or password." : `Login failed with status ${response.status}.`)
  }

  const envelope = await response.json() as ApiEnvelope<AuthPayload>
  const verifiedUser = await fetchMobileMe(envelope.data.accessToken)
  const role = toMobileRole(verifiedUser.role)
  await establishSession(envelope.data.accessToken, envelope.data.refreshToken)

  return {
    user: verifiedUser,
    accessToken: envelope.data.accessToken,
    refreshToken: envelope.data.refreshToken,
    role,
  }
}

// Wire the token into the typed API client, persist the refresh token to
// secure storage, and register a one-shot refresh for 401s.
async function establishSession(accessToken: string, refreshToken: string) {
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
    await establishSession(renewed.accessToken, renewed.refreshToken)
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

// Clears the client's local session state only: in-memory token, refresh
// handler, and stored refresh token. No server call. Shared by an explicit
// logout and by an expired-session sign-out, where a server round trip would
// be pointless (the refresh has already been proven dead by the caller).
export async function clearLocalMobileSession(): Promise<void> {
  mobileApi.setAccessToken(null)
  mobileApi.setRefreshHandler(null)
  await mobileAuthStorage.clearRefreshToken()
}

export async function logoutMobile(session: MobileAuthSession | null): Promise<void> {
  // Read the refresh token actually on file before clearing it: after any
  // refresh, the token in `session` (captured at login) has already been
  // rotated server-side, so revoking it would be a no-op and the live
  // session would keep working past "logout".
  const currentRefreshToken = await mobileAuthStorage.getRefreshToken()

  await clearLocalMobileSession()

  if (!session) return

  try {
    const apiBaseUrl = getMobileApiBaseUrl()
    await fetch(`${apiBaseUrl}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ refreshToken: currentRefreshToken ?? session.refreshToken }),
    })
  } catch {
    // Local session state is already cleared above; a failed best-effort
    // server-side revoke must not strand the caller mid-logout.
  }
}
