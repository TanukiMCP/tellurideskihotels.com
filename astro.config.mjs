import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://tellurideskihotels.com',
  output: 'hybrid',
  adapter: netlify(),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    react(),
    sitemap({
      filter: (page) => !page.includes('/admin/') && !page.includes('/api/'),
      changefreq: 'weekly',
      priority: 0.7,
      createLinkInHead: true,
      entryLimit: 45000,
    }),
    mdx(),
  ],
  image: {
    domains: ['images.pexels.com'],
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      },
    },
  },
  build: {
    inlineStylesheets: 'auto',
    assets: '_astro',
  },
  compressHTML: true,
  vite: {
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Split vendor chunks for better caching
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('mapbox')) {
                return 'mapbox-vendor';
              }
              if (id.includes('lucide-react')) {
                return 'icons-vendor';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    ssr: {
      noExternal: ['@tremor/react', 'recharts'],
    },
  },
});

