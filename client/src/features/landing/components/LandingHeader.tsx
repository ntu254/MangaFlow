import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Pricing", href: "#cta" },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#fff9fb]/85 backdrop-blur-lg shadow-[0_1px_12px_rgba(144,101,213,0.08)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2 text-xl font-bold text-[#2f243a]">
          <span className="inline-block size-8 rounded-lg bg-gradient-to-br from-[#9065d5] to-[#e560bc]" />
          MangaFlow
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#5f5270] transition-colors hover:text-[#9065d5]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </a>
          <a href="/sign-in">
            <Button size="sm" className="bg-[#9065d5] text-white hover:bg-[#7f55c7]">
              Get Started
            </Button>
          </a>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-lg p-2 text-[#5f5270] md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-[#eadff6] bg-[#fff9fb]/95 px-6 pb-4 backdrop-blur-lg md:hidden"
        >
          <nav className="flex flex-col gap-3 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#5f5270] transition-colors hover:text-[#9065d5]"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2">
            <a href="/sign-in">
              <Button variant="ghost" size="sm" className="w-full">
                Sign in
              </Button>
            </a>
            <a href="/sign-in">
              <Button size="sm" className="w-full bg-[#9065d5] text-white hover:bg-[#7f55c7]">
                Get Started
              </Button>
            </a>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
