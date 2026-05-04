/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff', 100: '#d9edff', 200: '#bbdfff', 300: '#8bccff',
          400: '#54b0ff', 500: '#2c8dff', 600: '#156cf5', 700: '#0e57e1',
          800: '#1247b6', 900: '#153e8f', 950: '#112757',
        },
      },
    },
  },
  plugins: [],
}
