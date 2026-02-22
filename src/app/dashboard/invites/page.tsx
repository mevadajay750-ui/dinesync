"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/providers/ToastProvider";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getInvitableRoles, canInviteRole } from "@/lib/permissions";
import {
  createInvite,
  getInvitesByOrganization,
  isInviteValid,
} from "@/services/invite.service";
import type { Invite, InviteRole } from "@/types/invite";
import { cn } from "@/lib/utils";

const inviteFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  role: z.enum(["manager", "waiter", "kitchen"], {
    message: "Role is required",
  }),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

const ROLE_LABELS: Record<InviteRole, string> = {
  manager: "Manager",
  waiter: "Waiter",
  kitchen: "Kitchen",
};

function formatInviteDate(timestamp: { toMillis?: () => number } | undefined): string {
  if (!timestamp?.toMillis) return "—";
  return new Date(timestamp.toMillis()).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function InviteStatusBadge({ invite }: { invite: Invite }) {
  const valid = invite.status === "pending" && isInviteValid(invite);
  const label =
    invite.status === "pending"
      ? valid
        ? "Pending"
        : "Expired"
      : invite.status === "accepted"
        ? "Accepted"
        : invite.status;

  const variantClasses =
    invite.status === "pending" && valid
      ? "bg-emerald-200 text-emerald-900 dark:bg-emerald-700 dark:text-white"
      : invite.status === "accepted"
        ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-50"
        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses
      )}
    >
      {label}
    </span>
  );
}

function InvitesPageContent() {
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Staff Invitations
          </h1>
          <p className="mt-1 text-muted-foreground">
            Invite and manage your team members
          </p>
        </div>
        <Button
          leftIcon={<UserPlus className="h-4 w-4" />}
          onClick={() =>
            document.getElementById("invite-form-card")?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Invite Staff
        </Button>
      </div>

      {/* 1. Invite Form Section */}
      <Card id="invite-form-card" className="rounded-xl">
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
              label="Email"
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
                  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2",
                  errors.role && "border-danger focus-visible:ring-danger"
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
                <p className="mt-1 text-sm text-danger" role="alert">
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

      {/* 2. Pending Invites List */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Invites</CardTitle>
          <CardDescription>
            Pending invites can be shared via link. Accepted or expired invites
            are shown for reference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitesLoading ? (
            <div className="flex min-h-[160px] items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : invites.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No invitations yet"
              description="Invite your staff to start managing orders and operations."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Invited
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Expires
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((invite) => {
                    const valid =
                      invite.status === "pending" && isInviteValid(invite);
                    return (
                      <tr
                        key={invite.id}
                        className="border-b border-border transition-colors hover:bg-muted/20 last:border-b-0"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {invite.email}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {ROLE_LABELS[invite.role]}
                        </td>
                        <td className="px-4 py-3">
                          <InviteStatusBadge invite={invite} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatInviteDate(invite.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatInviteDate(invite.expiresAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
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
                            {/* Resend: future placeholder */}
                            {/* Cancel invite: optional if implemented in service */}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvitesPage() {
  return (
    <RoleGuard allowedRoles={["owner", "manager"]}>
      <InvitesPageContent />
    </RoleGuard>
  );
}
