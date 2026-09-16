import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Optional healing-piano-over-a-water-fountain ambience played during a
 * conversation - an original piece synthesised with the Web Audio API in
 * that genre, not a copy of any existing recording.
 *
 * Synthesised entirely locally rather than an audio file or embed: no
 * licensed track to clear, nothing fetched from a third party, and it keeps
 * working offline. Off by default, for the same reason read-aloud defaults
 * off (see useSpeechSynthesis.ts) - ambient audio playing unexpectedly is a
 * disclosure risk in a shared office, so it is switched on deliberately
 * every time rather than remembered, the same as most browsers block
 * unattended autoplay anyway.
 */

export interface AmbientMusicState {
  supported: boolean;
  playing: boolean;
  toggle(): void;
}

/** C major pentatonic across two octaves - the warm, unresolved-tension scale most healing-piano pieces sit in. */
const SCALE_HZ = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

interface AmbientNodes {
  master: GainNode;
  delay: DelayNode;
  waterSource: AudioBufferSourceNode;
  dropletTimeoutId: number;
  noteTimeoutId: number;
  currentNoteGain: GainNode | null;
}

export function useAmbientMusic(): AmbientMusicState {
  const [playing, setPlaying] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AmbientNodes | null>(null);
  const scaleIndexRef = useRef(3);
  const supported = typeof window !== "undefined" && (
    "AudioContext" in window || "webkitAudioContext" in (window as unknown as Record<string, unknown>)
  );

  const stop = useCallback(() => {
    const nodes = nodesRef.current;
    const context = contextRef.current;
    if (nodes && context) {
      window.clearTimeout(nodes.noteTimeoutId);
      window.clearTimeout(nodes.dropletTimeoutId);
      nodes.currentNoteGain?.gain.cancelScheduledValues(context.currentTime);
      nodes.currentNoteGain?.gain.linearRampToValueAtTime(0, context.currentTime + 0.2);
      nodes.waterSource.stop(context.currentTime + 0.3);
    }
    nodesRef.current = null;
    window.setTimeout(() => void context?.close(), 400);
    contextRef.current = null;
    setPlaying(false);
  }, []);

  const start = useCallback(() => {
    if (!supported) return;
    const Ctor = (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const context = new Ctor();

    // A soft hall reverb shared by both the piano and the water bed, the way
    // a real recording space would tie the two together.
    const master = context.createGain();
    master.gain.value = 0.5;
    master.connect(context.destination);

    const delay = context.createDelay(1);
    delay.delayTime.value = 0.3;
    const feedback = context.createGain();
    feedback.gain.value = 0.3;
    const wet = context.createGain();
    wet.gain.value = 0.5;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(master);

    // --- Water fountain bed: a continuous soft trickle, plus discrete
    // droplet blips scheduled at random intervals - the two textures that
    // together read as running water rather than plain noise.
    const streamBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const streamData = streamBuffer.getChannelData(0);
    for (let i = 0; i < streamData.length; i++) streamData[i] = Math.random() * 2 - 1;

    const waterSource = context.createBufferSource();
    waterSource.buffer = streamBuffer;
    waterSource.loop = true;
    const streamFilter = context.createBiquadFilter();
    streamFilter.type = "bandpass";
    streamFilter.frequency.value = 1400;
    streamFilter.Q.value = 0.6;
    const streamGain = context.createGain();
    streamGain.gain.value = 0.05;
    waterSource.connect(streamFilter);
    streamFilter.connect(streamGain);
    streamGain.connect(master);
    waterSource.start();

    const dropletBuffer = context.createBuffer(1, context.sampleRate * 0.15, context.sampleRate);
    const dropletData = dropletBuffer.getChannelData(0);
    for (let i = 0; i < dropletData.length; i++) dropletData[i] = Math.random() * 2 - 1;

    contextRef.current = context;
    nodesRef.current = {
      master, delay, waterSource, dropletTimeoutId: 0, noteTimeoutId: 0, currentNoteGain: null,
    };
    setPlaying(true);

    playNextDroplet(context, master, dropletBuffer);
    playNextNote(context, master, delay);
  }, [supported]);

  function playNextDroplet(context: AudioContext, master: GainNode, dropletBuffer: AudioBuffer) {
    if (contextRef.current !== context) return;

    const now = context.currentTime;
    const droplet = context.createBufferSource();
    droplet.buffer = dropletBuffer;
    droplet.playbackRate.value = 1.6 + Math.random() * 1.2;

    const dropletFilter = context.createBiquadFilter();
    dropletFilter.type = "bandpass";
    dropletFilter.frequency.value = 1800 + Math.random() * 2200;
    dropletFilter.Q.value = 4;

    const dropletGain = context.createGain();
    dropletGain.gain.value = 0;
    droplet.connect(dropletFilter);
    dropletFilter.connect(dropletGain);
    dropletGain.connect(master);

    dropletGain.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.03, now + 0.008);
    dropletGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.18);

    droplet.start(now);
    droplet.stop(now + 0.2);

    const nextDelay = 350 + Math.random() * 900;
    const dropletTimeoutId = window.setTimeout(() => playNextDroplet(context, master, dropletBuffer), nextDelay);
    if (nodesRef.current) nodesRef.current.dropletTimeoutId = dropletTimeoutId;
  }

  function playNextNote(context: AudioContext, master: GainNode, delay: DelayNode) {
    if (contextRef.current !== context) return;

    // A gentle random walk across the scale, sparse rather than a running
    // arpeggio - healing piano pieces leave a lot of silence between notes.
    const step = Math.random() < 0.65 ? (Math.random() < 0.5 ? -1 : 1) : (Math.random() < 0.5 ? -2 : 2);
    scaleIndexRef.current = Math.min(SCALE_HZ.length - 1, Math.max(0, scaleIndexRef.current + step));
    const frequency = SCALE_HZ[scaleIndexRef.current];

    const now = context.currentTime;
    const gap = 1.8 + Math.random() * 2.8;

    // A struck-string tone: fundamental plus two quiet overtones, brightest
    // at the attack and mellowing as it decays, under a fast pluck envelope
    // rather than the slow swell a breath instrument would use.
    const fundamental = context.createOscillator();
    fundamental.type = "triangle";
    fundamental.frequency.value = frequency;

    const overtone2 = context.createOscillator();
    overtone2.type = "sine";
    overtone2.frequency.value = frequency * 2;
    const overtone2Gain = context.createGain();
    overtone2Gain.gain.value = 0.18;

    const overtone3 = context.createOscillator();
    overtone3.type = "sine";
    overtone3.frequency.value = frequency * 3;
    const overtone3Gain = context.createGain();
    overtone3Gain.gain.value = 0.07;

    const toneFilter = context.createBiquadFilter();
    toneFilter.type = "lowpass";
    toneFilter.frequency.setValueAtTime(3200, now);
    toneFilter.frequency.exponentialRampToValueAtTime(700, now + 3.5);

    fundamental.connect(toneFilter);
    overtone2.connect(overtone2Gain);
    overtone2Gain.connect(toneFilter);
    overtone3.connect(overtone3Gain);
    overtone3Gain.connect(toneFilter);

    const noteGain = context.createGain();
    noteGain.gain.value = 0;
    toneFilter.connect(noteGain);
    noteGain.connect(master);
    noteGain.connect(delay);

    const peak = 0.14 + Math.random() * 0.04;
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(peak, now + 0.012);
    noteGain.gain.setTargetAtTime(0.0001, now + 0.02, 1.1);

    const duration = 4.5;
    fundamental.start(now);
    overtone2.start(now);
    overtone3.start(now);
    fundamental.stop(now + duration);
    overtone2.stop(now + duration);
    overtone3.stop(now + duration);

    if (nodesRef.current) nodesRef.current.currentNoteGain = noteGain;

    const noteTimeoutId = window.setTimeout(() => playNextNote(context, master, delay), gap * 1000);
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
