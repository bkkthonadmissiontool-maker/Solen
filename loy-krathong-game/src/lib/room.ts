import { useCallback, useEffect, useRef, useState } from 'react'

export interface RoomPlayer { id: string; name: string; score: number; done: boolean; host: boolean }
export type Status = 'idle' | 'connecting' | 'open' | 'error' | 'closed'

export function wsUrl(): string {
  const env = import.meta.env.VITE_WS_URL as string | undefined
  if (env) return env
  const q = new URLSearchParams(location.search).get('server')
  if (q) return q
  return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`
}

interface Handlers {
  onStart: (seed: number) => void
  onEnd: (results: RoomPlayer[]) => void
}

/** Real-time room connection (see server/index.mjs). */
export function useRoom(handlers: Handlers) {
  const ws = useRef<WebSocket | null>(null)
  const h = useRef(handlers)
  h.current = handlers
  const [status, setStatus] = useState<Status>('idle')
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [roomState, setRoomState] = useState<'lobby' | 'playing'>('lobby')
  const [you, setYou] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [results, setResults] = useState<RoomPlayer[] | null>(null)

  const leave = useCallback(() => {
    const s = ws.current
    ws.current = null
    if (s) { s.onclose = null; s.close() }
    setStatus('idle')
    setPlayers([])
    setYou(null)
    setResults(null)
  }, [])

  const join = useCallback((room: string, name: string) => {
    leave()
    setStatus('connecting')
    setCode(room)
    let s: WebSocket
    try { s = new WebSocket(wsUrl()) } catch { setStatus('error'); return }
    ws.current = s
    s.onopen = () => {
      setStatus('open')
      s.send(JSON.stringify({ t: 'join', room, name }))
    }
    s.onmessage = (e) => {
      const m = JSON.parse(e.data as string)
      if (m.t === 'room') {
        setPlayers(m.players)
        setRoomState(m.state)
        setYou(m.you)
        setCode(m.room)
      } else if (m.t === 'start') {
        setResults(null)
        h.current.onStart(m.seed)
      } else if (m.t === 'end') {
        setResults(m.results)
        h.current.onEnd(m.results)
      }
    }
    s.onerror = () => setStatus('error')
    s.onclose = () => setStatus((p) => (p === 'open' ? 'closed' : 'error'))
  }, [leave])

  const send = (msg: object) => { if (ws.current?.readyState === 1) ws.current.send(JSON.stringify(msg)) }
  const start = () => send({ t: 'start' })
  const sendScore = (score: number, done = false) => send({ t: 'score', score, done })
  useEffect(() => leave, [leave])

  return { status, players, roomState, you, code, results, join, leave, start, sendScore }
}
