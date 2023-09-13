import Link from 'next/link';
import ProductName from '../ToolCard/Tool.Name';
import ProductTitle from '../ToolCard/Tool.Title';
import ProductLogo from '../ToolCard/Tool.Logo';
import { Product } from '@/utils/supabase/types';

export default ({ item, ...props }: { item: Product; onClick: () => void }) => (
  <Link
    {...props}
    href={'/tool/' + item.slug}
    className="p-3 flex items-start gap-x-3 rounded-xl from-indigo-900/20 to-indigo-800/10 hover:bg-gradient-to-l border border-transparent hover:border-slate-800 duration-150"
  >
    <ProductLogo src={item.logo_url} imgClassName="w-7 h-7" />

    <div className="text-sm">
      <ProductName className="text-slate-200">{item.name}</ProductName>
      <ProductTitle className="mt-1 line-clamp-1 sm:text-sm">{item.slogan}</ProductTitle>
    </div>
  </Link>
);
