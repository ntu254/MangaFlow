import { useAuth } from "@/shared/hooks/useAuth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiBaseUrl } from "@/shared/api";
import {
  BookOpen,
  PencilLine,
  FileCheck,
  Users,
  Loader2,
} from "lucide-react";
import { resolveAuthRoute, type SystemRole } from "@/features/auth/auth-flow";

type RoleOption = {
  value: SystemRole;
  label: string;
  description: string;
  icon: typeof BookOpen;
  color: string;
};

const roleOptions: RoleOption[] = [
  {
    value: "MANGAKA",
    label: "Mangaka",
    description: "Create series, manage chapters, and track your manga production.",
    icon: PencilLine,
    color: "bg-[#ece5ff] text-[#9065d5] border-[#eadff6]",
  },
  {
    value: "ASSISTANT",
    label: "Assistant",
    description: "Work on assigned tasks for regions and annotations.",
    icon: BookOpen,
    color: "bg-[#ffe6f2] text-[#e560bc] border-[#f3d7e7]",
  },
  {
    value: "EDITOR",
    label: "Editor",
    description: "Review and approve chapters and manuscripts.",
    icon: FileCheck,
    color: "bg-[#fff0dc] text-[#d97706] border-[#fde68a]",
  },
];

export function OnboardingPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<SystemRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!selectedRole) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Not authenticated");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`${apiBaseUrl}/auth/complete-onboarding`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestedSystemRole: selectedRole,
        }),
      });

      const body = await response.json();

      if (!response.ok || !body.success) {
        setError(body.message || "Failed to complete onboarding");
        setIsSubmitting(false);
        return;
      }

      const destination = resolveAuthRoute({
        isSignedIn: true,
        user: { systemRole: body.data.user?.systemRole ?? selectedRole, status: "ACTIVE" },
      });
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fff9fb] flex items-center justify-center px-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <Badge variant="outline" className="text-[#9065d5] border-[#eadff6] mb-3">
            Welcome to MangaFlow
          </Badge>
          <h1 className="text-3xl font-bold text-[#2f243a] mb-3">Choose Your Role</h1>
          <p className="text-[#5f5270] text-sm">
            Select the role that best describes how you'll use MangaFlow.
            You'll be assigned to a team by an administrator.
          </p>
        </div>

        {error && (
          <div className="bg-[#ffe7de] border border-[#ff7196]/30 p-4 rounded-xl text-[#e15f2f] text-sm mb-6">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          {roleOptions.map((role) => (
            <button
              key={role.value}
              onClick={() => setSelectedRole(role.value)}
              disabled={isSubmitting}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                ${
                  selectedRole === role.value
                    ? "border-[#9065d5] bg-[#f8f1ff] shadow-[0_4px_16px_rgba(144,101,213,0.12)]"
                    : "border-[#eadff6] bg-white hover:border-[#d4c4ee] hover:shadow-sm"
                }
                ${isSubmitting ? "opacity-60" : ""}
              `}
            >
              <div className={`p-2 rounded-lg border ${role.color}`}>
                <role.icon className="size-5" />
              </div>
              <div>
                <div className="font-semibold text-[#2f243a] text-sm">{role.label}</div>
                <div className="text-xs text-[#5f5270] mt-0.5">{role.description}</div>
              </div>
            </button>
          ))}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!selectedRole || isSubmitting}
          className="w-full bg-[#9065d5] text-white hover:bg-[#7f55c7] py-6 text-base font-medium"
        >
          {isSubmitting ? (
            <Loader2 className="size-5 animate-spin mr-2" />
          ) : null}
          {isSubmitting ? "Setting up..." : "Continue with Selected Role"}
        </Button>
      </div>
    </div>
  );
}
