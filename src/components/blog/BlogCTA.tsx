interface BlogCTAProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  variant?: 'default' | 'subtle';
}

export default function BlogCTA({
  title = 'Find Your Perfect Place to Stay',
  description = 'Browse our curated selection of ski-in/ski-out lodging, luxury resorts, and budget-friendly options.',
  buttonText = 'Browse Places to Stay',
  buttonUrl = '/places-to-stay',
  variant = 'default',
}: BlogCTAProps) {
  return (
    <div className="my-12 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="px-6 py-8 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-2xl">
          {/* Icon or visual element */}
          <div className="mb-4 flex items-center justify-center">
            <svg
              className="h-12 w-12 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>

          {/* Content */}
          <div className="text-center">
            <h3 className="mb-3 text-2xl font-semibold tracking-tight text-gray-900">
              {title}
            </h3>
            <p className="mb-6 text-base leading-relaxed text-gray-600">
              {description}
            </p>

            {/* CTA Button */}
            <a
              href={buttonUrl}
              className="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-white transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            >
              {buttonText}
              <svg
                className="ml-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Subtle bottom accent */}
      {variant === 'default' && (
        <div className="h-1 w-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
      )}
    </div>
  );
}

