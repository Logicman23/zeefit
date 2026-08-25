import Header from "@/components/Header";
import MegaNav from "@/components/MegaNav";
import Footer from "@/components/Footer";
import Newsletter from "@/components/Newsletter";
import ScrollTop from "@/components/ScrollTop";
import { getCatalog } from "@/lib/storefront";

/**
 * Storefront chrome, lifted out of the root layout so `/admin` can opt out of it.
 * Used by the (storefront) route group and by the root not-found page, which
 * Next renders against the root layout rather than the group's.
 */
export default async function StorefrontChrome({ children }: { children: React.ReactNode }) {
  const catalog = await getCatalog();

  return (
    <>
      <Header catalog={catalog}>
        <MegaNav />
      </Header>
      <main className="flex-1">{children}</main>
      <Newsletter />
      <Footer />
      <ScrollTop />
    </>
  );
}
