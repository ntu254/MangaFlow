import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { ChevronDown, LockKeyhole, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BOARD_MEMBERS,
  ROLE_LABEL,
  loginAsRoleLive,
  loginWithCredentials,
  type Role,
} from "@/shared/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — MangaFlow Studio" },
      { name: "description", content: "Sign in to MangaFlow Studio." },
      { property: "og:title", content: "Sign in — MangaFlow Studio" },
      { property: "og:description", content: "Sign in to MangaFlow Studio." },
    ],
  }),
  component: LoginPage,
});

const ROLES: Role[] = ["admin", "mangaka", "assistant", "editor", "board"];

function LoginPage() {
  const navigate = useNavigate();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending("credentials");
    setError(null);
    try {
      await loginWithCredentials(email, password);
      navigate({ to: "/app/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setPending(null);
    }
  }

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
    <div className="min-h-[100dvh] bg-[#fffaf1] text-[#071225]" suppressHydrationWarning>
      <main className="grid min-h-[100dvh] lg:grid-cols-[42%_58%]">
        <section className="relative overflow-hidden border-b border-[#d8d2c5] bg-[#faf7ef] px-8 py-10 sm:px-12 lg:border-b-0 lg:border-r lg:px-16 lg:py-14">
          <div
            className="absolute bottom-0 left-0 h-72 w-full studio-login-storyboard"
            aria-hidden="true"
          />
          <div className="absolute bottom-7 left-8 flex items-center gap-2 text-sm font-medium sm:left-12 lg:left-16">
            <span className="size-3 rounded-full bg-[#b02c2c]" />
            Workspace online
          </div>
          <div className="absolute left-8 top-12 hidden items-center gap-3 lg:flex lg:-rotate-90 lg:origin-top-left lg:translate-y-[18rem]">
            <span className="h-12 w-px bg-[#b02c2c]" />
            <span className="text-[10px] font-bold tracking-[0.24em] text-[#b02c2c]">
              STUDIO EDITION · 2026
            </span>
          </div>

          <div className="relative z-10 mx-auto flex min-h-[20rem] max-w-md flex-col justify-center lg:min-h-[calc(100dvh-7rem)]">
            <div className="studio-login-mark" aria-hidden="true" />
            <p className="mt-7 font-serif text-6xl leading-none tracking-tight sm:text-7xl">
              MangaFlow
            </p>
            <div className="mt-8 h-0.5 w-full bg-[#b02c2c]" />
            <h2 className="mt-9 font-serif text-4xl leading-tight sm:text-5xl">
              Return to the studio.
            </h2>
            <dl className="mt-10 divide-y divide-[#d8d2c5] text-xs font-medium tracking-[0.12em] text-[#59616e]">
              <div className="flex items-center justify-between py-3">
                <dt>ACTIVE SERIES</dt>
                <dd className="text-base tracking-normal text-[#b02c2c]">12</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt>REVIEW QUEUE</dt>
                <dd className="text-base tracking-normal text-[#b02c2c]">08</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt>PAGES IN PRODUCTION</dt>
                <dd className="text-base tracking-normal text-[#b02c2c]">46</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="relative px-6 py-10 sm:px-12 lg:px-[10%] lg:py-12">
          <div className="flex items-center justify-between border-t border-[#071225] pt-3 text-[11px] font-bold tracking-[0.16em]">
            <span>01 / ACCESS</span>
            <span>MANGAFLOW STUDIO</span>
          </div>
          <div className="mx-auto flex min-h-[calc(100dvh-7rem)] max-w-[36rem] flex-col justify-center">
            <div className="max-w-md">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Sign in</h1>
              <form className="mt-9 space-y-5" onSubmit={signIn}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={pending !== null}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={pending !== null}
                    required
                  />
                </div>
                <p
                  aria-live="polite"
                  className={
                    error
                      ? "rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                      : "sr-only"
                  }
                >
                  {error}
                </p>
                <Button
                  className="h-12 w-full rounded-md bg-[#071225] text-base shadow-none hover:bg-[#16233a]"
                  type="submit"
                  disabled={pending !== null}
                >
                  {pending === "credentials" ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <Collapsible className="mt-8">
                <CollapsibleTrigger asChild>
                  <Button
                    className="h-16 w-full justify-between border-[#071225] bg-transparent px-5 text-base shadow-none hover:bg-[#faf7ef]"
                    type="button"
                    variant="outline"
                  >
                    <span className="flex items-center gap-3">
                      <Monitor className="size-5" />
                      Demo access
                    </span>
                    <ChevronDown className="size-5" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-5 border border-[#d8d2c5] bg-[#faf7ef] p-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ROLES.map((role) => (
                      <Button
                        key={role}
                        type="button"
                        variant="secondary"
                        onClick={() => pick(role)}
                        disabled={pending !== null}
                      >
                        {pending === role ? "Signing in..." : ROLE_LABEL[role]}
                      </Button>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Board members
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {BOARD_MEMBERS.map((member, index) => (
                        <Button
                          key={member.id}
                          type="button"
                          variant="outline"
                          onClick={() => pickBoard(index)}
                          disabled={pending !== null}
                          className="h-auto justify-start whitespace-normal px-3 py-2 text-left text-xs"
                        >
                          {member.name}
                          {member.isChair ? " (Chair)" : ""}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <p className="mt-6 flex items-center gap-2 text-sm text-[#667080]">
                <LockKeyhole className="size-4" /> Secure studio workspace
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
