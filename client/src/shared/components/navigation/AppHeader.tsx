import { Link } from "react-router-dom";
import { UserButton } from "@clerk/react";
import { Search, Bell } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AppHeaderProps = {
  breadcrumb?: BreadcrumbItem[];
  actions?: React.ReactNode;
};

export function AppHeader({ breadcrumb, actions }: AppHeaderProps) {
  return (
    <header className="h-16 border-b border-mf-border bg-mf-bg-card/80 backdrop-blur-sm flex items-center px-6 sticky top-0 z-10">
      <div className="flex-1 flex items-center gap-4">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1.5 text-sm">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-mf-text-disabled">/</span>}
                {item.href ? (
                  <Link to={item.href} className="text-mf-text-secondary hover:text-mf-primary transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-mf-text font-medium">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button className="relative p-2 text-mf-text-muted hover:text-mf-text transition-colors rounded-lg hover:bg-mf-bg-soft">
          <Bell className="size-4" />
        </button>
        <UserButton />
      </div>
    </header>
  );
}
