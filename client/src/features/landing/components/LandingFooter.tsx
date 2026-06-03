import { Heart } from "lucide-react";

const footerLinks = [
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Sign In", href: "#cta" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-[#eadff6] bg-white/50 px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block size-6 rounded-md bg-gradient-to-br from-[#9065d5] to-[#e560bc]" />
          <span className="text-lg font-bold text-[#2f243a]">MangaFlow</span>
        </div>

        <nav className="flex gap-6">
          {footerLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-[#8a7a99] transition-colors hover:text-[#9065d5]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="flex items-center gap-1 text-sm text-[#b8a9c7]">
          Made with <Heart className="size-3.5 fill-[#ff7196] text-[#ff7196]" /> for manga creators
        </p>
      </div>
    </footer>
  );
}
