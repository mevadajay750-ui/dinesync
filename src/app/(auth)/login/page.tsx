"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-5 w-5", className)}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const {
    signIn,
    signInWithGoogle,
    loading,
    firebaseUser,
    user,
    error,
    setError,
  } = useAuth();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (loading || !firebaseUser) return;
    if (user?.organizationId) router.replace(ROUTES.DASHBOARD);
    else router.replace(ROUTES.CREATE_ORGANIZATION);
  }, [loading, firebaseUser, user?.organizationId, router]);

  const onSubmit = async (data: LoginForm) => {
    try {
      await signIn(data.email, data.password);
      toast.success("Welcome back!");
      router.push(ROUTES.DASHBOARD);
    } catch {
      toast.error(error ?? "Sign in failed");
    }
  };

  const onGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success("Welcome back!");
      router.push(ROUTES.DASHBOARD);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="rounded-2xl border border-border bg-card p-8 shadow-lg dark:bg-surface">
        <CardHeader className="space-y-1.5 p-0 pb-6">
          <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your DineSync account
          </p>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-0">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              className="h-11 rounded-lg focus-visible:ring-brand-accent"
              {...register("email")}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              className="h-11 rounded-lg focus-visible:ring-brand-accent"
              {...register("password")}
            />
            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm text-danger"
                  role="alert"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isSubmitting || loading}
              disabled={isSubmitting || loading}
              className="h-11 rounded-lg bg-brand-accent hover:opacity-90"
            >
              Sign in
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground dark:bg-surface">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              onClick={onGoogleSignIn}
              disabled={loading}
              leftIcon={<GoogleIcon />}
              className="h-11 rounded-lg border-border bg-background hover:bg-accent"
            >
              Google
            </Button>
          </CardContent>
          <CardFooter className="mt-6 justify-center p-0">
            <Link
              href={ROUTES.REGISTER}
              className="text-sm text-brand-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded"
              onClick={() => setError(null)}
            >
              Don&apos;t have an account? Register
            </Link>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
