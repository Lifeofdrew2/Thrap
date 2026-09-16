import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Optional bamboo-flute-style meditation loop played during a conversation.
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

/** D pentatonic, the scale most bamboo-flute meditation pieces wander over. */
const SCALE_HZ = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33]; // D4 F4 G4 A4 C5 D5

interface FluteNodes {
  master: GainNode;
  delay: DelayNode;
  noiseBuffer: AudioBuffer;
  noteTimeoutId: number;
  currentNoteGain: GainNode | null;
}

export function useAmbientMusic(): AmbientMusicState {
  const [playing, setPlaying] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<FluteNodes | null>(null);
  const scaleIndexRef = useRef(2);
  const supported = typeof window !== "undefined" && (
    "AudioContext" in window || "webkitAudioContext" in (window as unknown as Record<string, unknown>)
  );

  const stop = useCallback(() => {
    const nodes = nodesRef.current;
    const context = contextRef.current;
    if (nodes && context) {
      window.clearTimeout(nodes.noteTimeoutId);
      // Fade the note in flight quickly rather than cutting it off sharply.
      nodes.currentNoteGain?.gain.cancelScheduledValues(context.currentTime);
      nodes.currentNoteGain?.gain.linearRampToValueAtTime(0, context.currentTime + 0.2);
    }
    nodesRef.current = null;
    window.setTimeout(() => void context?.close(), 250);
    contextRef.current = null;
    setPlaying(false);
  }, []);

  const start = useCallback(() => {
    if (!supported) return;
    const Ctor = (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const context = new Ctor();

    // A short feedback delay stands in for the soft hall reverb that bamboo
    // flute meditation recordings are almost always mixed with.
    const master = context.createGain();
    master.gain.value = 0.5;
    master.connect(context.destination);

    const delay = context.createDelay(1);
    delay.delayTime.value = 0.32;
    const feedback = context.createGain();
    feedback.gain.value = 0.35;
    const wet = context.createGain();
    wet.gain.value = 0.55;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(master);

    // A short buffer of white noise, reused for every note's soft breath
    // attack rather than allocated fresh each time.
    const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.2, context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;

    contextRef.current = context;
    nodesRef.current = { master, delay, noiseBuffer, noteTimeoutId: 0, currentNoteGain: null };
    setPlaying(true);

    playNextNote(context, master, delay, noiseBuffer);
  }, [supported]);

  function playNextNote(context: AudioContext, master: GainNode, delay: DelayNode, noiseBuffer: AudioBuffer) {
    if (contextRef.current !== context) return;

    // A gentle random walk across the scale reads as an unhurried melodic
    // phrase rather than either a fixed tune or fully random noodling.
    const step = Math.random() < 0.7 ? (Math.random() < 0.5 ? -1 : 1) : (Math.random() < 0.5 ? -2 : 2);
    scaleIndexRef.current = Math.min(SCALE_HZ.length - 1, Math.max(0, scaleIndexRef.current + step));
    const frequency = SCALE_HZ[scaleIndexRef.current];

    const now = context.currentTime;
    const duration = 1.3 + Math.random() * 1.6;
    const gap = 0.5 + Math.random() * 1.2;

    // The tone itself: a sine core for breath warmth plus a faint triangle
    // overtone, both under a slow vibrato - the wavering pitch is what makes
    // a synthesised tone read as a blown flute rather than an electronic pad.
    const tone = context.createOscillator();
    tone.type = "sine";
    tone.frequency.value = frequency;

    const overtone = context.createOscillator();
    overtone.type = "triangle";
    overtone.frequency.value = frequency * 2;
    const overtoneGain = context.createGain();
    overtoneGain.gain.value = 0.06;
    overtone.connect(overtoneGain);

    const vibrato = context.createOscillator();
    vibrato.type = "sine";
    vibrato.frequency.value = 4.5 + Math.random() * 0.8;
    const vibratoDepth = context.createGain();
    vibratoDepth.gain.value = frequency * 0.008;
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(tone.frequency);
    vibratoDepth.connect(overtone.frequency);

    const noteGain = context.createGain();
    noteGain.gain.value = 0;
    tone.connect(noteGain);
    overtoneGain.connect(noteGain);
    noteGain.connect(master);
    noteGain.connect(delay);

    // Soft attack and release, like a breath swelling in and fading out,
    // rather than a hard-edged synthesiser envelope.
    const peak = 0.11 + Math.random() * 0.03;
    noteGain.gain.linearRampToValueAtTime(peak, now + 0.35);
    noteGain.gain.linearRampToValueAtTime(peak * 0.85, now + duration * 0.6);
    noteGain.gain.linearRampToValueAtTime(0, now + duration);

    // A brief filtered noise "chiff" under the attack, the airy edge of a
    // real flute's blown onset.
    const breath = context.createBufferSource();
    breath.buffer = noiseBuffer;
    const breathFilter = context.createBiquadFilter();
    breathFilter.type = "highpass";
    breathFilter.frequency.value = 2500;
    const breathGain = context.createGain();
    breathGain.gain.value = 0.02;
    breath.connect(breathFilter);
    breathFilter.connect(breathGain);
    breathGain.connect(master);

    tone.start(now);
    overtone.start(now);
    vibrato.start(now);
    breath.start(now);
    tone.stop(now + duration + 0.05);
    overtone.stop(now + duration + 0.05);
    vibrato.stop(now + duration + 0.05);
    breath.stop(now + 0.2);

    if (nodesRef.current) nodesRef.current.currentNoteGain = noteGain;

    const noteTimeoutId = window.setTimeout(
      () => playNextNote(context, master, delay, noiseBuffer),
      (duration + gap) * 1000,
    );
    if (nodesRef.current) nodesRef.current.noteTimeoutId = noteTimeoutId;
  }

  const toggle = useCallback(() => {
    if (playing) stop();
    else start();
  }, [playing, start, stop]);

  // Stop cleanly on unmount, e.g. when the conversation view is torn down.
  useEffect(() => stop, [stop]);

  return { supported, playing, toggle };
}
