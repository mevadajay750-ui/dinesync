"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPaymentCreate = exports.onOrderWrite = void 0;
const admin = require("firebase-admin");
const firestore_1 = require("firebase-functions/v1/firestore");
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
const COLLECTIONS = {
    ORDERS: "orders",
    PAYMENTS: "payments",
    DEVICE_TOKENS: "deviceTokens",
};
const CLICK_ACTION = "/dashboard/orders";
/**
 * Fetch FCM device token IDs (document IDs) for users in the same org with the given roles.
 * Multi-tenant: only tokens for the specified organizationId.
 */
async function getDeviceTokensForRoles(organizationId, roles) {
    if (roles.length === 0)
        return [];
    const tokens = [];
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
async function sendPushToTokens(tokens, title, body, data) {
    if (tokens.length === 0)
        return;
    const payload = {
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
exports.onOrderWrite = (0, firestore_1.document)("orders/{orderId}").onWrite(async (change, context) => {
    const orderId = context.params.orderId;
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;
    if (!after || !after.organizationId)
        return;
    const orgId = after.organizationId;
    const tableName = after.tableName ?? "—";
    const total = after.total != null ? `₹${after.total}` : "—";
    // New order created with status pending → notify kitchen
    if (!before && after.status === "pending") {
        const kitchenTokens = await getDeviceTokensForRoles(orgId, ["kitchen"]);
        await sendPushToTokens(kitchenTokens, "New Order Received 🍽️", `Table: ${tableName}\nTotal: ${total}`, { orderId, type: "order_created" });
        return;
    }
    // Status changed to ready → notify waiters
    if (before && before.status !== "ready" && after.status === "ready") {
        const waiterTokens = await getDeviceTokensForRoles(orgId, ["waiter"]);
        await sendPushToTokens(waiterTokens, "Order Ready to Serve ✅", `Table: ${tableName}\nTotal: ${total}`, { orderId, type: "order_ready" });
    }
});
/**
 * When payment is created, notify owner and manager.
 */
exports.onPaymentCreate = (0, firestore_1.document)("payments/{paymentId}").onCreate(async (snap, context) => {
    const payment = snap.data();
    const paymentId = context.params.paymentId;
    const orgId = payment.organizationId;
    if (!orgId)
        return;
    const total = payment.total != null ? `₹${payment.total}` : "—";
    const body = `Table / Order payment recorded.\nTotal: ${total}`;
    const ownerManagerTokens = await getDeviceTokensForRoles(orgId, ["owner", "manager"]);
    await sendPushToTokens(ownerManagerTokens, "Payment Completed 💳", body, { paymentId, orderId: payment.orderId ?? "", type: "payment_completed" });
});
