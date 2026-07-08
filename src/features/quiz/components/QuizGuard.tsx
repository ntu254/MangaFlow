import { useAuth } from "@/features/auth/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export const QuizGuard = ({ children }: { children: React.ReactElement }) => {
  const { loading, quizCompleted } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
      </div>
    );
  }

  if (!quizCompleted) {
    return <>{children}</>;
  }

  return <Navigate to="/" replace />;
};
