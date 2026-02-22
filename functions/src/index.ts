import * as admin from "firebase-admin";
import { document } from "firebase-functions/v1/firestore";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

const COLLECTIONS = {
  ORDERS: "orders",
  PAYMENTS: "payments",
  DEVICE_TOKENS: "deviceTokens",
} as const;

const CLICK_ACTION = "/dashboard/orders";

type UserRole = "owner" | "manager" | "waiter" | "kitchen";

interface OrderData {
  organizationId: string;
  status: string;
  tableName?: string;
  total?: number;
}

interface PaymentData {
  organizationId: string;
  orderId: string;
  tableId: string;
  total?: number;
}

/**
 * Fetch FCM device token IDs (document IDs) for users in the same org with the given roles.
 * Multi-tenant: only tokens for the specified organizationId.
 */
async function getDeviceTokensForRoles(
  organizationId: string,
  roles: UserRole[]
): Promise<string[]> {
  if (roles.length === 0) return [];

  const tokens: string[] = [];
  for (const role of roles) {
    const snapshot = await db
      .collection(COLLECTIONS.DEVICE_TOKENS)
      .where("organizationId", "==", organizationId)
      .where("role", "==", role)
      .get();
    snapshot.docs.forEach((d) => tokens.push(d.id));
  }
  return [...new Set(tokens)];
}

/**
 * Send push notification to tokens. Uses multicast (max 500 per call).
 */
async function sendPushToTokens(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string>
): Promise<void> {
  if (tokens.length === 0) return;

  const payload: admin.messaging.MulticastMessage = {
    tokens,
    notification: { title, body },
    data: { ...data, click_action: CLICK_ACTION },
    webpush: {
      fcmOptions: { link: CLICK_ACTION },
    },
  };

  const batchSize = 500;
  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);
    await messaging.sendEachForMulticast({
      ...payload,
      tokens: batch,
    });
  }
}

/**
 * Notify kitchen when a new order is created (status = pending).
 * Notify waiters when order status becomes ready.
 */
export const onOrderWrite = document("orders/{orderId}").onWrite(async (change, context) => {
    const orderId = context.params.orderId as string;
    const after = change.after.exists ? (change.after.data() as OrderData) : null;
    const before = change.before.exists ? (change.before.data() as OrderData) : null;

    if (!after || !after.organizationId) return;

    const orgId = after.organizationId;
    const tableName = after.tableName ?? "—";
    const total = after.total != null ? `₹${after.total}` : "—";

    // New order created with status pending → notify kitchen
    if (!before && after.status === "pending") {
      const kitchenTokens = await getDeviceTokensForRoles(orgId, ["kitchen"]);
      await sendPushToTokens(
        kitchenTokens,
        "New Order Received 🍽️",
        `Table: ${tableName}\nTotal: ${total}`,
        { orderId, type: "order_created" }
      );
      return;
    }

    // Status changed to ready → notify waiters
    if (before && before.status !== "ready" && after.status === "ready") {
      const waiterTokens = await getDeviceTokensForRoles(orgId, ["waiter"]);
      await sendPushToTokens(
        waiterTokens,
        "Order Ready to Serve ✅",
        `Table: ${tableName}\nTotal: ${total}`,
        { orderId, type: "order_ready" }
      );
    }
  }
);


/**
 * When payment is created, notify owner and manager.
 */
export const onPaymentCreate = document("payments/{paymentId}").onCreate(async (snap, context) => {
    const payment = snap.data() as PaymentData;
    const paymentId = context.params.paymentId as string;
    const orgId = payment.organizationId;
    if (!orgId) return;

    const total = payment.total != null ? `₹${payment.total}` : "—";
    const body = `Table / Order payment recorded.\nTotal: ${total}`;

    const ownerManagerTokens = await getDeviceTokensForRoles(orgId, ["owner", "manager"]);
    await sendPushToTokens(
      ownerManagerTokens,
      "Payment Completed 💳",
      body,
      { paymentId, orderId: payment.orderId ?? "", type: "payment_completed" }
    );
});
