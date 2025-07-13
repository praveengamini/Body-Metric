/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'soft-white': '0px 4px 10px rgba(255, 255, 255, 0.3)',
      }
    },
  },
  plugins: [],
}
