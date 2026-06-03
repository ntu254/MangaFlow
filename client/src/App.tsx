import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { useAuthClaims } from "@/shared/hooks/useAuthClaims";
import { RoleGuard } from "@/shared/components/RoleGuard";
import { RoleRedirect } from "@/features/auth/RoleRedirect";
import { SYSTEM_ROLES } from "@/shared/constants/roles";
import { NotFoundPage } from "@/shared/components/feedback/NotFoundPage";
import { HomeGate } from "@/shared/components/HomeGate";
import { AppShell } from "@/shared/components/layout/AppShell";
import { RoleSidebar, sidebarConfig } from "@/shared/components/navigation/RoleSidebar";
import { AppHeader } from "@/shared/components/navigation/AppHeader";
import { PlaceholderPage } from "@/shared/components/feedback/PlaceholderPage";
import { SignInPage } from "@/features/auth/routes/SignInPage";
import { OAuthCallback } from "@/features/auth/routes/OAuthCallback";
import {
  Users,
  HardDrive,
  History,
  Activity,
  Layers,
  FolderOpen,
  FileImage,
  MessageSquare,
  RefreshCw,
  CheckSquare,
  ThumbsUp,
  Upload,
  AlertTriangle,
  FileText,
  Scale,
  Wallet,
  Bell,
  User,
  Settings,
  BookOpen,
  ClipboardList,
  Send,
  BarChart3,
} from "lucide-react";
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
const NotificationsPage = lazy(() =>
  import("@/features/notification").then(m => ({ default: m.NotificationsPage }))
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

      {/* Common Authenticated Routes */}
      <Route path="notifications" element={
        <AppShell
          sidebar={<RoleSidebar role={effectiveClaims.systemRole || ""} items={sidebarConfig[effectiveClaims.systemRole || ""] || []} workspaceLabel={`${effectiveClaims.systemRole || "User"} Workspace`} />}
          header={<AppHeader breadcrumb={[{ label: "Notifications" }]} />}
        >
          <Suspense fallback={<LoadingScreen />}>
            <NotificationsPage />
          </Suspense>
        </AppShell>
      } />

      <Route path="profile" element={
        <AppShell
          sidebar={<RoleSidebar role={effectiveClaims.systemRole || ""} items={sidebarConfig[effectiveClaims.systemRole || ""] || []} workspaceLabel={`${effectiveClaims.systemRole || "User"} Workspace`} />}
          header={<AppHeader breadcrumb={[{ label: "Profile" }]} />}
        >
          <PlaceholderPage
            title="User Profile"
            description="Manage your profile information, view your role claims, and review your series memberships."
            icon={User}
          />
        </AppShell>
      } />

      <Route path="settings" element={
        <AppShell
          sidebar={<RoleSidebar role={effectiveClaims.systemRole || ""} items={sidebarConfig[effectiveClaims.systemRole || ""] || []} workspaceLabel={`${effectiveClaims.systemRole || "User"} Workspace`} />}
          header={<AppHeader breadcrumb={[{ label: "Settings" }]} />}
        >
          <PlaceholderPage
            title="Account Settings"
            description="Customize your account security, notification triggers, system theme, and language preferences."
            icon={Settings}
          />
        </AppShell>
      } />

      {/* Admin Routes */}
      <Route path="admin/*" element={
        <RoleGuard
          systemRole={effectiveClaims.systemRole}
          status={effectiveClaims.status}
          allowedRoles={[SYSTEM_ROLES.ADMIN]}
        >
          <AppShell
            sidebar={<RoleSidebar role="ADMIN" items={sidebarConfig.ADMIN} workspaceLabel="Admin Workspace" />}
            header={<AppHeader />}
          >
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminRoleReviewPage getToken={getToken} />} />
                <Route path="users/role-review" element={<AdminRoleReviewPage getToken={getToken} />} />
                <Route path="series" element={<PlaceholderPage title="All Series" description="View and manage all series across the system." icon={BookOpen} />} />
                <Route path="board/members" element={<PlaceholderPage title="Board Members" description="Manage Editorial Board members and Board Chair assignments." icon={Users} />} />
                <Route path="task-rates" element={<AdminTaskRatesPage />} />
                <Route path="ranking" element={<PlaceholderPage title="Ranking" description="Monitor system-wide ranking metrics and adjust ranking parameters." icon={BarChart3} />} />
                <Route path="payroll" element={<PlaceholderPage title="System Payroll" description="Overview of system-wide payouts, balances, and payroll disbursements." icon={Wallet} />} />
                <Route path="storage" element={<PlaceholderPage title="Storage Management" description="Monitor file count, Cloudflare R2 / MinIO storage usage and bandwidth." icon={HardDrive} />} />
                <Route path="audit-logs" element={<PlaceholderPage title="Audit Logs" description="View system-wide action logs, security histories, and change records." icon={History} />} />
                <Route path="system-health" element={<PlaceholderPage title="System Health" description="Check API server, database replica sets, AI service, and storage health." icon={Activity} />} />
                <Route path="*" element={<Navigate to="/app/admin/dashboard" replace />} />
              </Routes>
            </Suspense>
          </AppShell>
        </RoleGuard>
      } />

      {/* Mangaka Routes */}
      <Route path="mangaka/*" element={
        <RoleGuard
          systemRole={effectiveClaims.systemRole}
          status={effectiveClaims.status}
          allowedRoles={[SYSTEM_ROLES.MANGAKA]}
        >
          <AppShell
            sidebar={<RoleSidebar role="MANGAKA" items={sidebarConfig.MANGAKA} workspaceLabel="Mangaka Workspace" />}
            header={<AppHeader />}
          >
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="dashboard" element={<MangakaDashboardPage />} />
                <Route path="series" element={<SeriesListPage />} />
                <Route path="series/new" element={<CreateSeriesPage />} />
                <Route path="series/:seriesId" element={<SeriesDetailPage />} />
                <Route path="manuscripts" element={<PlaceholderPage title="Manuscripts" description="Upload, review, and organize series manuscripts." icon={Layers} />} />
                <Route path="chapters" element={<PlaceholderPage title="Chapters" description="Manage your chapters, deadlines, and release flow." icon={FolderOpen} />} />
                <Route path="pages" element={<PlaceholderPage title="Pages" description="Upload chapter pages and review AI bubble segmentations." icon={FileImage} />} />
                <Route path="chapters/:chapterId/pages" element={<ChapterPagesPage />} />
                <Route path="pages/:pageId/workspace" element={<PageWorkspacePage />} />
                <Route path="tasks" element={<MangakaTaskListPage />} />
                <Route path="submissions" element={<MangakaSubmissionsPage />} />
                <Route path="comments" element={<PlaceholderPage title="Comments" description="Track, verify, and resolve assistant feedback and editor comments." icon={MessageSquare} />} />
                <Route path="ranking" element={<MangakaRankingPage />} />
                <Route path="payroll" element={<MangakaPayrollPage />} />
                <Route path="*" element={<Navigate to="/app/mangaka/dashboard" replace />} />
              </Routes>
            </Suspense>
          </AppShell>
        </RoleGuard>
      } />

      {/* Editor Routes */}
      <Route path="editor/*" element={
        <RoleGuard
          systemRole={effectiveClaims.systemRole}
          status={effectiveClaims.status}
          allowedRoles={[SYSTEM_ROLES.EDITOR]}
        >
          <AppShell
            sidebar={<RoleSidebar role="EDITOR" items={sidebarConfig.EDITOR} workspaceLabel="Editor Workspace" />}
            header={<AppHeader />}
          >
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="dashboard" element={<EditorDashboardPage />} />
                <Route path="series" element={<EditorAssignedSeriesPage />} />
                <Route path="series/:seriesId" element={<SeriesDetailPage />} />
                <Route path="series/:seriesId/manuscripts/:manuscriptId/review" element={<EditorReviewPage />} />
                <Route path="chapters/:chapterId/pages" element={<ChapterPagesPage />} />
                <Route path="pages/:pageId/workspace" element={<PageWorkspacePage />} />
                <Route path="manuscripts" element={<PlaceholderPage title="Manuscript Review" description="Review uploaded manuscripts, add recommendations, and verify drafts." icon={FileText} />} />
                <Route path="chapters" element={<PlaceholderPage title="Chapter Review" description="Verify chapter progress and track deadlines." icon={FolderOpen} />} />
                <Route path="pages" element={<PlaceholderPage title="Page Review" description="Review chapter pages and check layout quality." icon={FileImage} />} />
                <Route path="comments" element={<PlaceholderPage title="Comments" description="Resolve, reopen, or reply to mangaka comments and annotations." icon={MessageSquare} />} />
                <Route path="tasks" element={<PlaceholderPage title="Tasks" description="Track editor-created tasks and assistant progress." icon={ClipboardList} />} />
                <Route path="submissions" element={<PlaceholderPage title="Submissions" description="Review assistant submissions and provide feedback." icon={Send} />} />
                <Route path="ranking" element={<PlaceholderPage title="Ranking" description="Monitor series ranking data and support rankings." icon={BarChart3} />} />
                <Route path="ranking-support" element={<PlaceholderPage title="Ranking Support" description="Analyze and manage data protecting series at-risk." icon={BarChart3} />} />
                <Route path="payroll" element={<PlaceholderPage title="Payroll" description="View contributor payouts and payment summaries." icon={Wallet} />} />
                <Route path="publication" element={<PlaceholderPage title="Publication" description="Perform publication checks and verify release readiness checklist." icon={CheckSquare} />} />
                <Route path="*" element={<Navigate to="/app/editor/dashboard" replace />} />
              </Routes>
            </Suspense>
          </AppShell>
        </RoleGuard>
      } />

      {/* Assistant Routes */}
      <Route path="assistant/*" element={
        <RoleGuard
          systemRole={effectiveClaims.systemRole}
          status={effectiveClaims.status}
          allowedRoles={[SYSTEM_ROLES.ASSISTANT]}
        >
          <AppShell
            sidebar={<RoleSidebar role="ASSISTANT" items={sidebarConfig.ASSISTANT} workspaceLabel="Assistant Workspace" />}
            header={<AppHeader />}
          >
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="dashboard" element={<AssistantDashboardPage />} />
                <Route path="tasks" element={<AssistantTaskListPage />} />
                <Route path="tasks/:taskId" element={<AssistantTaskDetailPage />} />
                <Route path="submissions" element={<PlaceholderPage title="My Submissions" description="Review your complete submission history and status updates." icon={Send} />} />
                <Route path="revisions" element={<PlaceholderPage title="Revisions" description="View and address tasks that have been returned for revision." icon={RefreshCw} />} />
                <Route path="comments" element={<PlaceholderPage title="Comments" description="View and respond to feedback on your submissions." icon={MessageSquare} />} />
                <Route path="ranking" element={<PlaceholderPage title="Ranking" description="View ranking standings and performance metrics." icon={BarChart3} />} />
                <Route path="payroll" element={<AssistantEarningsPage />} />
                <Route path="earnings" element={<AssistantEarningsPage />} />
                <Route path="*" element={<Navigate to="/app/assistant/dashboard" replace />} />
              </Routes>
            </Suspense>
          </AppShell>
        </RoleGuard>
      } />

      {/* Board Routes */}
      <Route path="board/*" element={
        <RoleGuard
          systemRole={effectiveClaims.systemRole}
          status={effectiveClaims.status}
          allowedRoles={[SYSTEM_ROLES.BOARD, SYSTEM_ROLES.ADMIN]}
        >
          <AppShell
            sidebar={<RoleSidebar role="BOARD" items={sidebarConfig.BOARD} workspaceLabel="Board Workspace" dark />}
            header={<AppHeader />}
          >
            <div className="min-h-full bg-slate-950 -m-6 p-6">
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="dashboard" element={<BoardDashboardPage />} />
                  <Route path="series-approvals" element={<PlaceholderPage title="Series Approvals" description="Review editor recommendations and approve new series proposals." icon={CheckSquare} />} />
                  <Route path="votes" element={<PlaceholderPage title="My Votes" description="Submit and monitor votes on active series proposals." icon={ThumbsUp} />} />
                  <Route path="series/:seriesId/review" element={<BoardSeriesReviewPage />} />
                  <Route path="ranking/import" element={<ImportRankingPage />} />
                  <Route path="ranking" element={<BoardRankingPage />} />
                  <Route path="publication" element={<PlaceholderPage title="Publication Decisions" description="Decide weekly and monthly publishing runs." icon={CheckSquare} />} />
                  <Route path="at-risk" element={<PlaceholderPage title="At-Risk Series" description="Monitor ranking metrics and series at risk of discontinuation." icon={AlertTriangle} />} />
                  <Route path="decisions" element={<PlaceholderPage title="Board Decisions" description="History of Editorial Board voting outcomes and official directives." icon={History} />} />
                  <Route path="tie-breaks" element={<PlaceholderPage title="Tie-break Queue" description="Resolve tied board votes as Board Chair." icon={Scale} />} />
                  <Route path="payroll" element={<PlaceholderPage title="Payroll" description="View board-related compensation and payout records." icon={Wallet} />} />
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

function App() {
  return (
    <Routes>
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/" element={<HomeGate />} />
      <Route path="/app/*" element={<AuthenticatedApp />} />
      <Route path="*" element={<NotFoundPage homePath="/" />} />
    </Routes>
  );
}

export default App;
