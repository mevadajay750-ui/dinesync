import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto max-w-2xl space-y-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          DineSync
        </h1>
        <p className="text-lg text-muted-foreground">
          Restaurant management made simple. Orders, kitchen, and reports in one place.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href={ROUTES.LOGIN}>
            <Button size="lg">Sign in</Button>
          </Link>
          <Link href={ROUTES.REGISTER}>
            <Button variant="outline" size="lg">Create account</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
