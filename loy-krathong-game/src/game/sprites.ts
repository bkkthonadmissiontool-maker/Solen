// Illustrated sprite drawing (cartoon semi-realistic), all drawn procedurally with
// gradients, outlines, highlights – no flat geometric placeholders.
// Every draw function paints around the origin (0,0).
import type { ItemKind } from './types'

type Ctx = CanvasRenderingContext2D
type Stops = [number, string][]

const OUT = '#3b2412'
const TAU = Math.PI * 2

function outline(ctx: Ctx, w = 3, color = OUT) {
  ctx.lineWidth = w
  ctx.strokeStyle = color
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
}
function fillStroke(ctx: Ctx, fill: string | CanvasGradient, w = 3) {
  ctx.fillStyle = fill
  ctx.fill()
  outline(ctx, w)
  ctx.stroke()
}
function lin(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: Stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  stops.forEach(([o, c]) => g.addColorStop(o, c))
  return g
}
function rad(ctx: Ctx, x0: number, y0: number, r0: number, x1: number, y1: number, r1: number, stops: Stops) {
  const g = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1)
  stops.forEach(([o, c]) => g.addColorStop(o, c))
  return g
}
function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, rot = 0) {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU)
}
export function star4(ctx: Ctx, x: number, y: number, r: number, color: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2
    const rr = i % 2 === 0 ? r : r * 0.26
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}
function glow(ctx: Ctx, x: number, y: number, r: number, color: string, alpha = 1) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = rad(ctx, x, y, 0, x, y, r, [[0, color], [1, 'rgba(255,200,80,0)']])
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
  ctx.restore()
}

