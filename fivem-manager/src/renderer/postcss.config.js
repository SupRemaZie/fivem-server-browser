// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')

module.exports = {
  plugins: {
    tailwindcss: {
      config: path.join(__dirname, 'tailwind.config.js')
    },
    autoprefixer: {}
  }
}
