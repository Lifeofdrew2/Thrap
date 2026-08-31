import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Read-aloud for service replies.
 *
 * Off by default and opt-in per session. A synthetic voice reading wellbeing
 * content aloud is a disclosure risk in a shared office or on a commute, so the
 * person turns it on deliberately rather than discovering it.
 *
 * Unlike recognition, synthesis runs against voices installed on the device, so
 * no reply text leaves the browser.
 */

export interface SpeechSynthesisState {
  supported: boolean;
  speaking: boolean;
  speak(text: string): void;
  cancel(): void;
}

export function useSpeechSynthesis(): SpeechSynthesisState {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback((text: string) => {
    if (!supported || !text.trim()) return;

    // Never queue: a backlog of replies talking over each other is worse than
    // losing one, and the person is reading the same text on screen anyway.
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const preferred = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang === "en-NG")
      ?? window.speechSynthesis.getVoices().find((voice) => voice.lang.startsWith("en-GB"));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [supported]);

  // Leaving the page mid-sentence must not keep the device talking.
  useEffect(() => () => {
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  return { supported, speaking, speak, cancel };
}