// ---------------------------------------------------------------------------
// KRATHONG – banana-leaf folded base, lotus, marigolds, jasmine, incense, candle
// ---------------------------------------------------------------------------
function leaf(ctx: Ctx, len: number, w: number, c1: string, c2: string) {
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(-w, -len * 0.5, 0, -len)
  ctx.quadraticCurveTo(w, -len * 0.5, 0, 0)
  ctx.closePath()
  fillStroke(ctx, lin(ctx, 0, 0, 0, -len, [[0, c1], [1, c2]]), 2.4)
  ctx.beginPath()
  ctx.moveTo(0, -3)
  ctx.lineTo(0, -len * 0.78)
  ctx.strokeStyle = 'rgba(255,255,255,.38)'
  ctx.lineWidth = 1.4
  ctx.stroke()
}
function leafRing(ctx: Ctx, n: number, rx: number, ry: number, cy: number, len: number, w: number, c1: string, c2: string, front: boolean) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + 0.2
    const s = Math.sin(a)
    if (s >= 0 !== front) continue
    ctx.save()
    ctx.translate(Math.cos(a) * rx, cy + s * ry)
    ctx.rotate(Math.cos(a) * 0.55)
    leaf(ctx, len, w, c1, c2)
    ctx.restore()
  }
}
function petal(ctx: Ctx, len: number, w: number, c1: string, c2: string) {
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(-w, -len * 0.3, -w * 0.8, -len * 0.82, 0, -len)
  ctx.bezierCurveTo(w * 0.8, -len * 0.82, w, -len * 0.3, 0, 0)
  ctx.closePath()
  fillStroke(ctx, lin(ctx, 0, 0, 0, -len, [[0, c1], [1, c2]]), 2.2)
}
function marigold(ctx: Ctx, x: number, y: number, r: number) {
  ctx.save()
  ctx.translate(x, y)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU
    ctx.beginPath()
    ctx.arc(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.46, 0, TAU)
    fillStroke(ctx, i % 2 ? '#ffb21f' : '#ff9a1a', 1.8)
  }
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.5, 0, TAU)
  fillStroke(ctx, rad(ctx, -1, -1, 0, 0, 0, r * 0.5, [[0, '#ffe680'], [1, '#ffa81a']]), 1.8)
  ctx.restore()
}
function jasmine(ctx: Ctx, x: number, y: number, r: number) {
  ctx.save()
  ctx.translate(x, y)
  for (let i = 0; i < 5; i++) {
    ctx.save()
    ctx.rotate((i / 5) * TAU)
    ellipse(ctx, 0, -r * 0.65, r * 0.3, r * 0.55)
    fillStroke(ctx, '#fffdf4', 1.5)
    ctx.restore()
  }
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.22, 0, TAU)
  ctx.fillStyle = '#ffd966'
  ctx.fill()
  ctx.restore()
}
export function drawFlame(ctx: Ctx, x: number, y: number, t: number, s = 1) {
  glow(ctx, x, y - 4 * s, 26 * s, 'rgba(255,214,110,.85)', 0.85)
  ctx.save()
  ctx.translate(x, y)
  ctx.scale((1 + Math.sin(t * 15) * 0.08) * s, (1 + Math.sin(t * 11 + 1) * 0.1) * s)
  const tip = Math.sin(t * 9) * 1.6
  ctx.beginPath()
  ctx.moveTo(0, 5)
  ctx.bezierCurveTo(-8, 1, -5, -9, tip, -17)
  ctx.bezierCurveTo(5, -9, 8, 1, 0, 5)
  ctx.closePath()
  ctx.fillStyle = lin(ctx, 0, 5, 0, -17, [[0, '#ff7a1a'], [0.6, '#ffc233'], [1, '#fff3a8']])
  ctx.fill()
  ellipse(ctx, 0, 1, 2.8, 4.6)
  ctx.fillStyle = '#fffbe0'
  ctx.fill()
  ctx.restore()
}
export function drawKrathong(ctx: Ctx, t: number, withCandle = true) {
  ctx.save()
  ctx.translate(0, 14)
  // soft shadow glow
  glow(ctx, 0, 20, 60, 'rgba(255,190,80,.35)', 0.6)
  // banana-trunk disc base (thickness + top)
  ellipse(ctx, 0, 31, 48, 14)
  fillStroke(ctx, '#b88a4a', 2.6)
  ellipse(ctx, 0, 25, 48, 14)
  fillStroke(ctx, rad(ctx, -10, 20, 2, 0, 25, 50, [[0, '#fff1c4'], [1, '#e0b872']]), 2.8)
  ellipse(ctx, 0, 25, 33, 8)
  ctx.strokeStyle = 'rgba(160,110,50,.45)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  // back leaves (folded banana leaf petals)
  leafRing(ctx, 12, 40, 11, 18, 34, 10, '#3fae52', '#1c7a38', false)
  leafRing(ctx, 9, 25, 7, 12, 26, 8, '#8be35f', '#3aa84b', false)

  if (withCandle) {
    // incense sticks
    const sticks: [number, number, number][] = [[-0.46, 56, 4], [0.5, 58, 4], [0.12, 50, 9]]
    for (const [ang, len, x0] of sticks) {
      const x1 = x0 + Math.sin(ang) * len
      const y1 = -4 - Math.cos(ang) * len
      ctx.beginPath()
      ctx.moveTo(x0 * Math.sign(ang || 1), -2)
      ctx.lineTo(x1, y1)
      outline(ctx, 4.6)
      ctx.stroke()
      ctx.strokeStyle = '#d99a4a'
      ctx.lineWidth = 2.4
      ctx.stroke()
      glow(ctx, x1, y1, 8, 'rgba(255,90,40,.9)', 0.9)
      ctx.beginPath()
      ctx.arc(x1, y1, 2.2, 0, TAU)
      ctx.fillStyle = '#ff4a1a'
      ctx.fill()
      for (let k = 0; k < 3; k++) {
        const ph = (t * 0.7 + k / 3 + x1 * 0.01) % 1
        ctx.beginPath()
        ctx.arc(x1 + Math.sin(ph * 6 + k) * 4, y1 - ph * 22, 2 + ph * 3, 0, TAU)
        ctx.fillStyle = `rgba(230,230,240,${0.35 * (1 - ph)})`
        ctx.fill()
      }
    }
    // candle
    ctx.beginPath()
    ctx.roundRect(-5, -44, 10, 44, 3)
    fillStroke(ctx, lin(ctx, -5, 0, 5, 0, [[0, '#ffe9a8'], [0.5, '#fffbe8'], [1, '#f1cf86']]), 2.4)
    ctx.beginPath()
    ctx.moveTo(-3, -44)
    ctx.quadraticCurveTo(-1, -36, 1, -42)
    ctx.lineTo(3, -44)
    ctx.fillStyle = '#ffd66e'
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(0, -44)
    ctx.lineTo(0, -48)
    outline(ctx, 1.8)
    ctx.stroke()
    drawFlame(ctx, 0, -53, t)
  }

  // flowers
  marigold(ctx, -31, 4, 12)
  marigold(ctx, 31, 4, 12)
  // lotus (outer fan then inner)
  ctx.save()
  ctx.translate(0, 8)
  for (const k of [-3, 3, -2, 2, -1, 1, 0]) {
    ctx.save()
    ctx.rotate(k * 0.4)
    petal(ctx, 27 - Math.abs(k) * 1.8, 9.5, '#ff4f93', '#ffb8d4')
    ctx.restore()
  }
  for (const k of [-2, 2, -1, 1, 0]) {
    ctx.save()
    ctx.rotate(k * 0.3)
    petal(ctx, 19 - Math.abs(k) * 1.2, 7.5, '#ff8abb', '#fff3f8')
    ctx.restore()
  }
  ctx.restore()
  jasmine(ctx, -17, 14, 6)
  jasmine(ctx, 17, 14, 6)
  jasmine(ctx, -44, 14, 5)
  jasmine(ctx, 44, 14, 5)

  // front leaves
  leafRing(ctx, 9, 27, 8, 20, 22, 8, '#a2ee70', '#3fae52', true)
  leafRing(ctx, 12, 41, 12, 26, 26, 10, '#47b95a', '#1e8040', true)
  ctx.restore()
}

