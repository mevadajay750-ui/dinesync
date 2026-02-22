# DineSync

Production-grade SaaS boilerplate for restaurant management. Built with Next.js 14+, TypeScript, Tailwind CSS, and Firebase.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 4
- **Backend:** Firebase (Auth, Firestore)
- **Notifications:** Firebase Cloud Messaging (Web Push ready)
- **Validation:** Zod
- **Forms:** React Hook Form + @hookform/resolvers
- **Package manager:** pnpm

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure Firebase

1. Create a project in [Firebase Console](https://console.firebase.google.com).
2. Copy `.env.example` to `.env.local`.
3. Add your Firebase config from **Project settings > General > Your apps**:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

4. Enable **Email/Password** and **Google** sign-in in Authentication > Sign-in method.
5. Create Firestore database (start in test mode for dev).

### 3. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Register a new account (creates an organization and owner user), then use the dashboard.

## Project structure

```
src/
├── app/
│   ├── (auth)/login, register
│   ├── dashboard/           # Protected routes
│   ├── api/auth/session      # Session cookie API
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                   # Button, Input, Card
│   ├── layout/               # Sidebar, Topbar, MobileDrawer
│   ├── shared/               # Toast
│   └── providers/            # Auth, Theme, Toast
├── lib/
│   ├── firebase/             # config, auth, firestore, messaging
│   ├── env.ts                # Env validation (Zod)
│   ├── utils.ts
│   └── constants.ts
├── hooks/
│   ├── useAuth.ts
│   └── useOrganization.ts
├── types/
├── services/                 # user, organization, order
└── middleware.ts             # Cookie-based route protection
```

## Features

- **Auth:** Email/password and Google sign-in, protected routes via middleware + client redirect
- **Multi-tenant:** User model with `organizationId` and roles (owner, manager, waiter, kitchen)
- **Dashboard:** Collapsible sidebar, topbar with theme toggle and sign out, mobile drawer
- **UI:** Reusable Button, Input, Card; toast notifications; dark mode
- **Firestore:** Organizations and users collections; order service and types ready for menu/tables

## Scripts

- `pnpm dev` – Start dev server
- `pnpm build` – Production build (works without `.env`; Firebase required at runtime)
- `pnpm start` – Start production server
- `pnpm lint` – ESLint
- `pnpm format` – Prettier

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_*` | Yes (at runtime) | Firebase client config |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` | No | Set `true` to use Auth/Firestore emulators |

Build succeeds without Firebase env vars; the app will prompt you to configure them when you use auth in the browser.

## License

MIT
