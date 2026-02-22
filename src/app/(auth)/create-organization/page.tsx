"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { createOrganization } from "@/services/organization.service";
import { uploadOrganizationLogo } from "@/lib/firebase/storage";
import type { BusinessType } from "@/types/organization";
import { cn } from "@/lib/utils";

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Cafe" },
];

const createOrganizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  businessType: z.enum(["restaurant", "cafe"], {
    message: "Please select a business type",
  }),
  logo: z
    .any()
    .optional()
    .refine(
      (v) =>
        v === undefined ||
        (typeof FileList !== "undefined" && v instanceof FileList),
      "Invalid file"
    ),
});

type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>;

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { firebaseUser, user, loading: authLoading, refreshUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      businessType: undefined,
    },
  });

  const logoFile = watch("logo");

  useEffect(() => {
    if (authLoading) return;
    if (!firebaseUser) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (user?.organizationId) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [authLoading, firebaseUser, user?.organizationId, router]);

  const onSubmit = async (data: CreateOrganizationForm) => {
    setSubmitError(null);
    if (!firebaseUser) {
      setSubmitError("You must be signed in to create an organization.");
      return;
    }

    try {
      let logoUrl: string | undefined;
      const logoFile = data.logo?.length ? data.logo[0] : undefined;
      if (logoFile && logoFile.size > 0) {
        try {
          logoUrl = await uploadOrganizationLogo(logoFile, firebaseUser.uid);
        } catch {
          // Continue without logo if upload fails (e.g. Storage not configured)
        }
      }

      await createOrganization(
        {
          name: data.name,
          businessType: data.businessType,
          ...(logoUrl && { logoUrl }),
        },
        {
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          name: firebaseUser.displayName ?? firebaseUser.email ?? "User",
        }
      );

      await refreshUser();
      toast.success("Organization created. Welcome to DineSync!");
      router.replace(ROUTES.DASHBOARD);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create organization";
      setSubmitError(message);
      toast.error(message);
    }
  };

  if (authLoading || (firebaseUser && user?.organizationId)) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  if (!firebaseUser) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your organization</CardTitle>
        <CardDescription>
          Set up your business on DineSync to get started
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <Input
            label="Organization name"
            autoComplete="organization"
            error={errors.name?.message}
            placeholder="e.g. Sunset Bistro"
            {...register("name")}
          />

          <div className="w-full">
            <label
              htmlFor="businessType"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Business type
            </label>
            <select
              id="businessType"
              aria-invalid={!!errors.businessType}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                errors.businessType && "border-destructive focus-visible:ring-destructive"
              )}
              {...register("businessType", { required: true })}
            >
              <option value="">Select type</option>
              {BUSINESS_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.businessType && (
              <p className="mt-1.5 text-sm text-destructive" role="alert">
                {errors.businessType.message}
              </p>
            )}
          </div>

          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Logo (optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onChange={(e) => setValue("logo", e.target.files ?? undefined, { shouldValidate: true })}
            />
            {logoFile instanceof FileList && logoFile[0] && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                Selected: {logoFile[0].name}
              </p>
            )}
          </div>

          {submitError && (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Create organization
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            You’ll be redirected to the dashboard after creation.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
