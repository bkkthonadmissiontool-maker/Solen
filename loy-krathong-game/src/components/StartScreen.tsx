import { useState } from 'react'
import ItemIcon from './ItemIcon'
import { LABELS, POINTS, type ItemKind } from '../game/types'

const KINDS: ItemKind[] = ['krathong', 'coin', 'trash', 'bomb', 'fish']

interface Props {
  name: string
  setName: (v: string) => void
  onStart: () => void
  onJoinRoom: (room: string) => void
}

export default function StartScreen({ name, setName, onStart, onJoinRoom }: Props) {
  const [multi, setMulti] = useState(false)
  const [room, setRoom] = useState(() => { try { return localStorage.getItem('loy-krathong-room') ?? 'main' } catch { return 'main' } })
  const submit = () => {
    if (!multi) return onStart()
    const r = room.trim() || 'main'
    try { localStorage.setItem('loy-krathong-room', r) } catch { /* ignore */ }
    onJoinRoom(r)
  }
  return (
    <div className="absolute inset-0 z-20 grid place-items-center overflow-y-auto bg-[#0a0624]/55 p-2 backdrop-blur-[2px] sm:p-4">
      <div className="panel pop-in w-full max-w-2xl p-4 text-center sm:p-6">
        <p className="text-xs tracking-widest text-amber-200/80 sm:text-sm">✦ เทศกาลลอยกระทง ✦</p>
        <h1 className="gold-text font-title my-1 text-2xl font-bold leading-tight sm:text-4xl">
          ควันหลงเก็บกระทงหลงทาง
        </h1>
        <p className="mx-auto max-w-lg text-sm text-amber-50/90 sm:text-base">
          ใช้เมาส์เลื่อนถุงขยะซ้าย-ขวา เก็บกระทง เหรียญ และขยะให้แม่น้ำสะอาด
          แต่ระวัง! อย่าเก็บระเบิด ปลา และหอย — เวลา 90 วินาที!
        </p>

        <div className="my-3 grid grid-cols-5 gap-1.5 sm:gap-2">
          {KINDS.map((k) => {
            const p = POINTS[k]
            return (
              <div key={k} className="rounded-2xl bg-white/8 px-1 py-1.5 ring-1 ring-white/15">
                <div className="bob mx-auto grid place-items-center" style={{ animationDelay: `${KINDS.indexOf(k) * 0.3}s` }}>
                  <ItemIcon kind={k} size={64} />
                </div>
                <div className="text-[11px] leading-tight sm:text-sm">{LABELS[k]}</div>
                <div className={`font-title text-base font-bold sm:text-xl ${p > 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                  {p > 0 ? '+' : ''}{p}
                </div>
              </div>
            )
          })}
        </div>

        <p className="mx-auto mb-3 max-w-lg rounded-xl bg-rose-500/20 px-3 py-1.5 text-xs text-amber-100 ring-1 ring-rose-300/40 sm:text-sm">
          ❤️ <b>หัวใจ 3 ดวง:</b> โดนระเบิดเสียหัวใจ 1 ดวง หมดแล้วต้องเริ่มใหม่!<br />
          🔥 <b>คอมโบ:</b> เก็บของที่ได้คะแนนบวกติดกัน — ครบ 5 ชิ้นของตกเร็วขึ้น, ครบ 10 เร็วขึ้นอีก, ครบ 20 เร็วสุดๆ! ถ้าเก็บของลบ คอมโบจะขาด
        </p>
        <div className="mx-auto mb-2 flex w-fit overflow-hidden rounded-full border-2 border-amber-300/70 text-sm font-semibold">
          <button type="button" onClick={() => setMulti(false)} className={`px-4 py-1.5 ${!multi ? 'bg-amber-300 text-[#4a1226]' : 'bg-black/20 text-amber-100'}`}>เล่นคนเดียว</button>
          <button type="button" onClick={() => setMulti(true)} className={`px-4 py-1.5 ${multi ? 'bg-amber-300 text-[#4a1226]' : 'bg-black/20 text-amber-100'}`}>เล่นพร้อมกัน (ห้อง)</button>
        </div>
        {multi && (
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            maxLength={16}
            placeholder="ชื่อห้อง (ใส่เหมือนกันเพื่อเข้าห้องเดียวกัน)"
            aria-label="ชื่อห้อง"
            className="mx-auto mb-2 block w-full max-w-md rounded-full border-2 border-amber-300/50 bg-[#1a0f3d]/80 px-4 py-2 text-center text-sm text-amber-50 placeholder-amber-100/40 outline-none focus:border-amber-200"
          />
        )}
        <form
          className="mx-auto flex max-w-md flex-col items-stretch gap-2 sm:flex-row"
          onSubmit={(e) => { e.preventDefault(); submit() }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            placeholder="ใส่ชื่อเล่นของคุณ"
            aria-label="ชื่อเล่น"
            className="min-w-0 flex-1 rounded-full border-2 border-amber-300/70 bg-[#1a0f3d]/80 px-4 py-2.5 text-center text-base text-amber-50 placeholder-amber-100/40 outline-none focus:border-amber-200 focus:ring-2 focus:ring-amber-300/40"
            autoFocus
          />
          <button type="submit" className="btn-festive px-7 py-2.5 text-lg">{multi ? 'เข้าห้อง' : 'เริ่มเล่น!'}</button>
        </form>
        <p className="mt-2 text-[11px] text-amber-100/55">เล่นด้วยคีย์บอร์ดได้ด้วย: ปุ่มลูกศร ← →</p>
      </div>
    </div>
  )
}
