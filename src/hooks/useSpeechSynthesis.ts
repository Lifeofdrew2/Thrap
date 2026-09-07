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
  voiceGender: "female" | "male";
  setVoiceGender(gender: "female" | "male"): void;
  speak(text: string): void;
  cancel(): void;
}

export function useSpeechSynthesis(): SpeechSynthesisState {
  const [speaking, setSpeaking] = useState(false);
  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
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
    utterance.rate = 0.9;
    utterance.pitch = 0.98;
    utterance.volume = 1;

    const availableVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    const englishVoices = availableVoices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
    const genderNames = voiceGender === "female"
      ? /samantha|jenny|ava|allison|aria|susan|victoria|moira|karen|hazel|libby|google us english female|google uk english female/i
      : /daniel|david|alex|george|mark|james|oliver|arthur|guy|ryan|google us english male|google uk english male/i;
    const preferred = englishVoices.find((voice) => genderNames.test(voice.name))
      ?? englishVoices.find((voice) => voice.lang.startsWith("en-GB"))
      ?? englishVoices.find((voice) => voice.lang === "en-NG")
      ?? englishVoices[0]
      ?? availableVoices[0];
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [supported, voiceGender]);

  useEffect(() => {
    if (!supported) return;
    const updateVoices = () => setVoices(window.speechSynthesis.getVoices());
    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  return { supported, speaking, voiceGender, setVoiceGender, speak, cancel };
}
