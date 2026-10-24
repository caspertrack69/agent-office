/**
 * Deterministic Mulberry32 PRNG. Seed → reproducible sequence.
 * State is serialisable so save/load preserves determinism.
 */
export type RngState = { seed: number; n: number };

export class SeededRng {
  private s: number;
  private n: number;
  constructor(
    public seed: number,
    n = 0,
  ) {
    this.s = seed >>> 0;
    this.n = n;
  }

  /** float in [0,1) */
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    this.n++;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)] as T;
  }

  getState(): RngState {
    return { seed: this.seed, n: this.n };
  }

  static fromState(s: RngState): SeededRng {
    // replay n steps to reach same internal s
    const r = new SeededRng(s.seed, 0);
    for (let i = 0; i < s.n; i++) r.next();
    return r;
  }
}
