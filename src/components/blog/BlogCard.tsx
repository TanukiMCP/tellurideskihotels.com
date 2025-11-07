import type { CollectionEntry } from 'astro:content';
import { formatDate } from '@/lib/utils';

interface BlogCardProps {
  article: CollectionEntry<'blog'>;
  featured?: boolean;
}

export default function BlogCard({ article, featured = false }: BlogCardProps) {
  const { data } = article;
  const url = `/blog/${data.category}/${data.slug}`;

  if (featured) {
    return (
      <article className="group relative overflow-hidden rounded-xl bg-white shadow-lg transition-all hover:shadow-xl">
        <a href={url} className="block">
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={data.featuredImage}
              alt={data.featuredImageAlt}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div className="p-6">
            <div className="mb-3 flex items-center gap-3 text-sm text-gray-600">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                {data.category.replace(/-/g, ' ')}
              </span>
              <time dateTime={data.publishDate.toISOString()}>
                {formatDate(data.publishDate)}
              </time>
              <span>•</span>
              <span>{data.readingTime} min read</span>
            </div>
            <h2 className="mb-3 text-2xl font-bold text-gray-900 transition-colors group-hover:text-blue-600">
              {data.title}
            </h2>
            <p className="mb-4 text-gray-600 line-clamp-2">{data.excerpt}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-600 group-hover:underline">
                Read Article →
              </span>
              {data.tags && data.tags.length > 0 && (
                <div className="flex gap-2">
                  {data.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
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
    <article className="group overflow-hidden rounded-lg bg-white shadow transition-all hover:shadow-lg">
      <a href={url} className="block">
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={data.featuredImage}
            alt={data.featuredImageAlt}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="p-5">
          <div className="mb-2 flex items-center gap-2 text-xs text-gray-600">
            <span className="rounded-full bg-blue-100 px-2 py-1 font-medium text-blue-800">
              {data.category.replace(/-/g, ' ')}
            </span>
            <time dateTime={data.publishDate.toISOString()}>
              {formatDate(data.publishDate)}
            </time>
            <span>•</span>
            <span>{data.readingTime} min</span>
          </div>
          <h3 className="mb-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600 line-clamp-2">
            {data.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">{data.excerpt}</p>
        </div>
      </a>
    </article>
  );
}

