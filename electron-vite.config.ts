/* eslint-disable */
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, existsSync } from 'fs';
import type { Plugin } from 'vite';

// Plugin to copy whatsapp-service.js to output directory
function copyWhatsAppServicePlugin(): Plugin {
  return {
    name: 'copy-whatsapp-service',
    writeBundle(options) {
      // This runs after the main bundle is written
      const source = resolve(__dirname, 'src/main/whatsapp-service.js');
      // Determine output directory - could be 'out' or custom
      const outputDir = options.dir || resolve(__dirname, 'out/main');
      const dest = resolve(outputDir, 'whatsapp-service.js');

      if (existsSync(source)) {
        // Ensure destination directory exists
        const destDir = resolve(dest, '..');
        if (!existsSync(destDir)) {
          const { mkdirSync } = require('fs');
          mkdirSync(destDir, { recursive: true });
        }
        copyFileSync(source, dest);
        console.log(`Copied whatsapp-service.js to ${dest}`);
      } else {
        console.warn(`Source file not found: ${source}`);
      }
    },
  };
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), copyWhatsAppServicePlugin()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@main': resolve(__dirname, 'src/main'),
        '@shared': resolve(__dirname, 'src/shared'),
      },
    },
    build: {
      rollupOptions: {
        external: [
          // whatsapp-web.js is no longer imported in main process - it runs in separate process
          // Only externalize other native dependencies if needed
          'puppeteer',
          'puppeteer-core',
          'qrcode-terminal',
        ],
      },
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared'),
      },
    },
  },
  renderer: {
    resolve: {
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
      alias: {
        '@': resolve(__dirname, 'src/renderer/src'),
        '@shared': resolve(__dirname, 'src/shared'),
      },
    },
    plugins: [react()],
    optimizeDeps: {
      include: ['jspdf', 'jspdf-autotable'],
      exclude: [],
    },
    build: {
      commonjsOptions: {
        include: [/jspdf-autotable/, /node_modules/],
      },
    },
  },
});
