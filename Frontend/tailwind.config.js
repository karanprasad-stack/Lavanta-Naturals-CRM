/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lavanta': {
          green: '#69C43F',
          'dark-green': '#4FAF32',
          'deep-green': '#3E8E25',
          'soft-green': '#EAF7E5',
          lavender: '#E8D8FF',
          'soft-lavender': '#F5EEFF',
          'lavender-dark': '#6D4CBA',
          navy: '#172235',
          gray: '#667085',
          border: '#E5E8E3',
          bg: '#FAFBF8',
          surface: '#FFFFFF',
          subtle: '#F4F5F2',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
      },
      boxShadow: {
        'lavanta-sm': '0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.03)',
        'lavanta-md': '0 4px 12px rgba(16, 24, 40, 0.06)',
        'lavanta-lg': '0 8px 24px rgba(16, 24, 40, 0.08)',
      }
    },
  },
  plugins: [],
}
