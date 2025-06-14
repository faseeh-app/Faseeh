/// <reference types="node" />
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import { config } from 'dotenv'

// Load environment variables from .env file
config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  root: '.',
  plugins: [vue()],
  resolve: {
    alias: {
      '@root': resolve(__dirname),
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      '@shared': resolve(__dirname, 'src/shared/'),
      '@main': resolve(__dirname, 'src/main/'),
      '@': resolve(__dirname, './src/renderer/src')
    }
  },
  optimizeDeps: {
    include: ['axios']
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress}.config.*',
      '**/difficulty-estimation/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/difficulty-estimation/**'
      ]
    },
    env: {
      OXFORD_APP_ID: process.env.OXFORD_APP_ID || '',
      OXFORD_APP_KEY: process.env.OXFORD_APP_KEY || ''
    },
    setupFiles: ['./vitest.setup.ts'],
    server: {
      deps: {
        inline: ['axios'],
        external: ['electron']
      }
    }
  }
})
