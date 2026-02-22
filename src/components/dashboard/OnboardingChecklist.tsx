"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/constants";
import { getTablesByOrganization } from "@/services/table.service";
import { getMenuItemsByOrg } from "@/services/menu.service";
import { getUsersByOrganization } from "@/services/user.service";
import { getOrdersByOrg } from "@/services/order.service";
import { getPaymentsByOrganization } from "@/services/payment.service";
import { Check, Circle, X, ChevronRight } from "lucide-react";

const ONBOARDING_DISMISSED_KEY = "onboardingDismissed";
const ONBOARDING_COMPLETE_KEY = "onboardingComplete";

const CHECKLIST_ITEMS = [
  {
    id: "tables",
    title: "Add tables",
    completed: (state: OnboardingState) => state.tablesCount > 0,
    href: ROUTES.DASHBOARD_TABLES,
    goLabel: "Go to Tables",
  },
  {
    id: "menu",
    title: "Add menu items",
    completed: (state: OnboardingState) => state.menuItemsCount > 0,
    href: ROUTES.DASHBOARD_MENU,
    goLabel: "Go to Menu",
  },
  {
    id: "staff",
    title: "Invite staff",
    completed: (state: OnboardingState) => state.usersCount > 1,
    href: ROUTES.DASHBOARD_INVITES,
    goLabel: "Invite",
  },
  {
    id: "order",
    title: "Create first order",
    completed: (state: OnboardingState) => state.ordersCount > 0,
    href: ROUTES.DASHBOARD_ORDERS,
    goLabel: "Go to Orders",
  },
  {
    id: "payment",
    title: "Complete first payment",
    completed: (state: OnboardingState) => state.paymentsCount > 0,
    href: ROUTES.DASHBOARD_ORDERS,
    goLabel: "Go to Orders",
  },
] as const;

interface OnboardingState {
  tablesCount: number;
  menuItemsCount: number;
  usersCount: number;
  ordersCount: number;
  paymentsCount: number;
}

const defaultState: OnboardingState = {
  tablesCount: 0,
  menuItemsCount: 0,
  usersCount: 0,
  ordersCount: 0,
  paymentsCount: 0,
};

export function OnboardingChecklist({
  organizationId,
  onDismiss,
  onComplete,
}: {
  organizationId: string;
  onDismiss: () => void;
  onComplete?: () => void;
}) {
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [loading, setLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  const fetchCounts = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [tables, menuItems, users, orders, payments] = await Promise.all([
        getTablesByOrganization(organizationId, 10),
        getMenuItemsByOrg(organizationId, 10),
        getUsersByOrganization(organizationId),
        getOrdersByOrg(organizationId, 10),
        getPaymentsByOrganization(organizationId, 10),
      ]);
      setState({
        tablesCount: tables.length,
        menuItemsCount: menuItems.length,
        usersCount: users.length,
        ordersCount: orders.length,
        paymentsCount: payments.length,
      });
    } catch {
      setState(defaultState);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const completedList = CHECKLIST_ITEMS.filter((item) => item.completed(state));
  const totalSteps = CHECKLIST_ITEMS.length;
  const completedSteps = completedList.length;
  const allComplete = completedSteps === totalSteps;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  useEffect(() => {
    if (!loading && allComplete && onComplete) {
      const t = window.setTimeout(() => onComplete(), 1800);
      return () => window.clearTimeout(t);
    }
  }, [loading, allComplete, onComplete]);

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.25 },
  };

  const itemVariants = {
    initial: { opacity: 0, x: -4 },
    animate: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: prefersReducedMotion ? 0 : i * 0.04, duration: 0.2 },
    }),
  };

  const checkScale = {
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: { duration: 0.2 },
  };

  if (loading) {
    return (
      <Card className="rounded-xl border border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={containerVariants.initial}
      animate={containerVariants.animate}
      transition={containerVariants.transition}
    >
      <Card className="rounded-xl border border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 p-6 pb-2">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Getting started with DineSync
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Complete these steps to activate your restaurant
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onDismiss}
            aria-label="Dismiss checklist"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 p-6 pt-2">
          {allComplete ? (
            <motion.div
              className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-muted/20 py-10 text-center"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              <span className="mb-3 text-4xl" aria-hidden>
                🎉
              </span>
              <h4 className="text-lg font-semibold text-foreground">
                You&apos;re all set!
              </h4>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Your restaurant is fully configured and ready to operate.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-secondary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>

              {/* Checklist */}
              <ul className="space-y-0 divide-y divide-border/70">
                {CHECKLIST_ITEMS.map((item, index) => {
                  const done = item.completed(state);
                  return (
                    <motion.li
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0"
                      variants={itemVariants}
                      initial="initial"
                      animate="animate"
                      custom={index}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                          aria-hidden
                        >
                          {done ? (
                            <motion.span
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success"
                              {...checkScale}
                            >
                              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </motion.span>
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground/60" />
                          )}
                        </span>
                        <span
                          className={
                            done
                              ? "text-sm font-medium text-muted-foreground line-through"
                              : "text-sm font-medium text-foreground"
                          }
                        >
                          {item.title}
                        </span>
                      </div>
                      {!done && (
                        <Link
                          href={item.href}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                        >
                          {item.goLabel}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </motion.li>
                  );
                })}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function getOnboardingDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "true";
}

export function setOnboardingDismissed(dismissed: boolean): void {
  if (typeof window === "undefined") return;
  if (dismissed) {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
  } else {
    localStorage.removeItem(ONBOARDING_DISMISSED_KEY);
  }
}

export function getOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "true";
}

export function setOnboardingComplete(complete: boolean): void {
  if (typeof window === "undefined") return;
  if (complete) {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
  } else {
    localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
  }
}
