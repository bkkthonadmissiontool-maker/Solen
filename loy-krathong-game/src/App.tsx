import { useCallback, useEffect, useRef, useState } from 'react'
import { Game } from './game/engine'
import { ROUND_SECONDS } from './game/types'
import { getLeaderboard, rankOf, submitScore, type Entry, usingBackend } from './lib/leaderboard'
import Hud from './components/Hud'
import Leaderboard from './components/Leaderboard'
import StartScreen from './components/StartScreen'
import EndScreen from './components/EndScreen'
import LobbyScreen from './components/LobbyScreen'
import { useRoom, type RoomPlayer } from './lib/room'

type Screen = 'start' | 'lobby' | 'playing' | 'ended'
const NAME_KEY = 'loy-krathong-name'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const nameRef = useRef('')

  const [screen, setScreen] = useState<Screen>('start')
  const [name, setName] = useState(() => { try { return localStorage.getItem(NAME_KEY) ?? '' } catch { return '' } })
  const [score, setScore] = useState(0)
  const [scoreKey, setScoreKey] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [entries, setEntries] = useState<Entry[]>([])
  const [muted, setMuted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)
  const [rank, setRank] = useState<number | null>(null)
  const [finalScore, setFinalScore] = useState(0)
  const [showBoard, setShowBoard] = useState(false)
  const [heartsOut, setHeartsOut] = useState(false)

  nameRef.current = name
  const multiRef = useRef(false)
  const roomRef = useRef<ReturnType<typeof useRoom> | null>(null)

  const room = useRoom({
    onStart: (seed) => beginPlay(seed),
    onEnd: () => { /* results arrive via room.results */ },
  })
  roomRef.current = room

  // --- leaderboard polling (live update) ---
  const refresh = useCallback(async () => setEntries(await getLeaderboard()), [])
  useEffect(() => {
    void refresh()
    const id = setInterval(refresh, usingBackend ? 4000 : 2500)
    return () => clearInterval(id)
  }, [refresh])

  // --- game engine lifecycle ---
  useEffect(() => {
    const game = new Game(canvasRef.current!, {
      onScore: (s) => { setScore(s); setScoreKey((k) => k + 1); if (multiRef.current) roomRef.current?.sendScore(s) },
      onTime: setTimeLeft,
      onCountdown: () => {},
      onEnd: async (s, reason) => {
        setHeartsOut(reason === 'lives')
        if (multiRef.current) roomRef.current?.sendScore(s, true)
        setFinalScore(s)
        setScreen('ended')
        setSaving(true)
        setRank(null)
        const entry = await submitScore(nameRef.current, s)
        const list = await getLeaderboard()
        setEntries(list)
        setMyId(entry.id)
        const r = rankOf(list, entry.id)
        setRank(r)
        setSaving(false)
        if (!multiRef.current && reason === 'time' && (s >= 50 || r <= 3)) game.celebrate()
      },
    })
    gameRef.current = game
    if (location.search.includes('debug')) (window as unknown as { __game: Game }).__game = game
    return () => { game.destroy(); gameRef.current = null }
  }, [])

  const saveName = () => { try { localStorage.setItem(NAME_KEY, name.trim()) } catch { /* ignore */ } }
  function beginPlay(seed?: number) {
    setMyId(null)
    setScreen('playing')
    setShowBoard(false)
    gameRef.current?.startRound(seed)
  }
  const start = () => { saveName(); multiRef.current = false; beginPlay() }
  const joinRoom = (code: string) => {
    saveName()
    multiRef.current = true
    setScreen('lobby')
    room.join(code, name.trim() || 'ผู้เล่น')
  }
  const leaveRoom = () => {
    room.leave()
    multiRef.current = false
    gameRef.current?.backToIdle()
    setScreen('start')
  }
  const multi = multiRef.current
  const roomEntries = (list: RoomPlayer[]) => list.map((p) => ({ id: p.id, name: p.name, score: p.score, at: 0 }))
  const toggleMute = () => {
    setMuted((m) => { gameRef.current?.setMuted(!m); return !m })
  }

  const playing = screen === 'playing'
  return (
    <div className="mx-auto flex min-h-full max-w-[1280px] flex-col p-2 sm:p-3">
      <Hud score={score} timeLeft={timeLeft} playing={playing} muted={muted} onToggleMute={toggleMute} scoreKey={scoreKey} />
      <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row lg:gap-3">
        <div className="relative min-w-0 flex-1">
          <canvas
            ref={canvasRef}
            className="block aspect-[3/2] w-full touch-none select-none rounded-2xl border-2 border-amber-300/60 shadow-[0_0_0_3px_rgba(122,18,48,.5),0_12px_40px_rgba(0,0,0,.5)]"
            style={{ cursor: playing ? 'none' : 'default' }}
            aria-label="พื้นที่เล่นเกม"
          />
          {screen === 'start' && <StartScreen name={name} setName={setName} onStart={start} onJoinRoom={joinRoom} />}
          {screen === 'lobby' && (
            <LobbyScreen
              status={room.status}
              code={room.code}
              players={room.players}
              you={room.you}
              roomState={room.roomState}
              onStart={room.start}
              onLeave={leaveRoom}
            />
          )}
          {screen === 'ended' && (
            <EndScreen
              score={finalScore}
              rank={multi ? (room.results && room.you ? room.results.findIndex((p) => p.id === room.you) + 1 : null) : rank}
              total={multi ? (room.results?.length ?? 0) : entries.length}
              name={name.trim()}
              saving={multi ? !room.results : saving}
              waitingText={multi ? 'รอผู้เล่นคนอื่นเล่นให้จบ…' : undefined}
              againLabel={multi ? 'กลับห้อง' : undefined}
              heartsOut={heartsOut}
              onAgain={multi ? () => setScreen('lobby') : start}
              onShowBoard={() => setShowBoard(true)}
            />
          )}
        </div>
        <aside className="lg:w-[440px] lg:shrink-0">
          <Leaderboard
            entries={multi && screen !== 'start' ? roomEntries(room.results ?? room.players) : entries}
            live={playing && !multi ? { name: name.trim() || 'คุณ', score } : null}
            highlightId={multi && screen !== 'start' ? room.you : myId}
            title={multi && screen !== 'start' ? `🎮 ห้อง “${room.code}”` : undefined}
            footer={multi && screen !== 'start' ? 'คะแนนเพื่อนในห้องอัปเดตสด' : undefined}
          />
        </aside>
      </div>

      {showBoard && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-3" onClick={() => setShowBoard(false)}>
          <div className="pop-in max-h-[92vh] w-full max-w-4xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <Leaderboard entries={multi ? roomEntries(room.results ?? room.players) : entries} highlightId={multi ? room.you : myId} title={multi ? `🎮 ผลในห้อง “${room.code}”` : undefined} size="md" />
            <button className="btn-festive mx-auto mt-3 block px-8 py-2" onClick={() => setShowBoard(false)}>ปิด</button>
          </div>
        </div>
      )}
    </div>
  )
}
