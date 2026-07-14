import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import { SiteFooter } from "@/shared/layout/shell/site-footer";
import { SiteHeader } from "@/shared/layout/shell/site-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MangaFlow — editorial workflow MVP" },
      {
        name: "description",
        content:
          "MangaFlow coordinates proposal review, board finalization, production tasks, publication, ranking, and at-risk decisions.",
      },
      { property: "og:title", content: "MangaFlow — editorial workflow MVP" },
      {
        property: "og:description",
        content: "A role-based manga production workflow for editorial teams.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground bg-paper-grain">
      <SiteHeader />
      <main className="mx-auto grid min-h-[calc(100vh-160px)] max-w-5xl place-items-center px-6 py-20">
        <section className="w-full rounded-lg border border-border bg-card/80 p-8 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Internal MVP
          </div>
          <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-none tracking-tight md:text-7xl">
            MangaFlow now starts from the role workspace.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">
            Public reader/catalog pages are intentionally outside this MVP slice. Use the app
            workspace to run the approved flow: Proposal → Board → Series → Chapter/Page → Task →
            Review → Publish → Ranking → At-risk.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90"
            >
              Sign in <ArrowRight className="size-3.5" />
            </Link>
            <Link
              to="/app/dashboard"
              className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
            >
              Open dashboard <BookOpen className="size-3.5" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
