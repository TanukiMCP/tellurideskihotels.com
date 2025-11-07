interface BlogCTAProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  variant?: 'primary' | 'secondary';
}

export default function BlogCTA({
  title = 'Find Your Perfect Telluride Hotel',
  description = 'Browse our curated selection of ski-in/ski-out hotels, luxury resorts, and budget-friendly lodging options.',
  buttonText = 'Browse Hotels',
  buttonUrl = '/lodging',
  variant = 'primary',
}: BlogCTAProps) {
  const bgColor = variant === 'primary' ? 'bg-blue-600' : 'bg-gray-900';
  const hoverColor = variant === 'primary' ? 'hover:bg-blue-700' : 'hover:bg-gray-800';

  return (
    <div className={`my-8 rounded-xl ${bgColor} p-8 text-white`}>
      <div className="mx-auto max-w-3xl text-center">
        <h3 className="mb-3 text-2xl font-bold">{title}</h3>
        <p className="mb-6 text-lg opacity-90">{description}</p>
        <a
          href={buttonUrl}
          className={`inline-block rounded-lg bg-white px-8 py-3 font-semibold text-gray-900 transition-all ${hoverColor} hover:text-white hover:shadow-lg`}
        >
          {buttonText}
        </a>
      </div>
    </div>
  );
}

