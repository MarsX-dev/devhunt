'use client';

import { IconLoading } from '@/components/Icons';
import { useSupabase } from '@/components/supabase/provider';
import Page404 from '@/components/ui/Page404/Page404';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { useParams } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';

export default ({ children }: { children: ReactNode }) => {
  const { id } = useParams();
  const { user } = useSupabase();
  const browserService = createBrowserClient();
  const tool = new ProductsService(browserService).getById(+id);
  const [isLoad, setLoad] = useState<boolean>(true);
  const [isTool, setIsTool] = useState<boolean>(true);

  useEffect(() => {
    tool.then(res => {
      setLoad(false);
      if (res && res.owner_id == user.id) setIsTool(true);
      else setIsTool(false);
    });
  }, []);

  return isLoad
    ? (
    <div className="min-h-screen">
      <IconLoading className="w-7 h-7 text-orange-500 mx-auto mt-16" />
    </div>
      )
    : isTool
      ? (
          children
        )
      : (
    <Page404 />
        );
};
