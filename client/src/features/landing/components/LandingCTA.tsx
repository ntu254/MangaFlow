import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SignInButton, SignUpButton, Show } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

interface LandingCTAProps {
  clerkConfigured: boolean;
}

export function LandingCTA({ clerkConfigured }: LandingCTAProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="cta" className="px-6 py-24">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="mx-auto max-w-4xl"
      >
        <div className="relative overflow-hidden rounded-3xl border border-[#eadff6] bg-gradient-to-br from-[#f8f1ff] via-[#fff3f8] to-[#fff7ec] p-10 text-center shadow-[0_20px_60px_rgba(144,101,213,0.1)] md:p-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-20 size-[300px] rounded-full bg-[#9065d5]/[0.06] blur-[80px]" />
            <div className="absolute -bottom-20 -right-20 size-[300px] rounded-full bg-[#e560bc]/[0.06] blur-[80px]" />
          </div>

          <div className="relative z-10">
            <div className="mb-6 inline-flex size-12 items-center justify-center rounded-2xl bg-[#9065d5]/10">
              <Zap className="size-6 text-[#9065d5]" />
            </div>

            <h2 className="text-3xl font-bold text-[#2f243a] md:text-4xl">
              Ready to streamline your manga workflow?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-[#5f5270]">
              Join MangaFlow and bring your team together in one beautiful
              workspace.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {clerkConfigured ? (
                <Show when="signed-out">
                  <SignUpButton mode="modal">
                    <Button
                      size="lg"
                      className="gap-2 bg-[#9065d5] px-8 text-white shadow-[0_8px_24px_rgba(144,101,213,0.3)] hover:bg-[#7f55c7]"
                    >
                      Start for Free
                      <ArrowRight className="size-4" />
                    </Button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-[#eadff6] px-8 text-[#5f5270] hover:bg-white/80 hover:text-[#9065d5]"
                    >
                      Sign in to your account
                    </Button>
                  </SignInButton>
                </Show>
              ) : null}
              <Show when="signed-in">
                <a href="/app/mangaka/series">
                  <Button
                    size="lg"
                    className="gap-2 bg-[#9065d5] px-8 text-white hover:bg-[#7f55c7]"
                  >
                    Go to Dashboard
                    <ArrowRight className="size-4" />
                  </Button>
                </a>
              </Show>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
