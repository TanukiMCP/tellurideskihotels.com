import type { CollectionEntry } from 'astro:content';
import { formatDate } from '@/lib/utils';

interface BlogCardProps {
  article: CollectionEntry<'blog'>;
  featured?: boolean;
}

export default function BlogCard({ article, featured = false }: BlogCardProps) {
  const { data } = article;
  const url = `/blog/${data.category}/${article.slug}`;

  if (featured) {
    return (
      <article className="group relative overflow-hidden rounded-2xl bg-white border border-neutral-200 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
        <a href={url} className="block">
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={data.featuredImage}
              alt={data.featuredImageAlt}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div className="p-6 lg:p-8">
            <div className="mb-3 flex items-center gap-3 text-sm text-neutral-600">
              <span className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 uppercase tracking-wide">
                {data.category.replace(/-/g, ' ')}
              </span>
              <time dateTime={data.publishDate.toISOString()}>
                {formatDate(data.publishDate)}
              </time>
              <span>•</span>
              <span>{data.readingTime} min read</span>
            </div>
            <h2 className="mb-3 text-2xl lg:text-3xl font-bold text-neutral-900 transition-colors group-hover:text-primary-600">
              {data.title}
            </h2>
            <p className="mb-6 text-neutral-600 leading-relaxed line-clamp-3">{data.excerpt}</p>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 group-hover:gap-3 transition-all">
                Read Article
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              {data.tags && data.tags.length > 0 && (
                <div className="flex gap-2">
                  {data.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </a>
      </article>
    );
  }

  return (
    <article className="group overflow-hidden rounded-2xl bg-white border border-neutral-200 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
      <a href={url} className="block">
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={data.featuredImage}
            alt={data.featuredImageAlt}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="p-5 lg:p-6">
          <div className="mb-2 flex items-center gap-2 text-xs text-neutral-600">
            <span className="rounded-lg bg-primary-50 px-2.5 py-1 font-semibold text-primary-700 uppercase tracking-wide">
              {data.category.replace(/-/g, ' ')}
            </span>
            <time dateTime={data.publishDate.toISOString()}>
              {formatDate(data.publishDate)}
            </time>
            <span>•</span>
            <span>{data.readingTime} min</span>
          </div>
          <h3 className="mb-2 text-lg lg:text-xl font-bold text-neutral-900 transition-colors group-hover:text-primary-600 line-clamp-2">
            {data.title}
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2">{data.excerpt}</p>
        </div>
      </a>
    </article>
  );
}

