"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/providers/ToastProvider";
import { PathGuard } from "@/components/guards/RoleGuard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { getInvitableRoles } from "@/lib/permissions";
import { canInviteRole } from "@/lib/permissions";
import {
  createInvite,
  getInvitesByOrganization,
  isInviteValid,
} from "@/services/invite.service";
import type { Invite } from "@/types/invite";
import type { InviteRole } from "@/types/invite";
import { cn } from "@/lib/utils";

const INVITE_PATH = "/dashboard/settings/invite";

const inviteFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  role: z.enum(["manager", "waiter", "kitchen"], {
    required_error: "Role is required",
  }),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

const ROLE_LABELS: Record<InviteRole, string> = {
  manager: "Manager",
  waiter: "Waiter",
  kitchen: "Kitchen",
};

function InvitePageContent() {
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const toast = useToast();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const invitableRoles = user ? getInvitableRoles(user.role) : [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: undefined,
    },
  });

  const loadInvites = useCallback(async () => {
    if (!user?.organizationId) return;
    setInvitesLoading(true);
    try {
      const list = await getInvitesByOrganization(user.organizationId);
      setInvites(list);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[Invite] getInvitesByOrganization failed:", err);
      }
      const message =
        err instanceof Error ? err.message : "Failed to load invites";
      const isIndexError =
        typeof message === "string" &&
        (message.includes("index") || message.includes("requires an index"));
      toast.error(
        isIndexError
          ? "Invites query needs a Firestore index. Deploy with: firebase deploy --only firestore:indexes"
          : "Failed to load invites"
      );
    } finally {
      setInvitesLoading(false);
    }
  }, [user?.organizationId, toast]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.organizationId) {
      setInvitesLoading(false);
      return;
    }
    loadInvites();
  }, [authLoading, user?.organizationId, user, loadInvites]);

  const onSubmit = async (data: InviteFormValues) => {
    if (!user?.organizationId || !user) {
      toast.error("You must be signed in and belong to an organization.");
      return;
    }
    const inviterUid = firebaseUser?.uid ?? user.uid;
    if (!inviterUid) {
      toast.error("Unable to identify your account. Please sign out and sign in again.");
      return;
    }
    if (!canInviteRole(user.role, data.role)) {
      toast.error("You are not allowed to invite this role.");
      return;
    }

    try {
      const inviteId = await createInvite({
        email: data.email.trim().toLowerCase(),
        role: data.role,
        organizationId: user.organizationId,
        invitedBy: inviterUid,
      });

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const inviteLink = `${origin}/register?inviteId=${inviteId}`;

      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.info("[Invite] Email:", data.email, "| Link:", inviteLink);
      }

      await loadInvites();
      reset({ email: "", role: undefined });
      toast.success(`Invite created. Share the link with ${data.email}.`);
      setCopyingId(inviteId);
      try {
        await navigator.clipboard.writeText(inviteLink);
        toast.success("Invite link copied to clipboard.");
      } catch {
        toast.info("Copy the link manually from the list below.");
      }
      setCopyingId(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create invite";
      toast.error(message);
    }
  };

  const copyLink = async (inviteId: string) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/register?inviteId=${inviteId}`;
    setCopyingId(inviteId);
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied to clipboard.");
    } catch {
      toast.error("Could not copy link.");
    } finally {
      setCopyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Invite staff</h2>
        <p className="text-muted-foreground">
          Send an invite link to add team members. They will join your
          organization with the role you assign.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send invite</CardTitle>
          <CardDescription>
            Enter email and choose a role. Only roles you are allowed to assign
            are shown.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <Input
              label="Staff email"
              type="email"
              autoComplete="email"
              placeholder="colleague@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <div className="w-full">
              <label
                htmlFor="role"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Role
              </label>
              <select
                id="role"
                aria-invalid={!!errors.role}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  errors.role &&
                    "border-destructive focus-visible:ring-destructive"
                )}
                {...register("role", { required: true })}
              >
                <option value="">Select role</option>
                {invitableRoles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1.5 text-sm text-destructive" role="alert">
                  {errors.role.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting || invitableRoles.length === 0}
            >
              Create invite
            </Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invites</CardTitle>
          <CardDescription>
            Pending invites can be shared via link. Accepted or expired invites
            are shown for reference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitesLoading ? (
            <div className="flex min-h-[120px] items-center justify-center py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : invites.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No invites yet. Create one above.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {invites.map((invite) => {
                const valid = invite.status === "pending" && isInviteValid(invite);
                return (
                  <li
                    key={invite.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {invite.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_LABELS[invite.role]} ·{" "}
                        <span
                          className={cn(
                            invite.status === "pending" && valid
                              ? "text-green-600 dark:text-green-400"
                              : invite.status === "accepted"
                                ? "text-muted-foreground"
                                : "text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {invite.status === "pending"
                            ? valid
                              ? "Pending"
                              : "Expired"
                            : invite.status === "accepted"
                              ? "Accepted"
                              : invite.status}
                        </span>
                      </p>
                    </div>
                    {valid && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        loading={copyingId === invite.id}
                        disabled={copyingId !== null}
                        onClick={() => copyLink(invite.id)}
                      >
                        Copy link
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvitePage() {
  return (
    <PathGuard pathname={INVITE_PATH}>
      <InvitePageContent />
    </PathGuard>
  );
}
