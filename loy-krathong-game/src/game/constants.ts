export const W = 900
export const H = 640
export const GAME_SECONDS = 60
export const COUNTDOWN_SECONDS = 3
export const WATER_TOP = 268
export const BAG_Y = H - 160 // y of the bag mouth centre
export const BAG_MOUTH_HALF = 70

export type Kind = 'krathong' | 'coin' | 'trash' | 'bomb' | 'fish'

export const KINDS: Kind[] = ['krathong', 'coin', 'trash', 'bomb', 'fish']

export const KIND_SCORE: Record<Kind, number> = {
  krathong: 2,
  coin: 1,
  trash: 1,
  bomb: -2,
  fish: -1,
}

export const KIND_NAME_TH: Record<Kind, string> = {
  krathong: 'กระทง',
  coin: 'เศษเหรียญ',
  trash: 'ขยะ',
  bomb: 'ระเบิด',
  fish: 'ปลา',
}

export const KIND_RADIUS: Record<Kind, number> = {
  krathong: 40,
  coin: 28,
  trash: 32,
  bomb: 30,
  fish: 32,
}

export const TAU = Math.PI * 2
export const rand = (a: number, b: number) => a + Math.random() * (b - a)
export const randInt = (n: number) => Math.floor(Math.random() * n)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
