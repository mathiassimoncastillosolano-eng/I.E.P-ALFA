import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 900: 'var(--color-brand-900)', 700: 'var(--color-brand-700)', 500: 'var(--color-brand-500)' },
        accent: { 600: 'var(--color-accent-600)' },
        surface: 'var(--color-surface)',
        app: 'var(--color-bg)',
        muted: 'var(--color-text-muted)',
        line: 'var(--color-border)',
        success: { 600: 'var(--color-success-600)', 50: 'var(--color-success-50)' },
        warning: { 600: 'var(--color-warning-600)', 50: 'var(--color-warning-50)' },
        danger: { 600: 'var(--color-danger-600)', 50: 'var(--color-danger-50)' },
        info: { 600: 'var(--color-info-600)', 50: 'var(--color-info-50)' },
      },
      borderRadius: { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)' },
      boxShadow: { sm: 'var(--shadow-sm)', md: 'var(--shadow-md)', lg: 'var(--shadow-lg)' },
      fontFamily: { sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'] },
    },
  },
} satisfies Config;
