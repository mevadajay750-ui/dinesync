"use client";

import { motion, useReducedMotion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: "easeOut" },
};

const reduced = {
  initial: {},
  animate: {},
  transition: { duration: 0 },
};

export function PageWrapper({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  const variant = prefersReducedMotion ? reduced : fadeUp;

  return (
    <motion.div
      initial={variant.initial}
      animate={variant.animate}
      transition={variant.transition}
      className="min-h-0"
    >
      {children}
    </motion.div>
  );
}
