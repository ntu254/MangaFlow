import { apiBaseUrl } from "@/shared/api/client";
import { setAuthToken } from "@/shared/api/client";

export async function exchangeGoogleCode(code: string): Promise<string | null> {
  try {
    const response = await fetch(`${apiBaseUrl}/auth/google/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const json = await response.json();
    if (json.success && json.data?.token) {
      setAuthToken(json.data.token);
      return json.data.token;
    }
    return null;
  } catch {
    return null;
  }
}

export function getGoogleAuthUrl(): string {
  return `${apiBaseUrl}/auth/google`;
}

export async function completeOnboarding(token: string, input: { fullName?: string; requestedSystemRole?: string }): Promise<string | null> {
  try {
    const response = await fetch(`${apiBaseUrl}/auth/complete-onboarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });
    const json = await response.json();
    if (json.success && json.data?.token) {
      setAuthToken(json.data.token);
      return json.data.token;
    }
    return null;
  } catch {
    return null;
  }
}
