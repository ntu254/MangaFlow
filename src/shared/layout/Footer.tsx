import { Link } from "react-router-dom";

const cols = [
  {
    title: "Sản phẩm",
    links: [
      { label: "Phối đồ", href: "/recommender" },
      { label: "Hồ sơ phong cách", href: "/style-profile" },
      { label: "Quiz phong cách", href: "/quiz" },
      { label: "Xu hướng", href: "/trends" },
    ],
  },
  {
    title: "Nền tảng",
    links: [
      { label: "Shopee", href: "#" },
      { label: "TikTok Shop", href: "#" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Cách hoạt động", href: "#" },
      { label: "Câu hỏi thường gặp", href: "#" },
      { label: "Liên hệ", href: "#" },
      { label: "Điều khoản", href: "#" },
    ],
  },
];

const Footer = () => (
  <footer className="border-t border-border bg-background">
    <div className="mag-grid grid-cols-1 md:grid-cols-4">
      <div className="p-10 md:p-12">
        <span className="font-heading text-2xl italic text-foreground">
          Redo
        </span>
        <p className="text-xs text-muted-foreground font-body leading-relaxed mt-4 max-w-[200px]">
          Trợ lý phối đồ AI — giúp thời trang cá nhân trở nên dễ dàng hơn bao
          giờ hết.
        </p>
      </div>
      {cols.map((c) => (
        <div key={c.title} className="p-10 md:p-12">
          <p className="editorial-label mb-5">{c.title}</p>
          <div className="space-y-3">
            {c.links.map((l) => (
              <Link
                key={l.label}
                to={l.href}
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
    <div className="border-t border-border px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">
        © 2026 Redo. Bảo lưu mọi quyền.
      </p>
      <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">
        Xây dựng với Lovable
      </p>
    </div>
  </footer>
);

export default Footer;
