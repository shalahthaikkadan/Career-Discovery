/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FFDE59',
        secondary: '#7ED957',
        accent: '#FF5757',
        tertiary: '#5CE1E6',
        bg: '#FDFBF7',
        surface: '#FFFFFF',
        text: {
          DEFAULT: '#1E1E1E',
          light: '#555555',
        }
      },
      borderWidth: {
        'pop': '3px',
      },
      borderRadius: {
        'pop': '12px',
      },
      boxShadow: {
        'pop': '4px 4px 0 0 #1E1E1E',
        'pop-hover': '6px 6px 0 0 #1E1E1E',
        'pop-sm': '2px 2px 0 0 #1E1E1E',
        'pop-md': '3px 3px 0 0 #1E1E1E',
      }
    },
  },
  plugins: [],
}
