// Night-time Loy Krathong river scene. Everything is animated from a single
// time value `t`: swaying bunting + lanterns, rising sky lanterns, twinkling
// stars, and a cartoon river with layered, gently sliding waves, candle-light
// reflections and drifting krathongs.
import { H, W } from './types'
import { drawKrathong, star4 } from './sprites'

type Ctx = CanvasRenderingContext2D
const TAU = Math.PI * 2
export const HORIZON = 318

// deterministic pseudo-random so the scene is stable between sessions
function mulberry(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry(20241115)

const stars = Array.from({ length: 80 }, () => ({
  x: rnd() * W, y: rnd() * 250, r: 0.5 + rnd() * 1.3, ph: rnd() * TAU,
}))
const sparkles = Array.from({ length: 46 }, () => ({
  x: rnd() * W, y: HORIZON + 10 + rnd() * (H - HORIZON - 10), ph: rnd() * TAU, s: 3 + rnd() * 5,
}))
const skyLanterns = Array.from({ length: 9 }, () => ({
  x: 40 + rnd() * (W - 80), off: rnd() * 320, speed: 9 + rnd() * 10, size: 7 + rnd() * 6, ph: rnd() * TAU,
}))
const riverKrathongs = [
  { x: 60, y: 372, s: 0.26, v: 5, ph: 0.4 },
  { x: 380, y: 405, s: 0.31, v: 7, ph: 1.9 },
  { x: 700, y: 366, s: 0.24, v: 4, ph: 3.1 },
  { x: 220, y: 470, s: 0.4, v: 9, ph: 2.2 },
  { x: 560, y: 520, s: 0.5, v: 11, ph: 4.3 },
  { x: 830, y: 450, s: 0.36, v: 8, ph: 5.1 },
]

const FLAG_COLORS = ['#ff4d6d', '#ffb703', '#3ddc97', '#4cc9f0', '#b388ff', '#ff8fab']
const LANTERNS = [
  { x: 90, len: 38, c: '#ff4d4d', c2: '#ff9a3c' },
  { x: 250, len: 50, c: '#ffb703', c2: '#ff7b1c' },
  { x: 410, len: 34, c: '#ff5c8a', c2: '#ff9a3c' },
  { x: 570, len: 52, c: '#ff4d4d', c2: '#ffcf4a' },
  { x: 730, len: 40, c: '#ffb703', c2: '#ff7b1c' },
  { x: 850, len: 56, c: '#ff5c8a', c2: '#ff9a3c' },
]
// catenary-ish string height
const stringY = (x: number, base: number, sag: number) => base + sag * (1 - Math.pow((2 * x) / W - 1, 2))

function glowAt(ctx: Ctx, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, color)
  g.addColorStop(1, 'rgba(255,170,60,0)')
  ctx.fillStyle = g
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
}

function drawSky(ctx: Ctx, t: number) {
  const g = ctx.createLinearGradient(0, 0, 0, HORIZON)
  g.addColorStop(0, '#060a2c')
  g.addColorStop(0.5, '#1b1858')
  g.addColorStop(0.82, '#5f3688')
  g.addColorStop(1, '#d9737f')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, HORIZON + 2)
  for (const s of stars) {
    ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.6 + s.ph))
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, TAU)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  // full moon
  glowAt(ctx, 745, 100, 170, 'rgba(255,236,170,.5)')
  const mg = ctx.createRadialGradient(738, 92, 4, 745, 100, 48)
  mg.addColorStop(0, '#fffdea')
  mg.addColorStop(1, '#ffe49a')
  ctx.fillStyle = mg
  ctx.beginPath()
  ctx.arc(745, 100, 46, 0, TAU)
  ctx.fill()
  ctx.fillStyle = 'rgba(210,170,90,.2)'
  for (const [x, y, r] of [[730, 92, 9], [758, 116, 7], [762, 84, 5], [728, 118, 5]]) {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, TAU)
    ctx.fill()
  }
}

