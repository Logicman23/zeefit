import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "Forget Password" };

export default function ForgetPasswordPage() {
  return (
    <>
      <PageHeader title="Forget Password" trail={["Customer Login"]} />

      <div className="mx-auto max-w-[1400px] px-6 py-14 lg:py-24">
        <div className="mx-auto max-w-md">
          <form className="space-y-7 border border-line p-8 lg:p-10" action="" method="post">
            <p className="text-[0.875rem] leading-relaxed text-ink-muted">
              Enter the email address on your account and we will send you a link to reset your password.
            </p>

            <div>
              <label htmlFor="email" className="eyebrow mb-2.5 block text-ink-muted">
                Email Address <span className="text-alert">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full border border-line bg-mist px-4 py-3.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:bg-paper"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand px-8 py-4 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-paper transition-colors duration-300 hover:bg-ink"
            >
              Send Reset Link
            </button>

            <Link
              href="/login"
              className="link-draw block text-center text-[0.8125rem] text-ink-soft transition-colors hover:text-brand"
            >
              Back to Customer Login
            </Link>
          </form>
        </div>
      </div>
    </>
  );
}
