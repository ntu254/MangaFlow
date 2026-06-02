import {
  Show,
  SignIn,
  SignInButton,
  SignUp,
  SignUpButton,
  UserButton,
  useAuth
} from "@clerk/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { resolveAuthRoute, type AuthRouteUser } from "@/features/auth/auth-flow";

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

  useEffect(() => {
    let cancelled = false;

    async function syncUser() {
      if (!isLoaded || !isSignedIn) {
        return;
      }

      setState({ status: "loading" });
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