function drawSkyLanterns(ctx: Ctx, t: number) {
  for (const l of skyLanterns) {
    const prog = ((t * l.speed + l.off) % 330) / 330 // 0 near horizon -> 1 top
    const y = HORIZON - 10 - prog * 300
    const x = l.x + Math.sin(t * 0.5 + l.ph) * 14 + prog * 18
    const a = Math.min(1, prog * 5) * (1 - prog * 0.75)
    ctx.globalAlpha = a
    glowAt(ctx, x, y, l.size * 4, 'rgba(255,190,80,.7)')
    ctx.beginPath()
    ctx.moveTo(x - l.size * 0.7, y - l.size)
    ctx.lineTo(x + l.size * 0.7, y - l.size)
    ctx.lineTo(x + l.size * 0.5, y + l.size)
    ctx.lineTo(x - l.size * 0.5, y + l.size)
    ctx.closePath()
    const g = ctx.createLinearGradient(0, y - l.size, 0, y + l.size)
    g.addColorStop(0, '#ffd27a')
    g.addColorStop(1, '#ff8a2b')
    ctx.fillStyle = g
    ctx.fill()
    ctx.globalAlpha = 1
  }
}

function wat(ctx: Ctx, x: number, s: number, t: number) {
  ctx.save()
  ctx.translate(x, HORIZON + 2)
  ctx.scale(s, s)
  ctx.fillStyle = '#150f34'
  // hall
  ctx.fillRect(-60, -30, 120, 30)
  ctx.beginPath()
  ctx.moveTo(-82, -28); ctx.quadraticCurveTo(-60, -34, -42, -58); ctx.lineTo(42, -58)
  ctx.quadraticCurveTo(60, -34, 82, -28); ctx.closePath(); ctx.fill()
  ctx.beginPath()
  ctx.moveTo(-54, -56); ctx.quadraticCurveTo(-38, -62, -24, -82); ctx.lineTo(24, -82)
  ctx.quadraticCurveTo(38, -62, 54, -56); ctx.closePath(); ctx.fill()
  ctx.beginPath() // gable spire
  ctx.moveTo(-4, -82); ctx.lineTo(0, -98); ctx.lineTo(4, -82); ctx.fill()
  // chedi
  ctx.beginPath()
  ctx.moveTo(86, 0); ctx.quadraticCurveTo(86, -40, 112, -50); ctx.quadraticCurveTo(138, -40, 138, 0); ctx.closePath(); ctx.fill()
  ctx.beginPath()
  ctx.moveTo(100, -48); ctx.lineTo(124, -48); ctx.lineTo(116, -110); ctx.lineTo(112, -128); ctx.lineTo(108, -110); ctx.closePath(); ctx.fill()
  // warm windows
  ctx.fillStyle = `rgba(255,200,90,${0.75 + 0.2 * Math.sin(t * 3 + x)})`
  for (let i = -3; i <= 3; i++) ctx.fillRect(i * 15 - 3, -20, 6, 11)
  ctx.restore()
}

function drawShore(ctx: Ctx, t: number) {
  ctx.fillStyle = '#120c2e'
  ctx.beginPath()
  ctx.moveTo(0, HORIZON + 4)
  for (let x = 0; x <= W; x += 30) {
    const bump = 10 + 8 * Math.abs(Math.sin(x * 0.045)) + 6 * Math.sin(x * 0.13)
    ctx.quadraticCurveTo(x - 15, HORIZON - bump - 4, x, HORIZON - bump * 0.4)
  }
  ctx.lineTo(W, HORIZON + 4)
  ctx.closePath()
  ctx.fill()
  wat(ctx, 190, 1, t)
  wat(ctx, 620, 0.62, t + 2)
  // tiny shore lamps
  for (let i = 0; i < 16; i++) {
    const x = 20 + i * 57 + (i % 3) * 7
    ctx.fillStyle = `rgba(255,190,90,${0.55 + 0.4 * Math.sin(t * 2.4 + i)})`
    ctx.beginPath()
    ctx.arc(x, HORIZON - 3, 2, 0, TAU)
    ctx.fill()
  }
}

