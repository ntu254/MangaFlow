import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { MangakaLayout } from '@/components/layout/MangakaLayout'
import LoginPage from '@/pages/auth/LoginPage'
import AdminDashboard from '@/pages/admin/DashboardPage'
import UsersPage from '@/pages/admin/UsersPage'
import CreateUserPage from '@/pages/admin/CreateUserPage'
import BoardMembersPage from '@/pages/admin/BoardMembersPage'
import TaskTypesPage from '@/pages/admin/TaskTypesPage'
import MangakaDashboard from '@/pages/mangaka/DashboardPage'
import MangakaSeriesPage from '@/pages/mangaka/SeriesPage'
import MangakaSeriesDetailPage from '@/pages/mangaka/SeriesDetailPage'
import MangakaCreateSeriesPage from '@/pages/mangaka/CreateSeriesPage'
import AssistantDashboard from '@/pages/assistant/DashboardPage'
import EditorDashboard from '@/pages/editor/DashboardPage'
import BoardDashboard from '@/pages/board/DashboardPage'

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
          ]},
          // Assistant
          { path: 'assistant', element: <ProtectedRoute allowedRoles={['ASSISTANT']} />, children: [
            { path: 'dashboard', element: <AssistantDashboard /> },
          ]},
          // Editor
          { path: 'editor', element: <ProtectedRoute allowedRoles={['EDITOR']} />, children: [
            { path: 'dashboard', element: <EditorDashboard /> },
          ]},
          // Board
          { path: 'board', element: <ProtectedRoute allowedRoles={['BOARD']} />, children: [
            { path: 'dashboard', element: <BoardDashboard /> },
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
