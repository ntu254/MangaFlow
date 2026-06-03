import { OAuth2Client } from "google-auth-library";

export type GoogleProfile = {
  sub: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
};

export async function verifyGoogleToken(
  idToken: string,
  clientId: string
): Promise<GoogleProfile | null> {
  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload?.email) return null;
    return {
      sub: payload.sub,
      email: payload.email,
      fullName: payload.name ?? payload.email,
      avatarUrl: payload.picture ?? null,
    };
  } catch {
    return null;
  }
}

export function getGoogleAuthUrl(clientId: string, redirectUri: string): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

export async function exchangeGoogleCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GoogleProfile | null> {
  try {
    const client = new OAuth2Client(clientId, clientSecret, redirectUri);
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) return null;
    return verifyGoogleToken(tokens.id_token, clientId);
  } catch {
    return null;
  }
}
