import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { LoginView } from "@/features/auth/components/LoginView";

export const Route = createFileRoute("/login")({
  validateSearch: z
    .object({
      redirect: z.string().optional(),
    })
    .partial()
    .optional()
    .catch({}),
  head: () => ({
    meta: [
      { title: "Sign in — MangaFlow" },
      {
        name: "description",
        content: "Sign in to MangaFlow to access the production console.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const search = useSearch({ from: "/login" }) as { redirect?: string } | undefined;
  const navigate = useNavigate();
  return (
    <LoginView
      onLoggedIn={() => {
        const target = search?.redirect ?? "/app";
        navigate({ to: target as any, replace: true });
      }}
    />
  );
}
