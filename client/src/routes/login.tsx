import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/shared/layout/shell/site-header";
import { RoleBadge } from "@/entities/user";
import {
  BOARD_MEMBERS,
  ROLE_DESCRIPTION,
  ROLE_LABEL,
  loginAsRoleLive,
  loginWithCredentials,
  type Role,
} from "@/shared/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — beachRead" },
      { name: "description", content: "Sign in to beachRead Studio with a demo role." },
      { property: "og:title", content: "Sign in — beachRead" },
      { property: "og:description", content: "Sign in with a demo role to explore the workspace." },
    ],
  }),
  component: LoginPage,
});

const ROLES: Role[] = ["admin", "mangaka", "assistant", "editor", "board"];

function LoginPage() {
  const navigate = useNavigate();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick(role: Role) {
    setPending(role);
    setError(null);
    try {
      await loginAsRoleLive(role);
      navigate({ to: "/app/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setPending(null);
    }
  }

  async function pickBoard(idx: number) {
    const member = BOARD_MEMBERS[idx];
    setPending(member.id);
    setError(null);
    try {
      await loginWithCredentials(member.email, member.email);
      navigate({ to: "/app/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="min-h-screen bg-background bg-paper-grain" suppressHydrationWarning>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Demo workspace
        </p>
        <h1 className="mt-2 font-serif text-5xl leading-tight">
          Enter the studio.
          <br />
          Choose a role to get started.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          The live backend is using seeded accounts from the Express API. Each role still opens its
          own dashboard and menu set.
        </p>
        {error ? (
          <div className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => pick(role)}
              disabled={pending !== null}
              className="group flex items-start justify-between gap-4 rounded-md border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md"
            >
              <div className="min-w-0">
                <RoleBadge role={role} />
                <h3 className="mt-3 font-serif text-2xl">{ROLE_LABEL[role]}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{ROLE_DESCRIPTION[role]}</p>
              </div>
              <span className="self-end text-xs font-medium text-muted-foreground group-hover:text-foreground">
                {pending === role ? "Signing in" : "Enter →"}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-border bg-card/40 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Quick select a Board member (5 people)
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Use this to demo 3/5 quorum, tie-breaks, and the Editor-in-chief tie-break vote.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {BOARD_MEMBERS.map((m, i) => (
              <button
                key={m.id}
                onClick={() => pickBoard(i)}
                disabled={pending !== null}
                className="flex items-center justify-between gap-3 rounded border border-border bg-background px-3 py-2 text-left text-xs hover:bg-muted"
              >
                <span>
                  <span className="font-semibold">{m.name}</span>
                  {m.isChair ? (
                    <span className="ml-2 rounded bg-fuchsia-100 px-1.5 text-[10px] font-bold text-fuchsia-900">
                      Chair
                    </span>
                  ) : null}
                </span>
                <span className="text-muted-foreground">{m.email}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
