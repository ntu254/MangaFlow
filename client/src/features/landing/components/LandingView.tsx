import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Search,
  User,
  Bookmark,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Newspaper,
  Instagram,
  Youtube,
  Twitter,
  Waves,
} from "lucide-react";
import heroBg from "@/shared/assets/hero-vagabond.jpg";
import { ranking, featured, recent, news } from "@/entities";
import { ThemeProvider } from "@/shared/lib/theme";
import { Logo } from "@/shared/ui/site/Logo";
import { ThemeToggle } from "@/shared/ui/site/ThemeToggle";

function Header() {
  return (
    <header className="relative z-30 border-b border-foreground/10 bg-background">
      <div className="mx-auto flex h-14 w-full max-w-[1920px] items-center justify-between gap-6 px-6 text-foreground lg:px-10 xl:px-12">
        <Logo />
        <div className="mx-auto flex h-8 w-full max-w-[520px] items-center gap-2 rounded-md border border-foreground/15 bg-foreground/5 px-3 text-xs text-foreground/60">
          <Search className="h-3.5 w-3.5" />
          <span>Search for a manga or author</span>
        </div>
        <nav className="flex items-center gap-6 text-[13px] text-foreground/80">
          <a href="#">Catalog</a>
          <a href="#">Discover</a>
          <a href="#">Merch</a>
        </nav>
        <ThemeToggle />
        <Link
          to="/login"
          className="flex h-8 items-center gap-2 rounded-md border border-foreground/15 px-3 text-xs font-semibold text-foreground/80 hover:bg-foreground/5 transition-colors"
        >
          <User className="h-3.5 w-3.5" />
          <span>Sign In</span>
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[640px] w-full">
        <img
          src={heroBg}
          alt="Vagabond hero"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-90 dark:opacity-70 mix-blend-multiply dark:mix-blend-screen"
        />
        {/* gradient overlays - bottom fade to page */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />

        <div className="relative mx-auto h-full max-w-[1280px] px-6 pt-24">
          <p className="text-lg font-semibold tracking-tight text-foreground">Trending Now</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Seinen", "Drama", "Epic", "Martial Arts"].map((t) => (
              <span
                key={t}
                className="rounded-md border border-foreground/20 bg-foreground/5 px-2.5 py-1 text-[11px] text-foreground/80"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="mt-3 max-w-md text-[12px] leading-relaxed text-foreground/70">
            The story starts in 1600, in the aftermath of the decisive Battle of Sekigahara. Two
            17-year-old teenagers who joined the losing side, Takezō Shinmen and Matahachi Hon'iden,
            lie wounded in the battlefield and pursued by survivor hunters. They manage to escape
            and swear to become "Invincible Under The Heavens".
          </p>
          <h1 className="mt-10 text-[112px] font-extrabold leading-[0.95] tracking-tight text-foreground">
            Vagabond
          </h1>
          <p className="mt-2 font-jp text-3xl text-foreground/90">バガボンド</p>
          <div className="mt-6 flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Chapter 1 <ArrowRight className="h-4 w-4" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-md border border-foreground/20 bg-foreground/5 text-foreground/80">
              <Bookmark className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function RankingRow({ item }: { item: (typeof ranking)[number] }) {
  return (
    <div className="grid grid-cols-[28px_44px_1fr_80px_80px] items-center gap-3 py-2 text-[13px]">
      <span className="text-foreground/60">{item.rank}</span>
      <img
        src={item.cover}
        alt={item.title}
        loading="lazy"
        className="h-12 w-9 rounded-sm object-cover"
      />
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{item.title}</div>
        <div className="truncate font-jp text-[11px] text-foreground/55">{item.romaji}</div>
      </div>
      <span className="text-right text-foreground/70">{item.chapters}</span>
      <span className="text-right text-foreground/70">{item.reads}</span>
    </div>
  );
}

function Ranking() {
  const left = ranking.slice(0, 5);
  const right = ranking.slice(5);
  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-2">
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-md border border-foreground/15 bg-foreground/5 p-0.5 text-xs">
          <button className="rounded-[5px] bg-primary px-3 py-1 text-primary-foreground">
            Trending
          </button>
          <button className="px-3 py-1 text-foreground/70">Top</button>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="inline-flex rounded-md border border-foreground/15 bg-foreground/5 p-0.5">
            {["1d", "7d", "30d", "1y"].map((p, i) => (
              <button
                key={p}
                className={`rounded-[5px] px-2.5 py-1 ${i === 0 ? "bg-primary text-primary-foreground" : "text-foreground/70"}`}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-1 rounded-md border border-foreground/15 bg-foreground/5 px-2.5 py-1 text-foreground/80">
            All Genres <ChevronDown className="h-3 w-3" />
          </button>
          <button className="rounded-md border border-foreground/15 bg-foreground/5 px-2.5 py-1 text-foreground/80">
            View All
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-10">
        {[left, right].map((col, idx) => (
          <div key={idx}>
            <div className="grid grid-cols-[28px_44px_1fr_80px_80px] gap-3 border-b border-foreground/10 pb-2 text-[11px] uppercase tracking-wider text-foreground/50">
              <span>Rank</span>
              <span />
              <span>Title</span>
              <span className="text-right">Chapters</span>
              <span className="text-right">Reads</span>
            </div>
            <div className="divide-y divide-foreground/5">
              {col.map((r) => (
                <RankingRow key={r.rank} item={r} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedCard({ item }: { item: (typeof featured)[number] }) {
  return (
    <div className="flex overflow-hidden rounded-md">
      <img
        src={item.cover}
        alt={item.title}
        loading="lazy"
        className="h-[230px] w-[160px] flex-none object-cover"
      />
      <div className="flex-1 bg-card border border-foreground/10 p-4 text-foreground">
        <div className="text-lg font-bold leading-tight">{item.title}</div>
        <div className="text-[11px] text-foreground/70">{item.author}</div>
        <ul className="mt-2 space-y-0.5 text-[11px]">
          {item.chapters.map((c) => (
            <li key={c} className="truncate underline-offset-2 hover:underline">
              {c}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-1">
          {item.tags.map((t) => (
            <span key={t} className="rounded border border-foreground/20 px-1.5 py-0.5 text-[10px]">
              {t}
            </span>
          ))}
        </div>
        <div className="mt-3 text-[10px] text-foreground/60">Updated 16min ago</div>
      </div>
    </div>
  );
}

function LatestUpdates() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-12">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-sm font-semibold">Latest Updates</h2>
        <a href="#" className="text-xs text-foreground/60 hover:text-foreground">
          View All
        </a>
      </div>
      <div className="grid grid-cols-3 gap-5">
        {featured.map((f, i) => (
          <FeaturedCard key={i} item={f} />
        ))}
      </div>
    </section>
  );
}

function RecentlyAdded() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-10">
      <h2 className="mb-3 text-sm font-semibold">Recently Added</h2>
      <div className="grid grid-cols-10 gap-3">
        {recent.map((r, i) => (
          <div key={i}>
            <img
              src={r.cover}
              alt={r.title}
              loading="lazy"
              className="aspect-[3/4] w-full rounded-sm object-cover"
            />
            <div className="mt-1.5 truncate text-[11px] font-medium">{r.title}</div>
            <div className="truncate text-[10px] text-foreground/55">{r.tag}</div>
          </div>
        ))}
        <div className="flex aspect-[3/4] flex-col items-center justify-center rounded-sm bg-card border border-foreground/10 text-foreground">
          <Waves className="h-5 w-5 opacity-80" />
          <div className="mt-2 text-[11px] font-medium">View All</div>
          <div className="text-[10px] text-foreground/60">975 manga</div>
        </div>
      </div>
    </section>
  );
}

function LatestNews() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-12 pb-16">
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <filter id="round-corners">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 12 -4"
              result="mask"
            />
            <feComposite in="SourceGraphic" in2="mask" operator="in" />
          </filter>
        </defs>
      </svg>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold tracking-tight">Latest News</h2>
      </div>

      {/* Decorative background grid for the whole section */}
      <div className="relative">
        <div
          className="absolute top-[-20px] right-[10%] w-[400px] h-[300px] opacity-10 pointer-events-none dark:opacity-5"
          style={{
            backgroundImage: "radial-gradient(currentColor 2px, transparent 2px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 relative z-10">
          {/* Main Feature */}
          <div className="relative lg:col-span-3 h-[400px]">
            {/* The Clipped Image Container */}
            <div
              className="absolute inset-0 overflow-hidden rounded-[24px] bg-foreground/5 shadow-sm"
              style={{
                clipPath: "polygon(0 0, calc(100% - 64px) 0, 100% 64px, 100% 100%, 0 100%)",
                filter: "url(#round-corners)",
              }}
            >
              <img
                src={news.feature.image}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {/* Banner */}
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-4 bg-card/95 border-t border-foreground/10 backdrop-blur-sm px-6 py-4 text-foreground">
                <span className="flex-1 text-[13px] font-medium leading-relaxed truncate">
                  {news.feature.title}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 opacity-80" />
              </div>
            </div>

            {/* Faux Cutout (Hiding Div) for Top-Left Icon */}
            <div className="absolute top-0 left-0 w-[96px] h-[96px] bg-background rounded-br-[32px] rounded-tl-[24px] z-20 flex items-start justify-start p-4 shadow-[4px_4px_16px_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_16px_rgba(0,0,0,0.4)]">
              <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-primary text-primary-foreground">
                <Newspaper className="h-7 w-7" />
              </div>
            </div>
          </div>

          {/* Side Features */}
          <div className="flex flex-col justify-between gap-4 h-[400px] lg:col-span-1">
            {news.side.map((n, i) => (
              <div
                key={i}
                className="relative h-[calc((100%-2rem)/3)] overflow-hidden rounded-[16px] bg-foreground/5 group cursor-pointer"
                style={{
                  clipPath:
                    "polygon(24px 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%, 0 24px)",
                  filter: "url(#round-corners)",
                }}
              >
                <img
                  src={n.image}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-card/95 border-t border-foreground/10 backdrop-blur-sm px-4 py-2.5 text-foreground">
                  <span className="flex-1 truncate text-[11px] font-medium">{n.title}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    {
      h: "Platform",
      items: ["Plans & Pricing", "Reading Features", "Updates & Releases", "Supported Devices"],
    },
    { h: "Company", items: ["About Us", "Careers", "Blog", "News & Events"] },
    { h: "Support", items: ["Help Center", "FAQs", "Contact Support", "Community Forum"] },
    {
      h: "Legal",
      items: ["Terms of Service", "Privacy Policy", "Cookie Policy", "Copyright Information"],
    },
  ];
  return (
    <footer className="bg-card text-foreground border-t border-foreground/10">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[repeat(4,1fr)_auto] gap-8 px-6 py-12">
        {cols.map((c) => (
          <div key={c.h}>
            <div className="mb-3 text-xs font-semibold">{c.h}</div>
            <ul className="space-y-1.5 text-[11px] text-foreground/70">
              {c.items.map((i) => (
                <li key={i}>
                  <a href="#" className="hover:text-primary">
                    {i}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="text-right">
          <Logo className="justify-end" />
          <p className="mt-3 font-jp text-[10px] text-foreground/60">
            世界中の読者に最高のマンガを届けます。
          </p>
          <p className="text-xs font-medium text-foreground/80">
            Bringing the best of manga
            <br />
            to readers worldwide.
          </p>
        </div>
      </div>
      <div className="border-t border-foreground/10">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4 text-[10px] text-foreground/60">
          <span>© 2024 beachRead Inc. All rights reserved.</span>
          <div className="flex items-center gap-3">
            <Instagram className="h-3.5 w-3.5" />
            <Youtube className="h-3.5 w-3.5" />
            <Twitter className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </footer>
  );
}

export function LandingView() {
  // unused setter retained for future tab state
  const [_tab] = useState<"trending" | "top">("trending");
  void _tab;
  return (
    <ThemeProvider>
      <div className="page-gradient min-h-screen">
        <Header />
        <Hero />
        <Ranking />
        <LatestUpdates />
        <RecentlyAdded />
        <LatestNews />
        <Footer />
      </div>
    </ThemeProvider>
  );
}
