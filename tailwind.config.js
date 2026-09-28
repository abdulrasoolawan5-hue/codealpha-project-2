/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2d6a4f',
          dark: '#1b4332',
          light: '#52b788',
          50: '#f0f7f4',
          100: '#d9ebe1',
          200: '#b3d7c3',
          300: '#80b89a',
          400: '#52b788',
          500: '#2d6a4f',
          600: '#245540',
          700: '#1b4332',
          800: '#143024',
          900: '#0a1a12',
        },
        accent: {
          DEFAULT: '#d8a657',
          dark: '#b8860b',
        },
        neutral: {
          50: '#faf9f7',
          100: '#f4f3f1',
          200: '#e0ddd8',
          300: '#c4bfb8',
          400: '#9a948c',
          500: '#6b6660',
          600: '#4a463f',
          700: '#332f2a',
          800: '#1f1d1a',
          900: '#0f0e0c',
        },
      },
      fontFamily: {
        heading: ['Georgia', 'Times New Roman', 'serif'],
        body: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease',
        'slide-up': 'slideUp 300ms ease',
        'scale-in': 'scaleIn 200ms ease',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
