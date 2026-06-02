import { Routes, Route } from "react-router-dom";
import {
  Show,
  SignIn,
  SignInButton,
  SignUp,
  SignUpButton,
  UserButton,
  useAuth
} from "@clerk/react";
import { Ban, RefreshCw, RotateCcw, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  assignableSystemRoles,
  buildAdminRoleReviewUrl,
  buildAdminUserRoleUrl,
  buildAdminUserStatusUrl,
  getAdminRoleReviewRoute
} from "@/features/auth/admin-flow";
import { resolveAuthRoute, type AuthRouteUser } from "@/features/auth/auth-flow";
import { SeriesListPage } from "@/features/series/routes/SeriesListPage";
import { CreateSeriesPage } from "@/features/series/routes/CreateSeriesPage";
import { SeriesDetailPage } from "@/features/series/routes/SeriesDetailPage";
import { EditorReviewPage } from "@/features/manuscript/routes/EditorReviewPage";
import { ChapterPagesPage } from "@/features/page/routes/ChapterPagesPage";
import { RoleGuard } from "@/shared/components/RoleGuard";
import { SYSTEM_ROLES } from "@/shared/constants/roles";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

const workflowSteps = [
  "Series",
  "Manuscript",
  "Pages",
  "Tasks",
  "Review",
  "Board",
  "Payroll"
];

type AppProps = {
  clerkConfigured: boolean;
};

type AuthSyncState =
  | { status: "idle" | "loading" }
  | { status: "ready"; user: AuthRouteUser; redirectTo: string }
  | { status: "error"; message: string };

type RoleReviewUser = AuthRouteUser & {
  id: string;
  clerkId: string;
  email: string;
  fullName: string;
  requestedSystemRole: "MANGAKA" | "ASSISTANT" | null;
};

type AdminReviewState =
  | { status: "loading" }
  | { status: "ready"; users: RoleReviewUser[] }
  | { status: "error"; message: string };

