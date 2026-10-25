import { useEffect, useRef } from 'react';
import { useSimStore, useUiStore } from '../store/simStore.ts';

/**
 * Plays a short two-tone chime when a new alert arrives.
 * Audio is unlocked by the first user gesture (browser autoplay policy),
 * and the header mute toggle genuinely silences it.
 */
export function useAlertSound() {
  const alerts = useSimStore((s) => s.alerts);
  const muted = useUiStore((s) => s.muted);
  const ctxRef = useRef<AudioContext | null>(null);
  const lastCount = useRef(0);

  useEffect(() => {
    const unlock = () => {
      if (ctxRef.current) return;
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) ctxRef.current = new Ctor();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  useEffect(() => {
    const prev = lastCount.current;
    lastCount.current = alerts.length;
    if (alerts.length <= prev || muted) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();

    const now = ctx.currentTime;
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.06, now + i * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.14 + 0.13);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.14);
    });
  }, [alerts, muted]);
}
