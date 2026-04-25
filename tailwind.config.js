/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx}", // Scopes it only to React files
  ],
  theme: {
    extend: {
      colors: {
        'chamber-bg': '#0F0F0F',
        'pivot-red': '#FF3B30',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
