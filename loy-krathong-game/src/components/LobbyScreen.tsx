import type { RoomPlayer, Status } from '../lib/room'

interface Props {
  status: Status
  code: string
  players: RoomPlayer[]
  you: string | null
  roomState: 'lobby' | 'playing'
  onStart: () => void
  onLeave: () => void
}

export default function LobbyScreen({ status, code, players, you, roomState, onStart, onLeave }: Props) {
  const isHost = players.find((p) => p.id === you)?.host ?? false
  const failed = status === 'error' || status === 'closed'
  return (
    <div className="absolute inset-0 z-20 grid place-items-center overflow-y-auto bg-[#0a0624]/60 p-3 backdrop-blur-[2px]">
      <div className="panel pop-in w-full max-w-lg p-5 text-center">
        <p className="text-xs tracking-widest text-amber-200/80">✦ เล่นพร้อมกัน ✦</p>
        <h2 className="gold-text font-title text-3xl font-bold">ห้อง “{code}”</h2>

        {failed ? (
          <div className="my-4 rounded-xl bg-rose-500/20 p-3 text-sm text-rose-100 ring-1 ring-rose-300/50">
            {status === 'closed' ? 'การเชื่อมต่อหลุด' : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'} — โหมดนี้ต้องเปิดเกมผ่านเซิร์ฟเวอร์ของเกม
            (รัน <code className="rounded bg-black/30 px-1">npm start</code> แล้วเข้าที่ลิงก์ของเซิร์ฟเวอร์) ดูวิธีใน README
          </div>
        ) : status === 'connecting' ? (
          <p className="my-4 text-amber-100/80">กำลังเชื่อมต่อ…</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-amber-100/80">
              ผู้เล่นในห้อง <b className="text-amber-300">{players.length}</b> คน • ส่งชื่อห้องให้เพื่อนเพื่อเข้ามาเล่นด้วยกัน
            </p>
            <ul className="my-3 grid max-h-52 grid-cols-2 gap-1.5 overflow-y-auto text-left">
              {players.map((p) => (
                <li key={p.id} className={`truncate rounded-lg px-2.5 py-1 text-sm ${p.id === you ? 'bg-amber-400/30 ring-1 ring-amber-300' : 'bg-white/10'}`}>
                  {p.host && '👑 '}{p.name}{p.id === you && ' (คุณ)'}
                </li>
              ))}
            </ul>
            {roomState === 'playing' ? (
              <p className="mb-3 rounded-xl bg-white/10 p-2 text-sm">รอบนี้กำลังเล่นอยู่ — รอรอบถัดไปนะ</p>
            ) : isHost ? (
              <button className="btn-festive mb-3 px-8 py-2.5 text-lg" onClick={onStart}>เริ่มเกมพร้อมกัน!</button>
            ) : (
              <p className="mb-3 rounded-xl bg-white/10 p-2 text-sm">รอหัวหน้าห้อง (👑) กดเริ่ม…</p>
            )}
          </>
        )}
        <div><button className="btn-ghost px-5 py-1.5 text-sm" onClick={onLeave}>ออกจากห้อง</button></div>
      </div>
    </div>
  )
}
