/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#e6f0f7',
          100: '#cce1ef',
          200: '#99c3df',
          300: '#66a5cf',
          400: '#3387bf',
          500: '#0D3B66',
          600: '#0a2f52',
          700: '#08233d',
          800: '#051729',
          900: '#030c14',
        },
        turquoise: {
          50: '#e6faf8',
          100: '#ccf5f1',
          200: '#99ebe3',
          300: '#66e1d5',
          400: '#33d7c7',
          500: '#14B8A6',
          600: '#109385',
          700: '#0c6e64',
          800: '#084a42',
          900: '#042521',
        },
        gold: {
          50: '#fef7e6',
          100: '#fdeecc',
          200: '#fbdd99',
          300: '#f9cc66',
          400: '#f7bb33',
          500: '#F59E0B',
          600: '#c47e09',
          700: '#935f07',
          800: '#623f04',
          900: '#312002',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans Variable', 'Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

