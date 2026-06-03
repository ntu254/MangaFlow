import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import {
  SignIn,
  SignUp,
  UserButton,
  useAuth,
} from "@clerk/react";
import { useAuthClaims } from "@/shared/hooks/useAuthClaims";
import { RoleGuard } from "@/shared/components/RoleGuard";
import { RoleRedirect } from "@/features/auth/RoleRedirect";
import { SYSTEM_ROLES } from "@/shared/constants/roles";
import { NotFoundPage } from "@/shared/components/feedback/NotFoundPage";
import { HomeGate } from "@/shared/components/HomeGate";
import { apiBaseUrl } from "@/shared/api";
import type { SystemRole, UserStatus } from "@/features/auth/auth-flow";

const SeriesListPage = lazy(() =>
  import("@/features/series/routes/SeriesListPage").then(m => ({ default: m.SeriesListPage }))
);
const CreateSeriesPage = lazy(() =>
  import("@/features/series/routes/CreateSeriesPage").then(m => ({ default: m.CreateSeriesPage }))
);
const SeriesDetailPage = lazy(() =>
  import("@/features/series/routes/SeriesDetailPage").then(m => ({ default: m.SeriesDetailPage }))
);
const EditorReviewPage = lazy(() =>
  import("@/features/manuscript/routes/EditorReviewPage").then(m => ({ default: m.EditorReviewPage }))
);
const ChapterPagesPage = lazy(() =>
  import("@/features/page/routes/ChapterPagesPage").then(m => ({ default: m.ChapterPagesPage }))
);
const PageWorkspacePage = lazy(() =>
  import("@/features/page/routes/PageWorkspacePage").then(m => ({ default: m.PageWorkspacePage }))
);
const AssistantDashboardPage = lazy(() =>
  import("@/features/task/routes/AssistantDashboardPage").then(m => ({ default: m.AssistantDashboardPage }))
);
const AssistantTaskDetailPage = lazy(() =>
  import("@/features/task/routes/AssistantTaskDetailPage").then(m => ({ default: m.AssistantTaskDetailPage }))
);
const EditorDashboardPage = lazy(() =>
  import("@/features/dashboard/routes/EditorDashboardPage").then(m => ({ default: m.EditorDashboardPage }))
);
const BoardDashboardPage = lazy(() =>
  import("@/features/board/routes/BoardDashboardPage").then(m => ({ default: m.BoardDashboardPage }))
);
const BoardSeriesReviewPage = lazy(() =>
  import("@/features/board/routes/BoardSeriesReviewPage").then(m => ({ default: m.BoardSeriesReviewPage }))
);
const BoardRankingPage = lazy(() =>
  import("@/features/ranking/routes/BoardRankingPage").then(m => ({ default: m.BoardRankingPage }))
);
const ImportRankingPage = lazy(() =>
  import("@/features/ranking/routes/ImportRankingPage").then(m => ({ default: m.ImportRankingPage }))
);
const MangakaRankingPage = lazy(() =>
  import("@/features/ranking/routes/MangakaRankingPage").then(m => ({ default: m.MangakaRankingPage }))
);
const MangakaDashboardPage = lazy(() =>
  import("@/features/dashboard/routes/MangakaDashboardPage").then(m => ({ default: m.MangakaDashboardPage }))
);
const AdminDashboardPage = lazy(() =>
  import("@/features/dashboard/routes/AdminDashboardPage").then(m => ({ default: m.AdminDashboardPage }))
);
const AdminRoleReviewPage = lazy(() =>
  import("@/features/admin/routes/AdminRoleReviewPage").then(m => ({ default: m.AdminRoleReviewPage }))
);
const OnboardingPage = lazy(() =>
  import("@/features/auth/routes/OnboardingPage").then(m => ({ default: m.OnboardingPage }))
);
const BlockedPage = lazy(() =>
  import("@/features/auth/routes/BlockedPage").then(m => ({ default: m.BlockedPage }))
);

