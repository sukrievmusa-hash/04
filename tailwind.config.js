/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sand: { 50: '#fbf8f2', 100: '#f5efe3', 200: '#ebdfc8', 300: '#dcc9a6', 400: '#c8ad7f', 600: '#9a7b4c', 800: '#5e4a2c' },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
