import { IconGlobeAlt } from '@/components/Icons/IconGlobeAlt'
import ProfileService from '@/utils/supabase/services/profile'
import Logo from '@/components/ui/ToolCard/Tool.Logo'
import Name from '@/components/ui/ToolCard/Tool.Name'
import Tags from '@/components/ui/ToolCard/Tool.Tags'
import Title from '@/components/ui/ToolCard/Tool.Title'
import Votes from '@/components/ui/ToolCard/Tool.Votes'
import ToolCard from '@/components/ui/ToolCard/ToolCard'
import ProductsService from '@/utils/supabase/services/products'
import { createServerClient } from '@/utils/supabase/server'

export default async ({ params: { user } }: { params: { user: string } }) => {
  const username = decodeURIComponent(user).slice(1)
  const profileService = new ProfileService(createServerClient())
  const profile = await profileService.getByUsername(username)

  const tools = await new ProductsService(createServerClient()).getUserProductsById(
    profile?.id as string,
    'votes_count',
    false
  )

  return (
    <div className="mt-10 space-y-10">
      <div>
        <p className="text-slate-400">{profile?.about}</p>
        {profile?.website_url ? (
          <div className="mt-3">
            <a
              href={profile?.website_url as string}
              target="_blank"
              className="flex items-center gap-x-2 text-slate-500 hover:text-slate-400 text-sm duration-150"
            >
              <IconGlobeAlt />
              Website
            </a>
          </div>
        ) : (
          ''
        )}
      </div>
      <div>
        <h3 className="font-medium text-slate-50">Launches</h3>
        <ul className="divide-y divide-slate-800/60">
          {tools && tools?.length > 0 ? (
            tools.map((product, idx) => (
              <li key={idx} className="py-3">
                <ToolCard href={'/tool/' + product.slug}>
                  <Logo src={product.logo_url || ''} alt={product.name} />
                  <div className="space-y-1">
                    <Name>{product.name}</Name>
                    <Title className="line-clamp-1 sm:line-clamp-2">{product.slogan}</Title>
                    <Tags
                      items={[
                        (product.product_pricing_types as { title: string }).title || 'Free',
                        ...(product.product_categories as { name: string }[]).map((c: { name: string }) => c.name),
                      ]}
                    />
                  </div>
                  <div className="flex-1 self-center flex justify-end">
                    <Votes count={product.votes_count} />
                  </div>
                </ToolCard>
              </li>
            ))
          ) : (
            <div className="mt-3 text-slate-400">No launces found for this user</div>
          )}
        </ul>
      </div>
    </div>
  )
}
