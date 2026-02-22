"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import {
  getFCMToken,
  onForegroundMessage,
  requestNotificationPermission,
  isPushSupported,
  type ForegroundMessagePayload,
} from "@/lib/firebase/messaging";
import { saveDeviceToken } from "@/services/deviceToken.service";
import { useToast } from "@/components/providers/ToastProvider";
import { assertEnv } from "@/lib/env";

/**
 * Registers for push notifications when user is logged in: requests permission,
 * gets FCM token, saves to Firestore with role + organizationId.
 * Subscribes to foreground messages and shows a toast when a notification is received.
 */
export function usePushNotifications() {
  const { user } = useAuthContext();
  const toast = useToast();
  const unsubForegroundRef = useRef<(() => void) | null>(null);

  const registerToken = useCallback(async () => {
    if (!user || !isPushSupported()) return;

    if (typeof window !== "undefined" && !window.isSecureContext) {
      toast.info(
        "Notifications require HTTPS. Open this site over HTTPS (or use localhost) to enable them.",
        8000
      );
      return;
    }

    const env = assertEnv();
    const vapidKey = env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn(
        "Push: Set NEXT_PUBLIC_FIREBASE_VAPID_KEY in .env.local (Firebase Console → Project settings → Cloud Messaging → Web Push key pair) to enable notifications."
      );
      toast.info("Notifications disabled: missing Web Push key. Check console for setup.", 8000);
      return;
    }

    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      if (permission === "denied") {
        toast.info("Notifications blocked. Enable them in your browser to get order alerts.", 6000);
      }
      return;
    }

    const result = await getFCMToken(vapidKey);
    if (!result.ok) {
      const message =
        result.reason === "no_messaging"
          ? "Notifications not supported in this browser. Try Chrome."
          : result.reason === "sw_failed"
            ? "Couldn’t register notification service. Try Chrome over HTTPS and refresh."
            : result.reason === "push_service_error"
              ? "Notification service isn’t ready yet. You can still use the app; alerts may be enabled later from Settings."
              : "Couldn’t enable notifications. Use Chrome over HTTPS and allow notifications in browser and system settings.";
      console.warn("Push: getFCMToken failed:", result.reason, message);
      toast.info(message, 8000);
      return;
    }

    try {
      await saveDeviceToken({
        token: result.token,
        userId: user.uid,
        organizationId: user.organizationId,
        role: user.role,
      });
    } catch (err) {
      console.error("Failed to save device token:", err);
      toast.info("Failed to save notification settings.", 5000);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;
    void registerToken();
  }, [user, registerToken]);

  // Foreground: show toast when message received
  useEffect(() => {
    if (!isPushSupported()) return;

    const unsub = onForegroundMessage((payload: ForegroundMessagePayload) => {
      const title = payload.notification?.title;
      const body = payload.notification?.body;
      const message = [title, body].filter(Boolean).join(" — ") || "New notification";
      toast.info(message, 6000);
      const type = payload.data?.type;
      if (type === "order_created" && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dinesync-push-order-created"));
      }
    });
    unsubForegroundRef.current = unsub ?? null;
    return () => {
      unsubForegroundRef.current?.();
      unsubForegroundRef.current = null;
    };
  }, [toast]);

  return { registerToken, isSupported: isPushSupported() };
}
