import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/shared/lib/theme";
import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={`flex h-8 w-8 items-center justify-center rounded-md border border-foreground/15 text-foreground/70 transition hover:text-foreground ${className}`}
    >
      {mounted ? (
        theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        <Sun className="h-4 w-4" /> // server defaults to dark, which renders Sun
      )}
    </button>
  );
}
