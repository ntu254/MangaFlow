export function SiteFooter() {
  return (
    <footer className="mt-20 bg-foreground text-background/80">
      <div className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-5">
          <FooterCol
            title="Platform"
            links={[
              { label: "Plans & Pricing", href: "/pricing" },
              { label: "Reading Features", href: "/features" },
              { label: "Updates & Releases", href: "/changelog" },
              { label: "Supported Devices", href: "/devices" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { label: "About Us", href: "/about" },
              { label: "Careers", href: "/careers" },
              { label: "Blog", href: "/blog" },
              { label: "News & Events", href: "/news" },
            ]}
          />
          <FooterCol
            title="Support"
            links={[
              { label: "Help Center", href: "/help" },
              { label: "FAQs", href: "/faq" },
              { label: "Contact Support", href: "/support" },
              { label: "Community Forum", href: "/community" },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { label: "Terms of Service", href: "/terms" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Cookie Policy", href: "/cookies" },
              { label: "Copyright Information", href: "/copyright" },
            ]}
          />
          <div className="col-span-2 md:col-span-1 md:text-right">
            <div className="mb-3 flex items-center gap-2 md:justify-end">
              <span className="grid size-7 place-items-center rounded-full border-2 border-background">
                <span className="size-2 rounded-full bg-background" />
              </span>
              <span className="font-serif text-xl italic">MangaFlow</span>
            </div>
            <p className="text-xs leading-relaxed text-background/60">
              世界中の物語に最高のマンガを届ける。
              <br />
              <span className="text-background">Bringing the best of manga</span>
              <br />
              <span className="text-background">to readers worldwide.</span>
            </p>
          </div>
        </div>
        <div className="mt-12 flex items-center justify-between border-t border-background/10 pt-6 text-[10px] uppercase tracking-widest text-background/40">
          <span>© 2026 MangaFlow All rights reserved.</span>
          <div className="flex gap-4">
            <span>IG</span>
            <span>YT</span>
            <span>X</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-background">
        {title}
      </h4>
      <ul className="space-y-2 text-xs text-background/60">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href} className="hover:text-background">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
