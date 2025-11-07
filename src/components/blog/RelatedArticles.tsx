import type { CollectionEntry } from 'astro:content';
import BlogCard from './BlogCard';

interface RelatedArticlesProps {
  articles: CollectionEntry<'blog'>[];
  currentSlug: string;
  maxArticles?: number;
}

export default function RelatedArticles({
  articles,
  currentSlug,
  maxArticles = 3,
}: RelatedArticlesProps) {
  const relatedArticles = articles.filter(article => article.data.slug !== currentSlug).slice(0, maxArticles);

  if (relatedArticles.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 border-t border-gray-200 pt-12">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Related Articles</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {relatedArticles.map(article => (
          <BlogCard key={article.data.slug} article={article} />
        ))}
      </div>
    </section>
  );
}

