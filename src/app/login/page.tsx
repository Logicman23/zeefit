import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "Customer Login" };

export default function LoginPage() {
  return (
    <>
      <PageHeader title="Customer Login" />

      <div className="mx-auto max-w-[1400px] px-6 py-14 lg:py-24">
        <div className="mx-auto max-w-md">
          <form className="space-y-7 border border-line p-8 lg:p-10" action="" method="post">
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

            <div>
              <label htmlFor="password" className="eyebrow mb-2.5 block text-ink-muted">
                Password <span className="text-alert">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full border border-line bg-mist px-4 py-3.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:bg-paper"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand px-8 py-4 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-paper transition-colors duration-300 hover:bg-ink"
            >
              Login
            </button>

            <Link
              href="/forget-password"
              className="link-draw block text-center text-[0.8125rem] text-ink-soft transition-colors hover:text-brand"
            >
              Forget Password?
            </Link>
          </form>
        </div>
      </div>
    </>
  );
}
