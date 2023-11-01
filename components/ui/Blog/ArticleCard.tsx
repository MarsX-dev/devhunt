import { ArrowSmallRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ArticleProps {
  article: any;
}

const ArticleCard: React.FC<ArticleProps> = ({ article }) => {
  return (
    <li key={article.id} className="border-b border-slate-800 py-8">
      <div className="flex flex-wrap gap-2 items-center w-full text-sm text-slate-500">
        <span>
          Published{' '}
          {new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        {article.readingTime ? <span>{` ⦁ ${article.readingTime}`} min read</span> : null}
      </div>
      <Link href={`/blog/${article.slug}`} className="block mt-2 mb-3 font-medium text-slate-50 hover:underline duration-150">
        <h2>{article.headline}</h2>
      </Link>
      <div className="text-slate-400 text-sm line-clamp-2  mb-4 block">{article.metaDescription}</div>
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(article.tags || []).splice(0, 3).map((t: any, ix: number) => (
            <a
              key={ix}
              href={`/blog/tag/${t.slug}`}
              className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-xs text-slate-400 font-semibold"
            >
              {t.title}
            </a>
          ))}
        </div>
        <Link href={`/blog/${article.slug}`} className="flex items-center text-sm text-orange-500 hover:text-orange-400 font-medium group">
          Read More
          <ArrowSmallRightIcon className="w-4 h-4 group-hover:translate-x-1 duration-150" />
        </Link>
      </div>
    </li>
  );
};

export default ArticleCard;
