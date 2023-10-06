'use client';

import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import CategoryService from '@/utils/supabase/services/categories';
import ToolCardEffect from '@/components/ui/ToolCardEffect/ToolCardEffect';
import { IconLoading } from '@/components/Icons';
import EmptyState from '@/components/ui/CommandPalette/EmptyState';
import Page404 from '@/components/ui/Page404/Page404';
import categories from '@/utils/categories';

export default () => {
  const query = useParams();
  const { slug } = query as { slug: string };
  const productService = new ProductsService(createBrowserClient());
  const categoryService = new CategoryService(createBrowserClient());

  const [tools, setTools] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [isCategoryValid, setCategoryValidation] = useState(true);

  const getOriginalSlug = () => {
    const getValidSlug = categories.filter(item => slug.replaceAll('-', ' ') == item.toLowerCase());
    return getValidSlug[0];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoryName = getOriginalSlug();

        // Fetch the category
        const categories: any = await categoryService.search(categoryName);
        const category = categories.find((c: { name: string }) => c.name.toLowerCase() === categoryName.toLowerCase());
        if (!category) {
          setCategoryValidation(false);
          setLoading(false);
        }

        // Fetch the products
        const { data: products } = await productService.getProducts(
          'votes_count',
          false,
          50,
          1,
          category.id,
          productService.EXTENDED_PRODUCT_SELECT_WITH_CATEGORIES,
        );

        setTools(products);
        setLoading(false);
      } catch (error) {
        console.error('An error occurred:', error);
        // Handle the error as needed, e.g., display an error message or log it.
      }
    };

    fetchData(); // Call the fetchData function to initiate the data fetching
  }, [slug]);

  return (
    <section className="max-w-4xl mt-5 lg:mt-10 mx-auto px-4 md:px-8">
      {isLoading ? (
        <div className="flex items-center justify-center h-screen">
          <IconLoading className="w-7 h-7 mx-auto text-orange-500" />
        </div>
      ) : (
        <>
          {isCategoryValid ? (
            <>
              <h1 className="text-xl text-slate-50 font-extrabold">Best {getOriginalSlug()} tools</h1>
              <ul className="mt-10 mb-12 divide-y divide-slate-800/60">
                {tools && tools.length > 0 ? (
                  tools.map((product, idx) => <ToolCardEffect key={idx} tool={product} />)
                ) : (
                  <div>
                    <EmptyState />
                  </div>
                )}
              </ul>
            </>
          ) : (
            <Page404 />
          )}
        </>
      )}
    </section>
  );
};
