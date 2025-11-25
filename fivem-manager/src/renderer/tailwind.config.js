/** @type {import('tailwindcss').Config} */
const path = require('path')

// Construire les chemins absolus avec les patterns glob
const rendererDir = __dirname.replace(/\\/g, '/') // Normaliser les séparateurs pour les globs

module.exports = {
  content: [
    `${rendererDir}/index.html`,
    `${rendererDir}/src/**/*.{js,ts,jsx,tsx}`,
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

