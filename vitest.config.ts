import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  root: '.',
  plugins: [vue()],
  resolve: {
    alias: {
      '@root': resolve(__dirname, '.'),
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@main': resolve(__dirname, 'src/main')
    }
  },
  test: {
    globals: false,
    environment: 'jsdom',
    include: ['**/__tests__/*.{test,spec}.ts']
  }
})
