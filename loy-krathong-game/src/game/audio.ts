// Tiny WebAudio synth – no asset files needed.
// Optional: a licensed/own audio file to loop instead of the built-in tune,
// e.g. VITE_MUSIC_URL=./my-song.mp3 (put the file in public/).
import trackUrl from '../assets/loy-krathong.mp3?inline'
const MUSIC_URL = (import.meta.env.VITE_MUSIC_URL as string | undefined) || trackUrl
const MUSIC_VOL = 0.28 // soft background level so game sound effects stay clear

// Original festive tune (generated live, not a copy of any existing song):
// Thai-style pentatonic "ranat" plucks + soft bass + ching (ฉิ่ง) offbeats.
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5] // C D E G A C
const MOTIFS = [
  [3, -1, 4, 3, 2, -1, 1, 2],
  [0, 1, 2, -1, 3, 2, 1, -1],
  [4, -1, 5, 4, 3, -1, 2, 3],
  [2, 3, 2, 1, 0, -1, -1, -1],
]
const BASS = [130.81, 98, 110, 98]
const EIGHTH = 60 / 96 / 2

export class Sfx {
  private _muted = false
  private ac: AudioContext | null = null
  private master: GainNode | null = null
  private timer: number | null = null
  private nextTime = 0
  private step = 0
  private motif = MOTIFS[0]
  private audioEl: HTMLAudioElement | null = null
  private fadeTimer: number | null = null

