import { describe, it, expect, vi } from "vitest";

const session = {
  user: { id: "u1", email: "u@e.com" },
  session: { access_token: "m" },
  role: "admin" as const,
  is_banned: false,
};

const bannedSession = {
  user: { id: "u2", email: "banned@e.com" },
  session: { access_token: "m" },
  role: "user" as const,
  is_banned: true,
};

const signupNeedsConfirmation = {
  user: { id: "u3", email: "new@e.com" },
  session: { access_token: "" },
  needsEmailConfirmation: true,
};

const signupDirect = {
  user: { id: "u4", email: "direct@e.com" },
  session: { access_token: "t" },
};

const mockProfileBanned = { is_banned: true, ban_reason: "Bị khóa" };
const mockProfileActive = { is_banned: false };

const mockAdminCheck = [{ role: "admin" }];
const mockUserCheck = [];

vi.mock("@/shared/lib", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: () => {} } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          single: vi.fn(),
        })),
      })),
      upsert: vi.fn(),
      delete: vi.fn(() => ({
        eq: vi.fn(),
        in: vi.fn(),
      })),
    })),
    rpc: vi.fn(),
  },
}));

import { authService } from "./auth.service";

describe("auth.service", () => {
  it("login success returns session with active profile", async () => {
    const { supabase } = await import("@/shared/lib");
    (supabase.auth.signInWithPassword as any).mockResolvedValueOnce({ data: { user: { id: "u1", email: "u@e.com" }, session: { access_token: "t" } }, error: null });
    (supabase.from as any).mockReturnValueOnce({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mockProfileActive, error: null }) }) }) });
    (supabase.rpc as any).mockResolvedValueOnce(mockUserCheck);

    const res = await authService.login("u@e.com", "secret");
    expect(res.user.email).toBe("u@e.com");
    expect(res.is_banned).toBe(false);
  });

  it("login throws when profile is banned", async () => {
    const { supabase } = await import("@/shared/lib");
    (supabase.auth.signInWithPassword as any).mockResolvedValueOnce({ data: { user: { id: "u2", email: "banned@e.com" }, session: { access_token: "t" } }, error: null });
    (supabase.from as any).mockReturnValueOnce({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mockProfileBanned, error: null }) }) }) });

    await expect(authService.login("banned@e.com", "secret")).rejects.toThrow("Bị khóa");
  });

  it("signup throws on duplicate identity", async () => {
    const { supabase } = await import("@/shared/lib");
    (supabase.auth.signUp as any).mockResolvedValueOnce({ data: { user: { id: "u3", email: "dup@e.com", identities: [] }, session: null }, error: null });

    await expect(authService.signup("dup@e.com", "secret")).rejects.toThrow("Email này đã được sử dụng");
  });

  it("signup returns needsEmailConfirmation when no session", async () => {
    const { supabase } = await import("@/shared/lib");
    (supabase.auth.signUp as any).mockResolvedValueOnce({ data: { user: { id: "u3", email: "new@e.com", identities: [{ id: "id" }] }, session: null }, error: null });

    const res = await authService.signup("new@e.com", "secret", "New");
    expect(res.needsEmailConfirmation).toBe(true);
  });

  it("signup returns session and upserts profile when direct signup", async () => {
    const { supabase } = await import("@/shared/lib");
    const upsertMock = vi.fn();
    (supabase.auth.signUp as any).mockResolvedValueOnce({ data: { user: { id: "u4", email: "direct@e.com", identities: [{ id: "id2" }] }, session: { access_token: "t" } }, error: null });
    (supabase.from as any).mockReturnValueOnce({ upsert: upsertMock });

    const res = await authService.signup("direct@e.com", "secret", "Direct");
    expect(res.user.id).toBe("u4");
    expect(upsertMock).toHaveBeenCalled();
  });

  it("logout calls supabase auth signOut", async () => {
    const { supabase } = await import("@/shared/lib");
    const signOutMock = vi.fn();
    (supabase.auth.signOut as any) = signOutMock;

    await authService.logout();
    expect(signOutMock).toHaveBeenCalled();
  });

  it("requestPasswordReset calls supabase resetPasswordForEmail", async () => {
    const { supabase } = await import("@/shared/lib");
    const resetMock = vi.fn().mockResolvedValueOnce({ error: null });
    (supabase.auth.resetPasswordForEmail as any) = resetMock;

    const res = await authService.requestPasswordReset("u@e.com");
    expect(res).toEqual({ success: true });
    expect(resetMock).toHaveBeenCalledWith("u@e.com", { redirectTo: expect.stringContaining("/reset-password") });
  });

  it("updatePassword calls supabase updateUser", async () => {
    const { supabase } = await import("@/shared/lib");
    const updateMock = vi.fn().mockResolvedValueOnce({ error: null });
    (supabase.auth.updateUser as any) = updateMock;

    const res = await authService.updatePassword("newpass");
    expect(res).toEqual({ success: true });
    expect(updateMock).toHaveBeenCalledWith({ password: "newpass" });
  });

  it("getSession returns null when no session", async () => {
    const { supabase } = await import("@/shared/lib");
    (supabase.auth.getSession as any).mockResolvedValueOnce({ data: { session: null }, error: null });

    const res = await authService.getSession();
    expect(res).toBeNull();
  });

  it("getSession maps admin role when RPC returns admin rows", async () => {
    const { supabase } = await import("@/shared/lib");
    (supabase.auth.getSession as any).mockResolvedValueOnce({ data: { session: { user: { id: "u1", email: "u@e.com" }, access_token: "t" } }, error: null });
    (supabase.rpc as any).mockResolvedValueOnce({ data: mockAdminCheck });

    const res = await authService.getSession();
    expect(res?.role).toBe("admin");
  });
});
