import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Optional calming instrumental loop played during a conversation.
 *
 * Synthesised entirely with the Web Audio API rather than an audio file: no
 * licensed track to clear, nothing to fetch, and it keeps working offline.
 * Off by default, for the same reason read-aloud defaults off (see
 * useSpeechSynthesis.ts) - ambient audio playing unexpectedly is a disclosure
 * risk in a shared office, so it is switched on deliberately every time
 * rather than remembered, the same as most browsers block unattended
 * autoplay anyway.
 */

export interface AmbientMusicState {
  supported: boolean;
  playing: boolean;
  toggle(): void;
}

/** A soft two-note detuned pad, slowly swelling and fading. Nothing sharp or attention-grabbing. */
const PAD_NOTES_HZ = [130.81, 164.81]; // C3, E3 - a plain, restful interval

export function useAmbientMusic(): AmbientMusicState {
  const [playing, setPlaying] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ oscillators: OscillatorNode[]; gain: GainNode; intervalId: number } | null>(null);
  const supported = typeof window !== "undefined" && (
    "AudioContext" in window || "webkitAudioContext" in (window as unknown as Record<string, unknown>)
  );

  const stop = useCallback(() => {
    if (nodesRef.current) {
      window.clearInterval(nodesRef.current.intervalId);
      nodesRef.current.oscillators.forEach((oscillator) => oscillator.stop());
    }
    nodesRef.current = null;
    void contextRef.current?.close();
    contextRef.current = null;
    setPlaying(false);
  }, []);

  const start = useCallback(() => {
    if (!supported) return;
    const Ctor = (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const context = new Ctor();
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(context.destination);

    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;
    filter.connect(gain);

    const oscillators = PAD_NOTES_HZ.map((frequency) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(filter);
      oscillator.start();
      return oscillator;
    });

    // Slow swell in, then a gentle continuous breathing volume rather than a
    // flat drone, so it reads as calming rather than a machine hum.
    const now = context.currentTime;
    gain.gain.linearRampToValueAtTime(0.05, now + 3);
    const breathe = () => {
      if (!contextRef.current) return;
      const t = contextRef.current.currentTime;
      gain.gain.linearRampToValueAtTime(0.07, t + 4);
      gain.gain.linearRampToValueAtTime(0.04, t + 8);
    };
    const intervalId = window.setInterval(breathe, 8000);

    contextRef.current = context;
    nodesRef.current = { oscillators, gain, intervalId };
    setPlaying(true);
  }, [supported]);

  const toggle = useCallback(() => {
    if (playing) stop();
    else start();
  }, [playing, start, stop]);

  // Stop cleanly on unmount, e.g. when the conversation view is torn down.
  useEffect(() => stop, [stop]);

  return { supported, playing, toggle };
}
