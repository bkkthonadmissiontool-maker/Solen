// Pure gameplay + rendering engine (no React). The UI talks to it through
// GameCallbacks and a handful of public methods.
import { drawBackground } from './background'
import { BAG_HALF, ITEM_RADIUS, TRASH_VARIANTS, drawBagBody, drawHand, drawItem, star4 } from './sprites'
import {
  COUNTDOWN_SECONDS, H, MAX_LIVES, POINTS, ROUND_SECONDS, W,
  type GameCallbacks, type ItemKind,
} from './types'
import { Sfx } from './audio'

type Phase = 'idle' | 'countdown' | 'playing' | 'ended'

interface Item {
  kind: ItemKind
  variant: number
  x: number
  y: number
  baseX: number
  vy: number
  swayAmp: number
  swayFreq: number
  swayPh: number
  drift: number
  rot: number
  vr: number
  scale: number
  flip: number
  seed: number
  age: number
  caughtAt: number // <0 = still falling
  fromX: number
  fromY: number
}
interface Floater { x: number; y: number; text: string; color: string; age: number }
interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; max: number
  color: string; size: number; kind: 'spark' | 'star' | 'smoke' | 'confetti'; rot: number; vr: number
}

const BAG_Y = H - 140 // y of the bag's open rim
const CATCH_HALF = BAG_HALF - 6
const WEIGHTS: [ItemKind, number][] = [
  ['krathong', 0.2],
  ['coin', 0.18],
  ['trash', 0.27],
  ['bomb', 0.17],
  ['fish', 0.18],
]
function drawHeart(ctx: CanvasRenderingContext2D, alive: boolean) {
  ctx.beginPath()
  ctx.moveTo(0, 15)
  ctx.bezierCurveTo(-28, -2, -16, -22, 0, -8)
  ctx.bezierCurveTo(16, -22, 28, -2, 0, 15)
  ctx.closePath()
  if (alive) {
    const g = ctx.createRadialGradient(-6, -8, 2, 0, 0, 24)
    g.addColorStop(0, '#ff9aa8')
    g.addColorStop(1, '#e0183f')
    ctx.fillStyle = g
  } else ctx.fillStyle = 'rgba(30,15,50,.55)'
  ctx.fill()
  ctx.lineWidth = 3.5
  ctx.lineJoin = 'round'
  ctx.strokeStyle = alive ? '#5a0f24' : 'rgba(255,255,255,.35)'
  ctx.stroke()
  if (alive) {
    ctx.beginPath()
    ctx.ellipse(-8, -8, 4.5, 2.6, -0.7, 0, 6.3)
    ctx.fillStyle = 'rgba(255,255,255,.75)'
    ctx.fill()
  }
}
function mulberry32(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const FONT = '"Kanit", "Mali", "Noto Sans Thai", sans-serif'

export class Game {
  private ctx: CanvasRenderingContext2D
  private raf = 0
  private last = 0
  private t = 0
  private phase: Phase = 'idle'
  private elapsed = 0
  private countdown = COUNTDOWN_SECONDS
  private lastSec = -1
  private lastCd = -1
  private score = 0
  private combo = 0
  private lives = MAX_LIVES
  private lostIdx = -1
  private lostT = 0
  private bannerBad = false
  private speedMul = 1
  private bannerText = ''
  private bannerT = 0
  private items: Item[] = []
  private floaters: Floater[] = []
  private particles: Particle[] = []
  private nextSpawn = 0.6
  private recent: ItemKind[] = []
  private rng: () => number = Math.random
  private bagX = W / 2
  private targetX = W / 2
  private bagVel = 0
  private bounce = 0
  private bounceV = 0
  private shake = 0
  private flash = 0
  private flashColor = '255,40,60'
  private keys = { left: false, right: false }
  private pxScale = 1
  private ro: ResizeObserver
  readonly sfx = new Sfx()

  constructor(private canvas: HTMLCanvasElement, private cb: GameCallbacks) {
    this.ctx = canvas.getContext('2d')!
    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(canvas)
    this.resize()
    canvas.addEventListener('pointermove', this.onPointer)
    canvas.addEventListener('pointerdown', this.onPointer)
    window.addEventListener('keydown', this.onKey)
    window.addEventListener('keyup', this.onKey)
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.loop)
  }

  // ---------------------------------------------------------------- public
  /** seed: when given (multiplayer) every player gets the identical item stream */
  startRound(seed?: number) {
    this.rng = seed === undefined ? Math.random : mulberry32(seed)
    this.items = []
    this.floaters = []
    this.particles = []
    this.score = 0
    this.combo = 0
    this.lives = MAX_LIVES
    this.lostT = 0
    this.speedMul = 1
    this.bannerT = 0
    this.elapsed = 0
    this.countdown = COUNTDOWN_SECONDS
    this.lastSec = -1
    this.lastCd = -1
    this.nextSpawn = 0.5
    this.recent = []
    this.bounce = this.bounceV = 0
    this.phase = 'countdown'
    this.sfx.init()
    this.sfx.startMusic()
    this.cb.onScore(0)
    this.cb.onTime(ROUND_SECONDS)
  }
  backToIdle() {
    this.phase = 'idle'
    this.items = []
    this.floaters = []
    this.particles = []
  }
  celebrate() {
    const colors = ['#ff4d6d', '#ffd35a', '#3ddc97', '#4cc9f0', '#b388ff', '#ff9b2f']
    for (let i = 0; i < 160; i++) {
      this.particles.push({
        x: Math.random() * W, y: -20 - Math.random() * 300,
        vx: (Math.random() - 0.5) * 90, vy: 120 + Math.random() * 180,
        life: 0, max: 5 + Math.random() * 2, color: colors[i % colors.length],
        size: 5 + Math.random() * 6, kind: 'confetti', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12,
      })
    }
    this.sfx.fanfare()
  }
  setMuted(m: boolean) { this.sfx.muted = m }
  destroy() {
    this.sfx.stopMusic(0)
    cancelAnimationFrame(this.raf)
    this.ro.disconnect()
    this.canvas.removeEventListener('pointermove', this.onPointer)
    this.canvas.removeEventListener('pointerdown', this.onPointer)
    window.removeEventListener('keydown', this.onKey)
    window.removeEventListener('keyup', this.onKey)
  }

  // --------------------------------------------------------------- input
  private onPointer = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect()
    this.targetX = ((e.clientX - r.left) / r.width) * W
  }
  private onKey = (e: KeyboardEvent) => {
    const down = e.type === 'keydown'
    if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = down
    if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = down
  }
  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(320, Math.round(this.canvas.clientWidth * dpr))
    this.canvas.width = w
    this.canvas.height = Math.round((w * H) / W)
    this.pxScale = w / W
  }

  // ----------------------------------------------------------- game logic
  private progress() { return Math.min(1, this.elapsed / ROUND_SECONDS) }

  private pickKind(): ItemKind {
    // keep it fair: after 3 penalty items in a row, force a good one
    const bad = (k: ItemKind) => POINTS[k] < 0
    let pool = WEIGHTS
    if (this.recent.length >= 3 && this.recent.slice(-3).every(bad)) pool = WEIGHTS.filter(([k]) => !bad(k))
    const total = pool.reduce((s, [, w]) => s + w, 0)
    let r = this.rng() * total
    for (const [k, w] of pool) { if ((r -= w) <= 0) return k }
    return 'trash'
  }

  private spawn() {
    const kind = this.pickKind()
    this.recent.push(kind)
    if (this.recent.length > 6) this.recent.shift()
    const p = this.progress()
    const margin = 50
    const x = margin + this.rng() * (W - margin * 2)
    this.items.push({
      kind,
      variant: Math.floor(this.rng() * TRASH_VARIANTS * 2), // trash uses %5, fish/shell uses %2
      x, baseX: x, y: -60,
      vy: (150 + this.rng() * 80) * (1 + p * 0.55),
      swayAmp: this.rng() < 0.55 ? 12 + this.rng() * 26 : 0,
      swayFreq: 1 + this.rng() * 1.6,
      swayPh: this.rng() * 6.28,
      drift: (this.rng() - 0.5) * 70,
      rot: (this.rng() - 0.5) * 0.4,
      vr: (this.rng() - 0.5) * (kind === 'krathong' ? 0.5 : 1.8),
      scale: kind === 'krathong' ? 0.88 : 1,
      flip: this.rng() < 0.5 ? -1 : 1,
      seed: this.rng() * 6.28,
      age: 0, caughtAt: -1, fromX: 0, fromY: 0,
    })
  }

  private catchItem(it: Item) {
    it.caughtAt = 0
    it.fromX = it.x
    it.fromY = it.y
    const pts = POINTS[it.kind]
    this.score = Math.max(0, this.score + pts)
    this.cb.onScore(this.score)
    this.bounce = 0
    this.bounceV = it.kind === 'bomb' ? 11 : 8
    const good = pts > 0
    if (good) {
      this.combo++
      if (this.combo % 5 === 0) {
        this.bannerText =
          this.combo === 5 ? 'คอมโบ 5! ของตกเร็วขึ้น!'
          : this.combo === 10 ? 'คอมโบ 10! เร็วขึ้นอีก!'
          : this.combo === 20 ? 'คอมโบ 20! เร็วสุดๆ!'
          : `คอมโบ ${this.combo}!`
        this.bannerBad = false
        this.bannerT = 1.3
      }
    } else {
      if (this.combo >= 3) { this.bannerText = 'คอมโบขาด!'; this.bannerBad = true; this.bannerT = 1 }
      this.combo = 0
    }
    const text = (pts > 0 ? '+' : '') + pts
    this.floaters.push({
      x: it.x, y: BAG_Y - 28, text,
      color: !good ? '#ff4040' : pts >= 2 ? '#ffe14a' : '#6dff8f', age: 0,
    })
    if (good) {
      this.sfx.good(pts)
      for (let i = 0; i < (pts >= 2 ? 22 : 12); i++) this.burst(it.x, BAG_Y - 10, pts >= 2 ? '#ffe14a' : '#9dffb2', 'star')
    } else {
      this.sfx.bad(it.kind === 'bomb')
      if (it.kind === 'bomb') {
        this.lives--
        this.lostIdx = this.lives
        this.lostT = 1
        this.bannerText = this.lives > 0 ? `เสียหัวใจ! เหลือ ${this.lives} ดวง` : 'หัวใจหมดแล้ว!'
        this.bannerBad = true
        this.bannerT = 1.3
        if (this.lives <= 0) {
          this.phase = 'ended'
          this.sfx.gameOver()
          this.sfx.stopMusic(0.6)
          setTimeout(() => this.cb.onEnd(this.score, 'lives'), 900)
        }
      }
      this.flash = it.kind === 'bomb' ? 0.55 : 0.28
      this.shake = it.kind === 'bomb' ? 14 : 6
      const n = it.kind === 'bomb' ? 34 : 14
      for (let i = 0; i < n; i++) this.burst(it.x, BAG_Y - 6, i % 2 ? '#ff4a3a' : '#ffa53a', 'spark', it.kind === 'bomb' ? 1.8 : 1)
      if (it.kind === 'bomb') for (let i = 0; i < 10; i++) this.burst(it.x, BAG_Y - 10, '#555', 'smoke')
    }
  }

  private burst(x: number, y: number, color: string, kind: Particle['kind'], power = 1) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6
    const sp = (80 + Math.random() * 220) * power
    this.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: 0, max: 0.5 + Math.random() * 0.5, color, size: 3 + Math.random() * 6, kind, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10,
    })
  }

  private update(dt: number) {
    this.t += dt

    // bag follows pointer (or keyboard)
    if (this.keys.left) this.targetX -= 620 * dt
    if (this.keys.right) this.targetX += 620 * dt
    this.targetX = Math.max(BAG_HALF, Math.min(W - BAG_HALF, this.targetX))
    const prev = this.bagX
    this.bagX += (this.targetX - this.bagX) * Math.min(1, dt * 16)
    this.bagVel += ((this.bagX - prev) / Math.max(dt, 0.001) - this.bagVel) * Math.min(1, dt * 10)

    // bounce spring
    this.bounceV += (-320 * this.bounce - 15 * this.bounceV) * dt
    this.bounce += this.bounceV * dt
    this.shake = Math.max(0, this.shake - dt * 30)
    this.flash = Math.max(0, this.flash - dt * 1.6)

    if (this.phase === 'countdown') {
      this.countdown -= dt
      const c = Math.ceil(this.countdown)
      if (c !== this.lastCd && c > 0) {
        this.lastCd = c
        this.cb.onCountdown(c)
        this.sfx.tick(false)
      }
      if (this.countdown <= 0) {
        this.phase = 'playing'
        this.cb.onCountdown(0)
        this.sfx.tick(true)
        this.countdown = -0.001
        this.goBanner = 1.2
      }
    }
    if (this.goBanner > 0) this.goBanner -= dt

    if (this.phase === 'playing') {
      this.elapsed += dt
      const left = Math.max(0, ROUND_SECONDS - this.elapsed)
      const sec = Math.ceil(left)
      if (sec !== this.lastSec) {
        this.lastSec = sec
        this.cb.onTime(sec)
        if (sec <= 5 && sec > 0) this.sfx.tick(false)
      }
      // spawning: keeps accelerating, fastest near the end
      this.nextSpawn -= dt
      if (this.nextSpawn <= 0) {
        const p = this.progress()
        const interval = 0.95 - 0.55 * Math.pow(p, 1.15)
        this.nextSpawn = interval * (0.55 + this.rng() * 0.9)
        this.spawn()
        if (this.rng() < 0.12 + p * 0.12) this.spawn() // occasional pair
      }
      if (left <= 0) {
        this.phase = 'ended'
        this.sfx.end()
        this.sfx.stopMusic()
        this.cb.onEnd(this.score, 'time')
      }
    }

    // items
    for (const it of this.items) {
      it.age += dt
      if (it.caughtAt >= 0) { it.caughtAt += dt; continue }
      it.y += it.vy * this.speedMul * dt
      it.baseX += it.drift * dt * 0.35
      it.x = it.baseX + Math.sin(it.age * it.swayFreq + it.swayPh) * it.swayAmp
      it.rot += it.vr * dt
      if (this.phase === 'playing' && it.y >= BAG_Y - 6 && it.y <= BAG_Y + 36 && Math.abs(it.x - this.bagX) <= CATCH_HALF + ITEM_RADIUS[it.kind] * 0.18) {
        this.catchItem(it)
      }
    }
    this.items = this.items.filter((i) => i.y < H + 90 && i.caughtAt < 0.22)

    for (const f of this.floaters) f.age += dt
    this.bannerT = Math.max(0, this.bannerT - dt)
    this.lostT = Math.max(0, this.lostT - dt * 1.4)
    // speed tiers: combo 5 (gradual), 10 (much faster), 20 (fastest)
    const c = this.combo
    const targetMul = c >= 20 ? 1.9 : c >= 10 ? 1.5 + (c - 10) * 0.01 : c >= 5 ? 1 + (c - 4) * 0.06 : 1
    this.speedMul += (targetMul - this.speedMul) * Math.min(1, dt * 3)
    this.floaters = this.floaters.filter((f) => f.age < 1.1)
    for (const p of this.particles) {
      p.life += dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (p.kind === 'confetti') { p.vx += Math.sin(this.t * 3 + p.rot) * 20 * dt }
      else p.vy += (p.kind === 'smoke' ? -60 : 420) * dt
      p.rot += p.vr * dt
    }
    this.particles = this.particles.filter((p) => p.life < p.max && p.y < H + 30)
  }
  private goBanner = 0

  // ------------------------------------------------------------ rendering
  private render() {
    const ctx = this.ctx
    ctx.setTransform(this.pxScale, 0, 0, this.pxScale, 0, 0)
    ctx.save()
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake)
    drawBackground(ctx, this.t)

    // items
    for (const it of this.items) {
      ctx.save()
      if (it.caughtAt >= 0) {
        const k = Math.min(1, it.caughtAt / 0.2)
        ctx.translate(it.fromX + (this.bagX - it.fromX) * k, it.fromY + (BAG_Y + 30 - it.fromY) * k)
        ctx.scale(it.scale * (1 - 0.6 * k), it.scale * (1 - 0.6 * k))
      } else {
        ctx.translate(it.x, it.y)
        ctx.scale(it.scale, it.scale)
      }
      ctx.rotate(it.kind === 'fish' ? Math.sin(it.age * 4 + it.seed) * 0.35 + Math.PI / 2 * 0.25 * it.flip : it.rot * (it.kind === 'krathong' ? 0.4 : 1))
      if (it.kind === 'fish') ctx.scale(it.flip, 1)
      drawItem(ctx, it.kind, it.variant, this.t + it.age, it.seed)
      ctx.restore()
    }

    // player: bag + hands
    ctx.save()
    ctx.translate(this.bagX, BAG_Y)
    const tilt = Math.max(-0.14, Math.min(0.14, this.bagVel * 0.00018))
    ctx.rotate(tilt)
    drawBagBody(ctx, this.t, this.bounce)
    drawHand(ctx, -1, this.bounce * 8)
    drawHand(ctx, 1, this.bounce * 8)
    ctx.restore()

    // particles
    for (const p of this.particles) {
      const a = 1 - p.life / p.max
      ctx.save()
      ctx.globalAlpha = Math.max(0, p.kind === 'confetti' ? Math.min(1, a * 3) : a)
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      if (p.kind === 'star') star4(ctx, 0, 0, p.size * 1.6, p.color)
      else if (p.kind === 'confetti') { ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6) }
      else if (p.kind === 'smoke') { ctx.fillStyle = 'rgba(80,80,90,.7)'; ctx.beginPath(); ctx.arc(0, 0, p.size * (1.5 - a), 0, 6.3); ctx.fill() }
      else { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.size * 0.6, 0, 6.3); ctx.fill() }
      ctx.restore()
    }

    // floating score text
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const f of this.floaters) {
      const k = f.age / 1.1
      const pop = k < 0.15 ? 0.6 + (k / 0.15) * 0.7 : 1.3 - Math.min(0.3, (k - 0.15) * 0.5)
      ctx.save()
      ctx.globalAlpha = Math.min(1, (1 - k) * 2)
      ctx.translate(f.x, f.y - k * 70)
      ctx.scale(pop, pop)
      ctx.font = `700 40px ${FONT}`
      ctx.lineWidth = 7
      ctx.strokeStyle = 'rgba(40,10,30,.9)'
      ctx.lineJoin = 'round'
      ctx.strokeText(f.text, 0, 0)
      ctx.fillStyle = f.color
      ctx.fillText(f.text, 0, 0)
      ctx.restore()
    }

    ctx.restore() // shake

    // hearts
    if (this.phase === 'playing' || (this.phase === 'ended' && this.lives <= 0 && this.lostT > 0)) {
      for (let i = 0; i < MAX_LIVES; i++) {
        const alive = i < this.lives
        const shake = i === this.lostIdx && this.lostT > 0 ? Math.sin(this.lostT * 40) * 5 * this.lostT : 0
        const pop = i === this.lostIdx && this.lostT > 0 ? 1 + this.lostT * 0.35 : 1
        ctx.save()
        ctx.translate(46 + i * 46 + shake, 150)
        ctx.scale(pop, pop)
        drawHeart(ctx, alive)
        ctx.restore()
      }
    }
    // combo pill + banner
    if (this.phase === 'playing' && this.combo >= 2) {
      const hot = this.combo >= 5
      const pulse = 1 + Math.max(0, this.bounceV) * 0.01
      ctx.save()
      ctx.translate(22, 188)
      ctx.scale(pulse, pulse)
      ctx.beginPath()
      ctx.roundRect(0, 0, hot ? 170 : 128, hot ? 58 : 40, 16)
      ctx.fillStyle = hot ? 'rgba(190,30,60,.85)' : 'rgba(40,20,80,.8)'
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = hot ? '#ffd35a' : 'rgba(255,211,90,.6)'
      ctx.stroke()
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.font = `700 24px ${FONT}`
      ctx.fillStyle = hot ? '#fff3b0' : '#ffe9a8'
      ctx.fillText(`คอมโบ ×${this.combo}`, 14, 21)
      if (hot) {
        ctx.font = `600 15px ${FONT}`
        ctx.fillStyle = '#ffd35a'
        ctx.fillText(`⚡ เร็วขึ้น ${Math.round((this.speedMul - 1) * 100)}%`, 14, 44)
      }
      ctx.restore()
    }
    if (this.bannerT > 0) {
      const k = 1 - this.bannerT / 1.3
      ctx.save()
      ctx.globalAlpha = Math.min(1, this.bannerT * 2.5)
      ctx.translate(W / 2, 170 - k * 20)
      const sc = 0.8 + Math.max(0, 0.3 - k) * 1.5
      ctx.scale(sc, sc)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `700 46px ${FONT}`
      ctx.lineWidth = 9
      ctx.lineJoin = 'round'
      ctx.strokeStyle = this.bannerBad ? '#4a1030' : '#7a1230'
      ctx.strokeText(this.bannerText, 0, 0)
      ctx.fillStyle = this.bannerBad ? '#ff6b7a' : '#ffe14a'
      ctx.fillText(this.bannerText, 0, 0)
      ctx.restore()
    }

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(${this.flashColor},${this.flash * 0.5})`
      ctx.fillRect(0, 0, W, H)
    }

    // countdown banner
    if (this.phase === 'countdown' || this.goBanner > 0) {
      const isGo = this.phase !== 'countdown'
      const frac = isGo ? 1 - this.goBanner / 1.2 : 1 - (this.countdown - Math.floor(this.countdown))
      const text = isGo ? 'เริ่ม!' : String(Math.max(1, Math.ceil(this.countdown)))
      const s = 0.7 + Math.max(0, 0.6 - frac) * 1.1
      ctx.save()
      ctx.globalAlpha = isGo ? Math.max(0, 1 - frac) : 1
      ctx.translate(W / 2, H * 0.4)
      ctx.scale(s, s)
      ctx.font = `700 150px ${FONT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineWidth = 16
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#7a1230'
      ctx.strokeText(text, 0, 0)
      const g = ctx.createLinearGradient(0, -70, 0, 70)
      g.addColorStop(0, '#fff6c2')
      g.addColorStop(1, '#ff9b2f')
      ctx.fillStyle = g
      ctx.fillText(text, 0, 0)
      ctx.restore()
    }
  }

  private loop = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.update(dt)
    this.render()
    this.raf = requestAnimationFrame(this.loop)
  }
}
