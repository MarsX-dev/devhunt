import Logo from '@/components/ui/ToolCard/Tool.Logo';
import Name from '@/components/ui/ToolCard/Tool.Name';
import Tags from '@/components/ui/ToolCard/Tool.Tags';
import Title from '@/components/ui/ToolCard/Tool.Title';
import Votes from '@/components/ui/ToolCard/Tool.Votes';
import ToolCard from '@/components/ui/ToolCard/ToolCard';

import ProfileService from '@/utils/supabase/services/profile';
import ProductsService from '@/utils/supabase/services/products';
import UserProfileInfo from '@/components/ui/UserProfileInfo/UserProfileInfo';
import { type Comment as CommentType, type Product, type Profile } from '@/utils/supabase/types';
import Page404 from '@/components/ui/Page404/Page404';
import ToolCardList, { type ITool } from '@/components/ui/ToolCardList/ToolCardList';
import { Comment, CommentContext, CommentDate, CommentUserAvatar, CommentUserName, Comments } from '@/components/ui/Comment';
import { createBrowserClient } from '@/utils/supabase/browser';
import moment from 'moment';
import Link from 'next/link';
import AwardsService from '@/utils/supabase/services/awards';

interface IComment extends CommentType {
  profiles: Profile;
  products: Product;
}

export default async ({ params: { user } }: { params: { user: string } }) => {
  const username = decodeURIComponent(user).slice(1);
  const browserService = createBrowserClient();
  const profileService = new ProfileService(browserService);
  const profile = await profileService.getByUsername(username);

  if (profile) {
    const tools = await new ProductsService(browserService).getUserProductsById(profile?.id, 'votes_count', false);

    const activity = await profileService.getUserActivityById(profile?.id);
    const votedTools = await profileService.getUserVoteTools(profile?.id);

    const awardService = new AwardsService(browserService);
    const trendingTools = await awardService.getWinnersOfTheDay(new Date().toISOString(), 10);

    return (
      <div className="container-custom-screen mt-10 mb-32 space-y-10">
        <UserProfileInfo profile={profile} />
        {tools && tools?.length > 0 ? (
          <div>
            <h3 className="font-medium text-slate-50">Launches</h3>
            <ul className="mt-3 divide-y divide-slate-800/60">
              {tools.map((tool, idx) => (
                <ToolCardList key={idx} tool={tool as ITool} />
              ))}
            </ul>
          </div>
        ) : (
          ''
        )}
        {votedTools && votedTools?.length > 0 ? (
          <div>
            <h3 className="font-medium text-slate-50">{votedTools?.length} Upvotes</h3>
            <ul className="mt-3 divide-y divide-slate-800/60">
              {votedTools.map((tool: any, idx: number) => (
                <li key={idx} className="py-3">
                  <ToolCard href={`/tool/${tool.products.slug}`}>
                    <Logo src={tool.products.logo_url || ''} alt={tool.products.name} />
                    <div className="space-y-1">
                      <Name>{tool.products.name}</Name>
                      <Title className="line-clamp-1 sm:line-clamp-2">{tool.products.slogan}</Title>
                      <Tags
                        items={[
                          (tool.products.product_pricing_types as { title: string }).title || 'Free',
                          ...(tool.products.product_category_product as { name: string }[]).map((c: { name: string }) => c.name),
                        ]}
                      />
                    </div>
                    <div className="flex-1 self-center flex justify-end">
                      <Votes className="text-orange-500" count={tool.products.votes_count} />
                    </div>
                  </ToolCard>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          ''
        )}
        {activity && activity?.length > 0 ? (
          <div>
            <h3 className="font-medium text-slate-50">Activity</h3>
            <Comments className="mt-8">
              {(activity as IComment[]).map((item: IComment, idx) => (
                <Comment key={idx} className="gap-4 sm:gap-6">
                  <CommentUserAvatar src={item.profiles.avatar_url as string} />
                  <div className="flex-1">
                    <Link href={`/tool/${item.products.slug}/#${item.id}`} className="flex-1">
                      <CommentUserName>{item.profiles.full_name}</CommentUserName>
                      <CommentDate className="mt-1">Commented {moment(item.created_at).format('LL')}</CommentDate>
                      <CommentContext className="mt-3 text-slate-400 line-clamp-2">{item.content}</CommentContext>
                    </Link>
                    <ToolCard className="mt-3 border border-slate-800" href={'/tool/' + item.products.slug}>
                      <Logo src={item.products.logo_url || ''} alt={item.products.name} imgClassName="w-12 h-12" />
                      <div className="space-y-1">
                        <Name>{item.products.name}</Name>
                        <Title className="line-clamp-1 text-sm sm:line-clamp-2">{item.products.slogan}</Title>
                      </div>
                      <div className="flex-1 self-center flex justify-end">
                        <Votes count={item.products.votes_count} />
                      </div>
                    </ToolCard>
                  </div>
                </Comment>
              ))}
            </Comments>
          </div>
        ) : (
          ''
        )}
        {trendingTools && trendingTools?.length > 0 ? (
          <div>
            <h3 className="font-medium text-slate-50">Trending tools</h3>
            <ul className="mt-3 divide-y divide-slate-800/60">
              {trendingTools.map((tool, idx) => (
                <li key={idx} className="py-3">
                  <ToolCard href={`/tool/${tool.slug}`}>
                    <Logo src={tool.logo_url ?? ''} alt={tool.name as string} />
                    <div className="space-y-1">
                      <Name>{tool.name}</Name>
                      <Title className="line-clamp-1 sm:line-clamp-2">{tool?.slogan}</Title>
                      <Tags items={[tool.product_pricing, ...(tool.product_categories ?? [])]} />
                    </div>
                    <div className="flex-1 self-center flex justify-end">
                      <Votes count={tool.votes_count as number} />
                    </div>
                  </ToolCard>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          ''
        )}
      </div>
    );
  } else return <Page404 />;
};
