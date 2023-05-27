import { type Product, type ProductCategory, type ProductPricingType, type Profile } from '@/libs/supabase/types'

export type ExtendedProduct = Product & {
  product_pricing_types: ProductPricingType
  product_categories: ProductCategory[]
}

export type ExtendedComment = Comment & {
  profiles: Profile
}
