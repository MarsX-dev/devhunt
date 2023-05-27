import { IProductResult } from '@/type'
import Link from 'next/link'
import ProductName from '../ToolCard/Tool.Name'
import ProductTitle from '../ToolCard/Tool.Title'
import ProductLogo from '../ToolCard/Tool.Logo'

export default ({ item }: { item: IProductResult }) => (
  <Link
    href={item.slug}
    className="p-3 flex items-start gap-x-3 rounded-xl from-indigo-900/20 to-indigo-800/10 hover:bg-gradient-to-l duration-150"
  >
    <ProductLogo src={item.logo} imgClassName="w-7 h-7" />
    <div className="text-sm">
      <ProductName className="text-slate-200">{item.name}</ProductName>
      <ProductTitle className="mt-1 line-clamp-1">{item.title}</ProductTitle>
    </div>
  </Link>
)
