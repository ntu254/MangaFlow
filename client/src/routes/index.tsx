import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute'
import { AppLayout } from '@/shared/components/layout/AppLayout'
import { MangakaLayout } from '@/shared/components/layout/MangakaLayout'
import LoginPage from '@/app/auth/LoginPage'
import AdminDashboard from '@/app/admin/DashboardPage'
import UsersPage from '@/app/admin/UsersPage'
import CreateUserPage from '@/app/admin/CreateUserPage'
import BoardMembersPage from '@/app/admin/BoardMembersPage'
import TaskTypesPage from '@/app/admin/TaskTypesPage'
import AuditLogsPage from '@/app/admin/AuditLogsPage'
import MangakaDashboard from '@/app/mangaka/DashboardPage'
import MangakaSeriesPage from '@/app/mangaka/SeriesPage'
import MangakaSeriesDetailPage from '@/app/mangaka/SeriesDetailPage'
import MangakaCreateSeriesPage from '@/app/mangaka/CreateSeriesPage'
import AssistantDashboard from '@/app/assistant/DashboardPage'
import EditorDashboard from '@/app/editor/DashboardPage'
import EditorReviewQueuePage from '@/app/editor/ReviewQueuePage'
import EditorSeriesReviewPage from '@/app/editor/SeriesReviewPage'
import BoardDashboard from '@/app/board/DashboardPage'
import BoardSeriesReviewPage from '@/app/board/SeriesReviewPage'
import BoardSeriesSummaryPage from '@/app/board/SeriesSummaryPage'
import PageStudioPage from '@/app/mangaka/PageStudioPage'
import TaskStudioPage from '@/app/assistant/TaskStudioPage'
import MangakaReviewQueuePage from '@/app/mangaka/ReviewQueuePage'
import MangakaTaskReviewPage from '@/app/mangaka/TaskReviewPage'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to='/login' replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/unauthorized', element: <div className='flex items-center justify-center h-screen'><p className='text-muted-foreground'>403 - Unauthorized</p></div> },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Admin
          { path: 'admin', element: <ProtectedRoute allowedRoles={['ADMIN']} />, children: [
            { path: 'dashboard', element: <AdminDashboard /> },
            { path: 'users', element: <UsersPage /> },
            { path: 'users/create', element: <CreateUserPage /> },
            { path: 'board-members', element: <BoardMembersPage /> },
            { path: 'task-types', element: <TaskTypesPage /> },
            { path: 'audit-logs', element: <AuditLogsPage /> },
          ]},
          // Assistant
          { path: 'assistant', element: <ProtectedRoute allowedRoles={['ASSISTANT']} />, children: [
            { path: 'dashboard', element: <AssistantDashboard /> },
            { path: 'tasks/:taskId/studio', element: <TaskStudioPage /> },
          ]},
          // Editor
          { path: 'editor', element: <ProtectedRoute allowedRoles={['EDITOR']} />, children: [
            { path: 'dashboard', element: <EditorDashboard /> },
            { path: 'manuscripts', element: <EditorReviewQueuePage /> },
            { path: 'manuscripts/review-queue', element: <EditorReviewQueuePage /> },
            { path: 'series/:id/review', element: <EditorSeriesReviewPage /> },
            { path: 'pages/:pageId/studio', element: <PageStudioPage /> },
          ]},
          // Board
          { path: 'board', element: <ProtectedRoute allowedRoles={['BOARD']} />, children: [
            { path: 'dashboard', element: <BoardDashboard /> },
            { path: 'series', element: <BoardSeriesReviewPage /> },
            { path: 'series-review', element: <BoardSeriesReviewPage /> },
            { path: 'series/:id/summary', element: <BoardSeriesSummaryPage /> },
            { path: 'series/:id/voting', element: <BoardSeriesSummaryPage /> },
          ]},
        ],
      },
      {
        element: <MangakaLayout />,
        children: [
          // Mangaka
          { path: 'mangaka', element: <ProtectedRoute allowedRoles={['MANGAKA']} />, children: [
            { path: 'dashboard', element: <MangakaDashboard /> },
            { path: 'series', element: <MangakaSeriesPage /> },
            { path: 'series/create', element: <MangakaCreateSeriesPage /> },
            { path: 'series/:id', element: <MangakaSeriesDetailPage /> },
            { path: 'pages/:pageId/studio', element: <PageStudioPage /> },
            { path: 'reviews', element: <MangakaReviewQueuePage /> },
            { path: 'tasks/:taskId/review', element: <MangakaTaskReviewPage /> },
            { path: 'inbox', element: <div className="p-6">Inbox content</div> },
            { path: 'ranking', element: <div className="p-6">Ranking content</div> },
            { path: 'payroll', element: <div className="p-6">Payroll content</div> },
          ]},
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
