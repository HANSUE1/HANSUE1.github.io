import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The site itself is static HTML with no build step. Vite only builds the React "islands" in src/islands into
// js/react/, which index.html loads like any other script. That output is committed, so GitHub Pages serves it
// as-is: run `npm run build` after changing anything in src/ and commit js/react/ with it.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  publicDir: false,
  build: {
    outDir: 'js/react',
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      input: { archive: 'src/islands/archive.tsx' },
      output: { entryFileNames: '[name].js', chunkFileNames: '[name].js', assetFileNames: '[name][extname]' },
    },
  },
})
