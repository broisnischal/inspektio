import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { crx } from "@crxjs/vite-plugin";
import manifest from "./src/manifest.config";
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [svelte(), crx({ manifest }), tsconfigPaths()],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
}) 