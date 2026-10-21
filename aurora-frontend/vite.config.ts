import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
        type: 'module',
      },
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Aurora | Sua casa em ordem',
        short_name: 'Aurora',
        description: 'Organize estoque, compras, agenda e rotina da sua casa.',
        theme_color: '#173e2d',
        background_color: '#f3f4ef',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
});
