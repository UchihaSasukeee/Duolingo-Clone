
import { useCallback, useRef } from "react";

export function useSoundEffects() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playTone = (freq: number, type: OscillatorType, duration: number, delay: number = 0) => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    
    // Envelope
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + delay + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  };

  const playCorrect = useCallback(() => {
    // Happy Ding (Major 3rd)
    playTone(523.25, "sine", 0.3, 0); // C5
    playTone(659.25, "sine", 0.4, 0.1); // E5
  }, []);

  const playWrong = useCallback(() => {
    // Sad Bonk (Descending minor 3rd)
    playTone(349.23, "triangle", 0.3, 0); // F4
    playTone(293.66, "triangle", 0.4, 0.2); // D4
  }, []);

  const playFinished = useCallback(() => {
    // Triumphant Fanfare (Ascending major arpeggio)
    playTone(523.25, "sine", 0.15, 0); // C5
    playTone(659.25, "sine", 0.15, 0.15); // E5
    playTone(783.99, "sine", 0.15, 0.3); // G5
    playTone(1046.50, "sine", 0.6, 0.45); // C6
  }, []);

  return { playCorrect, playWrong, playFinished };
}

