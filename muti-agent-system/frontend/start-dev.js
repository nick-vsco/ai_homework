#!/usr/bin/env node
import { createServer } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')

async function startDevServer() {
  const config = {
    root: resolve(__dirname, '.'),
    base: '/',
    logLevel: 'info',
    clearScreen: true,
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        }
      }
    }
  }

  const server = await createServer(config)
  await server.listen()
  
  console.log('Dev server is running on http://localhost:3000')
}

startDevServer().catch((err) => {
  console.error(err)
  process.exit(1)
})
