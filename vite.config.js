import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(async ({ mode }) => {
  const plugins = [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Budget Planner',
        short_name: 'Budget',
        description: 'Gestionnaire de budget familial',
        theme_color: '#C8956C',
        background_color: '#FAF8F5',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: []
      }
    })
  ]

  if (mode === 'report') {
    try {
      const { visualizer } = await import('rollup-plugin-visualizer')
      plugins.push(
        visualizer({
          filename: 'dist/bundle-report.html',
          open: false,
          gzipSize: true,
          brotliSize: true
        })
      )
    } catch {
      console.warn('[bundle-report] rollup-plugin-visualizer non installe: rapport non genere.')
    }
  }

  return {
    plugins,
    server: {
      allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app']
    },
    preview: {
      allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app']
    }
  }
})
