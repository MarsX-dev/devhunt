import { Product } from './utils/supabase/types';

export interface ProductType extends Product {
  product_pricing_types: {
    title: string;
  };
  product_categories: {
    name: string;
  }[];
  site_status?: 'ok' | 'dead' | 'hijacked'; // website health (hidden unless 'ok')
  site_status_reason?: string | null;
}
