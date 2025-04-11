/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        lobster: ['Lobster', 'cursive'],
        pacifico: ['Pacifico', 'cursive'],
        greatVibes: ['Great Vibes', 'cursive'],
        dancingScript: ['Dancing Script', 'cursive'],
      },
      colors: {
        menu: {
          primary: {
            DEFAULT: '#FF5733',
            500: '#FF5733', // Restaurante General
            600: '#F28C38', // Pollería
            700: '#D32F2F', // Pizzería
            800: '#FF9800', // Fuente de Soda
            900: '#4CAF50', // Café Bar
          },
          secondary: {
            DEFAULT: '#C70039',
            500: '#C70039',
            600: '#1A1A1A',
            700: '#FBC02D',
            800: '#4CAF50',
            900: '#8D5524',
          },
        }
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}