  get muted() { return this._muted }
  set muted(m: boolean) {
    this._muted = m
    if (this.master && this.ac) this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ac.currentTime, 0.05)
    if (this.audioEl) this.audioEl.muted = m
  }

  startMusic() {
    if (MUSIC_URL) {
      if (!this.audioEl) { this.audioEl = new Audio(MUSIC_URL); this.audioEl.loop = true }
      if (this.fadeTimer !== null) { window.clearInterval(this.fadeTimer); this.fadeTimer = null }
      const el = this.audioEl
      el.volume = 0
      el.muted = this._muted
      el.currentTime = 0
      void el.play().catch(() => {})
      this.fadeTimer = window.setInterval(() => { // gentle fade-in
        el.volume = Math.min(MUSIC_VOL, el.volume + MUSIC_VOL / 40)
        if (el.volume >= MUSIC_VOL) { window.clearInterval(this.fadeTimer!); this.fadeTimer = null }
      }, 50)
      return
    }
    if (!this.ac || this.timer !== null) return
    this.master = this.ac.createGain()
    this.master.gain.value = this._muted ? 0 : 0.5
    this.master.connect(this.ac.destination)
    this.nextTime = this.ac.currentTime + 0.15
    this.step = 0
    this.timer = window.setInterval(() => this.schedule(), 100)
  }
  stopMusic(fade = 1) {
    const el = this.audioEl
    if (el && !el.paused) {
      if (fade <= 0) el.pause()
      else {
        if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer)
        this.fadeTimer = window.setInterval(() => {
          el.volume = Math.max(0, el.volume - MUSIC_VOL / (fade * 20))
          if (el.volume <= 0.01) { el.pause(); window.clearInterval(this.fadeTimer!); this.fadeTimer = null }
        }, 50)
      }
    }
    if (this.timer === null || !this.ac || !this.master) return
    const m = this.master
    window.clearInterval(this.timer)
    this.timer = null
    m.gain.cancelScheduledValues(this.ac.currentTime)
    m.gain.setTargetAtTime(0, this.ac.currentTime, fade / 4 + 0.001)
    window.setTimeout(() => m.disconnect(), fade * 1000 + 300)
    this.master = null
  }
  private schedule() {
    const ac = this.ac
    if (!ac) return
    while (this.nextTime < ac.currentTime + 0.3) {
      this.playStep(this.step, this.nextTime)
      this.nextTime += EIGHTH
      this.step++
    }
  }
  private playStep(step: number, when: number) {
    const i = step % 8
    if (i === 0) this.motif = MOTIFS[Math.floor(Math.random() * MOTIFS.length)]
    const n = this.motif[i]
    if (n >= 0) {
      this.pluck(SCALE[n], when, 0.16)
      if (i % 4 === 0) this.pluck(SCALE[n] / 2, when, 0.07)
    }
    if (i % 2 === 0) this.pluck(BASS[(step >> 1) % 4], when, 0.2, 0.7)
    // ching: high metallic tick on the off-beats
    if (i % 2 === 1) this.ching(when, i % 4 === 1 ? 5200 : 4300)
  }
  private pluck(freq: number, when: number, vol: number, dur = 0.4) {
    if (!this.ac || !this.master) return
    const ac = this.ac
    const g = ac.createGain()
    g.gain.setValueAtTime(0.0001, when)
    g.gain.exponentialRampToValueAtTime(vol, when + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur)
    g.connect(this.master)
    for (const [mult, type, level] of [[1, 'triangle', 1], [2.01, 'sine', 0.3]] as const) {
      const o = ac.createOscillator()
      const og = ac.createGain()
      o.type = type
      o.frequency.value = freq * mult
      og.gain.value = level
      o.connect(og).connect(g)
      o.start(when)
      o.stop(when + dur + 0.05)
    }
  }
  private ching(when: number, freq: number) {
    if (!this.ac || !this.master) return
    const o = this.ac.createOscillator()
    const g = this.ac.createGain()
    o.type = 'square'
    o.frequency.value = freq
    g.gain.setValueAtTime(0.0001, when)
    g.gain.exponentialRampToValueAtTime(0.025, when + 0.003)
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.07)
    o.connect(g).connect(this.master)
    o.start(when)
    o.stop(when + 0.1)
  }

  init() {
    if (!this.ac) {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        this.ac = new AC()
      } catch { /* audio unsupported */ }
    }
    void this.ac?.resume()
  }
  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, delay = 0, slideTo?: number) {
    if (this._muted || !this.ac) return
    const ac = this.ac
    const t0 = ac.currentTime + delay
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t0)
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    o.connect(g).connect(ac.destination)
    o.start(t0)
    o.stop(t0 + dur + 0.02)
  }
  good(points: number) {
    this.tone(660, 0.12, 'triangle')
    this.tone(880, 0.16, 'triangle', 0.12, 0.07)
    if (points >= 2) this.tone(1320, 0.22, 'sine', 0.1, 0.14)
  }
  bad(bomb: boolean) {
    if (bomb) {
      this.tone(160, 0.45, 'sawtooth', 0.18, 0, 40)
      this.tone(90, 0.5, 'square', 0.1, 0, 30)
    } else {
      this.tone(300, 0.25, 'square', 0.1, 0, 140)
    }
  }
  /** sad-trombone "wah wah wah waaah" for losing all hearts */
  gameOver() {
    if (this._muted || !this.ac) return
    const ac = this.ac
    const notes: [number, number, number][] = [[233, 0.38, 0], [220, 0.38, 0.42], [208, 0.38, 0.84], [196, 1.1, 1.26]]
    notes.forEach(([f, dur, delay], idx) => {
      const t0 = ac.currentTime + delay + 0.05
      const last = idx === notes.length - 1
      const o = ac.createOscillator()
      const filt = ac.createBiquadFilter()
      const g = ac.createGain()
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(f, t0)
      if (last) o.frequency.exponentialRampToValueAtTime(f * 0.72, t0 + dur) // droop
      else o.frequency.exponentialRampToValueAtTime(f * 0.96, t0 + dur)
      // muted "wah" opens and closes the filter
      filt.type = 'lowpass'
      filt.Q.value = 5
      filt.frequency.setValueAtTime(350, t0)
      filt.frequency.exponentialRampToValueAtTime(last ? 700 : 1400, t0 + dur * 0.4)
      filt.frequency.exponentialRampToValueAtTime(260, t0 + dur)
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(0.2, t0 + 0.05)
      g.gain.setValueAtTime(0.2, t0 + dur * 0.7)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
      o.connect(filt).connect(g).connect(ac.destination)
      if (last) { // wobbling vibrato on the final note
        const lfo = ac.createOscillator()
        const lg = ac.createGain()
        lfo.frequency.value = 6.5
        lg.gain.value = 5
        lfo.connect(lg).connect(o.frequency)
        lfo.start(t0)
        lfo.stop(t0 + dur + 0.05)
      }
      o.start(t0)
      o.stop(t0 + dur + 0.05)
    })
  }
  tick(go: boolean) { this.tone(go ? 1040 : 520, go ? 0.35 : 0.12, 'triangle', 0.12) }
  end() { this.tone(520, 0.2, 'triangle'); this.tone(390, 0.35, 'triangle', 0.12, 0.18) }
  fanfare() {
    ;[523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.13, i * 0.12))
  }
}
