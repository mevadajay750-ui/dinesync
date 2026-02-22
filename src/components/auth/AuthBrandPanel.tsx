"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";

export function AuthBrandPanel() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className="relative hidden min-h-screen w-[40%] shrink-0 overflow-hidden bg-linear-to-br from-brand-primary via-brand-primary to-brand-accent md:block"
      aria-hidden
    >
      {/* Animated radial glow */}
      <motion.div
        className="absolute -left-1/2 -top-1/2 h-full w-full rounded-full bg-[radial-gradient(circle,var(--brand-accent)_0%,transparent_70%)] opacity-30"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.35, 0.2],
              }
        }
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <div className="relative flex min-h-screen flex-col justify-between p-8 lg:p-12">
        <motion.div
          className="flex flex-col gap-6"
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Logo */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              className="h-7 w-7 text-white"
              aria-hidden
            >
              <path
                d="M11 9v14h4A4 4 0 0 0 15 9h-4z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
              Dine<span className="text-brand-accent">Sync</span>
            </h1>
            <p className="mt-2 text-lg text-white/90">
              Your Restaurant. In Sync.
            </p>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-white/80">
            Manage orders, kitchen, billing, and reports in real-time.
          </p>
        </motion.div>
        <motion.p
          className="text-xs text-white/50"
          initial={prefersReducedMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Built for modern restaurants.
        </motion.p>
      </div>
    </div>
  );
}
