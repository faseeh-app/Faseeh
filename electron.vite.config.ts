import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { globSync } from 'glob'
import path from 'node:path'

const migrationFilesInput = Object.fromEntries(
  globSync('src/main/db/migrations/*.ts').map((file) => [
    path.relative('src/main/db', file.slice(0, -path.extname(file).length)),
    resolve(__dirname, file)
  ])
)

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
          ...migrationFilesInput
        },
        output: {
          // This ensures the output filenames match the input keys
          entryFileNames: '[name].js'
        }
      }
    },
    resolve: {
      alias: {
        '@root': resolve('.'),
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared/'),
        '@main': resolve('src/main/')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@root': resolve('.'),
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared/'),
        '@main': resolve('src/main/')
      }
    },
    plugins: [vue(), tailwindcss()]
  }
})
