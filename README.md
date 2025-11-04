# Telluride Ski Hotels

A complete, production-ready hotel booking website for Telluride, Colorado ski hotels. Built with Astro, React, TypeScript, and Tailwind CSS.

## Features

- **Hotel Search & Discovery**: Search hotels in Telluride with real-time availability
- **Hotel Details**: Comprehensive hotel information with images, amenities, and reviews
- **Room Selection**: Browse available rooms with pricing and details
- **Add-ons**: Select additional services (breakfast, parking, etc.)
- **Booking Flow**: Complete booking process with Stripe payment integration
- **Responsive Design**: Mobile-first, fully responsive UI
- **SEO Optimized**: Meta tags, structured data, and sitemap generation

## Tech Stack

- **Astro 4.16.1** - Static site generation with SSR support
- **React 18.3.1** - Interactive components
- **TypeScript 5.9.3** - Type safety
- **Tailwind CSS 3.4.14** - Styling
- **Stripe** - Payment processing
- **LiteAPI** - Hotel inventory and booking

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/tanukimcp/tellurideskihotels.com.git
cd tellurideskihotels.com
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Run the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Environment Variables

See `.env.example` for required environment variables. Key variables include:

- `LITEAPI_PUBLIC_KEY` - LiteAPI public key
- `LITEAPI_PRIVATE_KEY` - LiteAPI private key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

## Project Structure

```
src/
├── components/        # React and Astro components
│   ├── ui/           # Base UI components
│   ├── layout/        # Layout components
│   ├── lodging/      # Hotel-related components
│   ├── checkout/     # Checkout flow components
│   └── addons/       # Add-ons components
├── lib/              # Utilities and API clients
│   ├── liteapi/      # LiteAPI integration
│   └── stripe/       # Stripe integration
└── pages/            # Astro pages and API routes
```

## Deployment

The site is configured for Netlify deployment. The build process includes:

1. Type checking with Astro
2. Building the site
3. Generating search index with Pagefind

## License

Proprietary - All rights reserved
