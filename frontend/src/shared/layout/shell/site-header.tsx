import { Link } from "@tanstack/react-router";
import { Search, User } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full border-2 border-foreground">
              <span className="size-2 rounded-full bg-foreground" />
            </span>
            <span className="font-serif text-xl italic tracking-tight">beachRead</span>
          </Link>
        </div>
        <div className="hidden flex-1 justify-center px-12 md:flex">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for a manga or author"
              className="h-8 w-full rounded-md border border-border bg-card pl-9 pr-12 text-xs outline-none focus:border-foreground/30"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
              Ctrl + K
            </kbd>
          </div>
        </div>
        <nav className="flex items-center gap-6 text-xs font-medium text-foreground/70">
          <Link to="/read" className="hover:text-foreground">
            Catalog
          </Link>
          <Link to="/read" className="hover:text-foreground">
            Discover
          </Link>
          <Link to="/read" className="hover:text-foreground">
            Merch
          </Link>
          <Link
            to="/login"
            className="grid size-7 place-items-center rounded-full border border-border hover:border-foreground/40"
          >
            <User className="size-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
