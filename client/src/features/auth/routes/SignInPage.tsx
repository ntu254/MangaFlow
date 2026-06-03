import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getGoogleAuthUrl } from "@/shared/api/auth";
import { Sparkles } from "lucide-react";

export function SignInPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#fff9fb] via-[#f8f1ff] to-[#fff7ec]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[10%] top-[15%] size-[500px] rounded-full bg-[#9065d5]/[0.07] blur-[100px]" />
        <div className="absolute right-[5%] top-[40%] size-[400px] rounded-full bg-[#e560bc]/[0.06] blur-[100px]" />
        <div className="absolute bottom-[10%] left-[30%] size-[350px] rounded-full bg-[#ffc95e]/[0.08] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4"
      >
        <div className="bg-white border border-[#eadff6] rounded-2xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(144,101,213,0.12)]">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#eadff6] bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#9065d5]">
              <Sparkles className="size-3.5" />
              Manga Production Platform
            </span>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-5 font-bold text-[#2f243a]"
              style={{ fontSize: "1.25rem" }}
            >
              Welcome to{" "}
              <span className="bg-gradient-to-r from-[#9065d5] via-[#e560bc] to-[#ff7196] bg-clip-text text-transparent">
                MangaFlow
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-1.5 text-sm text-[#5f5270]"
            >
              Sign in to manage your manga workflow
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8"
          >
            <a href={getGoogleAuthUrl()} className="block">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-3 border-[#eadff6] text-[#2f243a] hover:bg-[#f8f1ff] hover:border-[#9065d5]/50"
              >
                <svg className="size-5 shrink-0" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                  <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                </svg>
                Sign in with Google
              </Button>
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center text-xs text-[#8a7a99] mt-6"
          >
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
