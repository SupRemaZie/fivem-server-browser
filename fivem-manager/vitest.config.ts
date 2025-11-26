import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'out/',
        'build/',
        '**/*.config.*',
        '**/*.d.ts',
        '**/types.ts',
        'scripts/'
      ]
    },
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'out', 'build']
  },
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, './src/renderer/src')
    }
  }
})

