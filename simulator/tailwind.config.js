/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/ui/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        boss: '#7a1423',
        hero: '#1b4d3e',
        wound: '#b33a3a',
      },
    },
  },
  plugins: [],
};
