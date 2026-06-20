import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/shared/ui/site/Logo";
import { ThemeToggle } from "@/shared/ui/site/ThemeToggle";
import { publicListSeries } from "@/shared/lib/public-api";

export const Route = createFileRoute("/read/")({
  component: ReaderHome,
});

function ReaderHome() {
  const series = publicListSeries();
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>
      <h1 className="mt-8 text-3xl font-bold tracking-tight">
        Read <span className="font-jp text-base font-normal text-foreground/50">· 読む</span>
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Free chapters from the MangaFlow line.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {series.map((s) => (
          <Link key={s.id} to="/read/$slug" params={{ slug: s.slug }} className="group">
            <div className="overflow-hidden rounded-md border border-foreground/10">
              <img
                src={s.cover}
                alt={s.title}
                className="aspect-[3/4] w-full object-cover transition group-hover:scale-[1.03]"
              />
            </div>
            <div className="mt-2 text-sm font-semibold">{s.title}</div>
            <div className="font-jp text-[11px] text-foreground/55">{s.jp}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