// ---------------------------------------------------------------------------
// COIN – shiny, spinning, sparkling
// ---------------------------------------------------------------------------
function coin(ctx: Ctx, x: number, y: number, r: number, sx: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(sx, 1)
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, TAU)
  fillStroke(ctx, rad(ctx, -r * 0.35, -r * 0.4, 1, 0, 0, r * 1.1, [[0, '#fff7b0'], [0.45, '#ffcf2e'], [1, '#c98410']]), 3)
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.7, 0, TAU)
  ctx.strokeStyle = '#b87408'
  ctx.lineWidth = 2
  ctx.stroke()
  // little star emblem
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2
    const rr = i % 2 === 0 ? r * 0.42 : r * 0.18
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  ctx.closePath()
  ctx.fillStyle = '#e9a516'
  ctx.fill()
  ctx.strokeStyle = '#b87408'
  ctx.lineWidth = 1.2
  ctx.stroke()
  // shine arc
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.84, Math.PI * 1.08, Math.PI * 1.45)
  ctx.strokeStyle = 'rgba(255,255,255,.85)'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.restore()
}
export function drawCoin(ctx: Ctx, t: number, seed: number) {
  const sx = 0.38 + 0.62 * Math.abs(Math.cos(t * 3.2 + seed))
  coin(ctx, 14, 12, 14, 0.5 + 0.5 * Math.abs(Math.cos(t * 2.6 + seed + 1.3)))
  coin(ctx, -4, -3, 24, sx)
  const pulse = (k: number) => 0.5 + 0.5 * Math.sin(t * 5 + k * 2.1 + seed)
  glow(ctx, -4, -3, 40, 'rgba(255,230,120,.5)', 0.6)
  star4(ctx, -22, -22, 9 * pulse(0), '#fffbe0')
  star4(ctx, 22, -14, 7 * pulse(1), '#fff3b0')
  star4(ctx, 8, 28, 6 * pulse(2), '#fffbe0')
}

