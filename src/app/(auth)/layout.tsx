export const dynamic = "force-dynamic";

import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen bg-background transition-colors duration-200">
      <AuthBrandPanel />
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
