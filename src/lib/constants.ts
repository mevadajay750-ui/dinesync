export const COLLECTIONS = {
  USERS: "users",
  ORGANIZATIONS: "organizations",
  ORDERS: "orders",
  INVITES: "invites",
  TABLES: "tables",
  MENU_CATEGORIES: "menuCategories",
  MENU_ITEMS: "menuItems",
  PAYMENTS: "payments",
  DEVICE_TOKENS: "deviceTokens",
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  CREATE_ORGANIZATION: "/create-organization",
  DASHBOARD: "/dashboard",
  DASHBOARD_TABLES: "/dashboard/tables",
  DASHBOARD_MENU: "/dashboard/menu",
  DASHBOARD_ORDERS: "/dashboard/orders",
  DASHBOARD_KITCHEN: "/dashboard/kitchen",
  DASHBOARD_REPORTS: "/dashboard/reports",
  DASHBOARD_INVITES: "/dashboard/invites",
  DASHBOARD_SETTINGS: "/dashboard/settings",
  UNAUTHORIZED: "/unauthorized",
} as const;

export const PROTECTED_PATHS = ["/dashboard", "/create-organization"] as const;

export const AUTH_PATHS = ["/login", "/register"] as const;

/** Default tax rate (5%). Used for order totals when org settings not available. */
export const DEFAULT_TAX_RATE = 0.05;

/** Default service charge (5%). */
export const DEFAULT_SERVICE_CHARGE_RATE = 0.05;

/** Currency symbol for display (INR). */
export const CURRENCY_SYMBOL = "₹";
