'use client';

import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import CategoryService from "@/utils/supabase/services/categories";

export default () => {
  const query = useParams();
  const { slug } = query as { slug: string };
  const productService = new ProductsService(createBrowserClient());
  const categoryService = new CategoryService(createBrowserClient());

  useEffect(async () => {
    const [category] = await categoryService.search(decodeURIComponent(slug));
    if(!category) {
      throw "Category not found";
    }

    const {data: products } = await productService.getProducts('votes_count', false, 50, 1, category.id, productService.EXTENDED_PRODUCT_SELECT_WITH_CATEGORIES)
    alert(products.map((p) => p.name));
  }, []);

  return <div style={{color: '#fff'}}></div>;
};
