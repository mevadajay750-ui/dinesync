import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <ShieldX
          className="mx-auto h-14 w-14 text-muted-foreground"
          aria-hidden
        />
        <h1 className="mt-4 text-xl font-semibold text-foreground">
          Access Denied
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&apos;t have permission to view this page.
        </p>
        <Link
          href={ROUTES.DASHBOARD}
          className="mt-6 flex h-11 w-full items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
