import { rmSync } from 'fs'
import { defineConfig, normalizePath } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import copy from 'rollup-plugin-copy'
import pkg from './package.json'
import path from 'path'

// rmSync('dist-electron', { recursive: true, force: true })
const sourcemap = !!process.env.VSCODE_DEBUG
const isBuild = process.argv.slice(2).includes('build')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    copy({
      targets: [
        {
          src: normalizePath(path.resolve(__dirname, 'electron/main/worker.mjs')),
          dest: normalizePath(path.resolve(__dirname, 'dist-electron/main'))
        }
      ]
    }),
    vue(),
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: 'electron/main/index.js',
        onstart(options) {
          if (process.env.VSCODE_DEBUG) {
            console.log(/* For `.vscode/.debug.script.mjs` */'[startup] Electron App')
          } else {
            options.startup()
          }
        },
        vite: {
          build: {
            sourcemap,
            minify: isBuild,
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: Object.keys(pkg.dependencies),
            },
          },
        },
      },
      {
        entry: 'electron/preload/index.js',
        onstart(options) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
          // instead of restarting the entire Electron App.
          options.reload()
        },
        vite: {
          build: {
            sourcemap,
            minify: isBuild,
            outDir: 'dist-electron/preload',
            rollupOptions: {
              external: Object.keys(pkg.dependencies),
            },
          },
        },
      }
    ]),
    // Use Node.js API in the Renderer-process
    renderer({
      nodeIntegration: true,
    }),

  ],
  server: process.env.VSCODE_DEBUG ? (() => {
    const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL)
    return {
      host: url.hostname,
      port: +url.port,
    }
  })() : undefined,
  clearScreen: false,
})
