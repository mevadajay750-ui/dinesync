export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 transition-colors duration-200">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
