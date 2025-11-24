import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="sticky top-24 hidden rounded-lg border border-[#E5E8E5] bg-[#F8F9F8] shadow-sm lg:block">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-[#F0F2F0]"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse table of contents' : 'Expand table of contents'}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#2D5F4F]">
          In This Article
        </h2>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-[#2D5F4F]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#2D5F4F]" />
        )}
      </button>
      {isExpanded && (
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-6 pb-6">
          <ul className="space-y-2.5 text-sm">
            {headings.map(heading => (
              <li
                key={heading.id}
                style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
              >
                <a
                  href={`#${heading.id}`}
                  className={`block py-1 transition-colors leading-relaxed hover:text-[#255040] hover:underline ${
                    activeId === heading.id
                      ? 'font-semibold text-[#2D5F4F]'
                      : 'text-[#2D5F4F]'
                  }`}
                  onClick={e => {
                    e.preventDefault();
                    document.getElementById(heading.id)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

