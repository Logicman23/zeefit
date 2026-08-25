import PageHeader from "@/components/PageHeader";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <PageHeader title="Checkout" />

      <div className="mx-auto max-w-[1400px] px-6 py-14 lg:py-20">
        <CheckoutForm />
      </div>
    </>
  );
}
