export type ItemKind = 'krathong' | 'coin' | 'trash' | 'bomb' | 'fish'

export const W = 900 // logical canvas width
export const H = 600 // logical canvas height
export const ROUND_SECONDS = 90
export const COUNTDOWN_SECONDS = 3
export const MAX_LIVES = 3
export type EndReason = 'time' | 'lives'

export const POINTS: Record<ItemKind, number> = {
  krathong: 2,
  coin: 1,
  trash: 1,
  bomb: -5,
  fish: -1,
}

export const LABELS: Record<ItemKind, string> = {
  krathong: 'กระทง',
  coin: 'เศษเหรียญ',
  trash: 'ขยะ',
  bomb: 'ระเบิด',
  fish: 'ปลา / หอย',
}

export interface GameCallbacks {
  onScore: (score: number) => void
  onTime: (secondsLeft: number) => void
  onCountdown: (n: number) => void // 3,2,1 then 0 = go
  onEnd: (score: number, reason: EndReason) => void
}
