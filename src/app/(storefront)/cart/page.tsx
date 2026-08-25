import PageHeader from "@/components/PageHeader";
import CartView from "@/components/CartView";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <>
      <PageHeader title="Cart" />

      <div className="mx-auto max-w-[1400px] px-6 py-14 lg:py-20">
        <CartView />
      </div>
    </>
  );
}