// ---------------------------------------------------------------------------
// TRASH – bottle, plastic bag, paper cup, food packaging, can
// ---------------------------------------------------------------------------
function drawBottle(ctx: Ctx) {
  ctx.beginPath()
  ctx.roundRect(-8, -34, 16, 12, 3)
  fillStroke(ctx, '#bfe6ff', 2.4)
  ctx.beginPath()
  ctx.roundRect(-9.5, -42, 19, 9, 3)
  fillStroke(ctx, lin(ctx, 0, -42, 0, -33, [[0, '#4a9cf0'], [1, '#2a62c4']]), 2.4)
  ctx.beginPath()
  ctx.moveTo(-8, -24)
  ctx.bezierCurveTo(-20, -16, -15, -8, -15, 0)
  ctx.lineTo(-15, 30)
  ctx.quadraticCurveTo(-15, 38, -7, 38)
  ctx.lineTo(7, 38)
  ctx.quadraticCurveTo(15, 38, 15, 30)
  ctx.lineTo(15, 0)
  ctx.bezierCurveTo(15, -8, 20, -16, 8, -24)
  ctx.closePath()
  fillStroke(ctx, lin(ctx, -15, 0, 15, 0, [[0, 'rgba(160,220,255,.95)'], [0.5, 'rgba(225,246,255,.95)'], [1, 'rgba(120,190,240,.95)']]), 2.6)
  ctx.beginPath()
  ctx.roundRect(-15, 2, 30, 17, 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.fillStyle = '#34b36b'
  ctx.fillRect(-15, 8, 30, 5)
  ctx.beginPath()
  ctx.roundRect(-15, 2, 30, 17, 2)
  outline(ctx, 1.6)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-10, -8)
  ctx.lineTo(-10, 28)
  ctx.strokeStyle = 'rgba(255,255,255,.9)'
  ctx.lineWidth = 3
  ctx.stroke()
}
function drawPlasticBag(ctx: Ctx) {
  for (const x of [-8, 8]) {
    ctx.beginPath()
    ctx.moveTo(x - 6, -14)
    ctx.bezierCurveTo(x - 9, -40, x + 9, -40, x + 6, -14)
    outline(ctx, 6)
    ctx.stroke()
    ctx.strokeStyle = '#f4fbff'
    ctx.lineWidth = 3
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.moveTo(-20, -14)
  ctx.lineTo(20, -14)
  ctx.bezierCurveTo(28, 0, 30, 18, 22, 30)
  ctx.quadraticCurveTo(0, 38, -22, 30)
  ctx.bezierCurveTo(-30, 18, -28, 0, -20, -14)
  ctx.closePath()
  fillStroke(ctx, lin(ctx, -22, -14, 22, 30, [[0, '#ffffff'], [0.55, '#e6f2fb'], [1, '#bcd4e8']]), 2.8)
  ctx.strokeStyle = 'rgba(120,150,180,.55)'
  ctx.lineWidth = 1.4
  for (const [x0, y0, x1, y1] of [[-10, -6, -14, 20], [2, -8, 6, 24], [14, -4, 12, 18]]) {
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.quadraticCurveTo((x0 + x1) / 2 + 4, (y0 + y1) / 2, x1, y1)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.moveTo(0, 14)
  ctx.bezierCurveTo(-9, 6, -4, 0, 0, 5)
  ctx.bezierCurveTo(4, 0, 9, 6, 0, 14)
  ctx.fillStyle = '#ff5a7a'
  ctx.fill()
}
function drawCup(ctx: Ctx) {
  // straw
  ctx.beginPath()
  ctx.moveTo(4, -26)
  ctx.lineTo(11, -42)
  outline(ctx, 6)
  ctx.stroke()
  ctx.strokeStyle = '#ff4d6d'
  ctx.lineWidth = 3
  ctx.stroke()
  // body
  ctx.beginPath()
  ctx.moveTo(-18, -24)
  ctx.lineTo(18, -24)
  ctx.lineTo(12, 34)
  ctx.quadraticCurveTo(0, 38, -12, 34)
  ctx.closePath()
  fillStroke(ctx, lin(ctx, -18, 0, 18, 0, [[0, '#fff6e6'], [0.5, '#ffffff'], [1, '#ecd9bd']]), 2.8)
  ctx.save()
  ctx.clip()
  ctx.fillStyle = '#e8403f'
  ctx.fillRect(-20, -2, 40, 20)
  ctx.fillStyle = '#ffd35a'
  ctx.fillRect(-20, 6, 40, 4)
  ctx.restore()
  ctx.beginPath()
  ctx.moveTo(-18, -24)
  ctx.lineTo(18, -24)
  ctx.lineTo(12, 34)
  ctx.quadraticCurveTo(0, 38, -12, 34)
  ctx.closePath()
  outline(ctx, 2.8)
  ctx.stroke()
  // lid
  ctx.beginPath()
  ctx.roundRect(-21, -31, 42, 9, 4)
  fillStroke(ctx, lin(ctx, 0, -31, 0, -22, [[0, '#ffffff'], [1, '#d9d9e4']]), 2.6)
}
function drawPackaging(ctx: Ctx) {
  const crimp = (y: number, dir: number) => {
    for (let i = -17; i < 17; i += 4.25) {
      ctx.lineTo(i + 2.1, y + dir * 6)
      ctx.lineTo(i + 4.25, y)
    }
  }
  ctx.beginPath()
  ctx.moveTo(-17, -22)
  crimp(-22, -1)
  ctx.lineTo(17, 22)
  for (let i = 17; i > -17; i -= 4.25) {
    ctx.lineTo(i - 2.1, 28)
    ctx.lineTo(i - 4.25, 22)
  }
  ctx.closePath()
  fillStroke(ctx, lin(ctx, -17, -22, 17, 22, [[0, '#ffb13d'], [0.55, '#ff7a2e'], [1, '#e2452a']]), 2.8)
  star4(ctx, 0, -2, 15, '#ffe566')
  ctx.beginPath()
  ctx.arc(0, -2, 4, 0, TAU)
  ctx.fillStyle = '#e2452a'
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(-11, 12, 22, 5, 2)
  ctx.fillStyle = '#fff3d6'
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(-12, -14)
  ctx.lineTo(-12, 10)
  ctx.strokeStyle = 'rgba(255,255,255,.55)'
  ctx.lineWidth = 3
  ctx.stroke()
}
function drawCan(ctx: Ctx) {
  ctx.beginPath()
  ctx.moveTo(-15, -26)
  ctx.lineTo(-15, 28)
  ctx.ellipse(0, 28, 15, 6, 0, Math.PI, 0, true)
  ctx.lineTo(15, -26)
  ctx.closePath()
  fillStroke(ctx, lin(ctx, -15, 0, 15, 0, [[0, '#c9ced8'], [0.35, '#f7f9fc'], [0.7, '#b6bcc8'], [1, '#8d94a3']]), 2.8)
  ctx.save()
  ctx.clip()
  ctx.fillStyle = '#e8403f'
  ctx.fillRect(-16, -10, 32, 26)
  ctx.fillStyle = 'rgba(255,255,255,.28)'
  ctx.fillRect(-10, -10, 5, 26)
  ctx.restore()
  ellipse(ctx, 0, -26, 15, 6)
  fillStroke(ctx, lin(ctx, -15, -26, 15, -26, [[0, '#9aa1ae'], [0.5, '#eef1f6'], [1, '#9aa1ae']]), 2.6)
  ellipse(ctx, 0, -26, 8, 2.8)
  ctx.strokeStyle = '#7b8392'
  ctx.lineWidth = 1.6
  ctx.stroke()
  ctx.beginPath()
  ctx.roundRect(1, -29, 8, 4, 2)
  ctx.fillStyle = '#d6dae2'
  ctx.fill()
  ctx.strokeStyle = OUT
  ctx.lineWidth = 1.4
  ctx.stroke()
  star4(ctx, 0, 3, 9, '#ffe27a')
}
export const TRASH_VARIANTS = 5
function drawTrash(ctx: Ctx, variant: number) {
  switch (variant % TRASH_VARIANTS) {
    case 0: return drawBottle(ctx)
    case 1: return drawPlasticBag(ctx)
    case 2: return drawCup(ctx)
    case 3: return drawPackaging(ctx)
    default: return drawCan(ctx)
  }
}

// ---------------------------------------------------------------------------
// BOMB – cute cartoon bomb with fuse + live spark
// ---------------------------------------------------------------------------
function drawBomb(ctx: Ctx, t: number) {
  // body
  ctx.beginPath()
  ctx.arc(0, 6, 26, 0, TAU)
  fillStroke(ctx, rad(ctx, -9, -5, 2, 0, 6, 30, [[0, '#7a7a8e'], [0.45, '#2e2e3c'], [1, '#101018']]), 3.2)
  ellipse(ctx, -10, -4, 7, 4.2, -0.6)
  ctx.fillStyle = 'rgba(255,255,255,.55)'
  ctx.fill()
  // cap
  ctx.beginPath()
  ctx.roundRect(-9, -26, 18, 10, 3)
  fillStroke(ctx, lin(ctx, 0, -26, 0, -16, [[0, '#b9bccb'], [1, '#6a6d7f']]), 2.8)
  // fuse
  const sway = Math.sin(t * 6) * 1.5
  ctx.beginPath()
  ctx.moveTo(0, -26)
  ctx.bezierCurveTo(-2, -36, 14, -34 + sway, 15, -42)
  outline(ctx, 6)
  ctx.stroke()
  ctx.strokeStyle = '#c99a5b'
  ctx.lineWidth = 3
  ctx.stroke()
  // spark
  const fx = 15, fy = -43
  glow(ctx, fx, fy, 24, 'rgba(255,170,40,.95)', 0.95)
  ctx.save()
  ctx.translate(fx, fy)
  ctx.rotate(t * 8)
  const f = 0.75 + 0.25 * Math.sin(t * 30)
  star4(ctx, 0, 0, 12 * f, '#ffd23a')
  ctx.rotate(Math.PI / 4)
  star4(ctx, 0, 0, 8 * f, '#fff6c2')
  ctx.restore()
  for (let k = 0; k < 4; k++) {
    const ph = (t * 2.2 + k / 4) % 1
    ctx.beginPath()
    ctx.arc(fx + Math.cos(k * 2.4 + t) * ph * 14, fy - ph * 14 + Math.sin(k * 1.7) * 4, 1.6 * (1 - ph) + 0.4, 0, TAU)
    ctx.fillStyle = `rgba(255,${180 + k * 20},60,${1 - ph})`
    ctx.fill()
  }
  // angry-cute face
  for (const x of [-9, 9]) {
    ellipse(ctx, x, 6, 6, 7.5)
    fillStroke(ctx, '#ffffff', 2)
    ctx.beginPath()
    ctx.arc(x + (x < 0 ? 1.4 : -1.4), 8, 3.2, 0, TAU)
    ctx.fillStyle = '#16161e'
    ctx.fill()
  }
  ctx.beginPath()
  ctx.moveTo(-16, -2)
  ctx.lineTo(-4, 1.5)
  ctx.moveTo(16, -2)
  ctx.lineTo(4, 1.5)
  outline(ctx, 3, '#ffd23a')
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-6, 22)
  ctx.quadraticCurveTo(0, 16, 6, 22)
  outline(ctx, 2.4, '#ff6a5a')
  ctx.stroke()
  for (const x of [-17, 17]) {
    ellipse(ctx, x, 15, 4, 2.4)
    ctx.fillStyle = 'rgba(255,90,110,.55)'
    ctx.fill()
  }
}

// ---------------------------------------------------------------------------
// FISH – cute, tail wiggles. Faces right (+x).
// ---------------------------------------------------------------------------
function drawShell(ctx: Ctx, t: number, seed: number) {
  const open = 0.5 + 0.5 * Math.sin(t * 3 + seed)
  // little pearl
  ctx.beginPath()
  ctx.arc(0, 2 + open * 4, 7, 0, TAU)
  fillStroke(ctx, rad(ctx, -2, 0, 1, 0, 3, 8, [[0, '#ffffff'], [1, '#dcd2f0']]), 2.2)
  // lower half
  ctx.beginPath()
  ctx.moveTo(-10, 22)
  ctx.bezierCurveTo(-34, 16, -34, -6, -28, -8 - open * 4)
  ctx.lineTo(28, -8 - open * 4)
  ctx.bezierCurveTo(34, -6, 34, 16, 10, 22)
  ctx.closePath()
  fillStroke(ctx, lin(ctx, 0, -8, 0, 22, [[0, '#ffb7c9'], [1, '#e97a9a']]), 3)
  // fan-shaped upper shell with scalloped edge
  const n = 7
  ctx.beginPath()
  ctx.moveTo(0, 22)
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * (1.08 + (i / n) * 0.84) // sweep over the top
    const a2 = Math.PI * (1.08 + ((i + 0.5) / n) * 0.84)
    const r = 38
    ctx.quadraticCurveTo(Math.cos(a2) * (r + 8) , 22 + Math.sin(a2) * (r + 8) - 6, Math.cos(a) * r, 22 + Math.sin(a) * r - 6 + (1 - open) * 0)
  }
  ctx.closePath()
  ctx.save()
  ctx.translate(0, -open * 3)
  fillStroke(ctx, lin(ctx, 0, -30, 0, 22, [[0, '#ffd9a0'], [0.5, '#ff9fb4'], [1, '#ec6e92']]), 3)
  ctx.clip()
  ctx.strokeStyle = 'rgba(160,50,80,.35)'
  ctx.lineWidth = 2
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * (1.08 + (i / n) * 0.84)
    ctx.beginPath()
    ctx.moveTo(0, 22)
    ctx.lineTo(Math.cos(a) * 50, 22 + Math.sin(a) * 50)
    ctx.stroke()
  }
  ctx.restore()
  // hinge
  ctx.beginPath()
  ctx.roundRect(-9, 18, 18, 8, 3)
  fillStroke(ctx, '#f4c27a', 2.4)
  // face on lower shell
  for (const x of [-9, 9]) {
    ctx.beginPath()
    ctx.arc(x, 8, 5, 0, TAU)
    fillStroke(ctx, '#fff', 2)
    ctx.beginPath()
    ctx.arc(x + 0.6, 9, 2.4, 0, TAU)
    ctx.fillStyle = '#1d1d28'
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(0, 12, 3.6, 0.2, Math.PI - 0.2)
  outline(ctx, 2)
  ctx.stroke()
  for (const x of [-17, 17]) {
    ellipse(ctx, x, 14, 4, 2.4)
    ctx.fillStyle = 'rgba(255,70,110,.5)'
    ctx.fill()
  }
  star4(ctx, 22, -22, 6 + 3 * Math.sin(t * 5 + seed), '#fffbe0')
}
function drawFish(ctx: Ctx, t: number, seed: number) {
  const wig = Math.sin(t * 10 + seed) * 0.4
  // tail
  ctx.save()
  ctx.translate(-22, 0)
  ctx.rotate(wig)
  ctx.beginPath()
  ctx.moveTo(2, 0)
  ctx.quadraticCurveTo(-8, -6, -22, -18)
  ctx.quadraticCurveTo(-14, 0, -22, 18)
  ctx.quadraticCurveTo(-8, 6, 2, 0)
  ctx.closePath()
  fillStroke(ctx, lin(ctx, 2, 0, -22, 0, [[0, '#ff8a3d'], [1, '#ffd05a']]), 2.8)
  ctx.restore()
  // dorsal + belly fin
  ctx.beginPath()
  ctx.moveTo(-8, -17)
  ctx.quadraticCurveTo(0, -34 + Math.sin(t * 8 + seed) * 2, 14, -16)
  ctx.closePath()
  fillStroke(ctx, '#ff8a3d', 2.6)
  ctx.beginPath()
  ctx.moveTo(-2, 17)
  ctx.quadraticCurveTo(6, 28, 12, 16)
  ctx.closePath()
  fillStroke(ctx, '#ff9a4a', 2.4)
  // body
  ellipse(ctx, 0, 0, 32, 21)
  fillStroke(ctx, lin(ctx, 0, -21, 0, 21, [[0, '#ff7a30'], [0.6, '#ffb14a'], [1, '#ffe08a']]), 3)
  ctx.save()
  ellipse(ctx, 0, 0, 32, 21)
  ctx.clip()
  ctx.strokeStyle = 'rgba(190,70,20,.28)'
  ctx.lineWidth = 1.6
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      ctx.beginPath()
      ctx.arc(-14 + c * 10 + (r % 2) * 5, -6 + r * 9, 5, 0.3, Math.PI - 0.3)
      ctx.stroke()
    }
  }
  ctx.restore()
  ctx.beginPath()
  ctx.arc(7, 0, 14, -0.9, 0.9)
  outline(ctx, 2, 'rgba(160,60,20,.6)')
  ctx.stroke()
  ellipse(ctx, -6, -11, 12, 3.6, -0.15)
  ctx.fillStyle = 'rgba(255,255,255,.4)'
  ctx.fill()
  // eye
  ctx.beginPath()
  ctx.arc(18, -5, 8, 0, TAU)
  fillStroke(ctx, '#fff', 2.4)
  ctx.beginPath()
  ctx.arc(20, -4.5, 4.2, 0, TAU)
  ctx.fillStyle = '#1d1d28'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(21.4, -6.2, 1.5, 0, TAU)
  ctx.fillStyle = '#fff'
  ctx.fill()
  // smile + blush
  ctx.beginPath()
  ctx.arc(26, 5, 4.6, 0.2, 1.9)
  outline(ctx, 2.2)
  ctx.stroke()
  ellipse(ctx, 15, 7, 4.4, 2.6)
  ctx.fillStyle = 'rgba(255,90,120,.5)'
  ctx.fill()
  // bubbles
  for (let k = 0; k < 2; k++) {
    const ph = (t * 0.9 + k * 0.5 + seed) % 1
    ctx.beginPath()
    ctx.arc(34 + k * 5, -10 - ph * 18, 2.5 + k, 0, TAU)
    ctx.strokeStyle = `rgba(200,240,255,${1 - ph})`
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
}