function PhaseZeroShell({ clerkConfigured }: AppProps) {
  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Manga production workspace</p>
          <h1 id="page-title">MangaFlow</h1>
          <p className="summary">
            A buildable Phase 0 shell for the manga workflow product contract.
          </p>
        </div>

        <div className="status-card" aria-label="Service status">
          <span className="status-dot" aria-hidden="true" />
          <div>
            <p className="status-label">API health</p>
            <a href={`${apiBaseUrl}/health`}>{apiBaseUrl}/health</a>
          </div>
        </div>
      </section>

      <section className="auth-panel" aria-label="Authentication status">
        <div>
          <p className="status-label">Auth foundation</p>
          <h2>{clerkConfigured ? "Clerk ready" : "Clerk key required"}</h2>
          <p>
            {clerkConfigured
              ? "Sign in to sync your Clerk identity with MangaFlow."
              : "Set VITE_CLERK_PUBLISHABLE_KEY to enable Clerk on the client."}
          </p>
        </div>
        {clerkConfigured ? (
          <div className="auth-actions">
            <SignInButton mode="modal">
              <Button>Sign in</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="outline">Sign up</Button>
            </SignUpButton>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        ) : null}
      </section>

      <section className="workflow-strip" aria-label="MVP workflow">
        {workflowSteps.map((step, index) => (
          <div className="workflow-step" key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </section>
    </main>
  );
}

function AuthenticatedApp() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [state, setState] = useState<AuthSyncState>({ status: "idle" });
  const path = window.location.pathname;

  useEffect(() => {
    let cancelled = false;

    async function syncUser() {
      if (!isLoaded || !isSignedIn) {
        return;
      }

      setState({ status: "loading" });
      try {
        const token = await getToken();

        if (!token) {
          setState({ status: "error", message: "Authentication token unavailable." });
          return;
        }

        const response = await fetch(`${apiBaseUrl}/auth/sync-user`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const body = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok || !body.success) {
          setState({ status: "error", message: body.message ?? "Auth sync failed." });
          return;
        }

        setState({
          status: "ready",
          user: body.data.user,
          redirectTo: body.data.auth.redirectTo
        });
      } catch (err: any) {
        if (!cancelled) {
          setState({ 
            status: "error", 
            message: `Failed to connect to backend API: ${err.message}. Please ensure the server is running and CORS matches.` 
          });
        }
      }
    }

    void syncUser();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn]);

  if (!isLoaded) {
    return <PhaseZeroShell clerkConfigured />;
  }

  if (!isSignedIn) {
    return <PhaseZeroShell clerkConfigured />;
  }

  const destination =
    state.status === "ready"
      ? resolveAuthRoute({ isSignedIn: true, user: state.user })
      : "/app/onboarding";

  if (path.startsWith("/app/admin")) {
    return (
      <AdminRoleReviewPage
        authState={state}
        getToken={getToken}
      />
    );
  }

  if (path.startsWith("/app/mangaka")) {
    return (
      <RoleGuard user={state.status === "ready" ? state.user : null} allowedRoles={[SYSTEM_ROLES.MANGAKA]}>
        <div className="min-h-screen flex flex-col bg-background">
          <header className="border-b bg-card h-14 flex items-center px-4 md:px-8 sticky top-0 z-10 shadow-sm">
            <div className="flex-1 flex items-center gap-4">
              <strong className="text-lg tracking-tight">MangaFlow</strong>
              <span className="text-muted-foreground text-sm">Mangaka Workspace</span>
            </div>
            <UserButton />
          </header>
          <main className="flex-1">
            <Routes>
              <Route path="/app/mangaka/series" element={<SeriesListPage />} />
              <Route path="/app/mangaka/series/new" element={<CreateSeriesPage />} />
              <Route path="/app/mangaka/series/:seriesId" element={<SeriesDetailPage />} />
              <Route path="/app/mangaka/chapters/:chapterId/pages" element={<ChapterPagesPage />} />
            </Routes>
          </main>
        </div>
      </RoleGuard>
    );
  }

  if (path.startsWith("/app/editor")) {
    return (
      <RoleGuard user={state.status === "ready" ? state.user : null} allowedRoles={[SYSTEM_ROLES.EDITOR]}>
        <div className="min-h-screen flex flex-col bg-background">
          <header className="border-b bg-card h-14 flex items-center px-4 md:px-8 sticky top-0 z-10 shadow-sm">
            <div className="flex-1 flex items-center gap-4">
              <strong className="text-lg tracking-tight">MangaFlow</strong>
              <span className="text-muted-foreground text-sm">Editor Workspace</span>
            </div>
            <UserButton />
          </header>
          <main className="flex-1">
            <Routes>
              {/* Other editor routes like dashboard can go here */}
              <Route path="/app/editor/series/:seriesId/manuscripts/:manuscriptId/review" element={<EditorReviewPage />} />
            </Routes>
          </main>
        </div>
      </RoleGuard>
    );
  }

  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Authenticated workspace</p>
          <h1 id="page-title">MangaFlow</h1>
          <p className="summary">
            Your Clerk identity is connected to the MangaFlow auth boundary.
          </p>
        </div>
        <div className="status-card" aria-label="User menu">
          <UserButton />
          <div>
            <p className="status-label">Next route</p>
            <a href={destination}>{destination}</a>
          </div>
        </div>
      </section>

      <section className="auth-panel" aria-label="Auth sync result">
        <div>
          <p className="status-label">User sync</p>
          <h2>
            {state.status === "ready"
              ? state.user.systemRole ?? "Onboarding required"
              : "Syncing profile"}
          </h2>
          <p>
            {state.status === "error"
              ? state.message
              : state.status === "ready"
                ? `Backend redirect state: ${state.redirectTo}`
                : "Fetching your internal MangaFlow user record."}
          </p>
        </div>
        <Button
          onClick={() => {
            window.location.href = destination;
          }}
        >
          Continue
        </Button>
      </section>
    </main>
  );
}