const LazyLandingPage = lazy(() =>
  import("@/features/landing").then(m => ({ default: m.LandingPage }))
);

type AppProps = {
  clerkConfigured: boolean;
};

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff9fb] via-[#f8f1ff] to-[#fff7ec]">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-4 border-[#eadff6] border-t-[#9065d5]" />
        <p className="text-sm text-[#5f5270]">Loading MangaFlow...</p>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { claims, isLoading: claimsLoading, needsFallback, refresh } = useAuthClaims();
  const [fallbackUser, setFallbackUser] = useState<{
    systemRole: SystemRole | null;
    status: UserStatus;
  } | null>(null);

  // Fallback: if JWT claims missing, call sync-user
  useEffect(() => {
    if (!needsFallback || !isSignedIn) return;

    let cancelled = false;

    async function syncUser() {
      try {
        const token = await getToken({ template: "mangaflow" });
        if (!token) return;

        const response = await fetch(`${apiBaseUrl}/auth/sync-user`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const body = await response.json();

        if (cancelled) return;

        if (response.ok && body.success) {
          setFallbackUser({
            systemRole: body.data.user.systemRole,
            status: body.data.user.status
          });
          // Refresh JWT claims after sync
          await refresh();
        }
      } catch (err) {
        console.warn("[Auth] Fallback sync failed:", err);
      }
    }

    void syncUser();
    return () => { cancelled = true; };
  }, [needsFallback, isSignedIn, getToken, refresh]);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  if (claimsLoading) {
    return <LoadingScreen />;
  }

  // Use claims from JWT, fallback to sync response
  const effectiveClaims = claims ?? fallbackUser;

  if (!effectiveClaims) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/app/onboarding" element={
        <Suspense fallback={<LoadingScreen />}>
          <OnboardingPage />
        </Suspense>
      } />
      <Route path="/app/blocked" element={
        <Suspense fallback={<LoadingScreen />}>
          <BlockedPage />
        </Suspense>
      } />

      <Route path="/app/admin/*" element={
        <RoleGuard
          systemRole={effectiveClaims.systemRole}
          status={effectiveClaims.status}
          allowedRoles={[SYSTEM_ROLES.ADMIN]}
        >
          <div className="min-h-screen flex flex-col bg-background">
            <main className="flex-1">
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/dashboard" element={<AdminDashboardPage />} />
                  <Route path="/role-review" element={<AdminRoleReviewPage getToken={getToken} />} />
                  <Route path="*" element={<Navigate to="/app/admin/dashboard" replace />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </RoleGuard>
      } />

      <Route path="/app/mangaka/*" element={
        <RoleGuard
          systemRole={effectiveClaims.systemRole}
          status={effectiveClaims.status}
          allowedRoles={[SYSTEM_ROLES.MANGAKA]}
        >
          <div className="min-h-screen flex flex-col bg-background">
            <header className="border-b bg-card h-14 flex items-center px-4 md:px-8 sticky top-0 z-10 shadow-sm">
              <div className="flex-1 flex items-center gap-4">
                <strong className="text-lg tracking-tight">MangaFlow</strong>
                <span className="text-muted-foreground text-sm">Mangaka Workspace</span>
              </div>
              <UserButton />
            </header>
            <main className="flex-1">
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/dashboard" element={<MangakaDashboardPage />} />
                  <Route path="/series" element={<SeriesListPage />} />
                  <Route path="/series/new" element={<CreateSeriesPage />} />
                  <Route path="/series/:seriesId" element={<SeriesDetailPage />} />
                  <Route path="/chapters/:chapterId/pages" element={<ChapterPagesPage />} />
                  <Route path="/pages/:pageId/workspace" element={<PageWorkspacePage />} />
                  <Route path="/ranking" element={<MangakaRankingPage />} />
                  <Route path="*" element={<NotFoundPage homePath="/app/mangaka/dashboard" />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </RoleGuard>
      } />

      <Route path="/app/editor/*" element={
        <RoleGuard
          systemRole={effectiveClaims.systemRole}
          status={effectiveClaims.status}
          allowedRoles={[SYSTEM_ROLES.EDITOR]}
        >
          <div className="min-h-screen flex flex-col bg-background">
            <header className="border-b bg-card h-14 flex items-center px-4 md:px-8 sticky top-0 z-10 shadow-sm">
              <div className="flex-1 flex items-center gap-4">
                <strong className="text-lg tracking-tight">MangaFlow</strong>
                <span className="text-muted-foreground text-sm">Editor Workspace</span>
              </div>
              <UserButton />
            </header>
            <main className="flex-1">
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/dashboard" element={<EditorDashboardPage />} />
                  <Route path="/series/:seriesId/manuscripts/:manuscriptId/review" element={<EditorReviewPage />} />
                  <Route path="/chapters/:chapterId/pages" element={<ChapterPagesPage />} />
                  <Route path="/pages/:pageId/workspace" element={<PageWorkspacePage />} />
                  <Route path="*" element={<NotFoundPage homePath="/app/editor/dashboard" />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </RoleGuard>
      } />

      <Route path="/app/assistant/*" element={
        <RoleGuard
          systemRole={effectiveClaims.systemRole}
          status={effectiveClaims.status}
          allowedRoles={[SYSTEM_ROLES.ASSISTANT]}
        >
          <div className="min-h-screen flex flex-col bg-background">
            <header className="border-b bg-card h-14 flex items-center px-4 md:px-8 sticky top-0 z-10 shadow-sm">
              <div className="flex-1 flex items-center gap-4">
                <strong className="text-lg tracking-tight">MangaFlow</strong>
                <span className="text-muted-foreground text-sm">Assistant Workspace</span>
              </div>
              <UserButton />
            </header>
            <main className="flex-1">
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/dashboard" element={<AssistantDashboardPage />} />
                  <Route path="/tasks/:taskId" element={<AssistantTaskDetailPage />} />
                  <Route path="*" element={<NotFoundPage homePath="/app/assistant/dashboard" />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </RoleGuard>
      } />

      <Route path="/app/board/*" element={
        <RoleGuard
          systemRole={effectiveClaims.systemRole}
          status={effectiveClaims.status}
          allowedRoles={[SYSTEM_ROLES.BOARD, SYSTEM_ROLES.ADMIN]}
        >
          <div className="min-h-screen flex flex-col bg-slate-950">
            <header className="border-b bg-slate-900 border-slate-800/80 h-14 flex items-center px-4 md:px-8 sticky top-0 z-10 shadow-sm">
              <div className="flex-1 flex items-center gap-4">
                <strong className="text-lg tracking-tight text-white">MangaFlow</strong>
                <span className="text-slate-400 text-sm">Board Workspace</span>
              </div>
              <UserButton />
            </header>
            <main className="flex-1 bg-slate-950">
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/dashboard" element={<BoardDashboardPage />} />
                  <Route path="/series/:seriesId/review" element={<BoardSeriesReviewPage />} />
                  <Route path="/ranking/import" element={<ImportRankingPage />} />
                  <Route path="/ranking" element={<BoardRankingPage />} />
                  <Route path="*" element={<NotFoundPage homePath="/app/board/dashboard" />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </RoleGuard>
      } />

      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}

function App({ clerkConfigured }: AppProps) {
  if (!clerkConfigured) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <LazyLandingPage clerkConfigured={false} />
      </Suspense>
    );
  }

  return (
    <Routes>
      <Route path="/sign-in/*" element={<SignIn />} />
      <Route path="/sign-up/*" element={<SignUp />} />
      <Route path="/" element={<HomeGate />} />
      <Route path="/app/*" element={<AuthenticatedApp />} />
      <Route path="*" element={<NotFoundPage homePath="/" />} />
    </Routes>
  );
}

export default App;
