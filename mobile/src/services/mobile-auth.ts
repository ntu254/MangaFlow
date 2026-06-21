import { clearMobileWorkflowAuthTokens, setMobileWorkflowAuthToken } from "@/services/mobile-workflow-data-source"
import { getMobileApiBaseUrl } from "@/services/mobile-api-config"

export type MobileAuthRole = "board" | "editor"

export interface MobileAuthUser {
  id: string
  name: string
  email: string
  role: "BOARD" | "EDITOR"
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
    email: process.env.EXPO_PUBLIC_BOARD_EMAIL ?? "board@mangaflow.local",
    password: process.env.EXPO_PUBLIC_BOARD_PASSWORD ?? "board@mangaflow.local",
    roleTitle: "Board Chair",
  },
  editor: {
    label: "Editor Demo",
    email: process.env.EXPO_PUBLIC_EDITOR_EMAIL ?? "editor@mangaflow.local",
    password: process.env.EXPO_PUBLIC_EDITOR_PASSWORD ?? "editor@mangaflow.local",
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
  setMobileWorkflowAuthToken(role, envelope.data.accessToken)

  return {
    user: verifiedUser,
    accessToken: envelope.data.accessToken,
    refreshToken: envelope.data.refreshToken,
    role,
  }
}

export async function logoutMobile(session: MobileAuthSession | null): Promise<void> {
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
