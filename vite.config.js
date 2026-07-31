import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: { port: 5173, open: false },
  // three.js dominates the bundle; venue modules are small, so acknowledge
  // the advisory instead of code-splitting.
  build: { chunkSizeWarningLimit: 900 },
});
