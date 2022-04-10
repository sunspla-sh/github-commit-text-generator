// vite.config.js
import { defineConfig } from 'vite';
import { obfuscator } from 'rollup-obfuscator';

export default defineConfig({
  build: {
    rollupOptions: {
      plugins: [
        obfuscator()
      ]
    }
  }
})