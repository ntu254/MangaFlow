import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { adminAuthService, type AdminSession } from "../services/admin-auth.service";

interface AdminAuthContextType {
  session: AdminSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (module: string, action?: "read" | "write" | "delete") => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = adminAuthService.getSession();
    if (stored) setSession(stored);
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { session: s } = await adminAuthService.login(email, password);
    adminAuthService.saveSession(s);
    setSession(s);
    adminAuthService.logAudit("login", "admin", s.id);
    navigate("/admin");
  }, [navigate]);

  const logout = useCallback(async () => {
    await adminAuthService.logout();
    adminAuthService.clearSession();
    setSession(null);
    navigate("/admin/login");
  }, [navigate]);

  const hasPermission = useCallback(
    (module: string, action: "read" | "write" | "delete" = "read") =>
      adminAuthService.hasPermission(session, module, action),
    [session],
  );

  return (
    <AdminAuthContext.Provider value={{ session, loading, login, logout, hasPermission }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
