import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useNavigate, useLocation } from "react-router-dom";

import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { AdminAuthProvider } from "@/features/admin/hooks/useAdminAuth";
import { AdminAuthGuard, AdminLayout } from "@/features/admin/components";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/useAuth";

// Custom lazy loader that force-refreshes the page once if a chunk fails to load
// This prevents the app from crashing when a new version is deployed and users are on an old cached version
function lazyWithRetry(componentImport: () => Promise<any>) {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem("page-has-been-force-refreshed") || "false"
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem("page-has-been-force-refreshed", "false");
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // Assume that the error is because of a new deployment (chunk not found)
        window.sessionStorage.setItem("page-has-been-force-refreshed", "true");
        window.location.reload();
        // Return a never-resolving promise so React doesn't crash before the reload happens
        return new Promise<any>(() => {});
      }
      throw error;
    }
  });
}

const Login = lazyWithRetry(() => import("@/features/auth/pages/LoginPage"));
const AuthCallback = lazyWithRetry(() => import("@/features/auth/pages/AuthCallbackPage"));
const ForgotPassword = lazyWithRetry(() => import("@/features/auth/pages/ForgotPasswordPage"));
const ResetPassword = lazyWithRetry(() => import("@/features/auth/pages/ResetPasswordPage"));
const SignUp = lazyWithRetry(() => import("@/features/auth/pages/SignUpPage"));
const Index = lazyWithRetry(() => import("@/features/landing/pages"));
const Profile = lazyWithRetry(() => import("@/features/profile/pages/ProfilePage"));
const Quiz = lazyWithRetry(() => import("@/features/quiz/pages"));
const OutfitBuilder = lazyWithRetry(() => import("@/features/outfit-builder/pages"));
const Recommender = lazyWithRetry(() => import("@/features/recommender/pages"));
const StyleProfile = lazyWithRetry(() => import("@/features/style-profile/pages"));
const Trends = lazyWithRetry(() => import("@/features/trends/pages/TrendsPage"));
const Wardrobe = lazyWithRetry(() => import("@/features/wardrobe/pages"));
const SavedAiOutfits = lazyWithRetry(() => import("@/features/wardrobe/pages").then((m) => ({ default: m.SavedAiOutfitsPage })));
const PricingPage = lazyWithRetry(() => import("@/features/subscription/pages/PricingPage"));
const PaymentResultPage = lazyWithRetry(() => import("@/features/subscription/pages/PaymentResultPage"));
const NotFound = lazyWithRetry(() => import("@/pages/NotFound"));

const AdminLoginPage = lazyWithRetry(() => import("@/features/admin/pages").then((module) => ({ default: module.AdminLoginPage })));
const AdminDashboard = lazyWithRetry(() => import("@/features/admin/pages").then((module) => ({ default: module.AdminDashboard })));
const AdminUsers = lazyWithRetry(() => import("@/features/admin/pages").then((module) => ({ default: module.AdminUsers })));
const AdminAiEngine = lazyWithRetry(() => import("@/features/admin/pages").then((module) => ({ default: module.AdminAiEngine })));
const AdminProducts = lazyWithRetry(() => import("@/features/admin/pages").then((module) => ({ default: module.AdminProducts })));
const AdminTrends = lazyWithRetry(() => import("@/features/admin/pages").then((module) => ({ default: module.AdminTrends })));
const AdminPlansBilling = lazyWithRetry(() => import("@/features/admin/pages").then((module) => ({ default: module.AdminPlansBilling })));
const AdminAnalytics = lazyWithRetry(() => import("@/features/admin/pages").then((module) => ({ default: module.AdminAnalytics })));
const AdminNotifications = lazyWithRetry(() => import("@/features/admin/pages").then((module) => ({ default: module.AdminNotifications })));
const AdminFeedback = lazyWithRetry(() => import("@/features/admin/pages").then((module) => ({ default: module.AdminFeedback })));
const AdminSettings = lazyWithRetry(() => import("@/features/admin/pages").then((module) => ({ default: module.AdminSettings })));
const AdminSurvey = lazyWithRetry(() => import("@/features/admin/pages/AdminSurvey"));

function RouteLoadingFallback() {
  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background font-heading text-lg italic">
            R
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-lg font-semibold text-foreground">Redo</p>
            <p className="text-xs font-body text-muted-foreground">Đang chuẩn bị trải nghiệm của bạn</p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <Skeleton className="h-3 w-11/12 rounded-full" />
          <Skeleton className="h-3 w-8/12 rounded-full" />
          <div className="grid grid-cols-3 gap-2 pt-2">
            <Skeleton className="aspect-square rounded-xl" />
            <Skeleton className="aspect-square rounded-xl" />
            <Skeleton className="aspect-square rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuizRedirectHandler() {
  const { session, quizCompleted, loading, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    // If logged in, has not completed quiz, not an admin
    if (session && !quizCompleted && role !== "admin") {
      const path = location.pathname;
      const allowedPaths = [
        "/quiz",
        "/login",
        "/signup",
        "/auth/callback",
        "/forgot-password",
        "/reset-password",
        "/pricing",
        "/payment/result",
      ];
      const isAdminPath = path.startsWith("/admin");
      // Also skip if the path itself is /auth/callback (handles OAuth return race)
      if (!allowedPaths.includes(path) && !isAdminPath) {
        navigate("/quiz", { replace: true, state: { from: path } });
      }
    }
  }, [session, quizCompleted, loading, role, location.pathname, navigate]);

  return null;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <QuizRedirectHandler />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/recommender" element={<Recommender />} />
          <Route path="/outfit-builder" element={<OutfitBuilder />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/style-profile" element={<ProtectedRoute><StyleProfile /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment/result" element={<PaymentResultPage />} />
          <Route path="/wardrobe" element={<ProtectedRoute><Wardrobe /></ProtectedRoute>} />
          <Route path="/wardrobe/ai-collection" element={<ProtectedRoute><SavedAiOutfits /></ProtectedRoute>} />

          <Route path="/admin/login" element={<AdminAuthProvider><AdminLoginPage /></AdminAuthProvider>} />
          <Route path="/admin" element={<AdminAuthProvider><AdminAuthGuard><AdminLayout /></AdminAuthGuard></AdminAuthProvider>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="ai-engine" element={<AdminAiEngine />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="trends" element={<AdminTrends />} />
            <Route path="plans" element={<AdminPlansBilling />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="survey" element={<AdminSurvey />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
