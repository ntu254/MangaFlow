import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import {
  SignIn,
  SignUp,
  useAuth,
} from "@clerk/react";
import { useAuthClaims } from "@/shared/hooks/useAuthClaims";
import { RoleGuard } from "@/shared/components/RoleGuard";
import { RoleRedirect } from "@/features/auth/RoleRedirect";
import { SYSTEM_ROLES } from "@/shared/constants/roles";
import { NotFoundPage } from "@/shared/components/feedback/NotFoundPage";
import { HomeGate } from "@/shared/components/HomeGate";
import { AppShell } from "@/shared/components/layout/AppShell";
import { RoleSidebar, sidebarConfig } from "@/shared/components/navigation/RoleSidebar";
import { AppHeader } from "@/shared/components/navigation/AppHeader";
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
const AssistantTaskListPage = lazy(() =>
  import("@/features/task/routes/AssistantTaskListPage").then(m => ({ default: m.AssistantTaskListPage }))
);
const MangakaTaskListPage = lazy(() =>
  import("@/features/task/routes/MangakaTaskListPage").then(m => ({ default: m.MangakaTaskListPage }))
);
const MangakaSubmissionsPage = lazy(() =>
  import("@/features/submission/routes/MangakaSubmissionsPage").then(m => ({ default: m.MangakaSubmissionsPage }))
);
const EditorAssignedSeriesPage = lazy(() =>
  import("@/features/series/routes/EditorAssignedSeriesPage").then(m => ({ default: m.EditorAssignedSeriesPage }))
);
const OnboardingPage = lazy(() =>
  import("@/features/auth/routes/OnboardingPage").then(m => ({ default: m.OnboardingPage }))
);
const BlockedPage = lazy(() =>
  import("@/features/auth/routes/BlockedPage").then(m => ({ default: m.BlockedPage }))
);
const AssistantEarningsPage = lazy(() =>
  import("@/features/payroll").then(m => ({ default: m.AssistantEarningsPage }))
);
const MangakaPayrollPage = lazy(() =>
  import("@/features/payroll").then(m => ({ default: m.MangakaPayrollPage }))
);
const AdminTaskRatesPage = lazy(() =>
  import("@/features/payroll").then(m => ({ default: m.AdminTaskRatesPage }))
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
  const { claims, isLoading: claimsLoading } = useAuthClaims();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  if (claimsLoading) {
    return <LoadingScreen />;
  }

  // Read role/status directly from JWT claims
  const effectiveClaims = claims;

  if (!effectiveClaims) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="onboarding" element={
        <Suspense fallback={<LoadingScreen />}>
          <OnboardingPage />
        </Suspense>
      } />
      <Route path="blocked" element={
        <Suspense fallback={<LoadingScreen />}>
          <BlockedPage />
        </Suspense>
      } />

      <Route path="admin/*" element={
        <RoleGuard
          systemRole={effectiveClaims.systemRole}
          status={effectiveClaims.status}
          allowedRoles={[SYSTEM_ROLES.ADMIN]}
        >
          <AppShell
            sidebar={<RoleSidebar role="ADMIN" items={sidebarConfig.ADMIN} workspaceLabel="Admin Workspace" />}
            header={<AppHeader breadcrumb={[{ label: "Admin" }]} />}
          >
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="role-review" element={<AdminRoleReviewPage getToken={getToken} />} />
                <Route path="task-rates" element={<AdminTaskRatesPage />} />
                <Route path="*" element={<Navigate to="/app/admin/dashboard" replace />} />
              </Routes>
            </Suspense>
          </AppShell>
        </RoleGuard>
      } />

      <Route path="mangaka/*" element={
        <RoleGuard
          systemRole={effectiveClaims.systemRole}
          status={effectiveClaims.status}
          allowedRoles={[SYSTEM_ROLES.MANGAKA]}
        >
          <AppShell
            sidebar={<RoleSidebar role="MANGAKA" items={sidebarConfig.MANGAKA} workspaceLabel="Mangaka Workspace" />}
            header={<AppHeader breadcrumb={[{ label: "Mangaka" }]} />}
          >
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="dashboard" element={<MangakaDashboardPage />} />
                <Route path="series" element={<SeriesListPage />} />
                <Route path="series/new" element={<CreateSeriesPage />} />
                <Route path="series/:seriesId" element={<SeriesDetailPage />} />
                <Route path="chapters/:chapterId/pages" element={<ChapterPagesPage />} />
                <Route path="pages/:pageId/workspace" element={<PageWorkspacePage />} />
                <Route path="tasks" element={<MangakaTaskListPage />} />
                <Route path="submissions" element={<MangakaSubmissionsPage />} />
                <Route path="ranking" element={<MangakaRankingPage />} />
                <Route path="payroll" element={<MangakaPayrollPage />} />
                <Route path="*" element={<Navigate to="/app/mangaka/dashboard" replace />} />
              </Routes>
            </Suspense>
          </AppShell>
        </RoleGuard>
      } />

      <Route path="editor/*" element={
        <RoleGuard
          systemRole={effectiveClaims.systemRole}
          status={effectiveClaims.status}
          allowedRoles={[SYSTEM_ROLES.EDITOR]}
        >
          <AppShell
            sidebar={<RoleSidebar role="EDITOR" items={sidebarConfig.EDITOR} workspaceLabel="Editor Workspace" />}
            header={<AppHeader breadcrumb={[{ label: "Editor" }]} />}
          >
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="dashboard" element={<EditorDashboardPage />} />
                <Route path="series" element={<EditorAssignedSeriesPage />} />
                <Route path="series/:seriesId" element={<SeriesDetailPage />} />
                <Route path="series/:seriesId/manuscripts/:manuscriptId/review" element={<EditorReviewPage />} />
                <Route path="chapters/:chapterId/pages" element={<ChapterPagesPage />} />
                <Route path="pages/:pageId/workspace" element={<PageWorkspacePage />} />
                <Route path="*" element={<Navigate to="/app/editor/dashboard" replace />} />
              </Routes>
            </Suspense>
          </AppShell>
        </RoleGuard>
      } />

      <Route path="assistant/*" element={
        <RoleGuard
          systemRole={effectiveClaims.systemRole}
          status={effectiveClaims.status}
          allowedRoles={[SYSTEM_ROLES.ASSISTANT]}
        >
          <AppShell
            sidebar={<RoleSidebar role="ASSISTANT" items={sidebarConfig.ASSISTANT} workspaceLabel="Assistant Workspace" />}
            header={<AppHeader breadcrumb={[{ label: "Assistant" }]} />}
          >
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="dashboard" element={<AssistantDashboardPage />} />
                <Route path="tasks" element={<AssistantTaskListPage />} />
                <Route path="tasks/:taskId" element={<AssistantTaskDetailPage />} />
                <Route path="earnings" element={<AssistantEarningsPage />} />
                <Route path="*" element={<Navigate to="/app/assistant/dashboard" replace />} />
              </Routes>
            </Suspense>
          </AppShell>
        </RoleGuard>
      } />

      <Route path="board/*" element={
        <RoleGuard
          systemRole={effectiveClaims.systemRole}
          status={effectiveClaims.status}
          allowedRoles={[SYSTEM_ROLES.BOARD, SYSTEM_ROLES.ADMIN]}
        >
          <AppShell
            sidebar={<RoleSidebar role="BOARD" items={sidebarConfig.BOARD} workspaceLabel="Board Workspace" dark />}
            header={<AppHeader breadcrumb={[{ label: "Board" }]} />}
          >
            <div className="min-h-full bg-slate-950 -m-6 p-6">
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="dashboard" element={<BoardDashboardPage />} />
                  <Route path="series/:seriesId/review" element={<BoardSeriesReviewPage />} />
                  <Route path="ranking/import" element={<ImportRankingPage />} />
                  <Route path="ranking" element={<BoardRankingPage />} />
                  <Route path="*" element={<NotFoundPage homePath="/app/board/dashboard" />} />
                </Routes>
              </Suspense>
            </div>
          </AppShell>
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
