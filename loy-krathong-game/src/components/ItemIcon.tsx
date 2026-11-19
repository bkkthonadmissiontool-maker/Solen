import { useEffect, useRef } from 'react'
import { drawItem } from '../game/sprites'
import type { ItemKind } from '../game/types'

/** Small animated preview of a game sprite (used in the how-to-play guide). */
export default function ItemIcon({ kind, size = 72 }: { kind: ItemKind; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current!
    const ctx = c.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    c.width = size * dpr
    c.height = size * dpr
    let raf = 0
    let variant = 0
    let lastSwap = 0
    const loop = (ms: number) => {
      const t = ms / 1000
      if ((kind === 'trash' || kind === 'fish') && t - lastSwap > 1.4) { variant++; lastSwap = t }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, c.width, c.height)
      const s = (size * dpr) / 124
      ctx.setTransform(s, 0, 0, s, c.width / 2, c.height / 2 + (kind === 'krathong' ? 2 : 0))
      drawItem(ctx, kind, variant, t, 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [kind, size])
  return <canvas ref={ref} style={{ width: size, height: size }} />
}
