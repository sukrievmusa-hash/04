import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath } from 'node:url'

// Исходная страница — web/index.html. Сборка одним файлом идёт в docs/,
// а скрипт build копирует её в корневой index.html, чтобы GitHub Pages
// работал и с корня (/), и с папки /docs.
export default defineConfig({
  root: fileURLToPath(new URL('./web', import.meta.url)),
  base: './',
  plugins: [react(), viteSingleFile()],
  build: { outDir: fileURLToPath(new URL('./docs', import.meta.url)), emptyOutDir: true },
  server: { fs: { allow: ['..'] } },
})