function drawRiver(ctx: Ctx, t: number) {
  // base
  const g = ctx.createLinearGradient(0, HORIZON, 0, H)
  g.addColorStop(0, '#26407f')
  g.addColorStop(0.18, '#18306b')
  g.addColorStop(1, '#070d34')
  ctx.fillStyle = g
  ctx.fillRect(0, HORIZON, W, H - HORIZON)
  // moon glow on the water
  const mg = ctx.createRadialGradient(745, HORIZON + 4, 0, 745, HORIZON + 4, 230)
  mg.addColorStop(0, 'rgba(255,238,180,.35)')
  mg.addColorStop(1, 'rgba(255,238,180,0)')
  ctx.fillStyle = mg
  ctx.fillRect(0, HORIZON, W, H - HORIZON)

  const layers = 7
  const path = (i: number) => {
    const baseY = HORIZON + 8 + i * 42
    const amp = 3 + i * 1.5
    const wl = 90 + i * 30
    const sp = (i % 2 ? 1 : -1) * (0.7 + i * 0.09)
    const sway = Math.sin(t * 0.42 + i * 1.3) * (14 + i * 3) // gentle left-right drift
    ctx.beginPath()
    for (let x = -10; x <= W + 10; x += 8) {
      const y =
        baseY +
        Math.sin(((x + sway) / wl) * TAU + t * sp) * amp +
        Math.sin(((x * 1.7 + sway) / wl) * TAU - t * sp * 0.7 + i) * amp * 0.42
      if (x === -10) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
  }
  for (let i = 0; i < layers; i++) {
    path(i)
    ctx.lineTo(W + 10, H)
    ctx.lineTo(-10, H)
    ctx.closePath()
    ctx.fillStyle = `rgba(${44 + i * 8},${96 + i * 11},${168 + i * 5},${0.28 + i * 0.012})`
    ctx.fill()
    path(i)
    ctx.strokeStyle = `rgba(200,236,255,${0.28 + 0.12 * Math.sin(t * 1.5 + i)})`
    ctx.lineWidth = 1.5 + i * 0.25
    ctx.stroke()
    if (i === 2) drawRiverKrathongs(ctx, t, 0, 400)
    if (i === 4) drawRiverKrathongs(ctx, t, 400, H)
  }

  // warm light reflections (additive)
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  const lights = LANTERNS.map((l) => ({ x: l.x + Math.sin(t * 0.9 + l.x) * 4, c: '255,170,70', w: 15, a: 0.5 }))
  lights.push({ x: 745, c: '255,240,190', w: 28, a: 0.42 })
  for (const L of lights) {
    for (let j = 0; j < 18; j++) {
      const y = HORIZON + 6 + j * 16.5
      const w = (L.w - j * 0.55) * (0.55 + 0.45 * Math.sin(t * 3 + j * 1.7 + L.x))
      const xo = Math.sin(t * 1.5 + j * 0.8 + L.x * 0.05) * (3 + j * 0.9)
      ctx.fillStyle = `rgba(${L.c},${L.a * (1 - j / 19)})`
      ctx.fillRect(L.x + xo - w / 2, y, Math.max(2, w), 3)
    }
  }
  // twinkling glints
  for (const s of sparkles) {
    const a = Math.pow(Math.max(0, Math.sin(t * 2 + s.ph)), 6)
    if (a < 0.05) continue
    ctx.globalAlpha = a
    star4(ctx, s.x + Math.sin(t * 0.6 + s.ph) * 5, s.y, s.s, '#fff4c8')
  }
  ctx.restore()
}

function drawRiverKrathongs(ctx: Ctx, t: number, yMin: number, yMax: number) {
  for (const k of riverKrathongs) {
    if (k.y < yMin || k.y >= yMax) continue
    const x = ((k.x + t * k.v) % (W + 140)) - 70
    const y = k.y + Math.sin(t * 1.3 + k.ph) * 3.5
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(Math.sin(t * 1.1 + k.ph) * 0.05)
    ctx.scale(k.s * 1.25, k.s * 1.25)
    ctx.globalAlpha = 0.92
    drawKrathong(ctx, t + k.ph)
    ctx.restore()
    // ripple ring
    ctx.strokeStyle = 'rgba(210,240,255,.25)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.ellipse(x, y + 8 * k.s * 4, 55 * k.s * 1.4, 9 * k.s * 1.5, 0, 0, TAU)
    ctx.stroke()
  }
}

function lantern(ctx: Ctx, x: number, y: number, c: string, c2: string, swing: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(swing)
  glowAt(ctx, 0, 26, 62, 'rgba(255,170,60,.55)')
  ctx.strokeStyle = '#4a2410'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, 0); ctx.lineTo(0, 8)
  ctx.stroke()
  // caps
  ctx.fillStyle = '#d99a2a'
  ctx.beginPath(); ctx.roundRect(-9, 6, 18, 6, 2); ctx.fill()
  ctx.beginPath(); ctx.roundRect(-9, 46, 18, 6, 2); ctx.fill()
  // paper body
  const g = ctx.createRadialGradient(-5, 24, 2, 0, 28, 30)
  g.addColorStop(0, '#fff2b8')
  g.addColorStop(0.4, c2)
  g.addColorStop(1, c)
  ctx.fillStyle = g
  ctx.strokeStyle = '#5a1e0a'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.ellipse(0, 28, 20, 21, 0, 0, TAU)
  ctx.fill(); ctx.stroke()
  ctx.strokeStyle = 'rgba(120,30,10,.45)'
  ctx.lineWidth = 1.4
  for (const rx of [7, 14]) {
    ctx.beginPath(); ctx.ellipse(0, 28, rx, 21, 0, 0, TAU); ctx.stroke()
  }
  ctx.beginPath(); ctx.moveTo(-19, 28); ctx.lineTo(19, 28); ctx.stroke()
  // tassel
  ctx.strokeStyle = '#ffd35a'
  ctx.lineWidth = 2
  for (const dx of [-3, 0, 3]) {
    ctx.beginPath(); ctx.moveTo(dx, 52); ctx.lineTo(dx * 1.8, 66 + Math.abs(dx)); ctx.stroke()
  }
  ctx.restore()
}

