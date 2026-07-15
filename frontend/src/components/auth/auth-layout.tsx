import Link from "next/link";

export default function AuthLayout({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-neutral-50 to-brand-50 px-4 py-12">
      <Link
        href="/"
        className="mb-8 text-2xl font-bold tracking-tight text-neutral-900"
      >
        VESTI
      </Link>
      {children}
      {footer ? (
        <div className="mt-6 text-sm text-neutral-500">{footer}</div>
      ) : null}
    </div>
  );
}
