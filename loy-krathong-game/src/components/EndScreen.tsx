interface Props {
  score: number
  rank: number | null
  total: number
  name: string
  saving: boolean
  heartsOut: boolean
  againLabel?: string
  waitingText?: string
  onAgain: () => void
  onShowBoard: () => void
}

function verdict(score: number) {
  if (score >= 65) return { title: 'ยอดเยี่ยมที่สุด! 🏅', msg: 'คุณคือผู้พิทักษ์แม่น้ำตัวจริง แม่น้ำสะอาดใสเพราะคุณ!' }
  if (score >= 50) return { title: 'เก่งมาก! 🎉', msg: 'แม่น้ำสะอาดขึ้นเยอะเลย ขอบคุณที่ช่วยกันนะ' }
  if (score >= 30) return { title: 'ทำได้ดี! 🌸', msg: 'อีกนิดเดียวก็เป็นผู้พิทักษ์ระดับตำนานแล้ว' }
  return { title: 'สู้ต่อไป! 🪷', msg: 'ลองใหม่อีกครั้ง หลบระเบิดกับปลา แล้วเก็บของดีให้ได้เยอะขึ้น' }
}

export default function EndScreen({ score, rank, total, name, saving, heartsOut, againLabel = 'เล่นอีกครั้ง', waitingText = 'กำลังบันทึกคะแนน…', onAgain, onShowBoard }: Props) {
  const v = heartsOut
    ? { title: 'หัวใจหมดแล้ว! 💔', msg: 'โดนระเบิดจนหัวใจหมด ต้องเริ่มเกมใหม่ ครั้งหน้าหลบระเบิดให้ดีนะ' }
    : verdict(score)
  return (
    <div className="absolute inset-0 z-20 grid place-items-center overflow-y-auto bg-[#0a0624]/60 p-3 backdrop-blur-[2px]">
      <div className="panel pop-in w-full max-w-md p-5 text-center sm:p-7">
        <p className="text-sm text-amber-200/80">{heartsOut ? 'จบเกม' : 'หมดเวลา!'} • {name || 'ผู้เล่น'}</p>
        <h2 className="gold-text font-title my-1 text-3xl font-bold sm:text-4xl">{v.title}</h2>
        <div className="font-title my-2 text-7xl font-bold text-amber-100 drop-shadow-[0_4px_0_rgba(122,18,48,.8)] sm:text-8xl">{score}</div>
        <div className="text-sm text-amber-100/80">คะแนนรวม</div>
        <div className="my-3 rounded-2xl bg-white/10 px-3 py-2 text-lg ring-1 ring-amber-300/40">
          {saving || rank === null ? (
            waitingText
          ) : (
            <>อันดับที่ <b className="font-title text-2xl text-amber-300">{rank}</b> จาก {total} คน</>
          )}
        </div>
        <p className="mb-4 text-sm text-amber-50/85">{v.msg}</p>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <button className="btn-festive px-6 py-2.5 text-lg" onClick={onAgain}>{againLabel}</button>
          <button className="btn-ghost px-6 py-2.5 text-lg" onClick={onShowBoard}>ดูอันดับ</button>
        </div>
      </div>
    </div>
  )
}
