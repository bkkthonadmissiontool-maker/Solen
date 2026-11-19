// Tiny WebAudio sound effects (no audio assets needed).
type AC = AudioContext
let ctx: AC | null = null
let muted = false

function ac(): AC | null {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (C) ctx = new C()
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, slideTo?: number, delay = 0) {
  if (muted) return
  const a = ac()
  if (!a) return
  const o = a.createOscillator()
  const g = a.createGain()
  const t0 = a.currentTime + delay
  o.type = type
  o.frequency.setValueAtTime(freq, t0)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(a.destination)
  o.start(t0)
  o.stop(t0 + dur + 0.02)
}

function noise(dur: number, vol = 0.2) {
  if (muted) return
  const a = ac()
  if (!a) return
  const n = Math.floor(a.sampleRate * dur)
  const buf = a.createBuffer(1, n, a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2)
  const s = a.createBufferSource()
  const g = a.createGain()
  const f = a.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 900
  g.gain.value = vol
  s.buffer = buf
  s.connect(f).connect(g).connect(a.destination)
  s.start()
}

export const sfx = {
  unlock() {
    ac()
  },
  setMuted(m: boolean) {
    muted = m
  },
  isMuted: () => muted,
  krathong() {
    tone(784, 0.14, 'triangle', 0.14)
    tone(1175, 0.22, 'triangle', 0.12, undefined, 0.07)
    tone(1568, 0.3, 'sine', 0.07, undefined, 0.14)
  },
  coin() {
    tone(988, 0.08, 'square', 0.06)
    tone(1319, 0.2, 'square', 0.06, undefined, 0.07)
  },
  trash() {
    tone(520, 0.12, 'triangle', 0.12, 700)
  },
  bomb() {
    noise(0.55, 0.35)
    tone(120, 0.45, 'sawtooth', 0.15, 40)
  },
  fish() {
    tone(420, 0.2, 'sine', 0.14, 160)
  },
  tick() {
    tone(660, 0.12, 'sine', 0.12)
  },
  go() {
    tone(880, 0.35, 'triangle', 0.14)
    tone(1320, 0.4, 'triangle', 0.1, undefined, 0.08)
  },
  end() {
    ;[523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, 'triangle', 0.12, undefined, i * 0.1))
  },
}