function AdminRoleReviewPage({
  authState,
  getToken
}: {
  authState: AuthSyncState;
  getToken: () => Promise<string | null>;
}) {
  const [state, setState] = useState<AdminReviewState>({ status: "loading" });
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  async function fetchPendingUsers() {
    setState({ status: "loading" });
    const token = await getToken();

    if (!token) {
      setState({ status: "error", message: "Authentication token unavailable." });
      return;
    }

    const response = await fetch(buildAdminRoleReviewUrl(apiBaseUrl), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const body = await response.json();

    if (!response.ok || !body.success) {
      setState({ status: "error", message: body.message ?? "Role review failed." });
      return;
    }

    setState({ status: "ready", users: body.data.users });
  }

  async function updateRole(userId: string, systemRole: string) {
    setBusyUserId(userId);
    const token = await getToken();

    if (!token) {
      setState({ status: "error", message: "Authentication token unavailable." });
      setBusyUserId(null);
      return;
    }

    const response = await fetch(buildAdminUserRoleUrl(apiBaseUrl, userId), {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ systemRole })
    });
    const body = await response.json();

    if (!response.ok || !body.success) {
      setState({ status: "error", message: body.message ?? "Role update failed." });
      setBusyUserId(null);
      return;
    }

    await fetchPendingUsers();
    setBusyUserId(null);
  }

  async function updateStatus(userId: string, status: "ACTIVE" | "SUSPENDED") {
    setBusyUserId(userId);
    const token = await getToken();

    if (!token) {
      setState({ status: "error", message: "Authentication token unavailable." });
      setBusyUserId(null);
      return;
    }

    const response = await fetch(buildAdminUserStatusUrl(apiBaseUrl, userId), {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });
    const body = await response.json();

    if (!response.ok || !body.success) {
      setState({ status: "error", message: body.message ?? "Status update failed." });
      setBusyUserId(null);
      return;
    }

    await fetchPendingUsers();
    setBusyUserId(null);
  }

  useEffect(() => {
    if (authState.status === "ready" && authState.user.systemRole === "ADMIN") {
      void fetchPendingUsers();
    }
  }, [authState.status]);

  if (authState.status !== "ready") {
    return <PhaseZeroShell clerkConfigured />;
  }

  if (authState.user.systemRole !== "ADMIN") {
    return (
      <main className="app-shell">
        <section className="auth-panel" aria-label="Admin access">
          <div>
            <p className="status-label">Admin</p>
            <h2>Access unavailable</h2>
            <p>Current role: {authState.user.systemRole ?? "Pending"}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = authState.redirectTo;
            }}
          >
            Continue
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell admin-shell">
      <section className="hero-panel compact-hero" aria-labelledby="admin-title">
        <div>
          <p className="eyebrow">Admin workspace</p>
          <h1 id="admin-title">Role review</h1>
          <p className="summary">
            Pending users awaiting system-role assignment.
          </p>
        </div>
        <div className="status-card" aria-label="Admin user menu">
          <UserButton />
          <div>
            <p className="status-label">Signed in</p>
            <strong>ADMIN</strong>
          </div>
        </div>
      </section>

      <section className="admin-panel" aria-label="Pending role requests">
        <div className="admin-panel-header">
          <div>
            <p className="status-label">Pending users</p>
            <h2>
              {state.status === "ready"
                ? `${state.users.length} waiting`
                : "Loading"}
            </h2>
          </div>
          <Button variant="outline" onClick={fetchPendingUsers}>
            <RefreshCw aria-hidden="true" />
            Refresh
          </Button>
        </div>

        {state.status === "error" ? (
          <p className="admin-error">{state.message}</p>
        ) : null}

        {state.status === "ready" && state.users.length === 0 ? (
          <div className="admin-empty">
            <UserCheck aria-hidden="true" />
            <span>No pending role requests</span>
          </div>
        ) : null}

        {state.status === "ready" && state.users.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Request</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Account</th>
                </tr>
              </thead>
              <tbody>
                {state.users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.fullName}</strong>
                      <span>{user.email}</span>
                    </td>
                    <td>{user.requestedSystemRole ?? "None"}</td>
                    <td>{user.status}</td>
                    <td>
                      <div className="role-actions">
                        {assignableSystemRoles.map((role) => (
                          <Button
                            key={role}
                            size="sm"
                            variant={
                              role === user.requestedSystemRole ? "default" : "outline"
                            }
                            disabled={busyUserId === user.id}
                            onClick={() => {
                              void updateRole(user.id, role);
                            }}
                          >
                            <UserCheck aria-hidden="true" />
                            {role}
                          </Button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="account-actions">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busyUserId === user.id}
                          onClick={() => {
                            void updateStatus(user.id, "SUSPENDED");
                          }}
                        >
                          <Ban aria-hidden="true" />
                          Suspend
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyUserId === user.id}
                          onClick={() => {
                            void updateStatus(user.id, "ACTIVE");
                          }}
                        >
                          <RotateCcw aria-hidden="true" />
                          Active
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function App({ clerkConfigured }: AppProps) {
  const path = window.location.pathname;

  if (!clerkConfigured) {
    return <PhaseZeroShell clerkConfigured={false} />;
  }

  if (path.startsWith("/sign-in")) {
    return <SignIn />;
  }

  if (path.startsWith("/sign-up")) {
    return <SignUp />;
  }

  return <AuthenticatedApp />;
}

export default App;
