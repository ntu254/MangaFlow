import { useCallback } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function useQuizRedirect() {
  const { quizCompleted, loading } = useAuth();

  const requireQuiz = useCallback(
    (fallback = "/quiz") => {
      if (loading) return null;
      return quizCompleted ? null : fallback;
    },
    [loading, quizCompleted]
  );

  return {
    requireQuiz,
    loading,
  };
}

export function RedirectIfQuizDone({ children }: { children: React.ReactElement }) {
  const { requireQuiz, loading } = useQuizRedirect();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="w-3 h-3 rounded-full bg-accent animate-ping" />
      </div>
    );
  }

  const to = requireQuiz("/quiz");
  if (to) {
    return <Navigate to={to} replace state={{ from: location.pathname }} />;
  }

  return children;
}
