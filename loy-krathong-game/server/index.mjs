// Game server: serves the built game (dist/), a shared leaderboard REST API,
// and a WebSocket endpoint (/ws) for real-time multiplayer rooms.
//   npm run build && npm start        -> http://localhost:3000
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { WebSocketServer } from 'ws'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, '..', 'dist')
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'scores.json')
const PORT = Number(process.env.PORT) || 3000
const ROUND_MS = (3 + 90 + 3) * 1000 // countdown + round + grace
const MAX_PLAYERS = 60

// ------------------------------------------------------------------ scores
let scores = []
try { scores = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) } catch { /* first run */ }
const persist = () => { try { fs.writeFileSync(DATA_FILE, JSON.stringify(scores)) } catch (e) { console.error('save failed', e.message) } }
const cleanName = (n) => String(n ?? '').trim().slice(0, 16) || 'ผู้เล่นนิรนาม'
const topScores = () =>
  [...scores].sort((a, b) => b.score - a.score || a.created_at - b.created_at).slice(0, 100)

// ------------------------------------------------------------------- HTTP
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json',
}
const json = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(body))
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  if (url.pathname.startsWith('/api/')) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' })
      return res.end()
    }
    if (url.pathname === '/api/health') return json(res, 200, { ok: true })
    if (url.pathname === '/api/scores' && req.method === 'GET') return json(res, 200, topScores())
    if (url.pathname === '/api/scores' && req.method === 'POST') {
      let body = ''
      req.on('data', (c) => { body += c; if (body.length > 2000) req.destroy() })
      req.on('end', () => {
        try {
          const { name, score } = JSON.parse(body)
          const s = Math.floor(Number(score))
          if (!Number.isFinite(s) || s < 0 || s > 500) return json(res, 400, { error: 'bad score' })
          const entry = { id: crypto.randomUUID(), name: cleanName(name), score: s, created_at: Date.now() }
          scores.push(entry)
          scores = topScores().slice(0, 500)
          persist()
          json(res, 200, entry)
        } catch { json(res, 400, { error: 'bad request' }) }
      })
      return
    }
    return json(res, 404, { error: 'not found' })
  }
  // static files (SPA fallback)
  let file = path.normalize(path.join(DIST, url.pathname === '/' ? 'index.html' : url.pathname))
  if (!file.startsWith(DIST)) { res.writeHead(403); return res.end() }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html')
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not built yet: run "npm run build" first') }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' })
    res.end(data)
  })
})

// -------------------------------------------------------------- multiplayer
/** rooms: code -> { code, players: Map(id -> player), state, timer, dirty } */
const rooms = new Map()
const send = (ws, msg) => { if (ws.readyState === 1) ws.send(JSON.stringify(msg)) }

function snapshot(room) {
  const hostId = room.players.keys().next().value
  return [...room.players.values()].map((p) => ({ id: p.id, name: p.name, score: p.score, done: p.done, host: p.id === hostId }))
}
function broadcastRoom(room) {
  const players = snapshot(room)
  for (const p of room.players.values()) send(p.ws, { t: 'room', room: room.code, state: room.state, you: p.id, players })
  room.dirty = false
}
function endRound(room) {
  if (room.state !== 'playing') return
  clearTimeout(room.timer)
  room.state = 'lobby'
  const results = snapshot(room).sort((a, b) => b.score - a.score)
  for (const p of room.players.values()) send(p.ws, { t: 'end', results })
  broadcastRoom(room)
}
const maybeEndEarly = (room) => {
  if (room.state === 'playing' && [...room.players.values()].every((p) => p.done)) setTimeout(() => endRound(room), 1500)
}

const wss = new WebSocketServer({ server, path: '/ws' })
wss.on('connection', (ws) => {
  let room = null
  let me = null
  ws.isAlive = true
  ws.on('pong', () => { ws.isAlive = true })

  ws.on('message', (raw) => {
    let m
    try { m = JSON.parse(raw) } catch { return }
    if (m.t === 'join' && !room) {
      const code = String(m.room ?? '').trim().slice(0, 16) || 'main'
      let r = rooms.get(code)
      if (!r) { r = { code, players: new Map(), state: 'lobby', timer: null, dirty: false }; rooms.set(code, r) }
      if (r.players.size >= MAX_PLAYERS) return send(ws, { t: 'error', msg: 'ห้องเต็ม' })
      me = { id: crypto.randomUUID().slice(0, 8), name: cleanName(m.name), score: 0, done: r.state === 'playing', ws }
      r.players.set(me.id, me)
      room = r
      broadcastRoom(room)
    } else if (!room) return
    else if (m.t === 'start') {
      const hostId = room.players.keys().next().value
      if (me.id !== hostId || room.state !== 'lobby') return
      for (const p of room.players.values()) { p.score = 0; p.done = false }
      room.state = 'playing'
      const seed = crypto.randomInt(1, 2 ** 31)
      for (const p of room.players.values()) send(p.ws, { t: 'start', seed })
      broadcastRoom(room)
      room.timer = setTimeout(() => endRound(room), ROUND_MS)
    } else if (m.t === 'score' && room.state === 'playing' && !me.done) {
      me.score = Math.max(0, Math.min(500, Math.floor(Number(m.score) || 0)))
      if (m.done) { me.done = true; broadcastRoom(room); maybeEndEarly(room) } else room.dirty = true
    }
  })

  ws.on('close', () => {
    if (!room || !me) return
    room.players.delete(me.id)
    if (room.players.size === 0) { clearTimeout(room.timer); rooms.delete(room.code); return }
    broadcastRoom(room)
    maybeEndEarly(room)
  })
})
// throttled live-score broadcast + connection keep-alive
setInterval(() => { for (const r of rooms.values()) if (r.dirty) broadcastRoom(r) }, 250)
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue }
    ws.isAlive = false
    ws.ping()
  }
}, 30000)

server.listen(PORT, '0.0.0.0', () => {
  console.log(`เซิร์ฟเวอร์พร้อมแล้ว: http://localhost:${PORT}`)
})
