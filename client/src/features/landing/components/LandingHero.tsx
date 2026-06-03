import { motion } from "framer-motion";
import { SignInButton, SignUpButton, Show } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

interface LandingHeroProps {
  clerkConfigured: boolean;
}

export function LandingHero({ clerkConfigured }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-28 md:pt-36">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[10%] top-[15%] size-[500px] rounded-full bg-[#9065d5]/[0.07] blur-[100px]" />
        <div className="absolute right-[5%] top-[40%] size-[400px] rounded-full bg-[#e560bc]/[0.06] blur-[100px]" />
        <div className="absolute bottom-[10%] left-[30%] size-[350px] rounded-full bg-[#ffc95e]/[0.08] blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#eadff6] bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#9065d5] backdrop-blur-sm">
              <Sparkles className="size-3.5" />
              Manga Production Platform
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-[#2f243a] md:text-7xl"
          >
            Create manga{" "}
            <span className="bg-gradient-to-r from-[#9065d5] via-[#e560bc] to-[#ff7196] bg-clip-text text-transparent">
              your way
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#5f5270] md:text-xl"
          >
            From manuscript to publication — manage series, assign tasks, review
            pages, and track payroll in one beautiful workspace built for manga
            teams.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            {clerkConfigured ? (
              <Show when="signed-out">
                <SignUpButton mode="modal">
                  <Button
                    size="lg"
                    className="gap-2 bg-[#9065d5] px-8 text-white shadow-[0_8px_24px_rgba(144,101,213,0.3)] hover:bg-[#7f55c7] hover:shadow-[0_12px_32px_rgba(144,101,213,0.4)]"
                  >
                    Get Started Free
                    <ArrowRight className="size-4" />
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button variant="outline" size="lg" className="border-[#eadff6] px-8 text-[#5f5270] hover:bg-[#f8f1ff] hover:text-[#9065d5]">
                    Sign in
                  </Button>
                </SignInButton>
              </Show>
            ) : null}
            <Show when="signed-in">
              <a href="/app/mangaka/series">
                <Button size="lg" className="gap-2 bg-[#9065d5] px-8 text-white hover:bg-[#7f55c7]">
                  Go to Dashboard
                  <ArrowRight className="size-4" />
                </Button>
              </a>
            </Show>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mx-auto mt-20 max-w-4xl"
        >
          <div className="relative rounded-2xl border border-[#eadff6] bg-white/70 p-2 shadow-[0_20px_60px_rgba(144,101,213,0.12)] backdrop-blur-sm">
            <div className="rounded-xl bg-gradient-to-br from-[#fff9fb] via-[#f8f1ff] to-[#fff7ec] p-8 md:p-12">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { color: "#9065d5", label: "Series" },
                  { color: "#e560bc", label: "Chapters" },
                  { color: "#ff7196", label: "Pages" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-[#eadff6]/60 bg-white/80 p-4 text-center shadow-sm"
                  >
                    <div
                      className="mx-auto mb-2 h-2 w-12 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-semibold text-[#5f5270]">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-4 gap-4">
                {[
                  { color: "#ff9971", label: "Tasks" },
                  { color: "#ffc95e", label: "Review" },
                  { color: "#f9f871", label: "Board" },
                  { color: "#9065d5", label: "Payroll" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-[#eadff6]/60 bg-white/80 p-4 text-center shadow-sm"
                  >
                    <div
                      className="mx-auto mb-2 h-2 w-12 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-semibold text-[#5f5270]">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
