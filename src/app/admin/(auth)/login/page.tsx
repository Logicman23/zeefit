import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — Zee Fit Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-mist px-4 py-16">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <span className="display text-2xl tracking-tight text-ink">ZEE FIT</span>
          <p className="eyebrow mt-2 text-brand">Admin Panel</p>
        </div>

        <div className="rounded-[2px] border border-line bg-paper p-7">
          <h1 className="display text-lg text-ink">Sign in</h1>
          <p className="mt-1.5 text-[0.8125rem] text-ink-muted">
            Staff accounts only. Access is issued by invitation.
          </p>

          <LoginForm next={next} />
        </div>

        <p className="mt-6 text-center text-[0.75rem] text-ink-muted">
          Lost your password? Ask an administrator to send a reset link.
        </p>
      </div>
    </div>
  );
}
