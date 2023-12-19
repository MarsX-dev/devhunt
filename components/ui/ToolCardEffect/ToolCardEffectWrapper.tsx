'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { useInView } from 'framer-motion';

export default ({ children, ToolId }: { children: ReactNode; ToolId: number }) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true });

  if (isInView) {
    new ProductsService(createBrowserClient()).viewed(ToolId); // track views
  }
  return (
    <li ref={cardRef} className="py-3">
      {children}
    </li>
  );
};
