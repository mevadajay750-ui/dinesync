"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants";
import { getInviteById, isInviteValid } from "@/services/invite.service";
import { acceptInvite } from "@/services/invite.service";
import { createUser } from "@/services/user.service";
import { getCurrentUser } from "@/lib/firebase/auth";
import type { Invite } from "@/types/invite";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

const ROLE_LABELS: Record<Invite["role"], string> = {
  manager: "Manager",
  waiter: "Waiter",
  kitchen: "Kitchen",
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteId = searchParams.get("inviteId");
  const { signUp, loading, firebaseUser, user, error, setError, refreshUser } =
    useAuth();
  const toast = useToast();

  const [invite, setInvite] = useState<Invite | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteId);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const isInviteFlow = Boolean(inviteId);

  const loadInvite = useCallback(async (id: string) => {
    setInviteError(null);
    setInviteLoading(true);
    try {
      const doc = await getInviteById(id);
      if (!doc) {
        setInviteError("Invite not found.");
        setInvite(null);
        return;
      }
      if (!isInviteValid(doc)) {
        setInviteError(
          doc.status !== "pending"
            ? "This invite has already been used."
            : "This invite has expired."
        );
        setInvite(null);
        return;
      }
      setInvite(doc);
    } catch {
      setInviteError("Failed to load invite.");
      setInvite(null);
    } finally {
      setInviteLoading(false);
    }
  }, []);

  useEffect(() => {
    if (inviteId) {
      loadInvite(inviteId);
    } else {
      setInviteLoading(false);
    }
  }, [inviteId, loadInvite]);

  useEffect(() => {
    if (loading || !firebaseUser) return;
    if (!isInviteFlow && user?.organizationId) router.replace(ROUTES.DASHBOARD);
    if (!isInviteFlow && !user?.organizationId)
      router.replace(ROUTES.CREATE_ORGANIZATION);
  }, [loading, firebaseUser, user?.organizationId, router, isInviteFlow]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (invite?.email) {
      setValue("email", invite.email, { shouldValidate: true });
    }
  }, [invite?.email, setValue]);

  const onSubmit = async (data: RegisterForm) => {
    setError(null);

    if (isInviteFlow && invite) {
      if (data.email.trim().toLowerCase() !== invite.email) {
        toast.error("Email must match the invited address.");
        return;
      }
      try {
        await signUp(data.email, data.password, data.name);
        const fbUser = getCurrentUser();
        if (!fbUser) {
          toast.error("Account created but session could not be verified.");
          return;
        }
        await createUser({
          uid: fbUser.uid,
          name: data.name,
          email: data.email.trim().toLowerCase(),
          role: invite.role,
          organizationId: invite.organizationId,
        });
        await acceptInvite(invite.id);
        await refreshUser();
        toast.success("Welcome! You have joined the team.");
        router.replace(ROUTES.DASHBOARD);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : error ?? "Registration failed";
        toast.error(message);
        if (process.env.NODE_ENV === "development") {
          console.error("[Register] Invite flow failed:", err);
        }
      }
      return;
    }

    try {
      await signUp(data.email, data.password, data.name);
      toast.success("Account created. Create your organization to continue.");
      router.push(ROUTES.CREATE_ORGANIZATION);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : error ?? "Registration failed";
      toast.error(message);
    }
  };

  if (inviteId && inviteLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">Checking invite…</p>
        </CardContent>
      </Card>
    );
  }

  if (inviteId && inviteError && !invite) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid invite</CardTitle>
          <CardDescription>{inviteError}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={ROUTES.REGISTER}
            className="text-sm text-primary hover:underline"
          >
            Register without an invite
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {invite ? "Join your team" : "Create account"}
        </CardTitle>
        <CardDescription>
          {invite
            ? `You’re invited to join as ${ROLE_LABELS[invite.role]}. Create your account below.`
            : "Register your organization on DineSync"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <Input
            label="Full name"
            autoComplete="name"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            readOnly={!!invite}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
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
            {invite ? "Create account & join" : "Create account"}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            href={ROUTES.LOGIN}
            className="text-sm text-primary hover:underline"
            onClick={() => setError(null)}
          >
            Already have an account? Sign in
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
