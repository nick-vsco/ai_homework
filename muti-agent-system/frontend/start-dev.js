#!/usr/bin/env node
import { createServer } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')

async function startDevServer() {
  // 获取命令行参数指定的端口
  const port = process.argv[2] || 3000
  
  const config = {
    root: resolve(__dirname, '.'),
    base: '/',
    logLevel: 'info',
    clearScreen: true,
    server: {
      port: parseInt(port),
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true,
        }
      }
    }
  }

  const server = await createServer(config)
  await server.listen()
  
  console.log(`Dev server is running on http://localhost:${port}`)
}

startDevServer().catch((err) => {
  console.error(err)
  process.exit(1)
})
