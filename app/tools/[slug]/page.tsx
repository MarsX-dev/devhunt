'use client';

import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default () => {
  const query = useParams();
  const { slug } = query as { slug: string };
  const productService = new ProductsService(createBrowserClient());

  useEffect(() => {
    productService.getProducts('votes_count', false, 20, 2, 1, productService.EXTENDED_PRODUCT_SELECT_WITH_CATEGORIES).then(res => {
      console.log(res);
    });
  }, []);

  return <div></div>;
};
