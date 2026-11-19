import type { Entry } from '../lib/leaderboard'
import { backendKind, sortEntries } from '../lib/leaderboard'

export interface LiveMe { name: string; score: number }

interface Props {
  entries: Entry[]
  /** while playing solo: the current player's running score is merged in live */
  live?: LiveMe | null
  /** id of the entry to highlight ("you") */
  highlightId?: string | null
  title?: string
  footer?: string
  /** sm = beside the game, md = roomy pop-up */
  size?: 'sm' | 'md'
  className?: string
}

const PER_COL = 20
const MEDAL = ['#ffd35a', '#dfe4ee', '#e8a263']

type Row = Entry & { me?: boolean }

export default function Leaderboard({
  entries, live, highlightId, title = '🏆 อันดับผู้พิทักษ์แม่น้ำ', footer, size = 'sm', className = '',
}: Props) {
  const rows: Row[] = entries.map((e) => ({ ...e, me: e.id === highlightId }))
  if (live) rows.push({ id: '__live__', name: live.name || 'คุณ', score: live.score, at: Date.now() + 1e9, me: true })
  const sorted = sortEntries(rows) as Row[]
  const max = Math.max(1, sorted[0]?.score ?? 1)
  const meIdx = sorted.findIndex((r) => r.me)
  const meOutside = meIdx >= PER_COL * 2 ? sorted[meIdx] : null
  const slots: (Row | null)[] = Array.from({ length: PER_COL * 2 }, (_, i) => sorted[i] ?? null)
  const sm = size === 'sm'

  const renderSlot = (r: Row | null, i: number) => {
    const rank = i + 1
    const top = rank <= 3 && r
    return (
      <li
        key={i}
        className={`relative flex items-center gap-1.5 overflow-hidden rounded-lg ${sm ? 'h-[26px] px-1.5' : 'h-8 px-2.5'} ${
          r?.me ? 'ring-2 ring-amber-300 bg-amber-400/25' : r ? 'bg-white/[.07]' : 'bg-white/[.025]'
        }`}
      >
        {r && (
          <span
            className="absolute inset-y-0 left-0 opacity-30"
            style={{ width: `${Math.max(4, (r.score / max) * 100)}%`, background: top ? MEDAL[rank - 1] : '#b79cff' }}
          />
        )}
        <span
          className={`font-title relative grid shrink-0 place-items-center rounded-full font-bold ${sm ? 'h-5 w-5 text-[11px]' : 'h-6 w-6 text-xs'}`}
          style={{
            background: top ? MEDAL[rank - 1] : r ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.07)',
            color: top ? '#4a1226' : r ? '#ffe9a8' : 'rgba(255,233,168,.35)',
          }}
        >
          {rank}
        </span>
        <span className={`relative min-w-0 flex-1 truncate ${sm ? 'text-xs' : 'text-sm'} ${r ? '' : 'text-white/25'}`}>
          {r ? r.name : '—'}
          {r?.me && <span className="ml-1 rounded-full bg-amber-300 px-1.5 text-[10px] font-bold text-[#4a1226]">คุณ</span>}
        </span>
        {r && <span className={`font-title relative font-bold text-amber-200 ${sm ? 'text-sm' : 'text-base'}`}>{r.score}</span>}
      </li>
    )
  }

  const colHead = (t: string) => (
    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-amber-200/80">
      <span className="h-px flex-1 bg-amber-200/30" />{t}<span className="h-px flex-1 bg-amber-200/30" />
    </div>
  )

  return (
    <div className={`panel p-3 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-title text-lg font-bold leading-tight text-amber-200">{title}</h2>
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-emerald-300">
          <i className="live-dot inline-block h-2 w-2 rounded-full bg-emerald-400" />
          สด • {sorted.length} คน
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-2">
        <div>{colHead('อันดับ 1–20')}<ol className="space-y-[3px]">{slots.slice(0, PER_COL).map((r, i) => renderSlot(r, i))}</ol></div>
        <div>{colHead('อันดับ 21–40')}<ol className="space-y-[3px]">{slots.slice(PER_COL).map((r, i) => renderSlot(r, i + PER_COL))}</ol></div>
      </div>
      {meOutside && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-400/25 px-3 py-1.5 ring-2 ring-amber-300">
          <span className="font-title grid h-6 min-w-6 place-items-center rounded-full bg-white/25 px-1 text-xs font-bold">{meIdx + 1}</span>
          <span className="flex-1 truncate text-sm">{meOutside.name} <b className="text-amber-300">(คุณ)</b></span>
          <span className="font-title font-bold text-amber-200">{meOutside.score}</span>
        </div>
      )}
      <p className="mt-2 text-[10px] leading-tight text-amber-100/50">
        {footer ?? (backendKind() === 'local' ? 'โหมดเดโม: เก็บคะแนนไว้ในเครื่องนี้ (ดู README เพื่อเปิดเซิร์ฟเวอร์/Supabase)' : 'เชื่อมต่อเซิร์ฟเวอร์ออนไลน์แล้ว')}
      </p>
    </div>
  )
}
