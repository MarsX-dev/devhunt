import { type ProductType } from '@/type';

// Fields read by ToolCardEffect/ToolCard and the click-to-preview ToolViewModal. List pages pass only
// these to client components; the full product rows (timestamps, payment fields, etc.) made every
// list page serialize ~30 unused fields per tool into the HTML.
export function toToolCardProps(product: any): ProductType {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    slogan: product.slogan,
    description: product.description,
    logo_url: product.logo_url,
    demo_url: product.demo_url,
    demo_video_url: product.demo_video_url,
    asset_urls: product.asset_urls,
    owner_id: product.owner_id,
    launch_date: product.launch_date,
    launch_end: product.launch_end,
    views_count: product.views_count,
    votes_count: product.votes_count,
    product_pricing_types: product.product_pricing_types ? { title: product.product_pricing_types.title } : null,
    product_categories: (product.product_categories ?? []).map((c: { id?: number; name: string }) => ({ id: c.id, name: c.name })),
  } as unknown as ProductType;
}
