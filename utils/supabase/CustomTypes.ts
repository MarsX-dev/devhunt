import {
  type Product,
  type ProductCategory,
  type ProductPricingType,
  type Profile,
  type Database,
} from '@/utils/supabase/types';

export type ExtendedProduct = Product & {
  product_pricing_types: ProductPricingType
  product_categories: ProductCategory[]
  profiles: Profile
}

export type ExtendedComment = Comment & {
  profiles: Profile
}

export type WinnerOfTheDay = Database['public']['Views']['winner_of_the_day']['Row']
export type WinnerOfTheWeek = Database['public']['Views']['winner_of_the_week']['Row']
export type WinnerOfTheMonth = Database['public']['Views']['winner_of_the_month']['Row']

export type ProductAward = Database['public']['Views']['product_awards']['Row']
