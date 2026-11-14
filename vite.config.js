import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Сборка в docs/ одним файлом — GitHub Pages раздаёт её с ветки main, папка /docs
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'docs', emptyOutDir: true },
})
