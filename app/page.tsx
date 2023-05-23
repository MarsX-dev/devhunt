import Logo from "@/components/ui/ProductCard/Product.Logo";
import Name from "@/components/ui/ProductCard/Product.Name";
import Tags from "@/components/ui/ProductCard/Product.Tags";
import Title from "@/components/ui/ProductCard/Product.Title";
import Votes from "@/components/ui/ProductCard/Product.Votes";
import ProductCard from "@/components/ui/ProductCard/ProductCard";
import LinkShiny from '@/components/ui/LinkShiny/LinkShiny';
import mockproducts from "@/mockproducts";

import Link from 'next/link'

export default function Home() {
  return (
<>
    <section className="max-w-4xl mt-20 mx-auto px-4 md:px-8">
        <h1 className="text-slate-50 text-lg font-semibold xl:px-4">
          Find your next favorite product
        </h1>

        <div className="mt-10">
          <ul className="divide-y divide-slate-800/60">
            {
              mockproducts.slice(0,5).map((item, idx) => (
              <li key={idx} className="py-3">
                <ProductCard href={item.slug}>
                  <Logo src={item.logo} alt={item.title} />
                  <div className="space-y-1">
                    <Name>
                      {item.name}
                    </Name>
                    <Title className="line-clamp-1 sm:line-clamp-2">
                      {item.title}
                    </Title>
                    <Tags items={item.tags.slice(0,2)} />
                  </div>
                  <div className="flex-1 self-center flex justify-end">
                    <Votes count={item.votes} />
                  </div>
                </ProductCard>
              </li>
              ))
            }
          </ul>
        </div>
    </section>
    <section className="max-w-4xl py-12 mx-auto px-4 md:px-8">
          <LinkShiny href='/products' className='block'>
            View all products
          </LinkShiny>
    </section>
  </>
  )
}
