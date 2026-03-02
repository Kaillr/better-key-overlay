import { createServer, type Server } from 'http'
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'
import { WebSocketServer, type WebSocket } from 'ws'
import type { AppSettings } from '../shared/types'

let httpServer: Server | null = null
let wss: WebSocketServer | null = null
let currentSettings: AppSettings | null = null

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

function broadcast(message: object): void {
  if (!wss) return
  const data = JSON.stringify(message)
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(data)
  }
}

export function broadcastKeyDown(code: string): void {
  broadcast({ type: 'keydown', code })
}

export function broadcastKeyUp(code: string): void {
  broadcast({ type: 'keyup', code })
}

export function broadcastAnalog(data: { scancode: number; value: number }[]): void {
  broadcast({ type: 'analog', data })
}

export function broadcastSettings(settings: AppSettings): void {
  currentSettings = settings
  broadcast({ type: 'settings', data: settings })
}

export function startServer(port: number, settings: AppSettings): void {
  if (httpServer) return
  currentSettings = settings

  const rendererDir = join(__dirname, '../renderer')
  const indexPath = join(rendererDir, 'index.html')

  httpServer = createServer((req, res) => {
    const urlPath = (req.url ?? '/').split('?')[0]

    if (urlPath === '/' || urlPath === '/index.html') {
      if (!existsSync(indexPath)) {
        res.writeHead(503, { 'Content-Type': 'text/plain' })
        res.end('Browser source requires a production build. Run: pnpm build')
        return
      }
      const html = readFileSync(indexPath, 'utf-8').replace(
        '<head>',
        '<head><script>window.__BROWSER_SOURCE__=true;document.documentElement.style.background="transparent";document.addEventListener("DOMContentLoaded",()=>document.body.style.background="transparent")</script>'
      )
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(html)
      return
    }

    const fullPath = join(rendererDir, urlPath)
    if (!existsSync(fullPath)) {
      res.writeHead(404)
      res.end('Not found')
      return
    }
    const ext = urlPath.substring(urlPath.lastIndexOf('.'))
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
    res.end(readFileSync(fullPath))
  })

  wss = new WebSocketServer({ server: httpServer })

  wss.on('connection', (ws: WebSocket) => {
    if (currentSettings) {
      ws.send(JSON.stringify({ type: 'settings', data: currentSettings }))
    }
  })

  httpServer.listen(port)
}

export function stopServer(): void {
  if (wss) {
    wss.close()
    wss = null
  }
  if (httpServer) {
    httpServer.close()
    httpServer = null
  }
}

export function isServerRunning(): boolean {
  return httpServer !== null
}
