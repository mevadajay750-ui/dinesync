"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles = {
  primary:
    "bg-primary text-white hover:opacity-90 focus-visible:ring-primary transition-all duration-200",
  secondary:
    "border border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring transition-all duration-200",
  outline:
    "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring transition-all duration-200",
  ghost: "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring transition-all duration-200",
  destructive:
    "bg-destructive text-destructive-foreground hover:opacity-90 focus-visible:ring-destructive transition-all duration-200",
};

const sizeStyles = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = "button",
      onDrag,
      onDragStart,
      onDragEnd,
      onDragOver,
      onAnimationStart,
      onAnimationEnd,
      onAnimationIteration,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    return (
      <motion.button
        ref={ref}
        type={type}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