// ---------------------------------------------------------------------------
// Public: draw any falling item at origin
// ---------------------------------------------------------------------------
export const ITEM_RADIUS: Record<ItemKind, number> = {
  krathong: 40,
  coin: 28,
  trash: 30,
  bomb: 30,
  fish: 32,
}
export function drawItem(ctx: Ctx, kind: ItemKind, variant: number, t: number, seed: number) {
  switch (kind) {
    case 'krathong': return drawKrathong(ctx, t)
    case 'coin': return drawCoin(ctx, t, seed)
    case 'trash': return drawTrash(ctx, variant)
    case 'bomb': return drawBomb(ctx, t)
    case 'fish': return variant % 2 === 0 ? drawFish(ctx, t, seed) : drawShell(ctx, t, seed)
  }
}

// ---------------------------------------------------------------------------
// PLAYER – open garbage bag held by two cartoon hands. Origin = centre of the
// bag's open rim. `squash` is the bounce reaction (0 = rest).
// ---------------------------------------------------------------------------
export const BAG_HALF = 74
export function drawHand(ctx: Ctx, side: -1 | 1, lift: number) {
  const hx = side * (BAG_HALF + 2)
  const skin = '#ffcf9f', skinDark = '#e9a672'
  ctx.save()
  ctx.translate(0, lift)
  // arm + festive sleeve (extends off-screen at bottom)
  ctx.beginPath()
  ctx.moveTo(hx + side * 22, 230)
  ctx.lineTo(hx + side * 4, 34)
  outline(ctx, 32)
  ctx.stroke()
  ctx.strokeStyle = skin
  ctx.lineWidth = 25
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(hx + side * 26, 230)
  ctx.lineTo(hx + side * 14, 108)
  outline(ctx, 38)
  ctx.stroke()
  ctx.strokeStyle = '#e63b6a'
  ctx.lineWidth = 31
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(hx + side * 16, 112)
  ctx.lineTo(hx + side * 12, 100)
  outline(ctx, 40)
  ctx.stroke()
  ctx.strokeStyle = '#ffd35a'
  ctx.lineWidth = 33
  ctx.stroke()
  // palm
  ellipse(ctx, hx, 10, 19, 23, side * 0.1)
  fillStroke(ctx, rad(ctx, hx - side * 5, 2, 2, hx, 10, 26, [[0, '#ffe2bf'], [1, skin]]), 3)
  // thumb (outer side)
  ctx.save()
  ctx.translate(hx + side * 17, 12)
  ctx.rotate(side * 0.55)
  ctx.beginPath()
  ctx.roundRect(-5.5, -14, 11, 28, 5.5)
  fillStroke(ctx, skin, 2.8)
  ctx.restore()
  // fingers curled over the rim
  for (let k = 0; k < 4; k++) {
    const fx = hx - side * (k - 1.4) * 8.4 - side * 2
    ctx.beginPath()
    ctx.roundRect(fx - 4.4, -12 + Math.abs(k - 1.5) * 1.8, 8.8, 25 - Math.abs(k - 1.5) * 2, 4.4)
    fillStroke(ctx, lin(ctx, fx - 4, 0, fx + 4, 0, [[0, '#ffe2bf'], [1, skinDark]]), 2.6)
    ctx.beginPath()
    ctx.moveTo(fx - 3, 5)
    ctx.lineTo(fx + 3, 5)
    ctx.strokeStyle = 'rgba(150,80,40,.35)'
    ctx.lineWidth = 1.2
    ctx.stroke()
  }
  ctx.restore()
}
export function drawBagBody(ctx: Ctx, t: number, squash: number) {
  const sy = 1 - squash * 0.24
  const sx = 1 + squash * 0.14
  ctx.save()
  ctx.scale(sx, sy)
  // inside of the bag (dark opening)
  ellipse(ctx, 0, 0, BAG_HALF, 17)
  fillStroke(ctx, rad(ctx, 0, 4, 2, 0, 0, 80, [[0, '#04100a'], [1, '#0c3a28']]), 3.4)
  // body
  ctx.beginPath()
  ctx.moveTo(-BAG_HALF, 0)
  ctx.bezierCurveTo(-106, 36, -100, 100, -64, 114)
  ctx.quadraticCurveTo(0, 126, 64, 114)
  ctx.bezierCurveTo(100, 100, 106, 36, BAG_HALF, 0)
  ctx.ellipse(0, 0, BAG_HALF, 17, 0, 0, Math.PI)
  ctx.closePath()
  fillStroke(ctx, lin(ctx, -100, 10, 100, 110, [[0, '#2fb97a'], [0.5, '#17875a'], [1, '#0b4a35']]), 3.4)
  // highlights & folds
  ctx.save()
  ctx.clip()
  ctx.strokeStyle = 'rgba(255,255,255,.28)'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(-70, 34)
  ctx.quadraticCurveTo(-82, 70, -52, 100)
  ctx.stroke()
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(0,0,0,.2)'
  for (const x of [-30, 8, 42]) {
    ctx.beginPath()
    ctx.moveTo(x, 24)
    ctx.quadraticCurveTo(x + 8, 64, x - 4, 110)
    ctx.stroke()
  }
  ctx.restore()
  // recycle-ish emblem: smiling heart for cuteness
  ctx.save()
  ctx.translate(0, 66)
  ctx.beginPath()
  ctx.moveTo(0, 16)
  ctx.bezierCurveTo(-26, -2, -14, -18, 0, -6)
  ctx.bezierCurveTo(14, -18, 26, -2, 0, 16)
  ctx.fillStyle = 'rgba(255,255,255,.88)'
  ctx.fill()
  outline(ctx, 2.2, 'rgba(10,60,40,.75)')
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(-4.5, 0, 1.6, 0, TAU)
  ctx.arc(4.5, 0, 1.6, 0, TAU)
  ctx.fillStyle = '#0b4a35'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(0, 3, 3.2, 0.2, Math.PI - 0.2)
  outline(ctx, 1.6, '#0b4a35')
  ctx.stroke()
  ctx.restore()
  // rim lip
  ctx.beginPath()
  ctx.ellipse(0, 0, BAG_HALF, 17, 0, 0, TAU)
  outline(ctx, 7, '#0b4a35')
  ctx.stroke()
  ctx.strokeStyle = '#52e0a0'
  ctx.lineWidth = 3.2
  ctx.stroke()
  void t
  ctx.restore()
}
