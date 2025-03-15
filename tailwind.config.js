/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'], // Fuente para títulos y precios
        roboto: ['Roboto', 'sans-serif'],   // Fuente para descripciones
      },
    },
  },
  plugins: [],
}
