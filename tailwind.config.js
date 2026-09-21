/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        roboto: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        // Editorial Palette
        paper: {
          50: '#FDFBF7',
          100: '#FAF6EE',
          200: '#F4ECE1',
          300: '#EAE0D1',
          400: '#D8CEBE',
          500: '#BDB19F',
          canvas: 'var(--color-bg-canvas)',
          surface: 'var(--color-bg-surface)',
          subtle: 'var(--color-bg-subtle)',
          elevated: 'var(--color-bg-elevated)',
        },
        ink: {
          50: '#FAF8F5',
          100: '#F3EFE8',
          200: '#E5DFD5',
          300: '#CBC4B8',
          400: '#A8A195',
          500: '#878074',
          600: '#666057',
          700: '#4A453F',
          800: '#2E2A27',
          900: '#1C1A18',
          950: '#0F0E0D',
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        terracotta: {
          50: '#FDF6F2',
          100: '#FAECE4',
          200: '#F5D5C4',
          300: '#EDB69C',
          400: '#DF8D67',
          500: '#C85A32',
          600: '#B44823',
          700: '#953A1C',
          800: '#79311A',
          900: '#632B1A',
          DEFAULT: '#C85A32',
        },
        // Backward compatibility mappings
        brandBeige: 'var(--color-bg-canvas)',
        brandBeigeAlt: 'var(--color-bg-subtle)',
        darkZinc: '#131316',
        darkZincAlt: '#1B1B20',
        brandAccent: '#C85A32',
      },
      boxShadow: {
        'book': '0 2px 4px rgba(28, 26, 24, 0.04), 0 8px 16px -2px rgba(28, 26, 24, 0.08)',
        'book-hover': '0 6px 12px rgba(28, 26, 24, 0.06), 0 16px 28px -4px rgba(28, 26, 24, 0.16)',
        'editorial': '0 1px 3px rgba(28, 26, 24, 0.05), 0 10px 24px -5px rgba(28, 26, 24, 0.08)',
      },
      letterSpacing: {
        'widest-editorial': '0.18em',
      },
    },
  },
  plugins: [],
}
