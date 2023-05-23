import ProductLogo from "@/components/ui/ProductCard/Product.Logo";
import ProductName from "@/components/ui/ProductCard/Product.Name";
import ProductTitle from "@/components/ui/ProductCard/Product.Title";

export default function Page() {
    return (
        <section className="mt-20">
            <div className="container-custom-screen">
                <ProductLogo src="/images/wundergraph.png" alt="WunderGraph the next generation Backend For Frontend framework" />
                <ProductName className="mt-3">WunderGraph</ProductName>
                <ProductTitle className="mt-1">
                    WunderGraph the next generation Backend For Frontend framework
                </ProductTitle>
                <div className="mt-5 text-xl text-white">
                    In Progress...
                </div>
            </div>
        </section>
    );
  }