import { getToken, onMessage, getMessaging, type Messaging } from "firebase/messaging";
import { app } from "./config";

let messagingInstance: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
  if (typeof window === "undefined") return null;
  if (messagingInstance) return messagingInstance;
  try {
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch {
    return null;
  }
}

/**
 * Request browser permission for notifications.
 * Returns current permission state without prompting if already granted/denied.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.requestPermission();
}

const FCM_SW_PATH = "/firebase-messaging-sw.js";

/**
 * Wait for this registration to have an active service worker.
 * getToken() can fail with "push service error" if the SW isn't active yet.
 */
function waitForActive(reg: ServiceWorkerRegistration): Promise<ServiceWorkerRegistration> {
  if (reg.active) return Promise.resolve(reg);
  const sw = reg.installing || reg.waiting;
  if (!sw) return Promise.resolve(reg);
  return new Promise((resolve) => {
    const onStateChange = (): void => {
      if (reg.active) {
        sw.removeEventListener("statechange", onStateChange);
        resolve(reg);
      }
    };
    sw.addEventListener("statechange", onStateChange);
    if (reg.active) onStateChange();
  });
}

/** Short delay so the push service is ready after SW becomes active. */
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Get or register the Firebase Cloud Messaging service worker.
 * Waits until it is active so getToken() does not hit "push service error".
 */
export async function getMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !navigator.serviceWorker) return null;
  try {
    const reg = await navigator.serviceWorker.register(FCM_SW_PATH, { scope: "/" });
    await waitForActive(reg);
    return reg;
  } catch (error) {
    console.error("FCM service worker registration error:", error);
    return null;
  }
}

export type GetFCMTokenResult =
  | { ok: true; token: string }
  | {
      ok: false;
      reason: "no_messaging" | "sw_failed" | "token_failed" | "push_service_error";
    };

/**
 * Get FCM token for this browser/device. Requires VAPID key from Firebase Console.
 * Registers the messaging SW first, waits for it to be active, then gets token with retries.
 * "push service error" is retried with longer backoff since the browser push service may not be ready yet.
 */
export async function getFCMToken(vapidKey: string): Promise<GetFCMTokenResult> {
  const instance = getMessagingInstance();
  if (!instance) return { ok: false, reason: "no_messaging" };

  const registration = await getMessagingServiceWorker();
  if (!registration) return { ok: false, reason: "sw_failed" };

  // Give the push service a moment to be ready after SW is active
  await delay(1500);

  const maxAttempts = 5;
  const baseDelayMs = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const token = await getToken(instance, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });
      return token ? { ok: true, token } : { ok: false, reason: "token_failed" };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const isPushServiceError =
        msg.includes("push service error") ||
        msg.includes("push service not available") ||
        msg.includes("Push service");
      console.warn(`FCM getToken attempt ${attempt}/${maxAttempts} failed:`, msg);
      if (attempt === maxAttempts) {
        console.error("FCM getToken error:", error);
        return {
          ok: false,
          reason: isPushServiceError ? "push_service_error" : "token_failed",
        };
      }
      if (isPushServiceError || msg.includes("AbortError")) {
        const backoffMs = baseDelayMs * attempt;
        await delay(backoffMs);
      } else {
        return { ok: false, reason: "token_failed" };
      }
    }
  }
  return { ok: false, reason: "token_failed" };
}

export interface ForegroundMessagePayload {
  notification?: { title?: string; body?: string };
  data?: Record<string, string>;
}

/**
 * Subscribe to foreground messages. When app is in focus, FCM delivers here instead of the service worker.
 * Returns unsubscribe function or null if messaging unavailable.
 */
export function onForegroundMessage(
  callback: (payload: ForegroundMessagePayload) => void
): (() => void) | null {
  const instance = getMessagingInstance();
  if (!instance) return null;
  return onMessage(instance, callback);
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}