function drawBunting(ctx: Ctx, t: number) {
  // string A with triangular flags
  const drawString = (base: number, sag: number, flagSize: number, ph: number) => {
    ctx.strokeStyle = '#2a1230'
    ctx.lineWidth = 2.2
    ctx.beginPath()
    for (let x = -10; x <= W + 10; x += 10) {
      const y = stringY(x, base, sag)
      if (x === -10) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    let i = 0
    for (let x = 14; x < W; x += 34) {
      const y = stringY(x, base, sag)
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(Math.sin(t * 1.7 + i * 0.7 + ph) * 0.11)
      ctx.beginPath()
      ctx.moveTo(-flagSize * 0.5, 0)
      ctx.lineTo(flagSize * 0.5, 0)
      ctx.lineTo(0, flagSize * 1.25)
      ctx.closePath()
      ctx.fillStyle = FLAG_COLORS[i % FLAG_COLORS.length]
      ctx.fill()
      ctx.strokeStyle = 'rgba(40,10,40,.7)'
      ctx.lineWidth = 1.6
      ctx.stroke()
      ctx.restore()
      i++
    }
  }
  drawString(10, 34, 18, 0)
  drawString(44, 26, 14, 2)
  for (let i = 0; i < LANTERNS.length; i++) {
    const l = LANTERNS[i]
    const y = stringY(l.x, 44, 26) + 2
    lantern(ctx, l.x, y, l.c, l.c2, Math.sin(t * 1.3 + i * 1.1) * 0.07)
  }
}

export function drawBackground(ctx: Ctx, t: number) {
  drawSky(ctx, t)
  drawSkyLanterns(ctx, t)
  drawShore(ctx, t)
  drawRiver(ctx, t)
  drawBunting(ctx, t)
  // soft vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95)
  v.addColorStop(0, 'rgba(0,0,20,0)')
  v.addColorStop(1, 'rgba(0,0,20,.35)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, W, H)
}
