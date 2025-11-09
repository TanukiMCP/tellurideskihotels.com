import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <button
            onClick={() => toggleItem(index)}
            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-neutral-50 transition-colors duration-150"
            aria-expanded={openIndex === index}
          >
            <h3 className="text-lg font-semibold text-neutral-900 pr-4">
              {item.question}
            </h3>
            <svg
              className={`w-5 h-5 text-neutral-600 flex-shrink-0 transition-transform duration-200 ${
                openIndex === index ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <div
            className={`overflow-hidden transition-all duration-200 ${
              openIndex === index ? 'max-h-96' : 'max-h-0'
            }`}
          >
            <div className="px-6 pb-4 text-neutral-700 leading-relaxed">
              <p>{item.answer}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

