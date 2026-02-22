"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/providers/ToastProvider";
import { PathGuard } from "@/components/guards/RoleGuard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { canManageBilling } from "@/lib/permissions";
import { getOrderById } from "@/services/order.service";
import {
  createPaymentAndCompleteOrder,
  buildInvoiceDataFromInput,
} from "@/services/payment.service";
import { getOrganizationById } from "@/services/organization.service";
import { generateInvoicePDF } from "@/lib/invoice/generateInvoice";
import type { Order } from "@/types/order";
import type { PaymentMethod } from "@/types/payment";
import { DEFAULT_TAX_RATE, DEFAULT_SERVICE_CHARGE_RATE } from "@/lib/constants";
import { ArrowLeft, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

const BILLING_PATH = "/dashboard/orders";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "mixed", label: "Mixed" },
];

const discountSchema = z.object({
  discountType: z.enum(["percent", "flat"]),
  discountValue: z.number().min(0, "Must be ≥ 0"),
  paymentMethod: z.enum(["cash", "upi", "card", "mixed"]),
});

type DiscountFormValues = z.infer<typeof discountSchema>;

function useBillingTotals(
  order: Order | null,
  discountType: "percent" | "flat",
  discountValue: number
) {
  return useMemo(() => {
    if (!order) {
      return {
        subtotal: 0,
        tax: 0,
        serviceCharge: 0,
        discountAmount: 0,
        total: 0,
      };
    }
    const subtotal = order.subtotal;
    const tax = order.tax;
    const serviceCharge = order.serviceCharge;
    const beforeDiscount = subtotal + tax + serviceCharge;
    const discountAmount =
      discountType === "percent"
        ? Math.round((subtotal * discountValue * 0.01) * 100) / 100
        : Math.min(discountValue, beforeDiscount);
    const total = Math.round((beforeDiscount - discountAmount) * 100) / 100;
    return {
      subtotal,
      tax,
      serviceCharge,
      discountAmount,
      total,
    };
  }, [order, discountType, discountValue]);
}

function ConfirmModal({
  open,
  onClose,
  onConfirm,
  loading,
  tableName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  tableName: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 id="confirm-title" className="text-lg font-semibold text-foreground">
          Confirm payment
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This will mark the order as completed, reset Table {tableName} to
          available, and generate the invoice PDF. This action cannot be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1"
            loading={loading}
            onClick={onConfirm}
          >
            Confirm & complete
          </Button>
        </div>
      </div>
    </div>
  );
}

function BillingPageInner() {
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params?.orderId === "string" ? params.orderId : "";
  const { user } = useAuth();
  const toast = useToast();
  const orgId = user?.organizationId ?? null;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canEdit = useMemo(
    () => (user?.role ? canManageBilling(user.role) : false),
    [user?.role]
  );

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<DiscountFormValues>({
    resolver: zodResolver(discountSchema) as Resolver<DiscountFormValues>,
    defaultValues: {
      discountType: "flat",
      discountValue: 0,
      paymentMethod: "cash",
    },
  });

  const discountType = watch("discountType");
  const discountValue = watch("discountValue");
  const paymentMethod = watch("paymentMethod");

  const { subtotal, tax, serviceCharge, discountAmount, total } =
    useBillingTotals(order, discountType, discountValue);

  useEffect(() => {
    if (!orgId || !orderId) {
      setLoading(false);
      setError("Missing organization or order.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const orderRes = await getOrderById(orgId, orderId);
        if (cancelled) return;
        if (!orderRes) {
          setError("Order not found or access denied.");
          setOrder(null);
          return;
        }
        if (orderRes.status !== "served") {
          setError(
            "This order is not ready for billing. Only orders with status \"Served\" can be paid."
          );
          setOrder(orderRes);
          return;
        }
        setOrder(orderRes);
        setError(null);
      } catch {
        if (!cancelled) setError("Failed to load order.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, orderId]);

  const onConfirmPayment = useCallback(async () => {
    if (!order || !orgId || !user?.uid) return;
    setSubmitting(true);
    try {
      await createPaymentAndCompleteOrder({
        orderId: order.id,
        tableId: order.tableId,
        subtotal,
        tax,
        serviceCharge,
        discount: discountAmount,
        total,
        paymentMethod,
        organizationId: orgId,
        processedBy: user.uid,
      });
      const org = await getOrganizationById(orgId);
      const invoiceData = buildInvoiceDataFromInput(
        order,
        {
          orderId: order.id,
          tableId: order.tableId,
          subtotal,
          tax,
          serviceCharge,
          discount: discountAmount,
          total,
          paymentMethod,
          organizationId: orgId,
          processedBy: user.uid,
        },
        org
      );
      generateInvoicePDF(invoiceData, order.id);
      toast.success("Payment completed. Table is available. Invoice downloaded.");
      setConfirmOpen(false);
      router.push("/dashboard/orders");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to complete payment"
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    order,
    orgId,
    user?.uid,
    subtotal,
    tax,
    serviceCharge,
    discountAmount,
    total,
    paymentMethod,
    toast,
    router,
  ]);

  const openConfirm = useCallback(() => {
    setConfirmOpen(true);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Receipt className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">
            Table {order.tableName} — Invoice preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Ordered items
            </h2>
            <ul className="space-y-2 rounded-lg border border-border p-3">
              {order.items.map((item, idx) => (
                <li
                  key={`${item.menuItemId}-${idx}`}
                  className="flex justify-between gap-2 text-sm"
                >
                  <span className="text-foreground">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="text-muted-foreground">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3 border-t border-border pt-4">
            <h2 className="text-sm font-semibold text-foreground">
              Breakdown
            </h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax ({Math.round(DEFAULT_TAX_RATE * 100)}%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Service charge (
                  {Math.round(DEFAULT_SERVICE_CHARGE_RATE * 100)}%)
                </span>
                <span>${serviceCharge.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div
                className={cn(
                  "flex justify-between pt-2 font-semibold",
                  "text-foreground"
                )}
              >
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </section>

          {canEdit && (
            <>
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Discount type
                  </label>
                  <select
                    {...register("discountType")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="flat">Flat amount</option>
                    <option value="percent">Percentage</option>
                  </select>
                </div>
                <Input
                  type="number"
                  step={discountType === "percent" ? 1 : 0.01}
                  min={0}
                  label={discountType === "percent" ? "Discount (%)" : "Discount ($)"}
                  error={errors.discountValue?.message}
                  {...register("discountValue", { valueAsNumber: true })}
                />
              </section>
              <section className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Payment method
                </label>
                <select
                  {...register("paymentMethod")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.value} value={pm.value}>
                      {pm.label}
                    </option>
                  ))}
                </select>
              </section>
              <Button
                type="button"
                fullWidth
                onClick={handleSubmit(openConfirm)}
                leftIcon={<Receipt className="h-4 w-4" />}
              >
                Confirm payment
              </Button>
            </>
          )}

          {!canEdit && (
            <p className="text-sm text-muted-foreground">
              Only managers and owners can complete payment. You can view the
              billing breakdown.
            </p>
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirmPayment}
        loading={submitting}
        tableName={order.tableName}
      />
    </div>
  );
}

export default function BillingPage() {
  return (
    <PathGuard pathname={BILLING_PATH}>
      <BillingPageInner />
    </PathGuard>
  );
}
