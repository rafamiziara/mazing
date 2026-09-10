/**
 * Synthesized audio engine — every sound is generated with WebAudio nodes,
 * no audio files. Lazily initialized on first user gesture (browser policy).
 */

const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]

export class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private ambientNodes: AudioNode[] = []
  private comboNote = 0
  muted = false

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    try {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : 0.5
      this.master.connect(this.ctx.destination)
      this.startAmbient()
    } catch {
      this.ctx = null
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (this.ctx && this.master) {
      this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.5, this.ctx.currentTime + 0.1)
    }
  }

  /** Two detuned drones with a slow LFO — the hum of the labyrinth. */
  private startAmbient() {
    if (!this.ctx || !this.master) return
    const g = this.ctx.createGain()
    g.gain.value = 0.05
    const lfo = this.ctx.createOscillator()
    lfo.frequency.value = 0.07
    const lfoGain = this.ctx.createGain()
    lfoGain.gain.value = 0.02
    lfo.connect(lfoGain).connect(g.gain)
    for (const [freq, pan] of [
      [55, -0.4],
      [55.35, 0.4],
      [110.2, 0],
    ] as const) {
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      const p = this.ctx.createStereoPanner()
      p.pan.value = pan
      osc.connect(p).connect(g)
      osc.start()
      this.ambientNodes.push(osc)
    }
    g.connect(this.master)
    lfo.start()
    this.ambientNodes.push(lfo, g)
  }

  private env(peak: number, attack: number, decay: number, when = 0): GainNode | null {
    if (!this.ctx || !this.master) return null
    const t = this.ctx.currentTime + when
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(peak, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
    g.connect(this.master)
    return g
  }

  private tone(freq: number, type: OscillatorType, peak: number, attack: number, decay: number, when = 0, glideTo?: number) {
    if (!this.ctx) return
    const g = this.env(peak, attack, decay, when)
    if (!g) return
    const t = this.ctx.currentTime + when
    const osc = this.ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + attack + decay)
    osc.connect(g)
    osc.start(t)
    osc.stop(t + attack + decay + 0.05)
  }

  private noise(peak: number, decay: number, filterFreq: number, when = 0) {
    if (!this.ctx) return
    const g = this.env(peak, 0.005, decay, when)
    if (!g) return
    const t = this.ctx.currentTime + when
    const len = Math.ceil(this.ctx.sampleRate * (decay + 0.05))
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const f = this.ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = filterFreq
    f.Q.value = 1.2
    src.connect(f).connect(g)
    src.start(t)
  }

  /** Soft tick as the ember glides between cells. */
  step() {
    this.noise(0.05, 0.06, 1400 + Math.random() * 600)
  }

  /** Pentatonic pluck that climbs with each spark in a streak. */
  spark() {
    const note = PENTATONIC[Math.min(this.comboNote, PENTATONIC.length - 1)]
    this.comboNote++
    this.tone(note, 'sine', 0.22, 0.008, 0.5)
    this.tone(note * 2, 'sine', 0.08, 0.008, 0.35)
    this.tone(note * 3, 'sine', 0.03, 0.008, 0.2)
  }

  resetCombo() {
    this.comboNote = 0
  }

  /** Rising whoosh of the echo pulse flooding the corridors. */
  pulse() {
    this.noise(0.16, 0.9, 500)
    this.tone(80, 'sine', 0.25, 0.02, 0.9, 0, 340)
    this.tone(160, 'triangle', 0.1, 0.02, 0.7, 0.05, 640)
  }

  /** A wisp brushes your light. */
  hit() {
    this.tone(110, 'sawtooth', 0.2, 0.005, 0.3, 0, 55)
    this.noise(0.14, 0.25, 250)
  }

  /** Gaining a pulse charge. */
  charge() {
    this.tone(523.25, 'triangle', 0.12, 0.01, 0.25)
    this.tone(783.99, 'triangle', 0.12, 0.01, 0.3, 0.07)
  }

  /** Stepping into the portal — shimmering resolve. */
  portal() {
    const chord = [261.63, 329.63, 392.0, 523.25, 659.25]
    chord.forEach((f, i) => {
      this.tone(f, 'sine', 0.14, 0.02, 1.4, i * 0.09)
    })
    this.noise(0.06, 1.2, 2200, 0.1)
  }

  /** The dark takes you. */
  death() {
    this.tone(220, 'sine', 0.22, 0.02, 1.8, 0, 55)
    this.tone(277, 'sine', 0.14, 0.02, 1.6, 0.1, 69)
    this.noise(0.1, 1.4, 180, 0.05)
  }

  /** Low warning as the light gutters. */
  lowLight() {
    this.tone(98, 'sine', 0.12, 0.05, 0.5)
  }
}

export const audio = new AudioEngine()
