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
  const relatedArticles = articles.filter(article => article.slug !== currentSlug).slice(0, maxArticles);

  if (relatedArticles.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 
        className="mb-12 text-4xl font-bold text-[#2C2C2C] text-center"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Related Articles
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {relatedArticles.map(article => (
          <BlogCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}

