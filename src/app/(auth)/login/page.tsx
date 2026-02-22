"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
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
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Sign in to your DineSync account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            fullWidth
            loading={isSubmitting || loading}
            disabled={isSubmitting || loading}
          >
            Sign in
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button type="button" variant="outline" fullWidth onClick={onGoogleSignIn} disabled={loading}>
            Google
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            href={ROUTES.REGISTER}
            className="text-sm text-primary hover:underline"
            onClick={() => setError(null)}
          >
            Don&apos;t have an account? Register
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
