import { ROUND_SECONDS } from '../game/types'

interface Props {
  score: number
  timeLeft: number
  playing: boolean
  muted: boolean
  onToggleMute: () => void
  scoreKey: number
}

export default function Hud({ score, timeLeft, playing, muted, onToggleMute, scoreKey }: Props) {
  const low = playing && timeLeft <= 10
  const pct = Math.max(0, Math.min(100, (timeLeft / ROUND_SECONDS) * 100))
  return (
    <header className="panel mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 sm:px-4">
      <div className="min-w-0 flex-1 basis-60">
        <h1 className="gold-text font-title truncate text-lg font-bold leading-tight sm:text-2xl">ควันหลงเก็บกระทงหลงทาง</h1>
        <p className="truncate text-[11px] text-amber-100/80 sm:text-sm">
          เลื่อนเมาส์ซ้าย-ขวาเพื่อรับกระทง เหรียญ ขยะ • หลบระเบิด ปลา หอย • เก็บของดีติดกันเพื่อคอมโบ
        </p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="rounded-2xl bg-white/10 px-3 py-1 text-center ring-1 ring-amber-300/40">
          <div className="text-[10px] text-amber-100/70">คะแนน</div>
          <div key={scoreKey} className="pop-in font-title text-2xl font-bold leading-none text-amber-200 sm:text-3xl">{score}</div>
        </div>
        <div className={`min-w-[84px] rounded-2xl px-3 py-1 text-center ring-1 ${low ? 'bg-rose-500/30 ring-rose-300' : 'bg-white/10 ring-amber-300/40'}`}>
          <div className="text-[10px] text-amber-100/70">เวลา</div>
          <div className={`font-title text-2xl font-bold leading-none sm:text-3xl ${low ? 'text-rose-200' : 'text-amber-200'}`}>
            {timeLeft}<span className="ml-0.5 text-xs font-normal">วิ</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/30">
            <div className={`h-full rounded-full ${low ? 'bg-rose-400' : 'bg-amber-300'}`} style={{ width: `${pct}%`, transition: 'width 1s linear' }} />
          </div>
        </div>
        <button className="btn-ghost h-10 w-10 text-lg" onClick={onToggleMute} aria-label={muted ? 'เปิดเสียงและเพลง' : 'ปิดเสียงและเพลง'} title={muted ? 'เปิดเสียงและเพลง' : 'ปิดเสียงและเพลง'}>
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </header>
  )
}
