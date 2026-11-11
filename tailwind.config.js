/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        google: {
          blue: '#1a73e8',
          hover: '#174ea6',
          bg: '#f8fafd',
          border: '#dadce0',
          text: '#3c4043',
          holiday: '#137333',
        }
      }
    },
  },
  plugins: [],
}
