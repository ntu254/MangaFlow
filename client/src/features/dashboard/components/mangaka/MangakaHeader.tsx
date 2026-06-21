import { useRole } from "@/shared/lib/role";

export function MangakaHeader() {
  const { user } = useRole();

  return (
    <div className="relative mb-8 overflow-hidden rounded-lg bg-[#FAF8F5] dark:bg-foreground/5 px-8 py-10">
      {/* Fake graphic background for the birds/mountains effect using a subtle SVG pattern or gradient */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none mix-blend-multiply dark:mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at 100% 50%, rgba(0,0,0,0.05) 0%, transparent 40%), radial-gradient(circle at 80% 0%, rgba(0,0,0,0.08) 0%, transparent 30%)",
        }}
      />
      <div className="relative z-10">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">
          Welcome back, {user?.name || "Mangaka"}
        </h1>
        <p className="mt-1 text-[13px] text-foreground/60">
          Here's what's happening with your manga today.
        </p>
      </div>
    </div>
  );
}
