/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'jatham-bg': '#FFFDF5',
        'jatham-maroon': '#9B2C2C',
        'jatham-gold': '#D69E2E',
        'jatham-cream': '#F9F6E5',
        'jatham-text': '#2D3748',
        'jatham-terracotta': '#C05621',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
